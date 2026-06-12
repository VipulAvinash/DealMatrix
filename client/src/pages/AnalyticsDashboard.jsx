import { useState } from "react";
import {
  BarChart3, Search, Zap, Database, TrendingUp, Clock,
  AlertCircle, RefreshCw,
} from "lucide-react";
import { useAnalyticsDashboard, useSearchTrends } from "../hooks/useProducts";
import { Skeleton } from "../components/ui/Skeleton";

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold font-display text-white">{value}</p>
    <p className="text-sm text-slate-400 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

export default function AnalyticsDashboard() {
  const [trendDays, setTrendDays] = useState(7);
  const { data: dashData, isLoading, isError, refetch } = useAnalyticsDashboard();
  const { data: trendData, isLoading: trendLoading } = useSearchTrends(trendDays);

  const dash = dashData?.data;
  const trends = trendData?.data || [];

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h2 className="font-display text-xl font-bold text-slate-300 mb-2">Access denied</h2>
        <p className="text-slate-500 text-sm mb-4">Admin privileges required.</p>
        <button onClick={refetch} className="btn-secondary flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const maxSearches = Math.max(...trends.map((t) => t.searches), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary-400" />
          <h1 className="font-display text-2xl font-bold text-white">Analytics Dashboard</h1>
        </div>
        <button onClick={refetch} className="btn-secondary text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Total Searches"
              value={dash?.overview?.totalSearches?.toLocaleString() || "—"}
              icon={Search}
              color="from-primary-500 to-primary-600"
            />
            <StatCard
              label="Cache Hit Rate"
              value={`${dash?.overview?.cacheHitRate || 0}%`}
              sub="Memory + Redis"
              icon={Database}
              color="from-emerald-500 to-green-600"
            />
            <StatCard
              label="Avg Response Time"
              value={`${((dash?.overview?.avgResponseTimeMs || 0) / 1000).toFixed(1)}s`}
              icon={Zap}
              color="from-amber-500 to-orange-500"
            />
            <StatCard
              label="Platform Sources"
              value={
                Object.values(dash?.platformStats || {}).reduce((a, b) => a + b, 0).toLocaleString()
              }
              sub="Across all AI searches"
              icon={TrendingUp}
              color="from-purple-500 to-violet-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top queries */}
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-2 p-5 border-b border-slate-800">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-200 text-sm">Top Search Queries</h2>
          </div>
          <div className="p-4 space-y-2">
            {isLoading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)
              : (dash?.topQueries || []).map(({ query, count }, i) => (
                  <div key={query} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600 w-5 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-300 truncate">{query}</span>
                        <span className="text-xs text-slate-500 shrink-0 ml-2">{count}</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{
                            width: `${(count / (dash?.topQueries?.[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Trend chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-slate-200 text-sm">Search Volume Trend</h2>
            </div>
            <div className="flex rounded-lg border border-slate-700 overflow-hidden">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-3 py-1 text-xs transition-colors ${
                    trendDays === d
                      ? "bg-primary-600 text-white"
                      : "bg-slate-800 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div className="p-5">
            {trendLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : trends.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No trend data available</p>
              </div>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {trends.map((t) => (
                  <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-primary-500/20 hover:bg-primary-500/40 rounded-t transition-colors relative"
                      style={{ height: `${(t.searches / maxSearches) * 100}%`, minHeight: "4px" }}
                      title={`${t.date}: ${t.searches} searches`}
                    />
                    <span className="text-xs text-slate-700 hidden sm:block">
                      {new Date(t.date).getDate()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center gap-2 p-5 border-b border-slate-800">
          <Clock className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-200 text-sm">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                {["Query", "Results", "Cache", "Time (ms)", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading
                ? [0, 1, 2].map((i) => (
                    <tr key={i}>
                      {[0, 1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-3 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (dash?.recentActivity || []).map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300 max-w-[150px] truncate">{item.query}</td>
                      <td className="px-4 py-3 text-slate-400">{item.resultsCount}</td>
                      <td className="px-4 py-3">
                        {item.cacheHit ? (
                          <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Hit</span>
                        ) : (
                          <span className="badge bg-slate-800 text-slate-500 border border-slate-700">Miss</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{item.responseTimeMs || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${item.status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"} border`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
