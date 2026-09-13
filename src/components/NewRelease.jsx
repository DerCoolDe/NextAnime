import React, { useEffect, useRef } from "react";
import { notifyDiscordBot } from "../utils/DiscordNotifier";

function NewRelease({ watchingList }) {
  const notifiedReleases = useRef(new Set());
  const watchingListRef = useRef(watchingList);

  useEffect(() => {
    watchingListRef.current = watchingList;
  }, [watchingList]);

  useEffect(() => {
    const saved = localStorage.getItem("notifiedReleases");
    if (saved) {
      try {
        notifiedReleases.current = new Set(JSON.parse(saved));
      } catch {
        notifiedReleases.current = new Set();
      }
    }

    const testing = false;

    const testAnime = {
      id: 999992,
      title: { english: "Test Anime", romaji: "Test Anime" },
      coverImage: {
        extraLarge:
          "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178754-Dgrub8xgC03M.jpg",
      },
      nextAiringEpisode: {
        episode: 999,
        airingAt: Math.floor(Date.now() / 1000) - 120,
      },
    };

    async function checkReleases() {
      const listToCheck = testing
        ? [testAnime, ...watchingListRef.current]
        : watchingListRef.current;

      const now = Math.floor(Date.now() / 1000);
      let newReleasesFound = false;

      for (const anime of listToCheck) {
        if (anime.status === "FINISHED") continue;
        if (!anime.nextAiringEpisode) continue;

        const ep = anime.nextAiringEpisode.episode;
        const airingAt = anime.nextAiringEpisode.airingAt;
        if (!ep || !airingAt) continue;

        const episodeKey = `${anime.id}-${ep}`;
        const timeSinceAiring = now - airingAt;

        if (
          timeSinceAiring >= 60 &&
          timeSinceAiring < 600 &&
          !notifiedReleases.current.has(episodeKey)
        ) {
          notifiedReleases.current.add(episodeKey);
          localStorage.setItem(
            "notifiedReleases",
            JSON.stringify([...notifiedReleases.current])
          );

          const title = anime.title.english || anime.title.romaji || "Unknown Anime";
          const imageUrl = anime.coverImage?.extraLarge || null;

          await notifyDiscordBot(`${title} episode ${ep} just released!`, imageUrl);
          newReleasesFound = true;
        }
      }

      if (!newReleasesFound && testing) {
        console.log("ℹ️ No new releases at this time.");
      }
    }

    const interval = setInterval(checkReleases, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

export default React.memo(NewRelease);
