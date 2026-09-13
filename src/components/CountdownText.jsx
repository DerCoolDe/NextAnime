import React, { useEffect, useRef } from "react";
import { registerDomCountdown, formatCountdown } from "../hooks/useNow";

/** Countdown that updates via DOM only — no per-second React re-renders. */
export default function CountdownText({ airingAtSeconds, style, className }) {
  const elRef = useRef(null);

  useEffect(() => {
    if (!airingAtSeconds || !elRef.current) {
      return undefined;
    }

    const el = elRef.current;
    const getText = (currentTimeMs) => formatCountdown(airingAtSeconds, currentTimeMs);

    return registerDomCountdown({ el, getText });
  }, [airingAtSeconds]);

  if (!airingAtSeconds) {
    return null;
  }

  return <span ref={elRef} style={style} className={className} />;
}
