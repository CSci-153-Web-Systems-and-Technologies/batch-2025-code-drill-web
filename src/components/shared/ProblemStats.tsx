interface ProblemStatsProps {
  available: number;
  completed: number;
  totalPoints: number;
  avgAccuracy: number;
}

export default function ProblemStats({
  available,
  completed,
  totalPoints,
  avgAccuracy,
}: ProblemStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-1">{available}</div>
        <div className="text-sm text-gray-500">Available Problems</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 mb-1">{completed}</div>
        <div className="text-sm text-gray-500">Completed</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-orange-500 mb-1">{totalPoints}</div>
        <div className="text-sm text-gray-500">Total Points</div>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-1">{avgAccuracy}%</div>
        <div className="text-sm text-gray-500">Avg Accuracy</div>
      </div>
    </div>
  );
}
