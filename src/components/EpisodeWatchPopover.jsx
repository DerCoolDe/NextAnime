import React, { useMemo } from "react";
import {
  getReleasedEpisodesFromCalendar,
  getWatchedThrough,
  isEpisodeWatched,
} from "../utils/episodeWatch";

export default function EpisodeWatchPopover({
  anime,
  calendarList,
  watchProgress,
  onToggleEpisode,
  onClose,
}) {
  const title =
    anime?.title?.customTitle ||
    anime?.title?.english ||
    anime?.title?.romaji ||
    "Anime";

  const releasedEpisodes = useMemo(
    () => getReleasedEpisodesFromCalendar(calendarList, anime?.id),
    [calendarList, anime?.id]
  );

  const watchedThrough = getWatchedThrough(watchProgress, anime?.id);

  if (!anime?.id) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Watch progress for ${title}`}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 16,
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 380px)",
          maxHeight: "min(80vh, 520px)",
          backgroundColor: "#1e1e1e",
          borderRadius: 12,
          border: "1px solid #444",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "14px 16px",
            borderBottom: "1px solid #333",
            alignItems: "center",
          }}
        >
          {anime.coverImage?.extraLarge && (
            <img
              src={anime.coverImage.extraLarge}
              alt=""
              style={{ width: 44, height: 66, objectFit: "cover", borderRadius: 6 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: "#eee" }}>{title}</h3>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#aaa" }}>
              Watched through ep {watchedThrough || "—"} · tap to toggle
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#444",
              border: "none",
              color: "#fff",
              borderRadius: 6,
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 16, overflowY: "auto" }}>
          {releasedEpisodes.length === 0 ? (
            <p style={{ color: "#bbb", margin: 0 }}>
              No aired episodes in your calendar for this show yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {releasedEpisodes.map((ep) => {
                const watched = isEpisodeWatched(watchProgress, anime.id, ep);
                return (
                  <button
                    key={ep}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleEpisode(anime.id, ep);
                    }}
                    style={{
                      minWidth: 52,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: watched ? "2px solid #4caf50" : "2px solid #ff8a80",
                      background: watched ? "rgba(76, 175, 80, 0.2)" : "rgba(255, 138, 128, 0.12)",
                      color: watched ? "#9be7a8" : "#ffc7c2",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                    title={watched ? `Unwatch episode ${ep}` : `Mark episode ${ep} watched`}
                  >
                    Ep {ep}
                  </button>
                );
              })}
            </div>
          )}

          <p style={{ margin: "14px 0 0", fontSize: 11, color: "#777", lineHeight: 1.4 }}>
            Green = watched (including earlier episodes). Tap again to unwatch from that episode
            upward.
          </p>
        </div>
      </div>
    </div>
  );
}
