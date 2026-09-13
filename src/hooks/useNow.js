import { useSyncExternalStore } from "react";

const TICK_MS = 1000;
let now = Date.now();
const subscribers = new Set();
const domCountdowns = new Set();
let timerId = null;

function startTicker() {
  if (timerId !== null) {
    return;
  }
  timerId = setInterval(() => {
    now = Date.now();
    subscribers.forEach((callback) => callback());
    domCountdowns.forEach((entry) => {
      if (!entry.el?.isConnected) {
        domCountdowns.delete(entry);
        return;
      }
      const text = entry.getText(now);
      if (entry.el.textContent !== text) {
        entry.el.textContent = text;
      }
    });
  }, TICK_MS);
}

function stopTicker() {
  if (timerId === null) {
    return;
  }
  clearInterval(timerId);
  timerId = null;
}

function subscribe(callback) {
  subscribers.add(callback);
  if (timerId === null) {
    startTicker();
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && domCountdowns.size === 0) {
      stopTicker();
    }
  };
}

function getSnapshot() {
  return now;
}

export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Updates text via DOM only — avoids React re-renders every second. */
export function registerDomCountdown(entry) {
  domCountdowns.add(entry);
  if (timerId === null) {
    startTicker();
  }
  if (entry.el) {
    const text = entry.getText(now);
    entry.el.textContent = text;
  }
  return () => {
    domCountdowns.delete(entry);
    if (subscribers.size === 0 && domCountdowns.size === 0) {
      stopTicker();
    }
  };
}

export function formatCountdown(airingAtSeconds, currentTimeMs) {
  if (!airingAtSeconds) {
    return "";
  }

  const diffMs = airingAtSeconds * 1000 - currentTimeMs;
  if (diffMs <= 0) {
    return "Now airing";
  }

  const seconds = Math.floor(diffMs / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && days === 0) parts.push(`${secs}s`);

  return parts.length > 0 ? parts.join(" ") : "Less than a second";
}