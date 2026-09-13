import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_PROVIDER_ORDER,
  loadProviderPriorityOrder,
  saveProviderPriorityOrder,
} from "../utils/providerPriority";

export default function Settings() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(() => loadProviderPriorityOrder());
  const [savedFlash, setSavedFlash] = useState(false);

  const persist = useCallback((next) => {
    setOrder(next);
    saveProviderPriorityOrder(next);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }, []);

  const move = useCallback(
    (index, direction) => {
      const target = index + direction;
      if (target < 0 || target >= order.length) return;
      const next = [...order];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      persist(next);
    },
    [order, persist]
  );

  const resetDefaults = useCallback(() => {
    persist([...DEFAULT_PROVIDER_ORDER]);
  }, [persist]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#eee",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "clamp(16px, 4vw, 40px)",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "#2a2a2a",
              color: "#eee",
              border: "1px solid #444",
              borderRadius: 6,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Settings</h1>
          {savedFlash && (
            <span style={{ marginLeft: "auto", color: "#81c784", fontSize: 13 }}>Saved</span>
          )}
        </div>

        <section
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Default streaming link</h2>
          <p style={{ margin: "0 0 16px", color: "#aaa", fontSize: 14, lineHeight: 1.45 }}>
            New anime use the first available provider in this list. Drag priority with the arrows —
            higher in the list wins.
          </p>

          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {order.map((name, index) => (
              <li
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "#242424",
                  borderRadius: 8,
                  border: "1px solid #333",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "#333",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    color: "#61dafb",
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{name}</span>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${name} up`}
                  style={{
                    background: index === 0 ? "#2a2a2a" : "#333",
                    color: index === 0 ? "#666" : "#eee",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: index === 0 ? "default" : "pointer",
                  }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move ${name} down`}
                  style={{
                    background: index === order.length - 1 ? "#2a2a2a" : "#333",
                    color: index === order.length - 1 ? "#666" : "#eee",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 10px",
                    cursor: index === order.length - 1 ? "default" : "pointer",
                  }}
                >
                  ↓
                </button>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={resetDefaults}
            style={{
              marginTop: 16,
              background: "transparent",
              color: "#61dafb",
              border: "1px solid #61dafb",
              borderRadius: 6,
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reset to Crunchyroll → Netflix → AniList
          </button>
        </section>
      </div>
    </div>
  );
}
