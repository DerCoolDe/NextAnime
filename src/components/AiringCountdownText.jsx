import React, { useEffect, useRef } from "react";
import { registerDomCountdown } from "../hooks/useNow";

const EPISODE_LINE_STYLE = {
  fontSize: "clamp(10px, 2vw, 12px)",
  color: "#ccc",
  marginTop: 4,
  marginBottom: 0,
};

export default function AiringCountdownText({ airingAt, episode, isCompleted }) {
  const lineRef = useRef(null);

  useEffect(() => {
    if (isCompleted || !airingAt || !lineRef.current) {
      return undefined;
    }

    const el = lineRef.current;
    const getText = (currentTimeMs) => {
      const diffMs = airingAt * 1000 - currentTimeMs;
      if (diffMs <= 0) {
        return `Ep ${episode ?? "?"} - Now airing`;
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

      const countdown = parts.length > 0 ? parts.join(" ") : "Less than a second";
      return `Ep ${episode ?? "?"} - ${countdown}`;
    };

    return registerDomCountdown({ el, getText });
  }, [airingAt, episode, isCompleted]);

  if (isCompleted) {
    return <p style={EPISODE_LINE_STYLE}>Completed</p>;
  }
  if (!airingAt) {
    return <p style={EPISODE_LINE_STYLE}>Finished airing</p>;
  }

  return <p ref={lineRef} style={EPISODE_LINE_STYLE} />;
}
