interface SkillProgressBarProps {
  skill: string;
  current: number;
  total: number;
}

export default function SkillProgressBar({ skill, current, total }: SkillProgressBarProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{skill}</span>
        <span className="text-sm text-gray-500">{current}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-gray-900 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
