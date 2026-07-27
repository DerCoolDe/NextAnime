import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { app } from "../firebase";
import CustomDropdown from "../components/CustomDropdown";
import { loadWatchingList, saveWatchingList, loadCalendarList, saveCalendarList } from "../utils/storage";
import { LIST_STATUS_OPTIONS, DEFAULT_LIST_STATUS } from "../constants/listStatuses";

const auth = getAuth(app);
const db = getFirestore(app);

// Helper: save watching list to Firestore for given uid
async function saveFirestoreWatchingList(uid, list) {
  if (!uid) return;
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { firebasewatchedlist: list }, { merge: true });
  } catch (e) {
    console.error("Error saving Firestore watching list:", e);
  }
}

// Helper: save calendar list to Firestore for given uid
async function saveFirestoreCalendarList(uid, list) {
  if (!uid) return;
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, { firebasecalendarlist: list }, { merge: true });
  } catch (e) {
    console.error("Error saving Firestore calendar list:", e);
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function normalizeForSearch(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compact(input) {
  return normalizeForSearch(input).replace(/\s+/g, "");
}

function isSubsequence(haystack, needle) {
  if (!needle) return true;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

// Lower score = better match. Returns null if no match.
function scoreMatch(titleRaw, queryRaw) {
  const q = compact(queryRaw);
  if (!q) return 0;

  const title = compact(titleRaw);
  if (!title) return null;

  if (title === q) return 0;
  if (title.startsWith(q)) return 5;
  if (title.includes(q)) return 15;

  // Fuzzy: allow abbreviations like "jjk" -> "jujutsukaisen"
  if (isSubsequence(title, q)) {
    const lengthPenalty = Math.min(40, Math.floor(title.length / 4));
    return 30 + lengthPenalty;
  }

  return null;
}


export default function AnimeList() {
  const navigate = useNavigate();
  const [animeList, setAnimeList] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [animatedItems, setAnimatedItems] = useState([]);
  const [openDropdown, setOpenDropdown] = useState({});
  const [calendarList, setCalendarList] = useState(() => loadCalendarList());
  const [user, setUser] = useState(null);
  
  // Debounced save function for Firebase
  const debouncedSaveCalendarList = React.useRef(null);

  useEffect(() => {
    debouncedSaveCalendarList.current = debounce(saveCalendarList, 300);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const savedList = loadWatchingList();
    const withDefaults = (savedList || []).map((anime) => ({
      ...anime,
      listStatus: anime.listStatus || DEFAULT_LIST_STATUS,
      watchedEpisodes: anime.watchedEpisodes ?? 0,
      score: anime.score ?? 0,
    }));
    setAnimeList(withDefaults);
    saveWatchingList(withDefaults);
    setCalendarList(loadCalendarList());
  }, []);

  const filteredList = animeList
    .map((anime) => {
      const title =
        anime.title?.customTitle ||
        anime.customTitle ||
        anime.title?.english ||
        anime.title?.romaji ||
        "";
      const s = scoreMatch(title, search);
      return { anime, _score: s, _title: title };
    })
    .filter(({ anime, _score }) => {
      const matchesStatus = filter === "All" ? true : anime.listStatus === filter;
      if (!matchesStatus) return false;
      if (!String(search || "").trim()) return true;
      return _score !== null;
    })
    .sort((a, b) => {
      const qTrim = String(search || "").trim();
      if (!qTrim) return 0;
      if (a._score !== b._score) return a._score - b._score;
      return String(a._title || "").localeCompare(String(b._title || ""));
    })
    .map(({ anime }) => anime);

  // Animate items in/out when filter/search changes
  useEffect(() => {
    setAnimatedItems((prev) => {
      const nextIds = new Set(filteredList.map((a) => a.id));
      const prevMap = new Map(prev.map((row) => [row.anime.id, row]));

      // Keep visible items in the exact filtered order so matches move to the top.
      const visibleRows = filteredList.map((anime) => {
        const existing = prevMap.get(anime.id);
        return existing
          ? { ...existing, anime, state: "in" }
          : { anime, state: "in" };
      });

      // Keep removed items temporarily for exit animation, after visible items.
      const exitingRows = prev
        .filter((row) => !nextIds.has(row.anime.id))
        .map((row) => ({ ...row, state: "out" }));

      return [...visibleRows, ...exitingRows];
    });

    const t = setTimeout(() => {
      setAnimatedItems((prev) => prev.filter((row) => filteredList.some((a) => a.id === row.anime.id)));
    }, 200);

    return () => clearTimeout(t);
  }, [filteredList]);

  const updateAnime = (id, changes) => {
    const updated = animeList.map((anime) =>
      anime.id === id ? { ...anime, ...changes } : anime
    );
    setAnimeList(updated);
    saveWatchingList(updated);
    if (user) {
      debounce(() => saveFirestoreWatchingList(user.uid, updated), 500)();
    }
  };

  const toggleDropdown = (animeId, field) => {
    setOpenDropdown((prev) => ({
      ...prev,
      [`${animeId}-${field}`]: !prev[`${animeId}-${field}`],
    }));
  };

  const toggleCalendar = (anime) => {
    setCalendarList((prev) => {
      const isInCalendar = prev.some((entry) => entry.id === anime.id);
      if (isInCalendar) {
        const updated = prev.filter((entry) => entry.id !== anime.id);
        if (debouncedSaveCalendarList.current) {
          debouncedSaveCalendarList.current(updated);
        }
        if (user) {
          debounce(() => saveFirestoreCalendarList(user.uid, updated), 500)();
        }
        return updated;
      }
      // Add ALL episodes from fullAiringSchedule (past, present, and future)
      let episodesToAdd = [];
      
      if (anime.fullAiringSchedule && anime.fullAiringSchedule.length > 0) {
        // Use fullAiringSchedule which includes all episodes
        episodesToAdd = anime.fullAiringSchedule.map((ep) => ({
          id: anime.id,
          title: anime.title,
          coverImage: anime.coverImage,
          episode: ep.episode,
          airingAt: ep.airingAt,
          favorited: anime.favorited || false,
          siteUrl: anime.siteUrl,
          externalLinks: anime.externalLinks || [],
        }));
      } else if (anime.airingAt && anime.episode) {
        // Fallback: if no full schedule but has current episode info
        episodesToAdd = [{
          id: anime.id,
          title: anime.title,
          coverImage: anime.coverImage,
          episode: anime.episode,
          airingAt: anime.airingAt,
          favorited: anime.favorited || false,
          siteUrl: anime.siteUrl,
          externalLinks: anime.externalLinks || [],
        }];
      }
      
      const updated = [...prev, ...episodesToAdd];
      if (debouncedSaveCalendarList.current) {
        debouncedSaveCalendarList.current(updated);
      }
      if (user) {
        debounce(() => saveFirestoreCalendarList(user.uid, updated), 500)();
      }
      return updated;
    });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/", { replace: true });
  };


  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "#1e1e1e",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      {/* Back Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleBack}
          style={{
            backgroundColor: "#3c3c3c",
            color: "#fff",
            padding: "6px 14px",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            marginRight: "auto",
          }}
        >
          ← Back
        </button>
      </div>

      {/* Filter Buttons */}
      <div style={{ marginBottom: 20 }}>
        {["All", ...LIST_STATUS_OPTIONS].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              marginRight: 10,
              padding: "6px 12px",
              backgroundColor: filter === status ? "#61dafb" : "#2c2c2c",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              cursor: "pointer",
              boxShadow: filter === status ? "0 0 5px #61dafb" : "none",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your anime..."
          style={{
            width: "100%",
            maxWidth: 520,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            backgroundColor: "#141414",
            color: "#eee",
            outline: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              backgroundColor: "#2c2c2c",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
            title="Clear search"
          >
            Clear
          </button>
        )}
      </div>

      {/* Anime List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <style>{`
          .anime-row {
            opacity: 0;
            transform: translateY(8px);
            transition: opacity 180ms ease, transform 180ms ease;
            will-change: opacity, transform;
          }
          .anime-row.in {
            opacity: 1;
            transform: translateY(0);
          }
          .anime-row.out {
            opacity: 0;
            transform: translateY(8px);
          }
        `}</style>

        {animatedItems.map(({ anime, state }) => {
          const maxEps = anime.episodes ?? 0;
          const isInCalendar = calendarList.some((entry) => entry.id === anime.id);

          return (
            <div
              key={anime.id}
              className={`anime-row ${state}`}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#2a2a2a",
                padding: 16,
                borderRadius: 10,
                gap: 20,
              }}
            >
              {/* Image + Title */}
              <img
                src={anime.coverImage?.extraLarge}
                alt={anime.title.english || anime.title.romaji}
                style={{ width: 90, height: 125, borderRadius: 8, objectFit: "cover" }}
              />

              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 6 }}>
                  {anime.title.english || anime.title.romaji}
                </div>
              </div>

              {/* Controls on the right */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginLeft: "auto",
                  width: 90,
                  boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
                  borderRadius: 6,
                  padding: 6,
                  backgroundColor: "#222",
                }}
              >
                {/* Episodes Dropdown */}
                <CustomDropdown
                  label="Watched Eps"
                  value={anime.watchedEpisodes}
                  options={Array.from({ length: maxEps + 1 }, (_, i) => i)}
                  onSelect={(val) => updateAnime(anime.id, { watchedEpisodes: val })}
                  isOpen={!!openDropdown[`${anime.id}-ep`]}
                  toggleOpen={() => toggleDropdown(anime.id, "ep")}
                />

                {/* Score Dropdown */}
                <CustomDropdown
                  label="Score"
                  value={anime.score}
                  options={Array.from({ length: 11 }, (_, i) => i)}
                  onSelect={(val) => updateAnime(anime.id, { score: val })}
                  isOpen={!!openDropdown[`${anime.id}-score`]}
                  toggleOpen={() => toggleDropdown(anime.id, "score")}
                />

                {/* Status Dropdown */}
                <CustomDropdown
                  label="Status"
                  value={anime.listStatus}
                  options={LIST_STATUS_OPTIONS}
                  onSelect={(val) => updateAnime(anime.id, { listStatus: val })}
                  isOpen={!!openDropdown[`${anime.id}-status`]}
                  toggleOpen={() => toggleDropdown(anime.id, "status")}
                />
                <button
                  onClick={() => toggleCalendar(anime)}
                  style={{
                    marginTop: 4,
                    padding: "6px 8px",
                    backgroundColor: isInCalendar ? "#28a745" : "#007acc",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: "0 0 6px rgba(0,0,0,0.35)",
                  }}
                  aria-pressed={isInCalendar}
                  title={isInCalendar ? "Remove from calendar" : "Add to calendar"}
                >
                  {isInCalendar ? "In calendar" : "Add to calendar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
