'use client';

import { ReactNode } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color: string;
  animated?: boolean;
  pulse?: boolean;
}

export default function StatCard({ icon, value, label, color, animated = true, pulse = false }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const isNumber = typeof value === 'number' || !isNaN(parseInt(value as string));
  
  const animatedValue = useCountUp({ 
    end: numericValue, 
    duration: 1000,
    enabled: animated && isNumber 
  });

  const displayValue = animated && isNumber ? animatedValue : value;

  return (
    <div 
      className="bg-gradient-to-br from-white to-gray-50/50 rounded-lg shadow-sm p-6 border border-gray-100 
                 transition-all duration-300 ease-out
                 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200
                 will-change-transform transform-gpu
                 contain-layout contain-paint
                 animate-fade-in"
      style={{ willChange: 'auto' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`${color} p-2 rounded-lg ${pulse ? 'animate-bounce-subtle' : ''}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">{displayValue}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

