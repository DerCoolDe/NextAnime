// src/utils/storage.js

export function loadWatchingList() {
  try {
    const data = localStorage.getItem("watchingList");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWatchingList(list) {
  localStorage.setItem("watchingList", JSON.stringify(list));
}

// Calendar List

export function loadCalendarList() {
  try {
    const data = localStorage.getItem("calendarList");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCalendarList(list) {
  localStorage.setItem("calendarList", JSON.stringify(list));
}

/** Stable key for a calendar episode row (anime id + episode number). */
export function calendarEpisodeKey(ep) {
  if (!ep?.id) return null;
  return `${ep.id}-${ep.episode ?? "?"}`;
}

/** Union local and Firestore calendar rows by anime id + episode (local wins on conflict). */
export function mergeCalendarLists(localList, firestoreList) {
  const calendarMap = new Map();

  (localList || []).forEach((ep) => {
    const key = calendarEpisodeKey(ep);
    if (key) calendarMap.set(key, ep);
  });

  (firestoreList || []).forEach((ep) => {
    const key = calendarEpisodeKey(ep);
    if (key && !calendarMap.has(key)) {
      calendarMap.set(key, ep);
    }
  });

  return Array.from(calendarMap.values());
}
