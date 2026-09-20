// Detect AniList schedule delays and push local/calendar dates forward.

import { resolveNextAiringEpisode, getAiringScheduleNodes } from "./airingDisplay";

/**
 * Merge past + upcoming schedule nodes and nextAiringEpisode into one list.
 */
export function mergeScheduleNodes(nodes, nextAiringEpisode) {
  const byEpisode = new Map();

  for (const node of nodes || []) {
    if (!node || typeof node.episode !== "number") continue;
    byEpisode.set(node.episode, { episode: node.episode, airingAt: node.airingAt });
  }

  if (
    nextAiringEpisode &&
    typeof nextAiringEpisode.episode === "number" &&
    typeof nextAiringEpisode.airingAt === "number"
  ) {
    byEpisode.set(nextAiringEpisode.episode, {
      episode: nextAiringEpisode.episode,
      airingAt: nextAiringEpisode.airingAt,
    });
  }

  return Array.from(byEpisode.values()).sort((a, b) => a.episode - b.episode);
}

/**
 * True when local next airing time is already past but the show is still airing —
 * a common signal that AniList delayed the episode and we still have the old date.
 */
export function isAnimeScheduleOverdue(anime, nowSec = Math.floor(Date.now() / 1000)) {
  if (!anime?.id) return false;
  if (anime.status === "FINISHED") return false;

  const next = resolveNextAiringEpisode(anime);
  const airingAt =
    (next?.airingAt && next.airingAt) ||
    anime.nextAiringEpisode?.airingAt ||
    anime.airingAt ||
    null;

  if (typeof airingAt !== "number") {
    // No next time but still supposedly airing — refresh to learn the real schedule.
    return anime.status === "RELEASING" || !anime.status;
  }

  return airingAt <= nowSec;
}

/**
 * True when fresh AniList data moved an episode later than what we stored locally.
 */
export function hasScheduleDelay(anime, freshSchedule, freshNext, nowSec = Math.floor(Date.now() / 1000)) {
  if (!anime) return false;

  const localNodes = getAiringScheduleNodes(anime);
  const freshNodes = mergeScheduleNodes(freshSchedule, freshNext);
  if (freshNodes.length === 0) return false;

  const freshByEp = new Map(freshNodes.map((n) => [n.episode, n.airingAt]));

  for (const local of localNodes) {
    if (typeof local?.episode !== "number" || typeof local?.airingAt !== "number") continue;
    const freshAt = freshByEp.get(local.episode);
    if (typeof freshAt !== "number") continue;
    // Delayed / pushed back (or corrected forward by more than a minute)
    if (freshAt > local.airingAt + 60) return true;
  }

  const localNext = resolveNextAiringEpisode(anime);
  if (
    localNext?.episode != null &&
    typeof localNext.airingAt === "number" &&
    freshNext?.episode === localNext.episode &&
    typeof freshNext.airingAt === "number" &&
    freshNext.airingAt > localNext.airingAt + 60
  ) {
    return true;
  }

  // Local time already passed but AniList still has a future airing for that / next ep
  if (isAnimeScheduleOverdue(anime, nowSec) && freshNext?.airingAt > nowSec) {
    return true;
  }

  return false;
}

/**
 * Re-apply a stored user offset onto fresh AniList schedule times.
 */
export function withPreservedUserOffset(anime, freshSchedule, freshNext) {
  const offset = anime.userTimeOffsetSeconds || 0;
  const schedule = mergeScheduleNodes(
    Array.isArray(freshSchedule) ? freshSchedule : getAiringScheduleNodes(anime),
    freshNext
  );
  const baseNext = freshNext ?? null;
  const baseAiringAt = baseNext?.airingAt ?? schedule.find((n) => n.airingAt > Date.now() / 1000)?.airingAt ?? null;

  if (!offset) {
    return {
      fullAiringSchedule: schedule,
      airingAt: baseAiringAt,
      episode: baseNext?.episode ?? anime.episode,
      nextAiringEpisode: baseNext,
      userTimeOffsetSeconds: 0,
      originalAiringAt: undefined,
      originalFullAiringSchedule: undefined,
    };
  }

  const shift = (ts) => (typeof ts === "number" ? ts + offset : ts);
  const adjustedSchedule = schedule.map((n) => ({
    ...n,
    airingAt: shift(n.airingAt),
  }));
  const adjustedNext = baseNext
    ? { ...baseNext, airingAt: shift(baseNext.airingAt) }
    : null;

  return {
    fullAiringSchedule: adjustedSchedule,
    airingAt: shift(baseAiringAt),
    episode: adjustedNext?.episode ?? anime.episode,
    nextAiringEpisode: adjustedNext,
    userTimeOffsetSeconds: offset,
    originalAiringAt: baseAiringAt,
    originalFullAiringSchedule: schedule,
    releaseTimeUpdatedAt: anime.releaseTimeUpdatedAt || 0,
  };
}

/**
 * Update calendar episode rows from watching-list schedules (pushes delayed dates).
 * Returns { list, changed }.
 */
export function syncCalendarFromWatching(calendarList, watchingList) {
  const byId = new Map((watchingList || []).map((a) => [a.id, a]));
  let changed = false;

  const list = (calendarList || []).map((ep) => {
    const anime = byId.get(ep.id);
    if (!anime) return ep;

    const scheduleEp = (anime.fullAiringSchedule || []).find((n) => n.episode === ep.episode);
    const fromNext =
      anime.nextAiringEpisode?.episode === ep.episode ? anime.nextAiringEpisode.airingAt : null;
    const nextAiringAt = scheduleEp?.airingAt ?? fromNext;

    if (typeof nextAiringAt !== "number" || nextAiringAt === ep.airingAt) {
      return ep;
    }

    changed = true;
    return {
      ...ep,
      airingAt: nextAiringAt,
      title: {
        ...(anime.title || ep.title),
        customTitle: anime.customTitle || ep.title?.customTitle || undefined,
      },
      coverImage: anime.coverImage || ep.coverImage,
      favorited: anime.favorited || false,
      siteUrl: anime.siteUrl || ep.siteUrl,
      externalLinks: anime.externalLinks || ep.externalLinks || [],
    };
  });

  return { list, changed };
}

/**
 * Pick anime IDs that should be re-fetched from AniList for delay detection.
 */
export function pickAnimeIdsForScheduleRefresh(list, { getCachedDetails, soonWindowSec = 60 * 60 * 24 * 14 } = {}) {
  const nowSec = Math.floor(Date.now() / 1000);
  const ids = [];

  for (const anime of list || []) {
    if (!anime?.id) continue;
    if (anime.status === "FINISHED") continue;

    // Always refresh overdue titles — likely delayed on AniList.
    if (isAnimeScheduleOverdue(anime, nowSec)) {
      ids.push(anime.id);
      continue;
    }

    if (typeof getCachedDetails === "function" && getCachedDetails(anime.id)) {
      continue;
    }

    const nextAiringAt = anime.nextAiringEpisode?.airingAt || anime.airingAt || null;
    const hasSchedule = Array.isArray(anime.fullAiringSchedule) && anime.fullAiringSchedule.length > 0;
    const airingSoon =
      typeof nextAiringAt === "number" &&
      nextAiringAt > nowSec &&
      nextAiringAt - nowSec <= soonWindowSec;

    if (!hasSchedule || airingSoon || nextAiringAt == null) {
      ids.push(anime.id);
    }
  }

  return ids;
}
