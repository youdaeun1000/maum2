
import React from 'react';
import { PatternAnalysisResult } from '../types';

interface PatternAnalysisProps {
  analysis: PatternAnalysisResult | null;
  loading: boolean;
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ analysis, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3"></div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 bg-gray-50 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis || analysis.patterns.length === 0) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center py-10">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-magnifying-glass-chart text-gray-300"></i>
        </div>
        <p className="text-gray-400 text-sm">기록이 더 쌓이면<br/>당신의 마음 패턴을 분석해드려요.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="flex items-center mb-5">
        <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
          <i className="fas fa-brain text-sm"></i>
        </div>
        <h3 className="font-bold text-gray-800">상황별 마음 패턴</h3>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed mb-6 bg-blue-50/50 p-4 rounded-2xl italic border-l-4 border-blue-200">
        "{analysis.summary}"
      </p>

      <div className="space-y-3 flex-1">
        {analysis.patterns.map((p, idx) => (
          <div key={idx} className="group flex items-start p-4 rounded-2xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all">
            <span className="text-2xl mr-4 group-hover:scale-125 transition-transform">{p.moodEmoji}</span>
            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-1">{p.situation}</h4>
              <p className="text-xs text-gray-500 leading-normal">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatternAnalysis;
