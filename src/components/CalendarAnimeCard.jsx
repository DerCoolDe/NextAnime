import React, { useEffect, useRef } from "react";
import Countdown from "./Countdown";
import { isEpisodeWatched } from "../utils/episodeWatch";

const EPISODES_ICON_COLOR = {
  watched: "#6a6a6a",
  default: "#9a9a9a",
  favorited: "#7eb8c9",
};

function EpisodesListIcon({ color }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 4h10M2 7h10M2 10h6"
        stroke={color}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

const HOLD_MS = 500;
const DOUBLE_TAP_MS = 320;

export default function CalendarAnimeCard({
  anime,
  onRemove,
  watchProgress,
  onToggleEpisodeWatch,
  onOpenEpisodePanel,
}) {
  const isAiring = anime.episode !== null && anime.airingAt !== null;
  const holdTimerRef = useRef(null);
  const holdFiredRef = useRef(false);
  const pointerDownAtRef = useRef(0);
  const lastTapAtRef = useRef(0);

  const isWatched = isEpisodeWatched(watchProgress, anime.id, anime.episode);
  const link = anime.siteUrl || anime.externalLinks?.[0]?.url;

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const isInteractiveChild = (target) => {
    if (!target?.closest) return false;
    return Boolean(target.closest("button"));
  };

  const startHoldToOpenLink = (e) => {
    if (isInteractiveChild(e.target)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    holdFiredRef.current = false;
    pointerDownAtRef.current = Date.now();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (!link) return;

    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      holdFiredRef.current = true;
      window.open(link, "_blank", "noopener,noreferrer");
    }, HOLD_MS);
  };

  const endPointer = (e) => {
    if (isInteractiveChild(e.target)) return;

    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* ignore */
    }

    clearHoldTimer();
    if (holdFiredRef.current) {
      holdFiredRef.current = false;
      return;
    }

    const pressDuration = Date.now() - pointerDownAtRef.current;
    if (pressDuration >= HOLD_MS - 40) {
      return;
    }

    // Touch: manual double-tap. Mouse: use onDoubleClick (avoids double-firing toggle).
    if (e.pointerType !== "touch") {
      return;
    }

    const now = Date.now();
    if (now - lastTapAtRef.current <= DOUBLE_TAP_MS) {
      lastTapAtRef.current = 0;
      handleToggleWatch(e);
    } else {
      lastTapAtRef.current = now;
    }
  };

  const cancelHold = () => {
    clearHoldTimer();
    holdFiredRef.current = false;
  };

  useEffect(() => () => clearHoldTimer(), []);

  const handleToggleWatch = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!anime.episode) return;
    onToggleEpisodeWatch?.(anime.id, anime.episode);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearHoldTimer();
    holdFiredRef.current = false;
    lastTapAtRef.current = 0;
    handleToggleWatch(e);
  };

  const handleOpenEpisodes = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenEpisodePanel?.(anime);
  };

  const title =
    anime.title?.customTitle || anime.title?.english || anime.title?.romaji || anime.title;

  const listIconColor = isWatched
    ? EPISODES_ICON_COLOR.watched
    : anime.favorited
      ? EPISODES_ICON_COLOR.favorited
      : EPISODES_ICON_COLOR.default;

  return (
    <div
      title={`${title} — double-tap to toggle watched${link ? " · hold to open link" : ""}`}
      onDoubleClick={handleDoubleClick}
      onPointerDown={startHoldToOpenLink}
      onPointerUp={endPointer}
      onPointerCancel={cancelHold}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        backgroundColor: isWatched
          ? "#252525"
          : anime.favorited
            ? "#2a2a2a"
            : "#3a3a3a",
        filter: isWatched ? "grayscale(75%)" : "none",
        borderRadius: 8,
        padding: 8,
        cursor: link ? "pointer" : "default",
        minHeight: 90,
        overflow: "hidden",
        transition: "background-color 0.2s ease, filter 0.2s ease, border-color 0.2s ease",
        border: isWatched
          ? "2px solid #4caf50"
          : anime.favorited
            ? "2px solid #61dafb"
            : "2px solid transparent",
        boxShadow: anime.favorited && !isWatched ? "0 0 15px rgba(97, 218, 251, 0.3)" : "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        opacity: isWatched ? 0.85 : 1,
        touchAction: "manipulation",
      }}
    >
      {isWatched && (
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "#4caf50",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 4,
            zIndex: 2,
          }}
        >
          WATCHED
        </span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          className="anime-image-container"
          style={{
            position: "relative",
            width: 36,
            height: 54,
            flexShrink: 0,
            borderRadius: 6,
            overflow: "hidden",
            filter: isWatched ? "grayscale(75%)" : "none",
            transition: "filter 0.2s ease",
          }}
        >
          <img
            src={anime.coverImage.extraLarge}
            alt={title}
            className="anime-cover-image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "opacity 0.3s ease",
            }}
          />
          <button
            className="remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(anime.id);
            }}
            title="Remove from calendar"
            aria-label={`Remove ${title} from calendar`}
          >
            🗑
          </button>
        </div>

        <div
          style={{
            fontWeight: "700",
            fontSize: 13,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flexGrow: 1,
            minWidth: 0,
            color: isWatched ? "#888" : "#eee",
            transition: "color 0.2s ease",
            paddingRight: isWatched ? 52 : 0,
          }}
        >
          {title}
        </div>
      </div>

      {isAiring && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: isWatched ? "#888" : "#ccc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            paddingLeft: 2,
            paddingRight: 2,
            gap: 6,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
            <div style={{ fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.2 }}>
              Ep {anime.episode}
            </div>
            <button
              type="button"
              onClick={handleOpenEpisodes}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              title="Episode watch list"
              aria-label="Open episode watch list"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                margin: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                opacity: 0.85,
                lineHeight: 0,
              }}
            >
              <EpisodesListIcon color={listIconColor} />
            </button>
          </div>
          <div
            style={{
              minWidth: 0,
              maxWidth: "65%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              textAlign: "right",
              color: isWatched ? "#666" : "#aaa",
              paddingBottom: 1,
            }}
          >
            <Countdown airingAt={anime.airingAt} />
          </div>
        </div>
      )}
    </div>
  );
}
