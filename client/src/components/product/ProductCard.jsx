import { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark, BookmarkCheck, GitCompareArrows, ShoppingCart,
  Package, Truck, ExternalLink, Sparkles,
} from "lucide-react";
import StarRating from "../ui/StarRating";
import Badge, { getPlatformVariant } from "../ui/Badge";
import { useSearchStore } from "../../store/searchStore";
import { useSaveProduct } from "../../hooks/useProducts";
import { useAuthStore } from "../../store/authStore";
import { toast } from "../ui/Toast";

const platformLabels = {
  amazon: "Amazon",
  flipkart: "Flipkart",
  reliance: "Reliance",
  croma: "Croma",
  other: "Global",
};

const ProductCard = memo(({ product, isSaved = false }) => {
  const { addToCompare, compareList } = useSearchStore();
  const { isAuthenticated } = useAuthStore();
  const { mutate: saveProduct } = useSaveProduct();
  const [saved, setSaved] = useState(isSaved);

  const platform = product.source?.platform || "other";
  const inCompare = compareList.some((p) => p._id === product._id);

  const handleSave = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.warning("Sign in to save products");
      return;
    }
    saveProduct(product._id, {
      onSuccess: (data) => {
        setSaved(data.data.saved);
        toast.success(data.data.saved ? "Product saved!" : "Product removed");
      },
      onError: () => toast.error("Failed to save product"),
    });
  };

  const handleCompare = (e) => {
    e.preventDefault();
    if (inCompare) {
      toast.info("Already in comparison");
      return;
    }
    const added = addToCompare(product);
    if (added) {
      toast.success("Added to compare");
    } else {
      toast.warning("Compare list is full (max 4)");
    }
  };

  const formatPrice = (price) => {
    if (!price) return null;
    const symbol = price.currency === "INR" ? "₹" : "$";
    return `${symbol}${price.amount?.toLocaleString()}`;
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="card-hover block group relative overflow-hidden"
    >
      {/* Platform badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`badge border ${getPlatformVariant(platform)} text-xs`}>
          {platformLabels[platform] || "Global"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleSave}
          title="Save product"
          className="w-7 h-7 rounded-lg bg-slate-800/90 backdrop-blur-sm border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors"
        >
          {saved ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-primary-400" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
        <button
          onClick={handleCompare}
          title="Add to compare"
          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
            inCompare
              ? "bg-primary-500/20 border-primary-500/40 text-primary-400"
              : "bg-slate-800/90 backdrop-blur-sm border-slate-700 text-slate-400 hover:bg-slate-700"
          }`}
        >
          <GitCompareArrows className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Image area */}
      <div className="h-40 bg-slate-800/50 flex items-center justify-center rounded-t-2xl overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={`w-full h-full flex items-center justify-center ${
            product.images?.[0] ? "hidden" : "flex"
          }`}
        >
          <Package className="w-12 h-12 text-slate-700" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {product.brand && (
          <p className="text-xs font-medium text-primary-400 uppercase tracking-wide">
            {product.brand}
          </p>
        )}

        <h3 className="text-sm font-semibold text-slate-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">
          {product.name}
        </h3>

        {product.rating?.average > 0 && (
          <StarRating rating={product.rating.average} count={product.rating.count} />
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-lg font-bold text-white">
            {formatPrice(product.price) || "Price unavailable"}
          </span>
          {product.price?.originalAmount && product.price.originalAmount > product.price.amount && (
            <>
              <span className="text-xs text-slate-500 line-through">
                {formatPrice({ ...product.price, amount: product.price.originalAmount })}
              </span>
              <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                -{product.price.discountPercent}%
              </span>
            </>
          )}
        </div>

        {/* Delivery */}
        {product.availability?.deliveryEstimate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Truck className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="line-clamp-1">{product.availability.deliveryEstimate}</span>
          </div>
        )}

        {/* Stock */}
        <div className="flex items-center justify-between pt-1">
          <span
            className={`text-xs font-medium ${
              product.availability?.inStock ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {product.availability?.inStock ? "● In Stock" : "○ Out of Stock"}
          </span>
          {product.source?.url && (
            <ExternalLink className="w-3 h-3 text-slate-600" />
          )}
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = "ProductCard";
export default ProductCard;
