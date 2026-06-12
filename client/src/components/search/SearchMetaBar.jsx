import { Zap, Database, Wifi } from "lucide-react";

const platformColors = {
  amazon: "bg-orange-500",
  flipkart: "bg-blue-500",
  reliance: "bg-purple-500",
  croma: "bg-green-500",
  other: "bg-slate-500",
};

export default function SearchMetaBar({ meta, totalCount, query }) {
  if (!meta) return null;

  const { cacheHit, cacheSource, responseTimeMs, sources, source } = meta;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 py-3 px-4 bg-slate-900/60 rounded-xl border border-slate-800">
      {/* Left: result summary */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-400">
          <span className="font-semibold text-slate-200">{totalCount}</span> results for{" "}
          <span className="font-semibold text-primary-400">"{query}"</span>
        </p>

        {/* Source badges */}
        {sources && (
          <div className="hidden sm:flex items-center gap-2">
            {Object.entries(sources)
              .filter(([, count]) => count > 0)
              .map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${platformColors[platform] || platformColors.other}`} />
                  <span className="text-xs text-slate-500 capitalize">
                    {platform} ({count})
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Right: cache/speed indicators */}
      <div className="flex items-center gap-2">
        {cacheHit ? (
          <div className="flex items-center gap-1.5 badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-3 h-3" />
            <span className="text-xs">
              Cached ({cacheSource})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <Zap className="w-3 h-3" />
            <span className="text-xs">
              {source === "rag" ? "RAG Search" : "AI Search"}
            </span>
          </div>
        )}

        {responseTimeMs > 0 && (
          <div className="flex items-center gap-1 badge bg-slate-800 text-slate-500 border border-slate-700">
            <Wifi className="w-3 h-3" />
            <span className="text-xs">{(responseTimeMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>
    </div>
  );
}
