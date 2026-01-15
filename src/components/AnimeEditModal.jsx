import React, { useMemo, useState } from "react";

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
  if (!isOpen || !anime) return null;

  const currentAdjustedTs = anime.airingAt || null; // seconds
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

  const [manualTime, setManualTime] = useState(displayIso);
  const [manualLink, setManualLink] = useState(anime.siteUrl || "");
  const [customName, setCustomName] = useState(anime.customTitle || "");
  const [selectedProvider, setSelectedProvider] = useState(anime.siteUrl || "");

  React.useEffect(() => {
    setManualTime(displayIso);
  }, [displayIso]);

  React.useEffect(() => {
    setManualLink(anime.siteUrl || "");
  }, [anime.siteUrl]);

  React.useEffect(() => {
    setCustomName(anime.customTitle || "");
  }, [anime.customTitle]);

  React.useEffect(() => {
    setSelectedProvider(anime.siteUrl || "");
    setManualLink(anime.siteUrl || "");
  }, [anime.siteUrl]);

  function handleManualSave() {
    if (!manualTime) return;
    const newDate = new Date(manualTime);
    if (isNaN(newDate.getTime())) return;
    const newTsSeconds = Math.floor(newDate.getTime() / 1000);
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
            originalSiteUrl: originalSiteUrl // Keep track of the original
          };
        }
        return animeItem;
      });
      // Save to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem('watchingList', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
      }
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

  function handleLinkSave() {
    const trimmedLink = manualLink.trim();
    onSaveLink(anime.id, trimmedLink);
    // Update selected provider to match saved link
    setSelectedProvider(trimmedLink);
  }

  function handleLinkReset() {
    onResetLink(anime.id);
    // Reset the input field to the original value
    setManualLink(anime.originalSiteUrl || anime.siteUrl || "");
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose();
  }

const originalUrl = anime.originalSiteUrl || anime.siteUrl || "";
const isLinkModified = manualLink.trim() !== originalUrl.trim();

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
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
          <button onClick={onClose} style={{ background: "transparent", color: "#ccc", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
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
            <img src={anime.coverImage?.extraLarge || anime.coverImage} alt={anime.title?.english || anime.title?.romaji || anime.title} style={{ width: 90, height: 135, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <label style={{ fontSize: 12, color: "#aaa" }}>Name</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input 
                  type="text" 
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={anime.title?.english || anime.title?.romaji || anime.title}
                  style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #333", background: "#2a2a2a", color: "#eee" }} 
                />
                <button 
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
                Original: {anime.title?.english || anime.title?.romaji || anime.title}
              </div>

              <label style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>Streaming Link</label>
              
              {/* Streaming Providers */}
              {(anime.externalLinks && anime.externalLinks.length > 0) && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Available Providers:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {anime.externalLinks.map((link) => {
                      const isSelected = selectedProvider === link.url;
                      const siteName = link.site || "Unknown";
                      return (
                        <button
                          key={link.id || link.url}
                          onClick={() => {
                            setSelectedProvider(link.url);
                            setManualLink(link.url);
                          }}
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
                          title={link.url}
                        >
                          {siteName}
                        </button>
                      );
                    })}
                    {anime.siteUrl && (
                      <button
                        onClick={() => {
                          setSelectedProvider(anime.siteUrl);
                          setManualLink(anime.siteUrl);
                        }}
                        style={{
                          background: selectedProvider === anime.siteUrl ? "#61dafb" : "#444",
                          color: selectedProvider === anime.siteUrl ? "#000" : "#eee",
                          border: `1px solid ${selectedProvider === anime.siteUrl ? "#61dafb" : "#666"}`,
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 11,
                          fontWeight: selectedProvider === anime.siteUrl ? 700 : 400,
                          cursor: "pointer",
                        }}
                      >
                        AniList
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input 
                  type="text" 
                  value={manualLink} 
                  onChange={(e) => {
                    setManualLink(e.target.value);
                    setSelectedProvider(e.target.value);
                  }}
                  placeholder="Enter anime URL..."
                  style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #333", background: "#2a2a2a", color: "#eee" }} 
                />
                <button 
                  onClick={handleLinkSave}
                  style={{ background: "#61dafb", color: "#000", border: "none", borderRadius: 6, padding: "8px 10px", fontWeight: 800, cursor: "pointer" }}
                >
                  Save
                </button>
                <button 
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
              {/* {!anime.originalSiteUrl && (
                <div style={{ fontSize: 12, color: "#aaa" }}>No modifications made</div>
              )} */}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 12, color: "#aaa" }}>Release time</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="datetime-local"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                style={{ flex: 1, minWidth: 240, padding: 10, borderRadius: 6, border: "1px solid #333", background: "#2a2a2a", color: "#eee" }}
              />
              <button onClick={handleManualSave} style={{ background: "#61dafb", color: "#000", border: "none", borderRadius: 6, padding: "10px 12px", fontWeight: 800, cursor: "pointer" }}>Save</button>
              <button onClick={() => onAdjustOffsetSeconds(anime.id, 60 * 60)} style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>+1h</button>
              <button onClick={() => onAdjustOffsetSeconds(anime.id, -60 * 60)} style={{ background: "#8b0000", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>-1h</button>
              <button onClick={() => onAdjustOffsetSeconds(anime.id, 30 * 60)} style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>+30m</button>
              <button onClick={() => onAdjustOffsetSeconds(anime.id, -30 * 60)} style={{ background: "#8b0000", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}>-30m</button>
              <button onClick={() => onResetReleaseTime(anime.id)} style={{ background: "#444", color: "#eee", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer", marginLeft: "auto" }}>Reset</button>
            </div>
            {anime.userTimeOffsetSeconds ? (
              <div style={{ fontSize: 12, color: "#aaa" }}>Offset applied: {Math.round(anime.userTimeOffsetSeconds / 60)} minutes</div>
            ) : (
              <div style={{ fontSize: 12, color: "#aaa" }}>No offset applied</div>
            )}
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={() => onToggleFavorite(anime.id)}
              style={{ background: "#61dafb", color: "#000", border: "none", borderRadius: 6, padding: "10px 12px", fontWeight: 800, cursor: "pointer" }}
            >
              {anime.favorited ? "★ Unfavorite" : "☆ Favorite"}
            </button>
            <button
              onClick={() => onToggleCalendar(anime)}
              style={{ background: isInCalendar ? "#2e7d32" : "#007acc", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}
            >
              {isInCalendar ? "Remove from Calendar" : "Add to Calendar"}
            </button>
            <button
              onClick={() => onDelete(anime.id)}
              style={{ background: "#e55353", color: "#fff", border: "none", borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}