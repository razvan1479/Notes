// Bara de cautare instantanee. Filtreaza in timp real dupa continut.

import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
}

export const SearchBar = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onClose }, ref) => {
    return (
      <div className="search">
        <svg className="search__icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="13.5" y1="13.5" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={ref}
          className="search__input"
          type="text"
          placeholder="Cauta task-uri…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
        />
        {value && (
          <button className="search__clear" onClick={() => onChange("")} aria-label="Sterge cautarea">
            ×
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
