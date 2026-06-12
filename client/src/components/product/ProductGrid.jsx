import { useState, useMemo, memo } from "react";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import ProductCard from "./ProductCard";
import { SearchSkeletonGrid } from "../ui/Skeleton";

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
];

const ProductGrid = memo(({ products = [], isLoading = false, savedProductIds = [] }) => {
  const [sort, setSort] = useState("relevance");
  const [view, setView] = useState("grid");

  const sorted = useMemo(() => {
    const arr = [...products];
    switch (sort) {
      case "price_asc":
        return arr.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
      case "price_desc":
        return arr.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
      case "rating":
        return arr.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
      case "reviews":
        return arr.sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0));
      default:
        return arr; // keep server-side ranking
    }
  }, [products, sort]);

  if (isLoading) return <SearchSkeletonGrid count={8} />;

  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-1">No products found</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Try a different search term or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500">
          Showing <span className="text-slate-300 font-medium">{sorted.length}</span> products
        </p>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg px-2 py-1.5 border border-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-slate-800">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 transition-colors ${
                view === "grid" ? "bg-primary-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 transition-colors ${
                view === "list" ? "bg-primary-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            : "flex flex-col gap-3"
        }
      >
        {sorted.map((product, index) => (
          <ProductCard
            key={product._id || product.id || index}
            product={product}
            isSaved={savedProductIds.includes((product._id || product.id)?.toString())}
          />
        ))}
      </div>
    </div>
  );
});

ProductGrid.displayName = "ProductGrid";
export default ProductGrid;
