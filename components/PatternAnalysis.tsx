
import React, { useMemo } from 'react';
import { MoodEntry, MOOD_CONFIGS, NUANCE_PAIRS, NuanceKey, MoodType } from '../types';

interface PatternAnalysisProps {
  entries: MoodEntry[];
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ entries }) => {
  // 1. 감정 분포 계산
  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([type, count]) => ({
        type: type as MoodType,
        count,
        percent: Math.round((count / entries.length) * 100),
        config: MOOD_CONFIGS[type as MoodType]
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  // 2. 5가지 상세 감정 밸런스 계산
  const nuanceBalance = useMemo(() => {
    const stats: Record<NuanceKey, { left: number; right: number; total: number }> = {
      fear_safety: { left: 0, right: 0, total: 0 },
      anxiety_stability: { left: 0, right: 0, total: 0 },
      worry_carefree: { left: 0, right: 0, total: 0 },
      ominous_good: { left: 0, right: 0, total: 0 },
      guilt_proud: { left: 0, right: 0, total: 0 }
    };

    entries.forEach(e => {
      if (!e.nuances) return;
      (Object.keys(NUANCE_PAIRS) as NuanceKey[]).forEach(key => {
        const pair = NUANCE_PAIRS[key];
        if (e.nuances?.[key] === pair[0]) {
          stats[key].left++;
          stats[key].total++;
        } else if (e.nuances?.[key] === pair[1]) {
          stats[key].right++;
          stats[key].total++;
        }
      });
    });

    return stats;
  }, [entries]);

  // 3. 감정별 메모 그룹화 (Memos grouped by Mood)
  const memosByMood = useMemo(() => {
    const grouped: Record<string, MoodEntry[]> = {};
    
    entries.forEach(e => {
      if (e.note && e.note.trim()) {
        if (!grouped[e.mood]) grouped[e.mood] = [];
        grouped[e.mood].push(e);
      }
    });

    return Object.entries(grouped)
      .map(([mood, items]) => ({
        mood: mood as MoodType,
        items: items.slice(0, 3) // 각 감정별 최근 3개만 표시
      }))
      .sort((a, b) => (grouped[b.mood]?.length || 0) - (grouped[a.mood]?.length || 0));
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center py-12">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-chart-pie text-gray-300"></i>
        </div>
        <p className="text-gray-400 text-sm">기록이 쌓이면<br/>감정별 메모 리포트를 표로 정리해드려요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full space-y-12">
      
      {/* 섹션 1: 감정 분포 통계 */}
      <div>
        <div className="flex items-center mb-4">
          <div className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-list-ol text-sm"></i>
          </div>
          <h3 className="font-bold text-gray-800">자주 느낀 기분 순위</h3>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">기분</th>
                <th className="px-4 py-3">횟수</th>
                <th className="px-4 py-3">비중</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {moodDistribution.slice(0, 3).map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 flex items-center font-medium text-gray-700">
                    <span className="text-xl mr-2">{item.config.emoji}</span>
                    {item.config.label}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.count}회</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-12 bg-gray-100 h-1.5 rounded-full mr-2 overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${item.percent}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600">{item.percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 섹션 2: 상세 감정 밸런스 */}
      <div>
        <div className="flex items-center mb-4">
          <div className="bg-purple-100 text-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-scale-balanced text-sm"></i>
          </div>
          <h3 className="font-bold text-gray-800">상세 감정 밸런스</h3>
        </div>
        
        <div className="space-y-5">
          {(Object.keys(NUANCE_PAIRS) as NuanceKey[]).map(key => {
            const pair = NUANCE_PAIRS[key];
            const stat = nuanceBalance[key];
            const leftPercent = stat.total > 0 ? Math.round((stat.left / stat.total) * 100) : 50;
            const rightPercent = 100 - leftPercent;

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold px-1">
                  <span className={`${stat.left > stat.right ? 'text-indigo-600' : 'text-gray-400'}`}>{pair[0]}</span>
                  <span className={`${stat.right > stat.left ? 'text-indigo-600' : 'text-gray-400'}`}>{pair[1]}</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full flex overflow-hidden border border-gray-50">
                  <div 
                    className="bg-indigo-400 transition-all duration-500 border-r border-white/20" 
                    style={{ width: `${leftPercent}%` }}
                  />
                  <div 
                    className="bg-teal-400 transition-all duration-500" 
                    style={{ width: `${rightPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 섹션 3: 감정별 메모 기록 표 (핵심 업데이트) */}
      <div>
        <div className="flex items-center mb-4">
          <div className="bg-teal-100 text-teal-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-table-list text-sm"></i>
          </div>
          <h3 className="font-bold text-gray-800">감정별 마음 기록 표</h3>
        </div>
        
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-1/4">감정</th>
                <th className="px-4 py-3 w-3/4">기록된 상황 (메모)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memosByMood.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-400 italic">
                    아직 기록된 메모가 없습니다.
                  </td>
                </tr>
              ) : (
                memosByMood.map((group) => (
                  <tr key={group.mood} className="align-top hover:bg-gray-50/30 transition-colors">
                    <td className="px-4 py-4 font-bold text-gray-700 bg-gray-50/20">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">{MOOD_CONFIGS[group.mood].emoji}</span>
                        <span className="text-[10px] text-center leading-tight">{MOOD_CONFIGS[group.mood].label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-4">
                        {group.items.map((item) => (
                          <div key={item.id} className="group/memo">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-[9px] font-bold text-gray-300">
                                {new Date(item.timestamp).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                              </span>
                              {item.nuances && (
                                <div className="flex gap-1">
                                  {Object.values(item.nuances).map((v, i) => (
                                    <span key={i} className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md font-bold">#{v}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className="text-gray-600 leading-relaxed border-l-2 border-indigo-100 pl-3">
                              {item.note}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-50">
        <p className="text-[11px] text-gray-400 leading-relaxed italic text-center">
          * 위 리포트는 사용자의 최근 기록 {entries.length}개를 기반으로 생성된 주관적인 통계입니다.
        </p>
      </div>
    </div>
  );
};

export default PatternAnalysis;
