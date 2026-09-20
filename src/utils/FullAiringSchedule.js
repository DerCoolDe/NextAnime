// FullAiringSchedule.js

import { getCachedSchedule, setCachedSchedule } from "../utils/cacheUtils";
import { fetchFullAiringSchedule } from "./anilistApi";

export async function FullAiringSchedule(animeId, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = getCachedSchedule(animeId);
    if (cached) {
      console.log("Loaded from cache:", animeId);
      return cached;
    }
  }

  try {
    const schedule = await fetchFullAiringSchedule(animeId);
    console.log("Fetched from API:", animeId, schedule);
    setCachedSchedule(animeId, schedule);
    return schedule;
  } catch (error) {
    console.error("Error fetching full airing schedule:", error);
    return [];
  }
}
