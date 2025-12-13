'use client';

import { useEffect, useState } from 'react';
import { getStreakCalendarAction } from '@/app/streaks/actions';

interface CalendarDay {
  date: string;
  active: boolean;
}

export function StreakCalendar() {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalendar() {
      const data = await getStreakCalendarAction();
      setCalendarData(data);
      setLoading(false);
    }

    fetchCalendar();
  }, []);

  if (loading) {
    return (
      <div className="w-full">
        <div className="space-y-3">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4 animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:1000px_100%]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Calendar (Last 30 Days)</h3>
      
      {/* Week day labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarData.map((day) => {
          const isToday = day.date === today;
          const date = new Date(day.date);
          const dayOfMonth = date.getDate();

          return (
            <div
              key={day.date}
              className={`
                aspect-square rounded-md flex items-center justify-center text-xs font-medium
                transition-all duration-200 hover:scale-110 cursor-default
                touch-manipulation min-h-[44px] sm:min-h-0
                ${day.active 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-400'
                }
                ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg shadow-blue-500/50 animate-glow-pulse' : ''}
              `}
              title={`${day.date}${day.active ? ' - Active' : ' - No activity'}${isToday ? ' (Today)' : ''}`}
            >
              {dayOfMonth}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded"></div>
          <span>Inactive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 rounded ring-2 ring-blue-500"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
