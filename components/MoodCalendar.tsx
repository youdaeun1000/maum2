
import React, { useState, useMemo } from 'react';
import { MoodEntry, MOOD_CONFIGS, MoodConfig } from '../types';

interface MoodCalendarProps {
  entries: MoodEntry[];
}

const MoodCalendar: React.FC<MoodCalendarProps> = ({ entries }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 현재 달의 일수와 시작 요일 계산
  const { days, month, year, firstDayOfMonth } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const d = new Date(y, m + 1, 0).getDate();
    const f = new Date(y, m, 1).getDay();
    return { days: d, month: m, year: y, firstDayOfMonth: f };
  }, [currentDate]);

  // 날짜별 평균 감정 데이터 맵핑
  const dailyMoodMap = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const score = MOOD_CONFIGS[entry.mood].score;
      
      if (!map[dateKey]) {
        map[dateKey] = { sum: 0, count: 0 };
      }
      map[dateKey].sum += score;
      map[dateKey].count += 1;
    });

    const finalMap: Record<string, string> = {};
    const configs = Object.values(MOOD_CONFIGS) as MoodConfig[];

    Object.keys(map).forEach(key => {
      const avg = map[key].sum / map[key].count;
      // 평균 점수와 가장 가까운 설정 찾기
      const closest = configs.reduce((prev, curr) => 
        Math.abs(curr.score - avg) < Math.abs(prev.score - avg) ? curr : prev
      );
      finalMap[key] = closest.emoji;
    });

    return finalMap;
  }, [entries]);

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-800 text-lg">
          {year}년 {month + 1}월
        </h3>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* 시작 요일 맞추기 위한 빈 칸 */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {/* 날짜 칸들 */}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${month}-${day}`;
          const moodEmoji = dailyMoodMap[dateKey];
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

          return (
            <div 
              key={day} 
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border ${
                moodEmoji 
                  ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' 
                  : 'bg-gray-50/30 border-transparent'
              } ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
            >
              <span className={`text-[10px] font-medium absolute top-1 left-1.5 ${isToday ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                {day}
              </span>
              {moodEmoji && (
                <span className="text-xl sm:text-2xl mt-1 animate-in zoom-in duration-300">
                  {moodEmoji}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MoodCalendar;
