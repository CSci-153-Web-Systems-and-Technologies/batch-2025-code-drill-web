import ProgressBar from '../ui/ProgressBar';

interface WeeklyGoalProps {
  current: number;
  goal: number;
}

export default function WeeklyGoal({ current, goal }: WeeklyGoalProps) {
  const remaining = goal - current;
  const percentage = Math.round((current / goal) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center mb-4">
        <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900">Weekly Goal</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">Solve {goal} problems this week</p>
      <ProgressBar current={current} total={goal} color="bg-gray-900" />
      <p className="text-sm text-gray-500 mt-3">
        {remaining > 0 ? `${remaining} more problems to reach your goal!` : 'Goal achieved! 🎉'}
      </p>
    </div>
  );
}
