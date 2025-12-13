'use client';

import { useEffect, useState } from 'react';
import { getRankHistory, RankHistoryEntry } from '@/app/leaderboard/actions';

interface RankHistoryChartProps {
  courseId?: string;
}

export default function RankHistoryChart({ courseId }: RankHistoryChartProps) {
  const [history, setHistory] = useState<RankHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setIsLoading(true);
      const data = await getRankHistory(courseId);
      setHistory(data);
      setIsLoading(false);
    }
    loadHistory();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">📈 Rank History</h3>
        <p className="text-muted-foreground text-sm">
          No rank history available yet. Keep practicing to see your progress! 🚀
        </p>
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const maxRank = Math.max(...history.map((h) => h.rank));
  const minRank = Math.min(...history.map((h) => h.rank));
  const rankRange = maxRank - minRank || 1;

  const chartHeight = 200;
  const chartWidth = 100;
  const padding = 20;

  // Generate SVG path
  const points = history.map((entry, index) => {
    const x = (index / (history.length - 1 || 1)) * chartWidth;
    // Invert Y because lower rank is better
    const y = ((maxRank - entry.rank) / rankRange) * (chartHeight - 2 * padding) + padding;
    return { x, y, ...entry };
  });

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">📈 Rank History (Last 30 Days)</h3>

      <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <defs>
            <linearGradient id="rankGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path
            d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#rankGradient)"
            className="transition-all duration-300"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="rgb(59, 130, 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
            }}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="3"
                fill="rgb(59, 130, 246)"
                className="transition-all duration-300 hover:r-5"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))',
                }}
              />
              <title>
                {new Date(point.snapshot_date).toLocaleDateString()}: Rank #{point.rank} ({point.total_points} pts)
              </title>
            </g>
          ))}
        </svg>

        {/* Y-axis labels (Rank) */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground -ml-12">
          <span>#{minRank}</span>
          <span>#{Math.round((minRank + maxRank) / 2)}</span>
          <span>#{maxRank}</span>
        </div>

        {/* X-axis labels (Dates) */}
        <div className="absolute left-0 right-0 -bottom-6 flex justify-between text-xs text-muted-foreground">
          <span>{new Date(history[0].snapshot_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
          {history.length > 2 && (
            <span>
              {new Date(history[Math.floor(history.length / 2)].snapshot_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          )}
          <span>
            {new Date(history[history.length - 1].snapshot_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {maxRank - minRank > 0 ? '↑' : '−'} {Math.abs(maxRank - minRank)}
          </div>
          <div className="text-xs text-muted-foreground">Rank Improvement</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">#{history[history.length - 1]?.rank}</div>
          <div className="text-xs text-muted-foreground">Current Rank</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">#{minRank}</div>
          <div className="text-xs text-muted-foreground">Best Rank</div>
        </div>
      </div>
    </div>
  );
}
