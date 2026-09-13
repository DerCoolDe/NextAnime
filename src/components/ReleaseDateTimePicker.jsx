import React, { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DESKTOP_QUERY = "(min-width: 1024px)";

function pad(n) {
  return String(n).padStart(2, "0");
}

function parseLocalDateTime(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match.map(Number);
  const date = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLocalDateTimeValue(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(date) {
  if (!date) return "Select release time";
  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_QUERY).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function buildMonthCells(viewYear, viewMonth) {
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

/**
 * Desktop: custom calendar/time popover matching the app theme.
 * Phone/tablet: native datetime-local input.
 */
export default function ReleaseDateTimePicker({ value, onChange, style }) {
  const isDesktop = useIsDesktop();
  const parsed = useMemo(() => parseLocalDateTime(value), [value]);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => (parsed || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parsed || new Date()).getMonth());
  const [draftHour, setDraftHour] = useState(() => (parsed ? parsed.getHours() : 12));
  const [draftMinute, setDraftMinute] = useState(() => (parsed ? parsed.getMinutes() : 0));
  const rootRef = useRef(null);

  useEffect(() => {
    if (!parsed) return;
    setViewYear(parsed.getFullYear());
    setViewMonth(parsed.getMonth());
    setDraftHour(parsed.getHours());
    setDraftMinute(parsed.getMinutes());
  }, [parsed]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!isDesktop) {
    return (
      <input
        type="datetime-local"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          flex: 1,
          minWidth: 240,
          padding: 10,
          borderRadius: 6,
          border: "1px solid #333",
          background: "#2a2a2a",
          color: "#eee",
          ...style,
        }}
      />
    );
  }

  const cells = buildMonthCells(viewYear, viewMonth);
  const selectedDay = parsed &&
    parsed.getFullYear() === viewYear &&
    parsed.getMonth() === viewMonth
    ? parsed.getDate()
    : null;
  const today = new Date();

  function commitDate(day, hour = draftHour, minute = draftMinute) {
    const next = new Date(viewYear, viewMonth, day, hour, minute, 0, 0);
    onChange?.(toLocalDateTimeValue(next));
  }

  function shiftMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function applyTime(hour, minute) {
    setDraftHour(hour);
    setDraftMinute(minute);
    const day = parsed?.getDate() || today.getDate();
    const year = parsed?.getFullYear() ?? viewYear;
    const month = parsed?.getMonth() ?? viewMonth;
    const next = new Date(year, month, day, hour, minute, 0, 0);
    onChange?.(toLocalDateTimeValue(next));
  }

  const fieldStyle = {
    flex: 1,
    minWidth: 260,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    border: open ? "1px solid rgba(97, 218, 251, 0.55)" : "1px solid rgba(97, 218, 251, 0.25)",
    background: "rgba(42, 42, 42, 0.95)",
    color: "#eee",
    cursor: "pointer",
    boxShadow: open ? "0 0 0 1px rgba(97, 218, 251, 0.15)" : "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    ...style,
  };

  const navBtn = {
    background: "rgba(97, 218, 251, 0.1)",
    border: "1px solid rgba(97, 218, 251, 0.3)",
    color: "#61dafb",
    borderRadius: 6,
    width: 32,
    height: 32,
    cursor: "pointer",
    fontWeight: 700,
  };

  const selectStyle = {
    background: "#2a2a2a",
    color: "#eee",
    border: "1px solid #444",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 14,
  };

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, minWidth: 260 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={fieldStyle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>{formatDisplay(parsed)}</span>
        <span style={{ color: "#61dafb", fontSize: 13, opacity: 0.9 }}>▾</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose release date and time"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 30,
            width: 320,
            background: "#1f1f1f",
            border: "1px solid rgba(97, 218, 251, 0.3)",
            borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
            padding: 14,
            color: "#eee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={navBtn} aria-label="Previous month">
              ‹
            </button>
            <div style={{ fontWeight: 700, color: "#61dafb", fontSize: 15 }}>
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button type="button" onClick={() => shiftMonth(1)} style={navBtn} aria-label="Next month">
              ›
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 6,
            }}
          >
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#888",
                  fontWeight: 700,
                  padding: "4px 0",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              marginBottom: 14,
            }}
          >
            {cells.map((day, index) => {
              if (day == null) {
                return <div key={`empty-${index}`} />;
              }
              const isSelected = selectedDay === day;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === day;

              return (
                <button
                  key={`${viewYear}-${viewMonth}-${day}`}
                  type="button"
                  onClick={() => commitDate(day)}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    border: isToday && !isSelected ? "1px solid rgba(97, 218, 251, 0.45)" : "1px solid transparent",
                    background: isSelected
                      ? "linear-gradient(135deg, #61dafb, #6dd6ff)"
                      : "rgba(42, 42, 42, 0.9)",
                    color: isSelected ? "#000" : "#eee",
                    fontWeight: isSelected || isToday ? 700 : 500,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div
            style={{
              borderTop: "1px solid #333",
              paddingTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 12, color: "#aaa", marginRight: 4 }}>Time</span>
            <select
              value={draftHour}
              onChange={(e) => applyTime(Number(e.target.value), draftMinute)}
              style={selectStyle}
              aria-label="Hour"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {pad(h)}
                </option>
              ))}
            </select>
            <span style={{ color: "#61dafb", fontWeight: 700 }}>:</span>
            <select
              value={draftMinute}
              onChange={(e) => applyTime(draftHour, Number(e.target.value))}
              style={selectStyle}
              aria-label="Minute"
            >
              {Array.from({ length: 60 }, (_, m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                background: "rgba(97, 218, 251, 0.15)",
                border: "1px solid rgba(97, 218, 251, 0.35)",
                color: "#61dafb",
                borderRadius: 6,
                padding: "8px 12px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
