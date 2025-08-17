import React, { useMemo } from "react";

// Builds a map of animeId -> { title, releasedMaxEpisode, coverUrl }
function buildAiredMap(calendarList) {
  const nowSec = Math.floor(Date.now() / 1000);
  const map = new Map();
  calendarList.forEach((ep) => {
    // Only count already released episodes
    if (!ep?.airingAt || ep.airingAt > nowSec) return;

    const prev = map.get(ep.id);
    const title = ep.title?.english || ep.title?.romaji || "Unknown";
    const coverUrl = ep.coverImage?.extraLarge || ep.coverImage?.large || ep.coverImage?.medium || null;
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
        favorited: prev.favorited || favorited
      });
    }
  });
  return map;
}

// Compute a single unwatched range up to the released max
// Example: watchedUntil=4, releasedMax=6 => [5-6]
function computeUnwatchedRange(watchedUntil, releasedMax) {
  const start = Math.max((watchedUntil || 0) + 1, 1);
  if (!releasedMax || start > releasedMax) return null;
  return { from: start, to: releasedMax };
}

export default function UnwatchedList({ calendarList, watchedState }) {
  const items = useMemo(() => {
    const airedMap = buildAiredMap(calendarList || []);

    const lines = [];
    for (const [id, info] of airedMap.entries()) {
      const watchedUntil = watchedState?.[id] || 0;
      const range = computeUnwatchedRange(watchedUntil, info.releasedMaxEpisode);
      if (range) {
        const label = range.from === range.to ? `${range.from}` : `${range.from}-${range.to}`;
        lines.push({ id, title: info.title, text: `Not watched ep ${label}`, coverUrl: info.coverUrl, favorited: !!info.favorited });
      }
    }

    // Sort favorites first, then alphabetically by title
    lines.sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      return a.title.localeCompare(b.title);
    });
    return lines;
  }, [calendarList, watchedState]);

  if (!items.length) {
    return (
      <p style={{ color: "#ccc" }}>You're all caught up. No unwatched episodes for the items in your calendar.</p>
    );
  }

  return (
    <div style={{ marginTop: 12 }}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.map((row) => (
          <li key={row.id} style={{
            padding: "10px 12px",
            borderBottom: "1px solid #333",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            {row.coverUrl ? (
              <img
                src={row.coverUrl}
                alt={row.title}
                loading="lazy"
                decoding="async"
                style={{ width: 48, aspectRatio: "2 / 3", objectFit: "cover", borderRadius: 6 }}
              />
            ) : (
              <div style={{ width: 48, aspectRatio: "2 / 3", background: "#333", borderRadius: 6 }} />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <span style={{ color: "#eee" }}>{row.title}</span>
              <span style={{ color: "#ff6b6b", fontWeight: 700 }}>{row.text}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

