import React, { useMemo } from "react";
import AnimeCard from "./AnimeCard";

export default function UpcomingAnimeVertical({ episodes, watchingList, onAddAnime }) {
  const normalizedEpisodes = useMemo(
    () => (Array.isArray(episodes) ? episodes : []),
    [episodes]
  );

  const watchingIdSet = useMemo(() => {
    if (!watchingList || watchingList.length === 0) {
      return new Set();
    }
    return new Set(watchingList.map((anime) => anime.id));
  }, [watchingList]);

  const { groupedEpisodes, sortedDays } = useMemo(() => {
    const dayGroups = normalizedEpisodes.reduce((groups, episode) => {
      const date = new Date(episode.airingAt * 1000);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let dayName;
      if (date.toDateString() === today.toDateString()) {
        dayName = "Today";
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dayName = "Tomorrow";
      } else {
        dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      }

      const dateString = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const dayKey = `${dayName} - ${dateString}`;
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(episode);
      return groups;
    }, {});

    Object.keys(dayGroups).forEach((dayKey) => {
      dayGroups[dayKey].sort((a, b) => a.airingAt - b.airingAt);
    });

    const orderedDays = Object.keys(dayGroups).sort((a, b) => {
      const firstEpisodeA = dayGroups[a][0];
      const firstEpisodeB = dayGroups[b][0];
      return firstEpisodeA.airingAt - firstEpisodeB.airingAt;
    });

    return { groupedEpisodes: dayGroups, sortedDays: orderedDays };
  }, [normalizedEpisodes]);

  if (sortedDays.length === 0) {
    return <p>No upcoming episodes available.</p>;
  }

  return (
    <div>
      <h3
        style={{
          textAlign: "center",
          marginBottom: "clamp(15px, 3vw, 25px)",
          background: "linear-gradient(135deg, #61dafb, #6dd6ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          padding: "clamp(8px, 2vw, 15px) clamp(15px, 3vw, 25px)",
          borderRadius: "clamp(6px, 1.5vw, 12px)",
          maxWidth: "clamp(250px, 40vw, 350px)",
          marginLeft: "auto",
          marginRight: "auto",
          fontWeight: 700,
          fontSize: "clamp(18px, 3.5vw, 24px)",
          textShadow: "0 2px 10px rgba(97, 218, 251, 0.3)",
        }}
      >
        Upcoming Episodes
      </h3>

      {sortedDays.map((dayKey) => (
        <div key={dayKey} style={{ marginBottom: "clamp(20px, 4vw, 35px)" }}>
          <h4
            style={{
              backgroundColor: "rgba(42, 42, 42, 0.9)",
              color: "#61dafb",
              padding: "clamp(10px, 2vw, 15px) clamp(15px, 3vw, 25px)",
              borderRadius: "clamp(6px, 1.5vw, 12px) clamp(6px, 1.5vw, 12px) 0 0",
              margin: 0,
              fontSize: "clamp(16px, 3vw, 20px)",
              fontWeight: 600,
              borderBottom: "2px solid #61dafb",
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            {dayKey}
          </h4>
          <div
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.8)",
              borderRadius: "0 0 clamp(6px, 1.5vw, 12px) clamp(6px, 1.5vw, 12px)",
              padding: "clamp(12px, 2.5vw, 20px)",
              border: "1px solid rgba(97, 218, 251, 0.2)",
              borderTop: "none",
              backdropFilter: "blur(10px)",
            }}
          >
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {groupedEpisodes[dayKey].map((ep) => (
                <li key={ep.media.id + ep.episode} style={{ marginBottom: "clamp(8px, 2vw, 15px)" }}>
                  <AnimeCard
                    episode={ep}
                    watchingIdSet={watchingIdSet}
                    onAddAnime={onAddAnime}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
