'use client';

import { useEffect, useState } from 'react';
import { getStreakCalendarAction } from '@/app/streaks/actions';

interface CalendarDay {
  date: string;
  count: number;
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
      <div className="w-full overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-48 mb-3 animate-shimmer bg-[length:1000px_100%]"></div>
          <div className="flex gap-1">
            {Array.from({ length: 53 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="w-3 h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-sm animate-shimmer bg-[length:1000px_100%]"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get color based on contribution count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900';
    if (count <= 5) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count <= 10) return 'bg-emerald-600 dark:bg-emerald-500';
    return 'bg-emerald-700 dark:bg-emerald-400';
  };

  // Group days by week
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];
  
  // Add padding days to start on Sunday
  const firstDate = new Date(calendarData[0]?.date || new Date());
  const dayOfWeek = firstDate.getDay();
  for (let i = 0; i < dayOfWeek; i++) {
    currentWeek.push({ date: '', count: -1 });
  }

  calendarData.forEach((day, index) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  // Add remaining days to last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: -1 });
    }
    weeks.push(currentWeek);
  }

  // Get month labels
  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';
    
    weeks.forEach((week, weekIndex) => {
      const firstDayWithDate = week.find(d => d.date);
      if (firstDayWithDate) {
        const date = new Date(firstDayWithDate.date);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (month !== lastMonth) {
          labels.push({ month, weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  };

  const monthLabels = getMonthLabels();
  const totalContributions = calendarData.reduce((sum, day) => sum + day.count, 0);

  return (
    <div className="w-full">
      <div className="mb-3">
        <span className="text-sm font-medium text-gray-700">
          {totalContributions} practice questions solved in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, index) => (
              <div
                key={index}
                style={{ 
                  marginLeft: index === 0 ? 0 : `${(label.weekIndex - (monthLabels[index - 1]?.weekIndex || 0)) * 14}px` 
                }}
                className="text-xs text-gray-600"
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2 text-xs text-gray-600">
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Mon</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Wed</div>
              <div className="h-3"></div>
              <div className="h-3 flex items-center">Fri</div>
              <div className="h-3"></div>
            </div>

            {/* Calendar grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => {
                    if (day.count === -1) {
                      return <div key={dayIndex} className="w-3 h-3"></div>;
                    }

                    const date = new Date(day.date);
                    const dateStr = date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          w-3 h-3 rounded-sm transition-all duration-200
                          ${getColor(day.count)}
                          ${day.count > 0 ? 'hover:ring-2 hover:ring-gray-400' : ''}
                        `}
                        title={`${dateStr}: ${day.count} question${day.count !== 1 ? 's' : ''}`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-200 dark:bg-emerald-900 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-400 dark:bg-emerald-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-600 dark:bg-emerald-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-emerald-700 dark:bg-emerald-400 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
