import { Link } from "react-router-dom";
import { GitCompareArrows, ArrowLeft, X, Package, Trophy } from "lucide-react";
import { useSearchStore } from "../store/searchStore";
import { useCompareProducts } from "../hooks/useProducts";
import StarRating from "../components/ui/StarRating";
import Badge, { getPlatformVariant } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useSearchStore();
  const productIds = compareList.map((p) => p._id);

  const { data, isLoading } = useCompareProducts(productIds);
  const comparison = data?.data;
  const products = comparison?.products || compareList;
  const winner = comparison?.winner;

  const formatPrice = (price) => {
    if (!price) return "N/A";
    const sym = price.currency === "INR" ? "₹" : "$";
    return `${sym}${price.amount?.toLocaleString()}`;
  };

  if (compareList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <GitCompareArrows className="w-14 h-14 text-slate-700 mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-slate-300 mb-2">No products to compare</h2>
        <p className="text-slate-500 text-sm mb-6">
          Add up to 4 products from search results to compare them side by side.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Start Searching
        </Link>
      </div>
    );
  }

  const ROWS = [
    { key: "platform", label: "Platform", render: (p) => (
      <span className={`badge border ${getPlatformVariant(p.source?.platform)}`}>
        {p.source?.platform || "Global"}
      </span>
    )},
    { key: "price", label: "Price", render: (p) => (
      <div>
        <span className="font-bold text-white">{formatPrice(p.price)}</span>
        {p.price?.discountPercent > 0 && (
          <span className="ml-2 badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
            -{p.price.discountPercent}%
          </span>
        )}
      </div>
    )},
    { key: "rating", label: "Rating", render: (p) => (
      p.rating?.average > 0
        ? <StarRating rating={p.rating.average} count={p.rating.count} />
        : <span className="text-slate-600 text-sm">No ratings</span>
    )},
    { key: "brand", label: "Brand", render: (p) => (
      <span className="text-slate-300">{p.brand || "—"}</span>
    )},
    { key: "category", label: "Category", render: (p) => (
      <span className="text-slate-400 text-sm">{p.category || "—"}</span>
    )},
    { key: "inStock", label: "Availability", render: (p) => (
      <span className={`text-sm font-medium ${p.availability?.inStock ? "text-emerald-400" : "text-red-400"}`}>
        {p.availability?.inStock ? "✓ In Stock" : "✗ Out of Stock"}
      </span>
    )},
    { key: "delivery", label: "Delivery", render: (p) => (
      <span className="text-slate-400 text-xs">{p.availability?.deliveryEstimate || "—"}</span>
    )},
    { key: "seller", label: "Seller", render: (p) => (
      <span className="text-slate-400 text-sm">{p.seller?.name || "—"}</span>
    )},
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/search" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5 text-primary-400" />
            Comparing {products.length} products
          </h1>
        </div>
        <button onClick={clearCompare} className="btn-secondary text-sm flex items-center gap-2">
          <X className="w-4 h-4" /> Clear all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs text-slate-500 uppercase tracking-wide font-semibold px-4 py-3 w-32 bg-slate-900 rounded-tl-xl border border-slate-800">
                Attribute
              </th>
              {products.map((p) => (
                <th key={p._id} className="px-4 py-3 bg-slate-900 border border-slate-800 min-w-[200px]">
                  <div className="relative">
                    {winner?._id?.toString() === p._id?.toString() && (
                      <div className="absolute -top-1 right-0 flex items-center gap-1 badge bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                        <Trophy className="w-3 h-3" /> Winner
                      </div>
                    )}
                    <button
                      onClick={() => removeFromCompare(p._id)}
                      className="absolute -top-1 left-0 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="mt-4 mb-2 flex items-center justify-center">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <Package className="w-10 h-10 text-slate-700" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 text-center line-clamp-2 leading-snug">
                      {p.name}
                    </p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ key, label, render }, rowIdx) => (
              <tr key={key} className={rowIdx % 2 === 0 ? "bg-slate-900/50" : "bg-slate-900/20"}>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border border-slate-800">
                  {label}
                </td>
                {products.map((p) => (
                  <td key={p._id} className="px-4 py-3 border border-slate-800">
                    {isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : (
                      render(p)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View links */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((p) => (
          <Link
            key={p._id}
            to={`/product/${p._id}`}
            className="btn-secondary text-xs text-center"
          >
            View Details →
          </Link>
        ))}
      </div>
    </div>
  );
}
