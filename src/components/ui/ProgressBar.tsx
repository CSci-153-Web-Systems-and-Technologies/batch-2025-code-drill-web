'use client';

import { useState, useEffect } from 'react';

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
  const [isAnimating, setIsAnimating] = useState(false);
  const isCelebrating = percentage >= 90;

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">{current} of {total} problems</span>
        {showPercentage && <span className="text-sm font-semibold text-gray-700">{percentage}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden relative">
        <div 
          className={`
            h-2.5 rounded-full transition-transform duration-500 ease-out origin-left
            ${color.includes('gradient') ? color : `bg-gradient-to-r ${color} to-${color.replace('bg-', '')}/80`}
            ${isCelebrating ? 'animate-glow-pulse' : ''}
            contain-layout
          `}
          style={{ 
            transform: `scaleX(${percentage / 100})`,
            willChange: isAnimating ? 'transform' : 'auto',
          }}
        />
      </div>
    </div>
  );
}
