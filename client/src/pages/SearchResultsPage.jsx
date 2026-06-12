import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import SearchBox from "../components/search/SearchBox";
import SearchFilters from "../components/search/SearchFilters";
import SearchMetaBar from "../components/search/SearchMetaBar";
import ProductGrid from "../components/product/ProductGrid";
import AIRecommendationPanel from "../components/product/AIRecommendationPanel";
import { RecommendationSkeleton } from "../components/ui/Skeleton";
import { useProductSearch } from "../hooks/useProducts";
import { useSearchStore } from "../store/searchStore";
import { useDebounce } from "../hooks/useDebounce";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters } = useSearchStore();

  const urlQuery = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(localQuery, 500);

  // Sync URL → local state
  useEffect(() => {
    setLocalQuery(urlQuery);
  }, [urlQuery]);

  const { data, isLoading, isError, error, refetch, isFetching } = useProductSearch(
    debouncedQuery,
    filters,
    { enabled: !!debouncedQuery }
  );

  const results = data?.data;
  const products = results?.products || [];
  const recommendations = results?.recommendations;
  const meta = results?.meta;

  const handleFilterApply = useCallback((newFilters) => {
    // Trigger re-fetch by updating search params
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    }
  }, [debouncedQuery, setSearchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search box */}
      <div className="mb-6">
        <SearchBox />
      </div>

      {/* Error state */}
      {isError && (
        <div className="card border-red-500/20 bg-red-500/5 p-6 mb-6 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Search failed</h3>
            <p className="text-sm text-slate-400">
              {error?.response?.data?.message || "Something went wrong. Please try again."}
            </p>
          </div>
          <button onClick={refetch} className="btn-secondary text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* Loading state — show searching message */}
      {(isLoading || isFetching) && !data && (
        <div className="mb-6 card p-5 border-primary-500/20 bg-primary-500/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-slate-300">
              AI is searching Amazon, Flipkart, Reliance, Croma and more for{" "}
              <span className="font-semibold text-primary-400">"{debouncedQuery}"</span>…
            </p>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Filters sidebar */}
        <SearchFilters onApply={handleFilterApply} />

        {/* Results */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Meta bar */}
          {results && !isLoading && (
            <SearchMetaBar
              meta={meta}
              totalCount={results.totalCount}
              query={debouncedQuery}
            />
          )}

          {/* AI Recommendations */}
          {isLoading && !data ? (
            <RecommendationSkeleton />
          ) : recommendations ? (
            <AIRecommendationPanel
              recommendations={recommendations}
              products={products}
              aiSummary={recommendations.aiSummary}
              buyingTips={recommendations.buyingTips}
            />
          ) : null}

          {/* Product Grid */}
          <ProductGrid
            products={products}
            isLoading={isLoading && !data}
          />

          {/* Pagination info */}
          {data?.pagination && (
            <div className="flex items-center justify-center pt-4">
              <p className="text-sm text-slate-500">
                Showing page{" "}
                <span className="text-slate-300 font-medium">{data.pagination.page}</span>
                {" "}of{" "}
                <span className="text-slate-300 font-medium">{data.pagination.totalPages}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
