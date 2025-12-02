interface ProgressBarProps {
  current: number;
  total: number;
  showPercentage?: boolean;
  color?: string;
}

export default function ProgressBar({ 
  current, 
  total, 
  showPercentage = true,
  color = 'bg-blue-600'
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">{current} of {total} problems</span>
        {showPercentage && <span className="text-sm font-semibold text-gray-700">{percentage}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
