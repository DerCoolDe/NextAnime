import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PROVIDER_PRIORITY_CHANGED_EVENT,
  getAniListUrl,
  getBestProviderUrl,
  loadProviderPriorityOrder,
  sortProvidersByPriority,
} from "../utils/providerPriority";
import ReleaseDateTimePicker from "./ReleaseDateTimePicker";

function titleText(anime) {
  if (!anime) return "";
  if (anime.customTitle) return anime.customTitle;
  if (typeof anime.title === "string") return anime.title;
  return anime.title?.english || anime.title?.romaji || anime.title?.native || "";
}

function coverUrl(anime) {
  const cover = anime?.coverImage;
  if (!cover) return "";
  if (typeof cover === "string") return cover;
  return cover.extraLarge || cover.large || cover.medium || "";
}

export default function AnimeEditModal({
  anime,
  isOpen,
  onClose,
  onSaveReleaseTimestamp,
  onAdjustOffsetSeconds,
  onResetReleaseTime,
  onToggleFavorite,
  onDelete,
  onToggleCalendar,
  isInCalendar,
  setAnimeList,
  onRename,
}) {
  const [providerOrder, setProviderOrder] = useState(() => loadProviderPriorityOrder());

  useEffect(() => {
    const onChange = (event) => {
      setProviderOrder(event.detail || loadProviderPriorityOrder());
    };
    window.addEventListener(PROVIDER_PRIORITY_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(PROVIDER_PRIORITY_CHANGED_EVENT, onChange);
  }, []);

  const currentAdjustedTs = anime?.airingAt || null; // seconds
  const displayIso = useMemo(() => {
    if (!currentAdjustedTs) return "";
    const d = new Date(currentAdjustedTs * 1000);
    // Format to yyyy-MM-ddTHH:mm for datetime-local
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  }, [currentAdjustedTs]);

  const anilistUrl = useMemo(
    () => (anime ? getAniListUrl(anime, anime.originalSiteUrl || "") : ""),
    [anime]
  );

  // Get the best provider URL based on priority
  const bestProviderUrl = useMemo(
    () => (anime ? getBestProviderUrl(anime, providerOrder) : ""),
    [anime, providerOrder]
  );

  // Get sorted providers
  const sortedProviders = useMemo(
    () =>
      anime
        ? sortProvidersByPriority(anime.externalLinks, anilistUrl, providerOrder)
        : [],
    [anime, anilistUrl, providerOrder]
  );

  const [manualTime, setManualTime] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [customName, setCustomName] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const linkSaveTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (linkSaveTimerRef.current) {
        clearTimeout(linkSaveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setManualTime(displayIso);
  }, [displayIso]);

  useEffect(() => {
    if (!anime) return;
    const urlToUse = anime.siteUrl || bestProviderUrl;
    setManualLink(urlToUse);
  }, [anime, bestProviderUrl]);

  useEffect(() => {
    if (!anime) return;
    setCustomName(anime.customTitle || "");
  }, [anime]);

  useEffect(() => {
    if (!anime) return;
    const urlToUse = anime.siteUrl || bestProviderUrl;
    setSelectedProvider(urlToUse);
    setManualLink(urlToUse);
  }, [anime, bestProviderUrl, isOpen]);

  if (!isOpen || !anime) return null;

  function handleReleaseTimeChange(value) {
    setManualTime(value);
    if (!value) return;
    const newDate = new Date(value);
    if (isNaN(newDate.getTime())) return;
    const newTsSeconds = Math.floor(newDate.getTime() / 1000);
    if (currentAdjustedTs && newTsSeconds === currentAdjustedTs) return;
    onSaveReleaseTimestamp(anime.id, newTsSeconds);
  }

  // Implemented link management functions
  const onSaveLink = (animeId, newLink) => {
    const trimmedLink = newLink.trim();
    setAnimeList(prevList => {
      const updated = prevList.map(animeItem => {
        if (animeItem.id === animeId) {
          // Store the original URL if this is the first time we're modifying it
          const originalSiteUrl = animeItem.originalSiteUrl || animeItem.siteUrl;
          
          return {
            ...animeItem,
            siteUrl: trimmedLink, // Save the new link (trimmed)
            originalSiteUrl: originalSiteUrl, // Keep track of the original
            // Preserve externalLinks if they exist
            externalLinks: animeItem.externalLinks || []
          };
        }
        return animeItem;
      });
      return updated;
    });
    
    console.log(`Link updated for anime ${animeId}`);
  };

  const onResetLink = (animeId) => {
    setAnimeList(prevList => 
      prevList.map(animeItem => {
        if (animeItem.id === animeId && animeItem.originalSiteUrl) {
          return {
            ...animeItem,
            siteUrl: animeItem.originalSiteUrl, // Reset to original
          };
        }
        return animeItem;
      })
    );
    
    console.log(`Link reset to original for anime ${animeId}`);
  };

  function handleLinkReset() {
    if (linkSaveTimerRef.current) {
      clearTimeout(linkSaveTimerRef.current);
      linkSaveTimerRef.current = null;
    }
    onResetLink(anime.id);
    setManualLink(anime.originalSiteUrl || anime.siteUrl || "");
    setSelectedProvider(anime.originalSiteUrl || anime.siteUrl || "");
  }

  function persistLink(url) {
    const trimmed = String(url || "").trim();
    setSelectedProvider(trimmed);
    setManualLink(trimmed);
    if (!trimmed || trimmed === (anime.siteUrl || "").trim()) return;
    onSaveLink(anime.id, trimmed);
  }

  function handleProviderSelect(url) {
    if (linkSaveTimerRef.current) {
      clearTimeout(linkSaveTimerRef.current);
      linkSaveTimerRef.current = null;
    }
    persistLink(url);
  }

  function handleLinkInputChange(value) {
    setManualLink(value);
    setSelectedProvider(value);
    if (linkSaveTimerRef.current) {
      clearTimeout(linkSaveTimerRef.current);
    }
    linkSaveTimerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      if (!trimmed || trimmed === (anime.siteUrl || "").trim()) return;
      onSaveLink(anime.id, trimmed);
    }, 400);
  }

  function handleLinkInputBlur() {
    if (linkSaveTimerRef.current) {
      clearTimeout(linkSaveTimerRef.current);
      linkSaveTimerRef.current = null;
    }
    const trimmed = manualLink.trim();
    if (!trimmed || trimmed === (anime.siteUrl || "").trim()) return;
    onSaveLink(anime.id, trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose();
  }

  const originalUrl = anime.originalSiteUrl || anime.siteUrl || "";
  const isLinkModified = manualLink.trim() !== originalUrl.trim();
  const displayTitle = titleText(anime);
  const imageSrc = coverUrl(anime);

  return createPortal(
    <div
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Edit anime"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 96vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#1f1f1f",
          color: "#eee",
          borderRadius: 12,
          border: "1px solid rgba(97,218,251,0.25)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          overflowX: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "#242424", borderBottom: "1px solid #333" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Edit Anime</div>
          <button type="button" onClick={onClose} style={{ background: "transparent", color: "#ccc", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 16, 
          padding: 16,
        }}
        className="modal-content-grid"
        >
          <style>{`
            @media (min-width: 768px) {
              .modal-content-grid {
                grid-template-columns: 1fr 1fr !important;
              }
            }
          `}</style>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {imageSrc ? (
              <img src={imageSrc} alt={displayTitle} style={{ width: 90, height: 135, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            ) : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: 12, color: "#aaa" }}>Name</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input 
                  type="text" 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={displayTitle}
                  style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #333", background: "#2a2a2a", color: "#eee" }} 
                />
                <button 
                  type="button"
                  onClick={() => {
                    if (onRename) {
                      onRename(anime.id, customName.trim() || "");
                    }
                  }}
                  style={{ background: "#61dafb", color: "#000", border: "none", borderRadius: 6, padding: "8px 10px", fontWeight: 800, cursor: "pointer" }}
                >
                  Save
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setCustomName("");
                    if (onRename) {
                      onRename(anime.id, "");
                    }
                  }}
                  disabled={!anime.customTitle}
                  style={{ 
                    background: anime.customTitle ? "#444" : "#333", 
                    color: anime.customTitle ? "#eee" : "#666", 
                    border: "none", 
                    borderRadius: 6, 
                    padding: "8px 10px", 
                    cursor: anime.customTitle ? "pointer" : "not-allowed" 
                  }}
                >
                  Reset
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                Original: {anime.title?.english || anime.title?.romaji || displayTitle}
              </div>

              <label style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>Streaming Link</label>
              
              {sortedProviders.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Available Providers:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sortedProviders.map((provider) => {
                      const isSelected = selectedProvider === provider.url;
                      const siteName = provider.site || "Unknown";
                      return (
                        <button
                          type="button"
                          key={provider.id || provider.url}
                          onClick={() => handleProviderSelect(provider.url)}
                          style={{
                            background: isSelected ? "#61dafb" : "#444",
                            color: isSelected ? "#000" : "#eee",
                            border: `1px solid ${isSelected ? "#61dafb" : "#666"}`,
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: 11,
                            fontWeight: isSelected ? 700 : 400,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          title={provider.url}
                        >
                          {siteName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input 
                  type="text" 
                  value={manualLink} 
                  onChange={(e) => handleLinkInputChange(e.target.value)}
                  onBlur={handleLinkInputBlur}
                  placeholder="Enter anime URL..."
                  style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #333", background: "#2a2a2a", color: "#eee" }} 
                />
                <button 
                  type="button"
                  onClick={handleLinkReset}
                  disabled={!anime.originalSiteUrl}
                  style={{ 
                    background: anime.originalSiteUrl ? "#444" : "#333", 
                    color: anime.originalSiteUrl ? "#eee" : "#666", 
                    border: "none", 
                    borderRadius: 6, 
                    padding: "8px 10px", 
                    cursor: anime.originalSiteUrl ? "pointer" : "not-allowed" 
                  }}
                >
                  Reset
                </button>
              </div>
              {isLinkModified && (
                <div style={{ fontSize: 12, color: "#ffa726" }}>Link has been modified from original</div>
              )}
              {selectedProvider && (
                <a
                  href={selectedProvider}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "#61dafb",
                    textDecoration: "none",
                    marginTop: 4,
                    display: "inline-block",
                  }}
                >
                  Open link →
                </a>
              )}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, color: "#aaa" }}>Release time</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <ReleaseDateTimePicker
                value={manualTime}
                onChange={handleReleaseTimeChange}
              />
              <button type="button" onClick={() => onAdjustOffsetSeconds(anime.id, 60 * 60)} style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>+1h</button>
              <button type="button" onClick={() => onAdjustOffsetSeconds(anime.id, -60 * 60)} style={{ background: "#8b0000", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>-1h</button>
              <button type="button" onClick={() => onAdjustOffsetSeconds(anime.id, 30 * 60)} style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>+30m</button>
              <button type="button" onClick={() => onAdjustOffsetSeconds(anime.id, -30 * 60)} style={{ background: "#8b0000", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>-30m</button>
              <button type="button" onClick={() => onResetReleaseTime(anime.id)} style={{ background: "#444", color: "#eee", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer", marginLeft: "auto" }}>Reset</button>
            </div>
            {anime.userTimeOffsetSeconds != null && anime.userTimeOffsetSeconds !== 0 ? (
              <div style={{ fontSize: 12, color: "#aaa" }}>
                Offset applied: {anime.userTimeOffsetSeconds > 0 ? "+" : ""}
                {Math.round(anime.userTimeOffsetSeconds / 60)} minutes
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#aaa" }}>No offset applied</div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="button"
              onClick={() => onToggleFavorite(anime.id)}
              style={{ background: "#61dafb", color: "#000", border: "none", borderRadius: 6, padding: "10px 12px", fontWeight: 800, cursor: "pointer" }}
            >
              {anime.favorited ? "★ Unfavorite" : "☆ Favorite"}
            </button>
            <button
              type="button"
              onClick={() => onToggleCalendar(anime)}
              style={{ background: isInCalendar ? "#2e7d32" : "#007acc", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}
            >
              {isInCalendar ? "Remove from Calendar" : "Add to Calendar"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(anime.id)}
              style={{ background: "#e55353", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}