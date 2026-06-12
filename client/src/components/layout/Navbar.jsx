import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Sparkles, Menu, X, User, Bookmark, LogOut,
  BarChart3, ChevronDown, Zap
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSearchStore } from "../../store/searchStore";
import { useDebounce } from "../../hooks/useDebounce";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { query, setQuery } = useSearchStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");

  const isHome = location.pathname === "/";

  const handleSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setQuery(localQuery.trim());
      navigate(`/search?q=${encodeURIComponent(localQuery.trim())}`);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-white hidden sm:block">
              AI<span className="gradient-text">Search</span>
            </span>
          </Link>

          {/* Search bar (hidden on home page) */}
          {!isHome && (
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl mx-6"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search any product..."
                  className="input-base w-full pl-10 pr-4 py-2 text-sm"
                />
              </div>
            </form>
          )}

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" label="Home" current={location.pathname === "/"} />
            {isAuthenticated && (
              <>
                <NavLink to="/saved" label="Saved" current={location.pathname === "/saved"} />
                {user?.role === "admin" && (
                  <NavLink to="/analytics" label="Analytics" current={location.pathname === "/analytics"} />
                )}
              </>
            )}

            {isAuthenticated ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-slate-300 font-medium">{user?.name?.split(" ")[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 card border border-slate-700 shadow-xl py-1 animate-fade-in">
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link to="/saved" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                      <Bookmark className="w-4 h-4" /> Saved
                    </Link>
                    {user?.role === "admin" && (
                      <Link to="/analytics" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <BarChart3 className="w-4 h-4" /> Analytics
                      </Link>
                    )}
                    <div className="border-t border-slate-700 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">Sign in</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-4">Get started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search products..."
                  className="input-base w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              <MobileNavLink to="/" label="Home" onClick={() => setMobileOpen(false)} />
              {isAuthenticated && (
                <>
                  <MobileNavLink to="/saved" label="Saved Products" onClick={() => setMobileOpen(false)} />
                  <MobileNavLink to="/profile" label="Profile" onClick={() => setMobileOpen(false)} />
                </>
              )}
              {!isAuthenticated && (
                <>
                  <MobileNavLink to="/login" label="Sign In" onClick={() => setMobileOpen(false)} />
                  <MobileNavLink to="/register" label="Get Started" onClick={() => setMobileOpen(false)} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

const NavLink = ({ to, label, current }) => (
  <Link
    to={to}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      current
        ? "bg-slate-800 text-white"
        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
    }`}
  >
    {label}
  </Link>
);

const MobileNavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
  >
    {label}
  </Link>
);
