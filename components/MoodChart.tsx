
import React, { useMemo, useRef, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import { MoodEntry, MOOD_CONFIGS } from '../types';

interface MoodChartProps {
  entries: MoodEntry[];
}

const MoodChart: React.FC<MoodChartProps> = ({ entries }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 모든 기록을 가져와서 시간순(과거 -> 현재)으로 정렬
  const data = useMemo(() => {
    return [...entries]
      .reverse()
      .map(e => ({
        time: new Date(e.timestamp).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        fullDate: new Date(e.timestamp).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric'
        }),
        score: MOOD_CONFIGS[e.mood].score,
        mood: MOOD_CONFIGS[e.mood].label,
        emoji: MOOD_CONFIGS[e.mood].emoji
      }));
  }, [entries]);

  const avgScore = useMemo(() => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, curr) => acc + MOOD_CONFIGS[curr.mood].score, 0);
    return sum / entries.length;
  }, [entries]);

  // 데이터 개수에 따른 차트의 실제 너비 계산
  // 사용자 요청에 따라 눈금 간격을 절반(70px -> 35px)으로 줄임
  const chartWidth = useMemo(() => {
    const minPointWidth = 35; 
    const calculatedWidth = data.length * minPointWidth;
    // 최소 너비를 유지하면서 데이터가 많아지면 확장
    return calculatedWidth > 500 ? calculatedWidth : '100%';
  }, [data.length]);

  // 새로운 데이터가 추가되거나 차트가 열릴 때 가장 최신(오른쪽)으로 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-400 text-sm">감정 흐름을 보려면 기록이 더 필요해요 (최소 2개)</p>
      </div>
    );
  }

  return (
    <div className="w-full relative group">
      {/* 가로 스크롤 컨테이너 */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ width: chartWidth, minWidth: '100%', height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}}
                interval={data.length > 15 ? "preserveStartEnd" : 0} // 간격이 좁아졌으므로 데이터가 아주 많을 때만 자동 조절
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                hide={true}
                domain={[0, 6]} 
              />
              <Tooltip 
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '12px'
                }}
                formatter={(value: number, name: string, props: any) => {
                  const { emoji, fullDate } = props.payload;
                  return [
                    <div key="tip" className="flex flex-col">
                      <span className="text-gray-400 text-[10px] mb-1">{fullDate}</span>
                      <span className="text-indigo-600 font-bold text-lg">{emoji}</span>
                    </div>,
                    null
                  ];
                }}
              />
              <ReferenceLine 
                y={avgScore} 
                stroke="#6366f1" 
                strokeDasharray="4 4" 
                label={{ 
                  value: `평균 ${avgScore.toFixed(2)}`, 
                  position: 'right', 
                  fill: '#6366f1', 
                  fontSize: 10, 
                  fontWeight: 'bold',
                  offset: 10
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={1000}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 데이터가 많을 때만 보여주는 스크롤 안내 인디케이터 */}
      {typeof chartWidth === 'number' && chartWidth > 500 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white/80 to-transparent w-12 h-full flex items-center justify-end pr-2">
          <i className="fas fa-chevron-right text-gray-300 animate-pulse"></i>
        </div>
      )}
    </div>
  );
};

export default MoodChart;
