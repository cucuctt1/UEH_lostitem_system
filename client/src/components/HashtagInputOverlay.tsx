import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { listTagRecommendationsApi } from "../services/api/miscApi";
import { TagRecommendation } from "../types";

interface ActiveToken {
  start: number;
  end: number;
  keyword: string;
}

interface HashtagInputOverlayProps {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  maxSuggestions?: number;
}

function getActiveToken(text: string, cursor: number | null): ActiveToken | null {
  if (cursor === null) {
    return null;
  }

  let start = cursor;
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start -= 1;
  }

  let end = cursor;
  while (end < text.length && !/\s/.test(text[end])) {
    end += 1;
  }

  const token = text.slice(start, end);
  if (!token.startsWith("#")) {
    return null;
  }

  const keyword = token.slice(1).toLowerCase();
  if (!/^[a-z0-9-]*$/.test(keyword)) {
    return null;
  }

  return { start, end, keyword };
}

export function HashtagInputOverlay({
  value,
  onChange,
  placeholder,
  maxSuggestions = 8
}: HashtagInputOverlayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fetchSeqRef = useRef(0);

  const [activeToken, setActiveToken] = useState<ActiveToken | null>(null);
  const [suggestions, setSuggestions] = useState<TagRecommendation[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  function updateActiveTokenFromSelection(text: string, cursor: number | null): void {
    const token = getActiveToken(text, cursor);
    setActiveToken(token);

    if (!token) {
      setOpen(false);
      setSuggestions([]);
      setHighlightIndex(0);
    }
  }

  useEffect(() => {
    if (!activeToken) {
      return;
    }

    const seq = ++fetchSeqRef.current;
    const timeout = setTimeout(() => {
      void listTagRecommendationsApi(activeToken.keyword || undefined, maxSuggestions)
        .then((rows) => {
          if (seq !== fetchSeqRef.current) {
            return;
          }

          setSuggestions(rows);
          setOpen(rows.length > 0);
          setHighlightIndex(0);
        })
        .catch(() => {
          if (seq !== fetchSeqRef.current) {
            return;
          }

          setSuggestions([]);
          setOpen(false);
          setHighlightIndex(0);
        });
    }, 120);

    return () => clearTimeout(timeout);
  }, [activeToken?.keyword, maxSuggestions]);

  function handleInputChange(nextRawValue: string, cursor: number | null): void {
    const nextValue = nextRawValue.toLowerCase();
    onChange(nextValue);
    updateActiveTokenFromSelection(nextValue, cursor);
  }

  function applySuggestion(tagName: string): void {
    if (!activeToken) {
      return;
    }

    const before = value.slice(0, activeToken.start);
    const after = value.slice(activeToken.end);
    const normalizedTag = `#${tagName.toLowerCase()}`;
    const shouldAppendSpace = after.length === 0 || !/^\s/.test(after);

    const nextValue = `${before}${normalizedTag}${shouldAppendSpace ? " " : ""}${after}`;
    const nextCursor = `${before}${normalizedTag}${shouldAppendSpace ? " " : ""}`.length;

    onChange(nextValue);
    setOpen(false);
    setSuggestions([]);
    setHighlightIndex(0);

    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
      updateActiveTokenFromSelection(nextValue, nextCursor);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const selected = suggestions[highlightIndex] ?? suggestions[0];
      if (selected) {
        applySuggestion(selected.name);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
  }

  return (
    <div className="hashtag-input-wrap">
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          handleInputChange(event.target.value, event.currentTarget.selectionStart);
        }}
        onClick={(event) => updateActiveTokenFromSelection(value, event.currentTarget.selectionStart)}
        onFocus={(event) => updateActiveTokenFromSelection(value, event.currentTarget.selectionStart)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
      />

      {open && suggestions.length > 0 && (
        <div className="hashtag-overlay" role="listbox" aria-label="Tag suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              className={`hashtag-option ${index === highlightIndex ? "active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applySuggestion(suggestion.name)}
            >
              <span className="hashtag-option-tag">{suggestion.tag}</span>
              <span className="hashtag-option-meta">
                {suggestion.isFrequent ? "Frequent" : suggestion.isPrebuilt ? "Prebuilt" : "Custom"} • {suggestion.useCount}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
