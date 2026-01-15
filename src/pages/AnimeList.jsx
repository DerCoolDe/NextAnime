import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomDropdown from "../components/CustomDropdown";
import { loadWatchingList, saveWatchingList, loadCalendarList, saveCalendarList } from "../utils/storage";
import { LIST_STATUS_OPTIONS, DEFAULT_LIST_STATUS } from "../constants/listStatuses";


export default function AnimeList() {
  const navigate = useNavigate();
  const [animeList, setAnimeList] = useState([]);
  const [filter, setFilter] = useState("All");
  const [openDropdown, setOpenDropdown] = useState({});
  const [calendarList, setCalendarList] = useState(() => loadCalendarList());

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

  const filteredList = animeList.filter((anime) =>
    filter === "All" ? true : anime.listStatus === filter
  );

  const updateAnime = (id, changes) => {
    const updated = animeList.map((anime) =>
      anime.id === id ? { ...anime, ...changes } : anime
    );
    setAnimeList(updated);
    saveWatchingList(updated);
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
        saveCalendarList(updated);
        return updated;
      }
      let episodesToAdd = (anime.fullAiringSchedule || []).map((ep) => ({
        id: anime.id,
        title: anime.title,
        coverImage: anime.coverImage,
        episode: ep.episode,
        airingAt: ep.airingAt,
        favorited: anime.favorited || false,
      }));
      if (episodesToAdd.length === 0 && anime.airingAt) {
        episodesToAdd = [{
          id: anime.id,
          title: anime.title,
          coverImage: anime.coverImage,
          episode: anime.episode ?? null,
          airingAt: anime.airingAt,
          favorited: anime.favorited || false,
        }];
      }
      const updated = [...prev, ...episodesToAdd];
      saveCalendarList(updated);
      return updated;
    });
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
          onClick={() => navigate("/")}
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

      {/* Anime List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filteredList.map((anime) => {
          const maxEps = anime.episodes ?? 0;
          const isInCalendar = calendarList.some((entry) => entry.id === anime.id);

          return (
            <div
              key={anime.id}
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
