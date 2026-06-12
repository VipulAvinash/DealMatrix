import { useAuthStore } from "../store/authStore";
import { useSearchHistory } from "../hooks/useProducts";
import { User, Clock, Search, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "../components/ui/Skeleton";

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { data: historyData, isLoading } = useSearchHistory({ page: 1, limit: 10 });
  const history = historyData?.data || [];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="card p-6 mb-6 flex items-start gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-white">{user?.name}</h1>
          <p className="text-slate-400 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 capitalize">
              {user?.role}
            </span>
            {user?.lastLogin && (
              <span className="text-xs text-slate-600">
                Last login: {new Date(user.lastLogin).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary text-sm flex items-center gap-2 text-red-400 hover:text-red-300 border-red-500/20">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { to: "/saved", label: "Saved Products", icon: "🔖" },
          { to: "/compare", label: "Compare Products", icon: "⚖️" },
          { to: "/search", label: "New Search", icon: "🔍" },
        ].map(({ to, label, icon }) => (
          <Link key={to} to={to} className="card-hover p-4 flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <span className="text-sm font-medium text-slate-300">{label}</span>
          </Link>
        ))}
      </div>

      {/* Search history */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" /> Recent Searches
          </h2>
          <span className="text-xs text-slate-600">{history.length} items</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="p-10 text-center">
            <Search className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">No search history yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {history.map((item) => (
              <Link
                key={item._id}
                to={`/search?q=${encodeURIComponent(item.query)}`}
                className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                      {item.query}
                    </p>
                    <p className="text-xs text-slate-600">
                      {item.resultsCount} results ·{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {item.cacheHit && (
                  <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                    Cached
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
