interface RankCardProps {
  rank: number;
  className?: string;
}

export default function RankCard({ rank, className }: RankCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 border border-gray-100 ${className || ''}`}>
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Your Rank</h3>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold text-blue-600 mb-2">#{rank}</div>
        <div className="text-sm text-gray-500">in your class</div>
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Leaderboard
        </button>
      </div>
    </div>
  );
}
