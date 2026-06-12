import { useState } from "react";
import { Filter, ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";
import { useSearchStore } from "../../store/searchStore";

const CATEGORIES = [
  "Smartphones", "Laptops", "Tablets", "Audio", "Cameras",
  "TVs", "Gaming", "Wearables", "Accessories",
];

const RATINGS = [4.5, 4, 3.5, 3];

const PLATFORMS = [
  { id: "amazon", label: "Amazon" },
  { id: "flipkart", label: "Flipkart" },
  { id: "reliance", label: "Reliance Digital" },
  { id: "croma", label: "Croma" },
];

export default function SearchFilters({ onApply, className = "" }) {
  const { filters, setFilter, clearFilters } = useSearchStore();
  const [expanded, setExpanded] = useState({ price: true, category: true, rating: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeCount = Object.values(filters).filter(
    (v) => v !== null && v !== undefined && v !== ""
  ).length;

  const handleApply = () => {
    onApply?.(filters);
    setMobileOpen(false);
  };

  const FiltersContent = () => (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
              {activeCount}
            </span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Price Range */}
      <FilterSection
        label="Price Range"
        expanded={expanded.price}
        onToggle={() => toggle("price")}
      >
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ""}
            onChange={(e) => setFilter("priceMin", e.target.value || null)}
            className="input-base w-full px-3 py-1.5 text-sm"
            min={0}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ""}
            onChange={(e) => setFilter("priceMax", e.target.value || null)}
            className="input-base w-full px-3 py-1.5 text-sm"
            min={0}
          />
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection
        label="Category"
        expanded={expanded.category}
        onToggle={() => toggle("category")}
      >
        <div className="space-y-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter("category", filters.category === cat ? null : cat)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.category === cat
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Minimum Rating */}
      <FilterSection
        label="Minimum Rating"
        expanded={expanded.rating}
        onToggle={() => toggle("rating")}
      >
        <div className="space-y-1">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => setFilter("rating", filters.rating === r ? null : r)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.rating === r
                  ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="text-amber-400">{"★".repeat(Math.floor(r))}</span>
              <span>{r}+ stars</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <button onClick={handleApply} className="btn-primary w-full text-sm">
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden lg:block w-56 shrink-0 ${className}`}>
        <div className="card p-4 sticky top-20">
          <FiltersContent />
        </div>
      </aside>

      {/* Mobile toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs">
              {activeCount}
            </span>
          )}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="relative ml-auto w-72 bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-5">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="mt-8">
                <FiltersContent />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const FilterSection = ({ label, expanded, onToggle, children }) => (
  <div>
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between text-sm font-medium text-slate-300 mb-2"
    >
      {label}
      {expanded ? (
        <ChevronUp className="w-4 h-4 text-slate-500" />
      ) : (
        <ChevronDown className="w-4 h-4 text-slate-500" />
      )}
    </button>
    {expanded && children}
  </div>
);
