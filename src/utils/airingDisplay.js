export function getAiringScheduleNodes(anime) {
  if (!anime) return [];
  if (Array.isArray(anime.fullAiringSchedule) && anime.fullAiringSchedule.length > 0) {
    return anime.fullAiringSchedule;
  }
  if (Array.isArray(anime.airingSchedule?.nodes) && anime.airingSchedule.nodes.length > 0) {
    return anime.airingSchedule.nodes;
  }
  return [];
}

/** Next episode to show on cards: first schedule entry with airingAt in the future. */
export function resolveNextAiringEpisode(anime) {
  if (!anime || anime.status === "FINISHED") {
    return null;
  }

  const now = Date.now() / 1000;
  const nodes = getAiringScheduleNodes(anime);
  const fromSchedule = nodes.find((ep) => ep?.airingAt > now);
  if (fromSchedule) {
    return { episode: fromSchedule.episode, airingAt: fromSchedule.airingAt };
  }

  const legacy = anime.nextAiringEpisode;
  if (legacy?.airingAt && legacy.airingAt > now) {
    return { episode: legacy.episode, airingAt: legacy.airingAt };
  }

  if (anime.airingAt && anime.airingAt > now && anime.episode) {
    return { episode: anime.episode, airingAt: anime.airingAt };
  }

  return legacy?.airingAt ? legacy : null;
}
