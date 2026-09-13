import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  FIRESTORE_WATCH_FIELD,
  loadLocalWatchProgress,
  mergeWatchProgress,
  normalizeWatchProgress,
  saveLocalWatchProgress,
  toggleEpisodeWatch,
  markEpisodeWatched,
  setWatchedThrough,
} from "../utils/episodeWatch";

async function loadFirestoreWatchProgress(uid) {
  if (!uid) return {};
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data[FIRESTORE_WATCH_FIELD] || data.watchedAnime || {};
    }
  } catch (e) {
    console.error("Error loading episode watch progress from Firestore:", e);
  }
  return {};
}

async function saveFirestoreWatchProgress(uid, progress) {
  if (!uid) return;
  try {
    const normalized = normalizeWatchProgress(progress);
    await setDoc(
      doc(db, "users", uid),
      { [FIRESTORE_WATCH_FIELD]: normalized },
      { merge: true }
    );
  } catch (e) {
    console.error("Error saving episode watch progress to Firestore:", e);
  }
}

/**
 * Shared watch progress for calendar (local + Firestore when logged in).
 */
export function useEpisodeWatch(user) {
  const [watchProgress, setWatchProgress] = useState(() => loadLocalWatchProgress());
  const uid = user?.uid ?? null;

  const applyProgress = useCallback(
    (computeNext) => {
      setWatchProgress((prev) => {
        const next = typeof computeNext === "function" ? computeNext(prev) : computeNext;
        const normalized = saveLocalWatchProgress(next);
        if (uid) {
          saveFirestoreWatchProgress(uid, normalized);
        }
        return normalized;
      });
    },
    [uid]
  );

  const syncFromCloud = useCallback(async () => {
    if (!uid) {
      setWatchProgress(loadLocalWatchProgress());
      return;
    }
    const remote = await loadFirestoreWatchProgress(uid);
    const local = loadLocalWatchProgress();
    const merged = mergeWatchProgress(local, remote);
    const normalized = saveLocalWatchProgress(merged);
    setWatchProgress(normalized);
    if (JSON.stringify(normalized) !== JSON.stringify(normalizeWatchProgress(remote))) {
      await saveFirestoreWatchProgress(uid, normalized);
    }
  }, [uid]);

  useEffect(() => {
    syncFromCloud();
  }, [syncFromCloud]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "watchedAnime") {
        setWatchProgress(loadLocalWatchProgress());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        syncFromCloud();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [syncFromCloud]);

  const handleToggleEpisode = useCallback(
    (animeId, episode) => {
      applyProgress((prev) => toggleEpisodeWatch(prev, animeId, episode));
    },
    [applyProgress]
  );

  const handleMarkEpisode = useCallback(
    (animeId, episode) => {
      applyProgress((prev) => markEpisodeWatched(prev, animeId, episode));
    },
    [applyProgress]
  );

  const handleSetWatchedThrough = useCallback(
    (animeId, through) => {
      applyProgress((prev) => setWatchedThrough(prev, animeId, through));
    },
    [applyProgress]
  );

  return {
    watchProgress,
    syncFromCloud,
    toggleEpisode: handleToggleEpisode,
    markEpisode: handleMarkEpisode,
    setWatchedThrough: handleSetWatchedThrough,
  };
}

export async function syncEpisodeWatchForUser(uid) {
  if (!uid) return loadLocalWatchProgress();
  const remote = await loadFirestoreWatchProgress(uid);
  const local = loadLocalWatchProgress();
  const merged = mergeWatchProgress(local, remote);
  const normalized = saveLocalWatchProgress(merged);
  await saveFirestoreWatchProgress(uid, normalized);
  return normalized;
}
