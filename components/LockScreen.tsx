
import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ correctPin, onUnlock }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (input.length < 4) {
      const newInput = input + num;
      setInput(newInput);
      
      if (newInput.length === 4) {
        if (newInput === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setInput('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setInput(input.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-800">잠금을 해제하세요</h2>
        <p className="text-gray-400 text-sm mt-1">4자리 PIN 번호를 입력해주세요</p>
      </div>

      <div className={`flex gap-4 mb-16 ${error ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              input.length > i 
                ? 'bg-indigo-600 border-indigo-600 scale-125' 
                : 'bg-transparent border-gray-200'
            } ${error ? 'border-red-400 bg-red-400' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 max-w-xs w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-gray-700 hover:bg-gray-100 active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-gray-700 hover:bg-gray-100 active:scale-90 transition-all"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
        >
          <i className="fas fa-backspace"></i>
        </button>
      </div>
    </div>
  );
};

export default LockScreen;
