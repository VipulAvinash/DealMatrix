import { useNavigate } from "react-router-dom";
import { GitCompareArrows, X, ArrowRight } from "lucide-react";
import { useSearchStore } from "../../store/searchStore";

export default function CompareBar() {
  const navigate = useNavigate();
  const { compareList, removeFromCompare, clearCompare } = useSearchStore();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-primary-500/30 shadow-2xl shadow-primary-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Icon + count */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <GitCompareArrows className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-300">
              Compare
              <span className="ml-1.5 badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
                {compareList.length}/4
              </span>
            </span>
          </div>

          {/* Product chips */}
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {compareList.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg pl-2.5 pr-1.5 py-1"
              >
                <span className="text-xs text-slate-300 max-w-[120px] truncate">
                  {product.name}
                </span>
                <button
                  onClick={() => removeFromCompare(product._id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {compareList.length < 4 && (
              <div className="flex items-center gap-1.5 bg-slate-800/50 border border-dashed border-slate-700 rounded-lg px-2.5 py-1">
                <span className="text-xs text-slate-600">
                  +{4 - compareList.length} more
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1"
            >
              Clear
            </button>
            <button
              disabled={compareList.length < 2}
              onClick={() => navigate("/compare")}
              className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
            >
              Compare Now
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
