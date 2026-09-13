import React, { useMemo } from "react";
import { getWatchedThrough, listUnwatchedEpisodes } from "../utils/episodeWatch";

function buildAiredMap(calendarList) {
  const nowSec = Math.floor(Date.now() / 1000);
  const map = new Map();
  calendarList.forEach((ep) => {
    if (!ep?.airingAt || ep.airingAt > nowSec) return;

    const prev = map.get(ep.id);
    const title =
      ep.title?.customTitle || ep.title?.english || ep.title?.romaji || "Unknown";
    const coverUrl =
      ep.coverImage?.extraLarge || ep.coverImage?.large || ep.coverImage?.medium || null;
    const epNum = ep.episode || 0;
    const favorited = ep.favorited || false;

    if (!prev) {
      map.set(ep.id, { title, releasedMaxEpisode: epNum, coverUrl, favorited });
    } else {
      const releasedMaxEpisode = Math.max(prev.releasedMaxEpisode || 0, epNum);
      map.set(ep.id, {
        title: prev.title || title,
        releasedMaxEpisode,
        coverUrl: prev.coverUrl || coverUrl,
        favorited: prev.favorited || favorited,
      });
    }
  });
  return map;
}

export default function UnwatchedList({ calendarList, watchProgress, onMarkEpisode }) {
  const items = useMemo(() => {
    const airedMap = buildAiredMap(calendarList || []);
    const rows = [];

    for (const [id, info] of airedMap.entries()) {
      const watchedThrough = getWatchedThrough(watchProgress, id);
      const unwatchedEps = listUnwatchedEpisodes(watchedThrough, info.releasedMaxEpisode);
      if (unwatchedEps.length === 0) continue;

      rows.push({
        id,
        title: info.title,
        coverUrl: info.coverUrl,
        favorited: !!info.favorited,
        watchedThrough,
        releasedMax: info.releasedMaxEpisode,
        unwatchedEps,
      });
    }

    rows.sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      if (b.unwatchedEps.length !== a.unwatchedEps.length) {
        return b.unwatchedEps.length - a.unwatchedEps.length;
      }
      return a.title.localeCompare(b.title);
    });

    return rows;
  }, [calendarList, watchProgress]);

  if (!items.length) {
    return (
      <p style={{ color: "#9be7a8", marginTop: 16, lineHeight: 1.5 }}>
        You're all caught up on every aired episode in your calendar.
      </p>
    );
  }

  const totalMissing = items.reduce((sum, row) => sum + row.unwatchedEps.length, 0);

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ margin: 0, color: "#bbb", fontSize: 14 }}>
        <strong style={{ color: "#ff8a80" }}>{totalMissing}</strong> unwatched episode
        {totalMissing !== 1 ? "s" : ""} across <strong>{items.length}</strong> show
        {items.length !== 1 ? "s" : ""}. Tap an episode to mark it watched.
      </p>

      {items.map((row) => {
        const watchedCount = row.releasedMax - row.unwatchedEps.length;
        return (
          <article
            key={row.id}
            style={{
              background: "#282828",
              borderRadius: 10,
              padding: 12,
              border: row.favorited ? "1px solid rgba(97, 218, 251, 0.5)" : "1px solid #333",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {row.coverUrl ? (
                <img
                  src={row.coverUrl}
                  alt={row.title}
                  loading="lazy"
                  style={{ width: 56, aspectRatio: "2 / 3", objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{ width: 56, aspectRatio: "2 / 3", background: "#333", borderRadius: 8 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: "0 0 6px", color: "#eee", fontSize: 15 }}>{row.title}</h4>
                <p style={{ margin: "0 0 10px", color: "#aaa", fontSize: 12 }}>
                  Progress: {watchedCount}/{row.releasedMax} aired episodes watched
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {row.unwatchedEps.map((ep) => (
                    <button
                      key={ep}
                      type="button"
                      onClick={() => onMarkEpisode?.(row.id, ep)}
                      style={{
                        background: "rgba(255, 138, 128, 0.15)",
                        border: "1px solid #ff8a80",
                        color: "#ffc7c2",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                      title={`Mark episode ${ep} as watched`}
                    >
                      Ep {ep}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
