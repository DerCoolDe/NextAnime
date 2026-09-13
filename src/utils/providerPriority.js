// Ordered highest → lowest priority.
export const DEFAULT_PROVIDER_ORDER = [
  "Crunchyroll",
  "Netflix",
  "AniList",
  "Prime Video",
  "Disney+",
];

const STORAGE_KEY = "providerPriorityOrder";
export const PROVIDER_PRIORITY_CHANGED_EVENT = "providerPriorityChanged";

export function loadProviderPriorityOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_PROVIDER_ORDER];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_PROVIDER_ORDER];
    }
    const cleaned = parsed.filter((name) => typeof name === "string" && name.trim());
    const missing = DEFAULT_PROVIDER_ORDER.filter((name) => !cleaned.includes(name));
    return [...cleaned, ...missing];
  } catch {
    return [...DEFAULT_PROVIDER_ORDER];
  }
}

export function saveProviderPriorityOrder(order) {
  const next = Array.isArray(order) && order.length > 0 ? order : [...DEFAULT_PROVIDER_ORDER];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(PROVIDER_PRIORITY_CHANGED_EVENT, { detail: next }));
  return next;
}

/** Higher number = higher priority. Unknown providers get 0. */
export function getProviderPriority(siteName, order = loadProviderPriorityOrder()) {
  if (!siteName) return 0;
  const normalized = siteName.toLowerCase();
  const idx = order.findIndex((name) => normalized.includes(String(name).toLowerCase()));
  if (idx === -1) return 0;
  return order.length - idx;
}

export function getAniListUrl(animeOrId, fallbackUrl = "") {
  if (fallbackUrl && String(fallbackUrl).includes("anilist.co")) {
    return fallbackUrl;
  }
  const id = typeof animeOrId === "object" ? animeOrId?.id : animeOrId;
  if (id) return `https://anilist.co/anime/${id}`;
  return fallbackUrl || "";
}

export function getBestProviderUrlFromLinks(externalLinks, anilistSiteUrl, order = loadProviderPriorityOrder()) {
  const candidates = [];

  if (Array.isArray(externalLinks)) {
    for (const link of externalLinks) {
      if (link?.url) {
        candidates.push({ url: link.url, site: link.site || "" });
      }
    }
  }

  if (anilistSiteUrl) {
    const already = candidates.some((c) => c.url === anilistSiteUrl);
    if (!already) {
      candidates.push({ url: anilistSiteUrl, site: "AniList" });
    }
  }

  if (candidates.length === 0) return anilistSiteUrl || "";

  candidates.sort((a, b) => {
    const diff = getProviderPriority(b.site, order) - getProviderPriority(a.site, order);
    if (diff !== 0) return diff;
    return (a.site || "").localeCompare(b.site || "");
  });

  return candidates[0]?.url || anilistSiteUrl || "";
}

/** Prefer an existing priority provider link; otherwise pick by settings order. */
export function getBestProviderUrl(anime, order = loadProviderPriorityOrder()) {
  if (!anime) return "";

  if (anime.siteUrl) {
    const externalLink = anime.externalLinks?.find((link) => link.url === anime.siteUrl);
    if (externalLink && getProviderPriority(externalLink.site, order) > 0) {
      return anime.siteUrl;
    }
  }

  const anilistUrl = getAniListUrl(anime, anime.originalSiteUrl || anime.siteUrl || "");
  return getBestProviderUrlFromLinks(anime.externalLinks || [], anilistUrl, order);
}

export function sortProvidersByPriority(links, anilistSiteUrl, order = loadProviderPriorityOrder()) {
  const allLinks = [];

  if (links && links.length > 0) {
    allLinks.push(...links.map((link) => ({ ...link, isAniList: false })));
  }

  if (anilistSiteUrl) {
    const alreadyHas = allLinks.some((l) => l.url === anilistSiteUrl);
    if (!alreadyHas) {
      allLinks.push({ url: anilistSiteUrl, site: "AniList", isAniList: true });
    }
  }

  return allLinks.sort((a, b) => {
    const diff = getProviderPriority(b.site, order) - getProviderPriority(a.site, order);
    if (diff !== 0) return diff;
    return (a.site || "").localeCompare(b.site || "");
  });
}
