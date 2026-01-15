// src/components/AnimeCard.jsx
import React, { useMemo } from "react";
import { useNow, formatCountdown } from "../hooks/useNow";

function AnimeCard({ episode, watchingIdSet, onAddAnime }) {
  const {
    media: { id, title, coverImage, genres, siteUrl },
    episode: epNumber,
    airingAt,
  } = episode;

  const currentTime = useNow();
  const countdown = useMemo(
    () => formatCountdown(airingAt, currentTime),
    [airingAt, currentTime]
  );

  const isInWatchingList = Boolean(watchingIdSet && watchingIdSet.has(id));

  const handleAddAnime = async () => {
    if (onAddAnime) {
      await onAddAnime(title.romaji || title.english);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        background: "#232323ff",
        borderRadius: 12,
        boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
        padding: 15,
        alignItems: "center",
        gap: 20,
        transition: "transform 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <a
        href={siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          flexShrink: 0,
          borderRadius: 8,
          overflow: "hidden",
          width: 120,
          height: 170,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "block",
        }}
        title={title.romaji}
      >
        <img
          src={coverImage.extraLarge}
          alt={title.romaji}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
          decoding="async"
        />
      </a>

      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "1.3rem",
            fontWeight: "700",
          }}
        >
          {title.romaji} {title.english ? `(${title.english})` : ""}
        </h3>

        <p
          style={{
            margin: "0 0 10px",
            color: "#aaa",
            fontStyle: "italic",
          }}
        >
          {genres?.join(", ")}
        </p>

        <p style={{ margin: "0 0 6px" }}>
          <strong>Episode:</strong> {epNumber}
        </p>

        <p style={{ margin: "0 0 10px" }}>
          <strong>Release:</strong> {countdown}
        </p>

        <button
          onClick={handleAddAnime}
          disabled={isInWatchingList}
          style={{
            padding: "8px 16px",
            backgroundColor: isInWatchingList ? "#666" : "#6dd6ff",
            color: isInWatchingList ? "#ccc" : "#000",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: isInWatchingList ? "default" : "pointer",
            fontSize: "14px",
            transition: "background-color 0.3s ease",
          }}
          title={isInWatchingList ? "Anime already in your list" : "Add to watching list"}
        >
          {isInWatchingList ? "Anime already added" : "Add anime"}
        </button>
      </div>
    </div>
  );
}

export default React.memo(AnimeCard);
