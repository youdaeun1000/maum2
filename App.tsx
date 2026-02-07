
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MoodType, MoodEntry, MOOD_CONFIGS, MoodConfig, PatternAnalysisResult, NUANCE_PAIRS, NuanceKey } from './types';
import MoodSelector from './components/MoodSelector';
import MoodChart from './components/MoodChart';
import MoodCalendar from './components/MoodCalendar';
import PatternAnalysis from './components/PatternAnalysis';
import LockScreen from './components/LockScreen';
import { analyzePatterns } from './geminiService';

const App: React.FC = () => {
  // --- Data States ---
  const [entries, setEntries] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('mood_entries');
    return saved ? JSON.parse(saved) : [];
  });
  
  // --- UI/Navigation States ---
  const [activeTab, setActiveTab] = useState<'home' | 'my'>('home');
  const [showForm, setShowForm] = useState(false);
  
  // --- Entry Form States ---
  const [currentMood, setCurrentMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState('');
  const [nuances, setNuances] = useState<Partial<Record<NuanceKey, string>>>({});
  
  // --- AI States ---
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysisResult | null>(null);
  const [isPatternLoading, setIsPatternLoading] = useState(false);
  
  // --- Security States ---
  const [savedPin, setSavedPin] = useState<string | null>(() => localStorage.getItem('mind_diary_pin'));
  const [isAppLocked, setIsAppLocked] = useState<boolean>(!!localStorage.getItem('mind_diary_pin'));
  const [newPinInput, setNewPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // --- Bulk Delete States ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Statistics Calculation
  const averageData = useMemo(() => {
    if (entries.length === 0) return null;
    const latestEntry = entries[0];
    const latestDate = new Date(latestEntry.timestamp).toLocaleDateString();
    const latestDayEntries = entries.filter(e => 
      new Date(e.timestamp).toLocaleDateString() === latestDate
    );
    const sum = latestDayEntries.reduce((acc, curr) => acc + MOOD_CONFIGS[curr.mood].score, 0);
    const avg = sum / latestDayEntries.length;
    const configs = Object.values(MOOD_CONFIGS) as MoodConfig[];
    const closest = configs.reduce((prev, curr) => 
      Math.abs(curr.score - avg) < Math.abs(prev.score - avg) ? curr : prev
    );
    return { 
      score: avg.toFixed(1), 
      dateLabel: latestDate,
      count: latestDayEntries.length,
      ...closest 
    };
  }, [entries]);

  const bulkDeleteCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    return entries.filter(e => e.timestamp >= start && e.timestamp <= end).length;
  }, [entries, startDate, endDate]);

  useEffect(() => {
    localStorage.setItem('mood_entries', JSON.stringify(entries));
  }, [entries]);

  const handleFetchAnalysis = useCallback(async () => {
    if (entries.length === 0) {
      setPatternAnalysis(null);
      return;
    }
    setIsPatternLoading(true);
    try {
      const patterns = await analyzePatterns(entries);
      setPatternAnalysis(patterns);
    } catch (error) {
      console.error("Pattern Analysis Error:", error);
    } finally {
      setIsPatternLoading(false);
    }
  }, [entries]);

  useEffect(() => {
    if (!isAppLocked && entries.length > 0 && !patternAnalysis) {
      handleFetchAnalysis();
    }
  }, [isAppLocked, entries.length, patternAnalysis, handleFetchAnalysis]);

  const toggleNuance = (key: NuanceKey, value: string) => {
    setNuances(prev => {
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleSaveEntry = () => {
    if (!currentMood) return;
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      mood: currentMood,
      note,
      nuances: Object.keys(nuances).length > 0 ? nuances : undefined
    };
    setEntries(prev => [newEntry, ...prev]);
    setCurrentMood(null);
    setNote('');
    setNuances({});
    setShowForm(false);
    setPatternAnalysis(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setPatternAnalysis(null);
    }
  };

  const handleBulkDelete = () => {
    if (bulkDeleteCount === 0) return;
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    if (window.confirm(`${startDate}부터 ${endDate}까지의 기록 ${bulkDeleteCount}개를 정말 삭제하시겠습니까?`)) {
      setEntries(prev => prev.filter(e => e.timestamp < start || e.timestamp > end));
      setPatternAnalysis(null);
      setStartDate('');
      setEndDate('');
    }
  };

  const handleSetPin = () => {
    if (newPinInput.length === 4) {
      localStorage.setItem('mind_diary_pin', newPinInput);
      setSavedPin(newPinInput);
      setIsSettingPin(false);
      setNewPinInput('');
      alert('PIN 번호가 설정되었습니다.');
    }
  };

  const handleRemovePin = () => {
    if (window.confirm('잠금 기능을 해제하시겠습니까?')) {
      localStorage.removeItem('mind_diary_pin');
      setSavedPin(null);
    }
  };

  if (isAppLocked && savedPin) {
    return <LockScreen correctPin={savedPin} onUnlock={() => setIsAppLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-4 py-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">마음일기</h1>
          {activeTab === 'home' && (
            <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors flex items-center shadow-md">
              <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'} mr-2`}></i>
              {showForm ? '닫기' : '기록하기'}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        {activeTab === 'home' ? (
          <div className="space-y-8">
            {showForm && (
              <section className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-xl font-bold text-gray-800 mb-6">지금 기분이 어떠신가요?</h2>
                <div className="space-y-8">
                  <MoodSelector selectedMood={currentMood} onSelect={setCurrentMood} />
                  
                  {/* Nuance Selectors */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">더 구체적으로 느껴본다면?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(Object.entries(NUANCE_PAIRS) as [NuanceKey, [string, string]][]).map(([key, [left, right]]) => (
                        <div key={key} className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                          <button 
                            onClick={() => toggleNuance(key, left)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${nuances[key] === left ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {left}
                          </button>
                          <div className="w-px h-4 bg-gray-200 self-center mx-1" />
                          <button 
                            onClick={() => toggleNuance(key, right)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${nuances[key] === right ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {right}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">메모</label>
                    <textarea 
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="지금 느끼는 감정을 가볍게 적어보세요..."
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <button onClick={handleSaveEntry} disabled={!currentMood} className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 shadow-lg ${currentMood ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                    기록 저장하기
                  </button>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="space-y-4 lg:col-span-2">
                <h2 className="text-lg font-bold text-gray-800 flex items-center"><i className="fas fa-chart-line mr-2 text-blue-500"></i>감정 트렌드</h2>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  {averageData && (
                    <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{averageData.emoji}</span>
                        <div>
                          <p className="text-xs text-indigo-600 font-bold uppercase">최근 하루 평균</p>
                          <p className="text-sm font-bold text-gray-800">{averageData.dateLabel}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{averageData.score}</span>
                    </div>
                  )}
                  <MoodChart entries={entries} />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center"><i className="fas fa-calendar-alt mr-2 text-indigo-500"></i>감정 달력</h2>
                <MoodCalendar entries={entries} />
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center"><i className="fas fa-brain mr-2 text-purple-500"></i>상황별 마음 분석</h2>
                <PatternAnalysis analysis={patternAnalysis} loading={isPatternLoading} />
              </section>
            </div>

            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center"><i className="fas fa-history mr-2 text-gray-500"></i>지난 기록들</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {entries.length === 0 ? (
                  <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">아직 기록이 없습니다.</div>
                ) : (
                  entries.map(entry => {
                    const config = MOOD_CONFIGS[entry.mood];
                    return (
                      <div key={entry.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
                        <button onClick={() => handleDeleteEntry(entry.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt text-sm"></i></button>
                        <div className="flex items-center mb-3">
                          <span className="text-4xl mr-4">{config.emoji}</span>
                          <div>
                            <span className="text-[10px] font-bold text-gray-300 uppercase block">기록 시각</span>
                            <span className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        {/* Nuances Display */}
                        {entry.nuances && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {Object.values(entry.nuances).map((v, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold">#{v}</span>
                            ))}
                          </div>
                        )}

                        {entry.note && (
                          <div className="bg-gray-50/50 p-3 rounded-2xl"><p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{entry.note}</p></div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl mb-4 shadow-lg shadow-indigo-100">
                <i className="fas fa-user"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">나의 마음 공간</h2>
              <p className="text-gray-400 mt-1">총 {entries.length}개의 감정 조각이 모였어요</p>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 font-bold text-gray-800 flex items-center">
                <i className="fas fa-trash-can mr-2 text-red-500"></i>기록 정리하기
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-3 bg-gray-50 border rounded-xl text-sm" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-3 bg-gray-50 border rounded-xl text-sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-500">{bulkDeleteCount > 0 ? `${bulkDeleteCount}개 선택됨` : ''}</span>
                  <button onClick={handleBulkDelete} disabled={bulkDeleteCount === 0} className="px-6 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:bg-gray-100 disabled:text-gray-400">삭제하기</button>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 font-bold text-gray-800 flex items-center">
                <i className="fas fa-shield-alt mr-2 text-indigo-500"></i>보안 설정
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div><h4 className="font-medium">앱 잠금 (PIN)</h4><p className="text-xs text-gray-400">4자리 비밀번호 사용</p></div>
                  {savedPin ? <button onClick={handleRemovePin} className="text-red-600 text-sm">해제</button> : <button onClick={() => setIsSettingPin(true)} className="text-indigo-600 text-sm">설정</button>}
                </div>
                {isSettingPin && (
                  <div className="space-y-2">
                    <input type="password" maxLength={4} value={newPinInput} onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g,''))} className="w-full p-3 border rounded-xl text-center tracking-[1em]" />
                    <button onClick={handleSetPin} className="w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold">확인</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-8 py-3 rounded-full shadow-2xl border border-white/20 z-40 flex items-center space-x-12">
        <button onClick={() => { setActiveTab('home'); setShowForm(false); }} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <i className="fas fa-home text-xl"></i><span className="text-[10px] mt-1 font-bold">홈</span>
        </button>
        <button onClick={() => { setActiveTab('home'); setShowForm(true); }} className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center -mt-10 shadow-lg hover:scale-110 active:scale-95 transition-transform">
          <i className="fas fa-plus"></i>
        </button>
        <button onClick={() => setActiveTab('my')} className={`flex flex-col items-center ${activeTab === 'my' ? 'text-indigo-600' : 'text-gray-400'}`}>
          <i className="fas fa-user text-xl"></i><span className="text-[10px] mt-1 font-bold">마이</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
