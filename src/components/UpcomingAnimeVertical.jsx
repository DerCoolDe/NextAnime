import React, { useState } from "react";
import AnimeCard from "./AnimeCard";

export default function UpcomingAnimeVertical({ episodes, watchingList, onAddAnime }) {
  const [expandedDays, setExpandedDays] = useState({});

  if (!episodes || episodes.length === 0) return <p>No upcoming episodes available.</p>;

  // Helper function to get day name from timestamp
  const getDayName = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    // Otherwise return the day name
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Helper function to get date string
  const getDateString = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Group episodes by day
  const episodesByDay = episodes.reduce((groups, episode) => {
    const dayName = getDayName(episode.airingAt);
    const dateString = getDateString(episode.airingAt);
    const dayKey = `${dayName} - ${dateString}`;
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(episode);
    return groups;
  }, {});

  // Sort episodes within each day by airing time
  Object.keys(episodesByDay).forEach(dayKey => {
    episodesByDay[dayKey].sort((a, b) => a.airingAt - b.airingAt);
  });

  // Sort days chronologically
  const sortedDays = Object.keys(episodesByDay).sort((a, b) => {
    const firstEpisodeA = episodesByDay[a][0];
    const firstEpisodeB = episodesByDay[b][0];
    return firstEpisodeA.airingAt - firstEpisodeB.airingAt;
  });

  // Show More/Less logic
  const handleShowMore = (dayKey) => {
    setExpandedDays((prev) => ({ ...prev, [dayKey]: true }));
  };
  const handleShowLess = (dayKey) => {
    setExpandedDays((prev) => ({ ...prev, [dayKey]: false }));
  };

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
        🎬 Upcoming Episodes
      </h3>
      {sortedDays.map((dayKey) => {
        const dayEpisodes = episodesByDay[dayKey];
        const isExpanded = expandedDays[dayKey];
        const showEpisodes = isExpanded ? dayEpisodes : dayEpisodes.slice(0, 2);
        return (
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
              📅 {dayKey}
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
                {showEpisodes.map((ep) => (
                  <li key={ep.media.id + ep.episode} style={{ marginBottom: "clamp(8px, 2vw, 15px)" }}>
                    <AnimeCard
                      episode={ep}
                      watchingList={watchingList}
                      onAddAnime={onAddAnime}
                    />
                  </li>
                ))}
              </ul>
              {dayEpisodes.length > 4 && !isExpanded && (
                <button
                  onClick={() => handleShowMore(dayKey)}
                  style={{
                    margin: "10px auto 0 auto",
                    display: "block",
                    background: "linear-gradient(135deg, #61dafb, #6dd6ff)",
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                    padding: "10px 24px",
                    boxShadow: "0 4px 15px rgba(97, 218, 251, 0.3)",
                  }}
                >
                  Show More
                </button>
              )}
              {dayEpisodes.length > 4 && isExpanded && (
                <button
                  onClick={() => handleShowLess(dayKey)}
                  style={{
                    margin: "10px auto 0 auto",
                    display: "block",
                    background: "#232323",
                    color: "#61dafb",
                    fontWeight: "bold",
                    border: "1px solid #61dafb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                    padding: "10px 24px",
                    boxShadow: "0 4px 15px rgba(97, 218, 251, 0.1)",
                  }}
                >
                  Show Less
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
