
import React, { useMemo, useRef, useEffect } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  ReferenceLine,
  Legend
} from 'recharts';
import { MoodEntry, MOOD_CONFIGS, NUANCE_PAIRS, NuanceKey } from '../types';

interface MoodChartProps {
  entries: MoodEntry[];
}

const MoodChart: React.FC<MoodChartProps> = ({ entries }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 데이터 가공 로직
  const data = useMemo(() => {
    return [...entries]
      .reverse()
      .map(e => {
        const dateObj = new Date(e.timestamp);
        const nuanceData: Record<string, number> = {};
        
        // 5가지 뉘앙스를 수치화 (-1, 0, 1)
        (Object.keys(NUANCE_PAIRS) as NuanceKey[]).forEach(key => {
          const pair = NUANCE_PAIRS[key];
          if (e.nuances?.[key] === pair[0]) {
            nuanceData[key] = -1; // 왼쪽 (무섭다, 불안하다 등)
          } else if (e.nuances?.[key] === pair[1]) {
            nuanceData[key] = 1;  // 오른쪽 (안전하다, 안정적이다 등)
          } else {
            nuanceData[key] = 0;  // 미선택
          }
        });

        return {
          time: dateObj.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          fullDate: dateObj.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
          }),
          score: MOOD_CONFIGS[e.mood].score,
          emoji: MOOD_CONFIGS[e.mood].emoji,
          ...nuanceData
        };
      });
  }, [entries]);

  const avgScore = useMemo(() => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, curr) => acc + MOOD_CONFIGS[curr.mood].score, 0);
    return sum / entries.length;
  }, [entries]);

  const chartWidth = useMemo(() => {
    const minPointWidth = 45; 
    const calculatedWidth = data.length * minPointWidth;
    return calculatedWidth > 500 ? calculatedWidth : '100%';
  }, [data.length]);

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
    <div className="w-full relative group space-y-8">
      {/* 가로 스크롤 컨테이너 */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div style={{ width: chartWidth, minWidth: '100%' }} className="space-y-10">
          
          {/* 1. 기본 기분 점수 차트 (Area Chart) */}
          <div className="h-[200px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">전반적인 기분 점수 (1-5)</p>
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
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis hide domain={[0, 6]} />
                <Tooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'score') return [<span className="font-bold text-indigo-600">{props.payload.emoji} {value}점</span>, '기분'];
                    return [null, null];
                  }}
                />
                <ReferenceLine y={avgScore} stroke="#6366f1" strokeDasharray="4 4" />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 2. 상세 감정 뉘앙스 차트 (Line Chart) */}
          <div className="h-[200px]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">상세 감정 스펙트럼 (-1 ~ +1)</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}}
                  padding={{ left: 20, right: 20 }}
                />
                <YAxis domain={[-1.2, 1.2]} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }}
                  formatter={(value: number, name: string) => {
                    const pair = NUANCE_PAIRS[name as NuanceKey];
                    if (!pair) return [null, null];
                    const label = value === -1 ? pair[0] : value === 1 ? pair[1] : '중립';
                    return [<span className="font-bold">{label}</span>, pair.join('-')];
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                  formatter={(value) => NUANCE_PAIRS[value as NuanceKey]?.join('/')}
                />
                <ReferenceLine y={0} stroke="#e2e8f0" />
                <Line type="monotone" dataKey="fear_safety" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="fear_safety" />
                <Line type="monotone" dataKey="anxiety_stability" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="anxiety_stability" />
                <Line type="monotone" dataKey="worry_carefree" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="worry_carefree" />
                <Line type="monotone" dataKey="ominous_good" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="ominous_good" />
                <Line type="monotone" dataKey="guilt_proud" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="guilt_proud" />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
      
      {typeof chartWidth === 'number' && chartWidth > 500 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white/80 to-transparent w-12 h-full flex items-center justify-end pr-2">
          <i className="fas fa-chevron-right text-gray-300 animate-pulse"></i>
        </div>
      )}
    </div>
  );
};

export default MoodChart;
