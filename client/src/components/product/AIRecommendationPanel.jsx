import { memo } from "react";
import { Sparkles, Trophy, Wallet, Crown, Zap, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import StarRating from "../ui/StarRating";

const CATEGORIES = [
  { key: "bestOverall", label: "Best Overall", icon: Trophy, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10 border-amber-500/20" },
  { key: "bestValue", label: "Best Value", icon: Wallet, color: "from-emerald-500 to-green-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "bestPremium", label: "Premium Pick", icon: Crown, color: "from-purple-500 to-violet-500", bg: "bg-purple-500/10 border-purple-500/20" },
  { key: "bestBudget", label: "Best Budget", icon: Zap, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10 border-blue-500/20" },
];

const AIRecommendationPanel = memo(({ recommendations, products, aiSummary, buyingTips }) => {
  if (!recommendations) return null;

  const getProduct = (rec) => {
    if (!rec) return null;
    if (rec.productIndex !== undefined && products) return products[rec.productIndex];
    return rec;
  };

  const hasAnyRecommendation = CATEGORIES.some(
    ({ key }) => getProduct(recommendations[key])
  );

  if (!hasAnyRecommendation) return null;

  return (
    <div className="card border-primary-500/20 bg-primary-500/5 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="font-display font-bold text-white">AI Recommendations</h2>
          <p className="text-xs text-slate-500">Analysed across all platforms</p>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      {/* Recommendation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {CATEGORIES.map(({ key, label, icon: Icon, color, bg }) => {
          const rec = recommendations[key];
          const product = getProduct(rec);
          if (!product) return null;

          const reason = rec?.reason || recommendations.reasoning?.[key];
          const currency = product.price?.currency === "INR" ? "₹" : "$";
          const price = product.price?.amount;

          return (
            <Link
              key={key}
              to={`/product/${product._id}`}
              className="block group rounded-xl border bg-slate-900/70 hover:bg-slate-800/80 transition-all duration-200 overflow-hidden"
              style={{ borderColor: "rgba(99,102,241,0.15)" }}
            >
              {/* Category header */}
              <div className={`flex items-center gap-2 px-3 py-2 border-b border-slate-800 ${bg} border`}>
                <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-300">{label}</span>
              </div>

              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                  {product.name}
                </p>

                {product.rating?.average > 0 && (
                  <StarRating rating={product.rating.average} count={product.rating.count} />
                )}

                {price && (
                  <p className="text-base font-bold text-white">
                    {currency}{price.toLocaleString()}
                  </p>
                )}

                {reason && (
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed border-t border-slate-800 pt-2 mt-2">
                    {reason}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Buying Tips */}
      {buyingTips?.length > 0 && (
        <div className="border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-300">Buying Tips</span>
          </div>
          <ul className="space-y-1.5">
            {buyingTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-primary-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

AIRecommendationPanel.displayName = "AIRecommendationPanel";
export default AIRecommendationPanel;
