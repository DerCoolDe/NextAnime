// src/components/AnimeCard.jsx
import React, { useCallback } from "react";
import CountdownText from "./CountdownText";

const CARD_STYLE = {
  display: "flex",
  background: "#232323ff",
  borderRadius: 12,
  boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  padding: 15,
  alignItems: "center",
  gap: 20,
  transition: "transform 0.2s ease",
  cursor: "default",
};

const COVER_LINK_STYLE = {
  flexShrink: 0,
  borderRadius: 8,
  overflow: "hidden",
  width: 120,
  height: 170,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  display: "block",
};

const COVER_IMG_STYLE = { width: "100%", height: "100%", objectFit: "cover" };

const TITLE_STYLE = {
  margin: "0 0 8px",
  fontSize: "1.3rem",
  fontWeight: "700",
};

const GENRES_STYLE = {
  margin: "0 0 10px",
  color: "#aaa",
  fontStyle: "italic",
};

const LINE_STYLE = { margin: "0 0 6px" };
const RELEASE_LINE_STYLE = { margin: "0 0 10px" };

function getButtonStyle(isInWatchingList) {
  return {
    padding: "8px 16px",
    backgroundColor: isInWatchingList ? "#666" : "#6dd6ff",
    color: isInWatchingList ? "#ccc" : "#000",
    fontWeight: "bold",
    border: "none",
    borderRadius: "6px",
    cursor: isInWatchingList ? "default" : "pointer",
    fontSize: "14px",
    transition: "background-color 0.3s ease",
  };
}

function AnimeCard({ episode, watchingIdSet, onAddAnime }) {
  const {
    media: { id, title, coverImage, genres, siteUrl },
    episode: epNumber,
    airingAt,
  } = episode;

  const isInWatchingList = Boolean(watchingIdSet && watchingIdSet.has(id));
  const displayTitle = title.romaji || title.english || "";

  const handleAddAnime = useCallback(async () => {
    if (onAddAnime) {
      await onAddAnime(title.romaji || title.english);
    }
  }, [onAddAnime, title.romaji, title.english]);

  const handleMouseEnter = useCallback((e) => {
    e.currentTarget.style.transform = "scale(1.02)";
  }, []);

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = "scale(1)";
  }, []);

  return (
    <div
      style={CARD_STYLE}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={siteUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={COVER_LINK_STYLE}
        title={displayTitle}
      >
        <img
          src={coverImage.extraLarge}
          alt={displayTitle}
          style={COVER_IMG_STYLE}
          loading="lazy"
          decoding="async"
          width={120}
          height={170}
        />
      </a>

      <div style={{ flex: 1 }}>
        <h3 style={TITLE_STYLE}>
          {title.romaji} {title.english ? `(${title.english})` : ""}
        </h3>

        <p style={GENRES_STYLE}>{genres?.join(", ")}</p>

        <p style={LINE_STYLE}>
          <strong>Episode:</strong> {epNumber}
        </p>

        <p style={RELEASE_LINE_STYLE}>
          <strong>Release:</strong>{" "}
          <CountdownText airingAtSeconds={airingAt} />
        </p>

        <button
          onClick={handleAddAnime}
          disabled={isInWatchingList}
          style={getButtonStyle(isInWatchingList)}
          title={isInWatchingList ? "Anime already in your list" : "Add to watching list"}
        >
          {isInWatchingList ? "Anime already added" : "Add anime"}
        </button>
      </div>
    </div>
  );
}

export default React.memo(AnimeCard);
