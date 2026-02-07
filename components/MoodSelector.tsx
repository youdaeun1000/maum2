
import React from 'react';
import { MoodType, MOOD_CONFIGS, MoodConfig } from '../types';

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelect: (mood: MoodType) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onSelect }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
      {(Object.values(MOOD_CONFIGS) as MoodConfig[]).map((config) => (
        <button
          key={config.type}
          onClick={() => onSelect(config.type)}
          className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
            selectedMood === config.type 
              ? `${config.color} text-white shadow-lg ring-4 ring-offset-2 ring-opacity-50 ring-blue-200` 
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm'
          }`}
          title={config.label} // 마우스를 올렸을 때만 툴팁으로 설명을 보여줍니다.
        >
          <span className="text-3xl sm:text-4xl">{config.emoji}</span>
        </button>
      ))}
    </div>
  );
};

export default MoodSelector;
