import { Link } from "react-router-dom";
import { Zap, Github, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                AI<span className="gradient-text">Search</span> Hub
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              AI-powered product search across Amazon, Flipkart, Reliance, Croma and more — with intelligent recommendations.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Platform</h3>
            <ul className="space-y-2">
              {["Home", "Search", "Compare", "Saved"].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Powered by</h3>
            <ul className="space-y-2">
              {["Grok AI", "Gemini AI", "OpenRouter", "MongoDB"].map((item) => (
                <li key={item}>
                  <span className="text-sm text-slate-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} AI Product Search Hub. Built with MERN + Multi-LLM.
          </p>
          <div className="flex items-center gap-1">
            {[
              { label: "Amazon", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
              { label: "Flipkart", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { label: "Reliance", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              { label: "Croma", color: "bg-green-500/10 text-green-400 border-green-500/20" },
            ].map(({ label, color }) => (
              <span key={label} className={`badge border ${color} text-xs`}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
