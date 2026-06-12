import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-display font-black gradient-text mb-4">404</p>
        <h1 className="text-2xl font-bold text-slate-300 mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/search" className="btn-secondary flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </Link>
        </div>
      </div>
    </div>
  );
}
