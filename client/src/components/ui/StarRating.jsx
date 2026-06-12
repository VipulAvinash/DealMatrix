import { Star } from "lucide-react";

export default function StarRating({ rating = 0, count = null, size = "sm" }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const partial = !filled && i < rating;
    return { filled, partial };
  });

  const iconSize = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {stars.map(({ filled, partial }, i) => (
          <Star
            key={i}
            className={`${iconSize} ${
              filled
                ? "fill-amber-400 text-amber-400"
                : partial
                ? "fill-amber-400/50 text-amber-400/50"
                : "fill-slate-700 text-slate-700"
            }`}
          />
        ))}
      </div>
      {rating > 0 && (
        <span className={`font-semibold text-slate-300 ${size === "lg" ? "text-base" : "text-xs"}`}>
          {rating.toFixed(1)}
        </span>
      )}
      {count !== null && (
        <span className={`text-slate-500 ${size === "lg" ? "text-sm" : "text-xs"}`}>
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})
        </span>
      )}
    </div>
  );
}
