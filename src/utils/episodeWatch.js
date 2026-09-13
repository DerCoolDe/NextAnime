// Episode watch progress: per anime, highest episode watched contiguously (eps 1..N count as watched).

const LOCAL_KEY = "watchedAnime";
export const FIRESTORE_WATCH_FIELD = "firebaseEpisodeWatch";

function readThrough(value) {
  if (value == null) return 0;
  if (typeof value === "number") return Math.max(0, Math.floor(value));
  if (typeof value === "object") {
    if (value.through != null) return Math.max(0, Math.floor(Number(value.through) || 0));
    if (value.watchedThrough != null) {
      return Math.max(0, Math.floor(Number(value.watchedThrough) || 0));
    }
  }
  return 0;
}

function readUpdatedAt(value) {
  if (value == null || typeof value !== "object") return 0;
  const t = Number(value.updatedAt);
  return Number.isNaN(t) ? 0 : t;
}

function toEntry(through, updatedAt = Date.now()) {
  const n = Math.max(0, Math.floor(Number(through) || 0));
  if (n <= 0) return null;
  return { through: n, updatedAt };
}

export function normalizeWatchProgress(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw)) {
    const through = readThrough(value);
    if (through > 0) {
      out[String(key)] = {
        through,
        updatedAt: readUpdatedAt(value),
      };
    }
  }
  return out;
}

export function loadLocalWatchProgress() {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? normalizeWatchProgress(JSON.parse(saved)) : {};
  } catch {
    return {};
  }
}

export function saveLocalWatchProgress(progress) {
  const normalized = normalizeWatchProgress(progress);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
  return normalized;
}

/** Prefer the copy with the newer updatedAt (fixes un-watch being overwritten by max-merge). */
export function mergeWatchProgress(local, remote) {
  const localNorm = normalizeWatchProgress(local);
  const remoteNorm = normalizeWatchProgress(remote);
  const merged = { ...localNorm };
  const ids = new Set([...Object.keys(localNorm), ...Object.keys(remoteNorm)]);

  for (const id of ids) {
    const l = localNorm[id];
    const r = remoteNorm[id];
    if (!l && r) merged[id] = r;
    else if (l && !r) merged[id] = l;
    else if (l && r) {
      if (r.updatedAt > l.updatedAt) merged[id] = r;
      else if (l.updatedAt > r.updatedAt) merged[id] = l;
      else {
        merged[id] = {
          through: Math.max(l.through, r.through),
          updatedAt: l.updatedAt,
        };
      }
    }
  }
  return merged;
}

export function getWatchedThrough(progress, animeId) {
  return readThrough(progress?.[String(animeId)]);
}

export function isEpisodeWatched(progress, animeId, episode) {
  const ep = Number(episode);
  if (!ep || Number.isNaN(ep)) return false;
  return ep <= getWatchedThrough(progress, animeId);
}

function setThroughOnProgress(progress, animeId, through) {
  const id = String(animeId);
  const next = { ...normalizeWatchProgress(progress) };
  const entry = toEntry(through);
  if (!entry) {
    delete next[id];
  } else {
    next[id] = entry;
  }
  return next;
}

/** Mark through `episode` as watched (fills 1..episode). */
export function markEpisodeWatched(progress, animeId, episode) {
  const ep = Number(episode);
  if (!ep || Number.isNaN(ep)) return normalizeWatchProgress(progress);
  const current = getWatchedThrough(progress, animeId);
  return setThroughOnProgress(progress, animeId, Math.max(current, ep));
}

/** Toggle watch through N, or unwatch from N upward. */
export function toggleEpisodeWatch(progress, animeId, episode) {
  const ep = Number(episode);
  if (!ep || Number.isNaN(ep)) return normalizeWatchProgress(progress);

  const current = getWatchedThrough(progress, animeId);
  const alreadyWatched = ep <= current;

  if (alreadyWatched) {
    return setThroughOnProgress(progress, animeId, ep - 1);
  }
  return setThroughOnProgress(progress, animeId, Math.max(current, ep));
}

export function listUnwatchedEpisodes(watchedThrough, releasedMax) {
  const max = Number(releasedMax) || 0;
  const through = Number(watchedThrough) || 0;
  const missing = [];
  for (let ep = 1; ep <= max; ep++) {
    if (ep > through) missing.push(ep);
  }
  return missing;
}

/** Set exact watched-through episode (0 clears all). */
export function setWatchedThrough(progress, animeId, through) {
  const n = Math.max(0, Math.floor(Number(through) || 0));
  return setThroughOnProgress(progress, animeId, n);
}

const nowSec = () => Math.floor(Date.now() / 1000);

/** Released episode numbers for an anime from calendar entries. */
export function getReleasedEpisodesFromCalendar(calendarList, animeId) {
  const id = Number(animeId);
  const episodes = new Set();
  (calendarList || []).forEach((entry) => {
    if (entry?.id !== id || !entry.episode) return;
    if (entry.airingAt && entry.airingAt > nowSec()) return;
    episodes.add(entry.episode);
  });
  return Array.from(episodes).sort((a, b) => a - b);
}
