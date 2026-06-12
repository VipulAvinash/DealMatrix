import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Package, Truck, ExternalLink, Bookmark,
  BookmarkCheck, GitCompareArrows, Star, ShieldCheck
} from "lucide-react";
import { useProduct, useSaveProduct } from "../hooks/useProducts";
import { useSearchStore } from "../store/searchStore";
import { useAuthStore } from "../store/authStore";
import { toast } from "../components/ui/Toast";
import StarRating from "../components/ui/StarRating";
import Badge, { getPlatformVariant } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { useState } from "react";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useProduct(id);
  const { mutate: saveProduct } = useSaveProduct();
  const { addToCompare } = useSearchStore();
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const product = data?.data;

  const handleSave = () => {
    if (!isAuthenticated) return toast.warning("Sign in to save products");
    saveProduct(id, {
      onSuccess: (res) => {
        setSaved(res.data.saved);
        toast.success(res.data.saved ? "Saved!" : "Removed from saved");
      },
    });
  };

  const handleCompare = () => {
    if (!product) return;
    const added = addToCompare(product);
    if (added) toast.success("Added to compare");
    else toast.warning("Compare list is full (max 4)");
  };

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Product not found.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Go Home</Link>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (!price) return "N/A";
    const sym = price.currency === "INR" ? "₹" : "$";
    return `${sym}${price.amount?.toLocaleString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        to="/search"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      {isLoading ? (
        <ProductDetailSkeleton />
      ) : product ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <div className="card overflow-hidden">
            <div className="h-80 bg-slate-800 flex items-center justify-center">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-20 h-20 text-slate-700" />
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-5">
            {/* Platform + brand */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge border ${getPlatformVariant(product.source?.platform)}`}>
                {product.source?.platform || "Global"}
              </span>
              {product.brand && (
                <span className="text-xs text-primary-400 font-semibold uppercase tracking-wide">
                  {product.brand}
                </span>
              )}
              {product.category && (
                <span className="badge bg-slate-800 text-slate-400 border border-slate-700">
                  {product.category}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl font-bold text-white leading-snug">
              {product.name}
            </h1>

            {product.rating?.average > 0 && (
              <StarRating rating={product.rating.average} count={product.rating.count} size="lg" />
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">
                {formatPrice(product.price)}
              </span>
              {product.price?.originalAmount > product.price?.amount && (
                <>
                  <span className="text-lg text-slate-500 line-through">
                    {formatPrice({ ...product.price, amount: product.price.originalAmount })}
                  </span>
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm">
                    {product.price.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock & Delivery */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`flex items-center gap-1.5 text-sm font-medium ${product.availability?.inStock ? "text-emerald-400" : "text-red-400"}`}>
                <ShieldCheck className="w-4 h-4" />
                {product.availability?.inStock ? "In Stock" : "Out of Stock"}
              </div>
              {product.availability?.deliveryEstimate && (
                <div className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Truck className="w-4 h-4 text-slate-500" />
                  {product.availability.deliveryEstimate}
                </div>
              )}
            </div>

            {/* Seller */}
            {product.seller?.name && (
              <div className="text-sm text-slate-400">
                Sold by{" "}
                <span className="text-slate-200 font-medium">{product.seller.name}</span>
                {product.seller.rating && (
                  <span className="text-amber-400 ml-2">★ {product.seller.rating}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} className="btn-secondary flex items-center gap-2">
                {saved ? <BookmarkCheck className="w-4 h-4 text-primary-400" /> : <Bookmark className="w-4 h-4" />}
                {saved ? "Saved" : "Save"}
              </button>
              <button onClick={handleCompare} className="btn-secondary flex items-center gap-2">
                <GitCompareArrows className="w-4 h-4" />
                Compare
              </button>
              {product.source?.url && (
                <a
                  href={product.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  View on Store
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Description</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Features */}
            {product.features?.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Key Features</h3>
                <ul className="space-y-1.5">
                  {product.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-primary-400 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Summary */}
            {product.aiSummary && (
              <div className="card border-primary-500/20 bg-primary-500/5 p-4">
                <h3 className="text-sm font-semibold text-primary-400 mb-2 flex items-center gap-1.5">
                  ✨ AI Summary
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{product.aiSummary}</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const ProductDetailSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <Skeleton className="h-80 rounded-2xl" />
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-36" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);
