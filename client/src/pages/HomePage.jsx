import { Link } from "react-router-dom";
import { Sparkles, Zap, Shield, BarChart3, ArrowRight, Package } from "lucide-react";
import SearchBox from "../components/search/SearchBox";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Multi-LLM AI Search",
    desc: "Grok, Gemini & OpenRouter work in parallel to find the best products across every major platform.",
    gradient: "from-purple-500 to-primary-500",
  },
  {
    icon: Zap,
    title: "RAG Architecture",
    desc: "Retrieval-Augmented Generation caches product knowledge for instant, accurate results.",
    gradient: "from-primary-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "Smart Deduplication",
    desc: "AI merges, de-duplicates, and ranks results from Amazon, Flipkart, Reliance, and Croma.",
    gradient: "from-emerald-500 to-accent-500",
  },
  {
    icon: BarChart3,
    title: "AI Recommendations",
    desc: "Get Best Overall, Best Value, Best Budget, and Best Premium picks with AI reasoning.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const PLATFORMS = [
  { name: "Amazon", color: "text-orange-400", emoji: "🛒" },
  { name: "Flipkart", color: "text-blue-400", emoji: "📦" },
  { name: "Reliance", color: "text-purple-400", emoji: "📱" },
  { name: "Croma", color: "text-green-400", emoji: "💻" },
];

const POPULAR_SEARCHES = [
  "iPhone 16 Pro", "Samsung Galaxy S25", "MacBook Pro M4",
  "Sony WH-1000XM6", "iPad Pro", "PS5", "Nintendo Switch 2",
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 bg-grid-pattern"
        style={{ backgroundSize: "50px 50px" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950" />

      {/* Glow orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-accent-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 badge border border-primary-500/30 bg-primary-500/10 text-primary-400 mb-6 py-1.5 px-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-sm font-medium">Powered by Grok · Gemini · OpenRouter</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Search products with{" "}
            <span className="gradient-text">AI intelligence</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            One search. Every major platform. AI aggregates, ranks and recommends
            the best products from Amazon, Flipkart, Reliance, Croma and more.
          </p>

          {/* Search box */}
          <div className="mb-8">
            <SearchBox autoFocus />
          </div>

          {/* Popular searches */}
          <div className="flex items-center justify-center flex-wrap gap-2">
            <span className="text-xs text-slate-600 mr-1">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                to={`/search?q=${encodeURIComponent(term)}`}
                className="text-xs text-slate-500 hover:text-primary-400 hover:bg-primary-500/5 border border-slate-800 hover:border-primary-500/30 px-3 py-1 rounded-full transition-all"
              >
                {term}
              </Link>
            ))}
          </div>
        </section>

        {/* ── Platform logos ──────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <p className="text-center text-xs text-slate-600 uppercase tracking-widest mb-6">
            Searches across
          </p>
          <div className="flex items-center justify-center flex-wrap gap-3">
            {PLATFORMS.map(({ name, color, emoji }) => (
              <div
                key={name}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <span>{emoji}</span>
                <span className={`text-sm font-semibold ${color}`}>{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="font-display text-3xl font-bold text-center text-white mb-3">
            Why AI Product Search?
          </h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">
            Stop visiting multiple sites. Let AI do the heavy lifting.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
              <div
                key={title}
                className="card-hover p-5 group cursor-default"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
          <div className="card border-primary-500/20 bg-gradient-to-br from-primary-500/5 to-accent-500/5 p-10">
            <Package className="w-10 h-10 text-primary-400 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-white mb-3">
              Ready to find the best deal?
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Start a free search — no account needed.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/search?q=iPhone 16 Pro" className="btn-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Try AI Search
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="btn-secondary flex items-center gap-2">
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
