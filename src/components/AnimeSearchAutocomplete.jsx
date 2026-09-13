// components/AnimeSearchAutocomplete.jsx
import React, { useState, useEffect, useRef } from "react";
import { searchAnimeByName } from "../utils/anilistApi";

const CONTAINER_STYLE = {
  position: "relative",
  width: "100%",
  maxWidth: "400px",
  flexShrink: 1,
};

const INPUT_STYLE = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  width: "100%",
  fontSize: 16,
  backgroundColor: "#1e1e1e",
  color: "#eee",
};

const DROPDOWN_STYLE = {
  width: "100%",
  backgroundColor: "#222",
  color: "#eee",
  borderRadius: "0 0 6px 6px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
  listStyle: "none",
  margin: 0,
  padding: 0,
  maxHeight: 200,
  overflowY: "auto",
  scrollbarWidth: "none",
  marginTop: 6,
};

const SUGGESTION_ITEM_STYLE = {
  padding: "10px 12px",
  cursor: "pointer",
  borderBottom: "1px solid #333",
};

function AnimeSearchAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      setSuppressSuggestions(false);
      return;
    }

    if (suppressSuggestions) {
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const results = await searchAnimeByName(value.trim(), 6);
        setSuggestions(results);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [value, suppressSuggestions]);

  return (
    <div ref={containerRef} style={CONTAINER_STYLE}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setSuppressSuggestions(false);
          onChange(e.target.value);
        }}
        placeholder="e.g. Attack on Titan"
        style={INPUT_STYLE}
        onFocus={() => {
          if (!suppressSuggestions && value.trim()) {
            setShowDropdown(true);
          }
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul style={DROPDOWN_STYLE} className="autocomplete-dropdown">
          {suggestions.map((anime) => (
            <li
              key={anime.id}
              onClick={() => {
                const name = anime.title.english || anime.title.romaji;
                onSelect(name);
                setSuppressSuggestions(true);
                setShowDropdown(false);
              }}
              style={SUGGESTION_ITEM_STYLE}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#222";
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {anime.title.english || anime.title.romaji}
            </li>
          ))}
        </ul>
      )}

      <style>
        {`
          .autocomplete-dropdown::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
}

export default React.memo(AnimeSearchAutocomplete);
