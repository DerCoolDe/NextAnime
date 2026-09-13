import React, { memo, useMemo } from "react";
import SavedAnimeCard from "./SavedAnimeCard";
import { resolveNextAiringEpisode } from "../utils/airingDisplay";

function SavedAnimeHorizontal({
  watchingList,
  onDelete,
  onToggleFavorite,
  calendarIdSet,
  onToggleCalendar,
  isCompleted,
  onClickEdit,
  onChangeStatus,
}) {
  const adjustedList = useMemo(() => {
    return watchingList.map((anime) => {
      if (anime.status === "FINISHED") {
        return anime;
      }
      const next = resolveNextAiringEpisode(anime);
      if (!next) return anime;
      return {
        ...anime,
        airingAt: next.airingAt,
        episode: next.episode,
        nextAiringEpisode: next,
      };
    });
  }, [watchingList]);

  if (adjustedList.length === 0) return null;

  return (
    <div
      className="anime-scroll-container"
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
        contain: "layout style paint",
      }}
    >
      {adjustedList.map((anime) => (
        <SavedAnimeCard
          key={anime.id}
          anime={anime}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onToggleCalendar={onToggleCalendar}
          isInCalendar={calendarIdSet.has(anime.id)}
          isCompleted={isCompleted(anime)}
          onClickEdit={onClickEdit}
          onChangeStatus={onChangeStatus}
        />
      ))}
    </div>
  );
}

const MemoSavedAnimeHorizontal = memo(SavedAnimeHorizontal, (prev, next) => {
  if (prev.watchingList !== next.watchingList) return false;
  if (prev.calendarIdSet !== next.calendarIdSet) return false;
  if (prev.isCompleted !== next.isCompleted) return false;
  return (
    prev.onDelete === next.onDelete &&
    prev.onToggleFavorite === next.onToggleFavorite &&
    prev.onToggleCalendar === next.onToggleCalendar &&
    prev.onClickEdit === next.onClickEdit &&
    prev.onChangeStatus === next.onChangeStatus
  );
});

export default MemoSavedAnimeHorizontal;
