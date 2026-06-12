const variants = {
  default: "bg-slate-800 text-slate-300 border-slate-700",
  primary: "bg-primary-500/10 text-primary-400 border-primary-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border-red-500/20",
  amazon: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  flipkart: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  reliance: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  croma: "bg-green-500/10 text-green-400 border-green-500/20",
  other: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export const getPlatformVariant = (platform = "other") => {
  return variants[platform?.toLowerCase()] || variants.other;
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span className={`badge border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
