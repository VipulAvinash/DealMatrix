import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useSearchStore } from "../../store/searchStore";

const TRENDING = [
  "iPhone 16 Pro", "Samsung Galaxy S25", "MacBook Pro M4",
  "Sony WH-1000XM6", "iPad Pro", "AirPods Pro 3",
];

export default function SearchBox({ autoFocus = false }) {
  const navigate = useNavigate();
  const { recentSearches, clearRecentSearches } = useSearchStore();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setFocused(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSuggestion = (suggestion) => {
    setQuery(suggestion);
    setFocused(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  const showDropdown = focused && (recentSearches.length > 0 || TRENDING.length > 0);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div
          className={`flex items-center gap-3 bg-slate-900 border rounded-2xl px-4 py-3 transition-all duration-200 ${
            focused
              ? "border-primary-500 ring-2 ring-primary-500/20 shadow-lg shadow-primary-500/10"
              : "border-slate-700 hover:border-slate-600"
          }`}
        >
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search iPhone 16 Pro, MacBook, TV..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-base outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim()}
            className="btn-primary py-1.5 px-4 flex items-center gap-2 text-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search AI</span>
            <ArrowRight className="w-3.5 h-3.5 sm:hidden" />
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 card border-slate-700 shadow-2xl overflow-hidden z-50 animate-fade-in">
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Recent
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.slice(0, 4).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-800">
            <div className="px-4 pt-3 pb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Trending
              </span>
            </div>
            {TRENDING.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors text-left"
              >
                <TrendingUp className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
