import React, { useRef, useState, useEffect } from "react";
import SavedAnimeCard from "./SavedAnimeCard";

function ShowMoreCard({ onClick, expanded, remaining }) {
  return (
    <div
      style={{
        position: "relative",
        width: "clamp(160px, 25vw, 200px)",
        minWidth: "clamp(160px, 25vw, 200px)",
        height: "clamp(380px, 60vw, 460px)",
        borderRadius: "clamp(8px, 1.5vw, 12px)",
        overflow: "hidden",
        backgroundColor: "#232323",
        border: "2px dashed #61dafb",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#eee",
        userSelect: "none",
        boxShadow: "0 0 15px rgba(97, 218, 251, 0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
      onClick={onClick}
      title={expanded ? "Show less" : `Show ${remaining} more`}
    >
      <div style={{ textAlign: "center" }}>
        <span style={{ fontSize: 36, color: "#61dafb" }}>{expanded ? "←" : "+"}</span>
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 10 }}>
          {expanded ? "Show Less" : `Show ${remaining} More`}
        </div>
      </div>
    </div>
  );
}

export default function SavedAnimeHorizontal({
  watchingList,
  onDelete,
  onToggleFavorite,
  calendarList,
  onToggleCalendar,
  isCompleted,
  onClickEdit,
}) {
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(4); // default fallback
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    function updateVisibleCount() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      // Estimate card width (should match SavedAnimeCard)
      const cardWidth = 180; // px, average between clamp min/max
      const gap = 20; // px, matches gap in style
      const count = Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
      setVisibleCount(count);
    }
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  if (watchingList.length === 0) return null;

  const now = Date.now() / 1000;
  const adjustedList = watchingList.map((anime) => {
    if (anime.status === "FINISHED") return anime;
    if (
      anime.airingAt &&
      anime.airingAt < now &&
      anime.airingSchedule?.nodes
    ) {
      const nextEp = anime.airingSchedule.nodes.find(
        (ep) => ep.airingAt > now
      );
      if (nextEp) {
        return {
          ...anime,
          airingAt: nextEp.airingAt,
          episode: nextEp.episode,
        };
      }
    }
    return anime;
  });

  let cardsToShow = adjustedList;
  let showMore = false;
  let remaining = 0;

  if (!expanded && adjustedList.length > visibleCount) {
    showMore = true;
    remaining = adjustedList.length - (visibleCount - 1);
    cardsToShow = adjustedList.slice(0, visibleCount - 1);
  }

  return (
    <div
      className="anime-scroll-container"
      ref={containerRef}
      style={{
        display: "flex",
        overflowX: "auto",
        gap: "clamp(12px, 2vw, 20px)",
        padding: "clamp(10px, 2vw, 20px)",
        marginBottom: "clamp(20px, 4vw, 40px)",
        maxWidth: "100%",
        scrollbarWidth: "thin",
        scrollbarColor: "#61dafb transparent",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {cardsToShow.map((anime) => (
        <SavedAnimeCard
          key={anime.id}
          anime={anime}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onToggleCalendar={onToggleCalendar}
          calendarList={calendarList}
          isCompleted={isCompleted(anime)}
          onClickEdit={onClickEdit}
        />
      ))}
      {showMore && (
        <ShowMoreCard
          onClick={() => setExpanded(true)}
          expanded={false}
          remaining={remaining}
        />
      )}
      {expanded && adjustedList.length > visibleCount && (
        <ShowMoreCard
          onClick={() => setExpanded(false)}
          expanded={true}
          remaining={0}
        />
      )}
    </div>
  );
}
