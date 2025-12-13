'use client';

import { Badge } from '@/app/leaderboard/actions';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function BadgeDisplay({
  badge,
  size = 'md',
  showName = false,
}: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div
      className="inline-flex items-center gap-2 group relative"
      title={`${badge.name}: ${badge.description}`}
    >
      <span className={`${sizeClasses[size]} transition-transform group-hover:scale-110`}>
        {badge.emoji}
      </span>
      {showName && (
        <span className="text-sm font-medium">{badge.name}</span>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        <div className="font-semibold text-sm">{badge.name}</div>
        <div className="text-xs text-muted-foreground">
          {badge.description}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Earned {new Date(badge.earned_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
