import React, { useMemo, useRef, useEffect, useState } from "react";
import { LIST_STATUS_OPTIONS, DEFAULT_LIST_STATUS } from "../constants/listStatuses";
import { useNow, formatCountdown } from "../hooks/useNow";

export default function SavedAnimeCard({
  anime,
  onDelete,
  onToggleFavorite,
  onToggleCalendar,
  calendarList,
  isCompleted,
  onClickEdit,
  onChangeStatus,
  onRename,
}) {
  const currentTime = useNow();
  const clickTimerRef = useRef(null);
  const statusMenuRef = useRef(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!statusMenuOpen) return;

    function handleOutsideClick(event) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setStatusMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [statusMenuOpen]);

  const nextAiringTs = anime.nextAiringEpisode?.airingAt || null;
  const nextAiringEp = anime.nextAiringEpisode?.episode || null;
  const countdown = useMemo(() => {
    if (isCompleted || !nextAiringTs) return "";
    return formatCountdown(nextAiringTs, currentTime);
  }, [nextAiringTs, currentTime, isCompleted]);

  const isAiring = !isCompleted && !!nextAiringTs;

  const airingText = useMemo(() => {
    if (isCompleted) {
      return "Completed";
    }
    if (isAiring) {
      return `Ep ${nextAiringEp ?? "?"} - ${countdown || "Now airing"}`;
    }
    return "Finished airing";
  }, [countdown, isAiring, isCompleted, nextAiringEp]);

  const isInCalendar = useMemo(
    () => calendarList.some((a) => a.id === anime.id),
    [calendarList, anime.id]
  );

  const currentStatus = anime.listStatus || DEFAULT_LIST_STATUS;

  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    if (anime.siteUrl) {
      window.open(anime.siteUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      if (onClickEdit) {
        onClickEdit(anime);
      }
      clickTimerRef.current = null;
    }, 250);
  };

  const handleStatusButtonClick = (event) => {
    event.stopPropagation();
    setStatusMenuOpen((prev) => !prev);
  };

  const handleStatusOptionSelect = (status) => {
    if (onChangeStatus) {
      onChangeStatus(anime.id, status);
    }
    setStatusMenuOpen(false);
  };

  const titleDisplay = anime.customTitle || anime.title?.english || anime.title?.romaji;

  return (
    <div
      style={{
        position: "relative",
        width: "clamp(160px, 25vw, 200px)",
        minWidth: "clamp(160px, 25vw, 200px)",
        height: "clamp(380px, 60vw, 460px)",
        borderRadius: "clamp(8px, 1.5vw, 12px)",
        overflow: "visible",
        backgroundColor: anime.favorited ? "#2a2a2a" : "#1e1e1e",
        border: anime.favorited ? "2px solid #61dafb" : "none",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        color: "#eee",
        userSelect: "none",
        boxShadow: anime.favorited ? "0 0 15px rgba(97, 218, 251, 0.3)" : "none",
        transition: "all 0.3s ease",
        cursor: "pointer",
        contain: "layout style",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = anime.favorited
          ? "0 8px 25px rgba(97, 218, 251, 0.4)"
          : "0 8px 25px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = anime.favorited
          ? "0 0 15px rgba(97, 218, 251, 0.3)"
          : "none";
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Single click to edit - double click to visit anime page"
    >
      <img
        src={anime.coverImage.extraLarge}
        alt={anime.title.english || anime.title.romaji}
        style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover" }}
        loading="lazy"
        decoding="async"
      />
      <div
        style={{
          padding: "10px",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          textAlign: "center",
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: "clamp(12px, 2.5vw, 14px)",
              lineHeight: "1.2em",
              height: "2.4em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              wordBreak: "break-word",
            }}
            title={titleDisplay}
          >
            {titleDisplay}
          </h4>

          <p style={{ fontSize: "clamp(10px, 2vw, 12px)", color: "#ccc", marginTop: 4 }}>
            {airingText}
          </p>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <div ref={statusMenuRef} style={{ position: "relative", zIndex: 50 }}>
              <button
                type="button"
                onClick={handleStatusButtonClick}
                style={{
                  background: "rgba(97, 218, 251, 0.15)",
                  border: "1px solid rgba(97, 218, 251, 0.4)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  color: "#61dafb",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: 12,
                  boxShadow: statusMenuOpen
                    ? "0 0 12px rgba(97, 218, 251, 0.45)"
                    : "0 0 8px rgba(97, 218, 251, 0.2)",
                  transition: "all 0.2s ease",
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
                title="Change list status"
              >
                {currentStatus}
              </button>
              {statusMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "110%",
                    left: 0,
                    background: "rgba(30, 30, 30, 0.95)",
                    border: "1px solid rgba(97, 218, 251, 0.35)",
                    borderRadius: 8,
                    boxShadow: "0 0 14px rgba(97, 218, 251, 0.35)",
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    minWidth: 160,
                    zIndex: 999,
                    maxWidth: "min(160px, calc(100vw - 40px))",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {LIST_STATUS_OPTIONS.map((status) => {
                    const isActive = status === currentStatus;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleStatusOptionSelect(status);
                        }}
                        style={{
                          background: isActive ? "rgba(97, 218, 251, 0.25)" : "transparent",
                          color: "#eee",
                          border: "none",
                          borderRadius: 6,
                          padding: "6px 10px",
                          textAlign: "left",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = "rgba(97, 218, 251, 0.35)";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = isActive
                            ? "rgba(97, 218, 251, 0.25)"
                            : "transparent";
                        }}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(anime.id);
              }}
              style={{
                backgroundColor: "#61dafb",
                border: "none",
                borderRadius: "50%",
                width: "clamp(24px, 4vw, 32px)",
                height: "clamp(24px, 4vw, 32px)",
                cursor: "pointer",
                fontSize: "clamp(14px, 3vw, 18px)",
                lineHeight: 1,
                transition: "all 0.3s ease",
              }}
              aria-label={anime.favorited ? "Unfavorite anime" : "Favorite anime"}
              title={anime.favorited ? "Unfavorite" : "Favorite"}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {anime.favorited ? "★" : "☆"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(anime.id);
              }}
              style={{
                backgroundColor: "#e55353",
                border: "none",
                borderRadius: "50%",
                width: "clamp(24px, 4vw, 32px)",
                height: "clamp(24px, 4vw, 32px)",
                cursor: "pointer",
                color: "white",
                fontWeight: "bold",
                fontSize: "clamp(16px, 3vw, 20px)",
                lineHeight: 1,
                transition: "all 0.3s ease",
              }}
              aria-label="Delete anime"
              title="Delete"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ×
            </button>
          </div>

          {isAiring && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCalendar(anime);
              }}
              style={{
                marginTop: 4,
                fontSize: "clamp(10px, 2vw, 12px)",
                padding: "clamp(4px, 1vw, 6px) clamp(8px, 2vw, 10px)",
                borderRadius: "clamp(4px, 1vw, 6px)",
                border: "none",
                backgroundColor: isInCalendar ? "#28a745" : "#007acc",
                color: "white",
                cursor: "pointer",
                width: "100%",
                fontWeight: "700",
                userSelect: "none",
                transition: "all 0.3s ease",
              }}
              aria-pressed={isInCalendar}
              title={isInCalendar ? "Remove from calendar" : "Add to calendar"}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {isInCalendar ? "Added" : "Add to calendar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
