import { Bookmark } from "lucide-react";
import { Link } from "react-router-dom";
import { useSavedProducts } from "../hooks/useProducts";
import ProductGrid from "../components/product/ProductGrid";

export default function SavedProductsPage() {
  const { data, isLoading } = useSavedProducts();
  const products = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-6 h-6 text-primary-400" />
        <h1 className="font-display text-2xl font-bold text-white">Saved Products</h1>
        {products.length > 0 && (
          <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20">
            {products.length}
          </span>
        )}
      </div>

      {!isLoading && products.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-slate-400 mb-2">No saved products</h2>
          <p className="text-slate-600 text-sm mb-6">
            Bookmark products during search to find them here.
          </p>
          <Link to="/" className="btn-primary inline-flex">Start Searching</Link>
        </div>
      ) : (
        <ProductGrid
          products={products}
          isLoading={isLoading}
          savedProductIds={products.map((p) => p._id?.toString())}
        />
      )}
    </div>
  );
}
