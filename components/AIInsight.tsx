
import React, { useState, useRef, useEffect } from 'react';
import { AIAnalysisResult } from '../types';
import { generateSpeech } from '../geminiService';

interface AIInsightProps {
  insight: AIAnalysisResult | null;
  loading: boolean;
  onRefresh: () => void;
}

const AIInsight: React.FC<AIInsightProps> = ({ insight, loading, onRefresh }) => {
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferCache = useRef<AudioBuffer | null>(null);

  // Helper: Decode base64 to Uint8Array
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper: Decode raw PCM to AudioBuffer
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Source might already be stopped
      }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!insight?.text) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      let buffer = audioBufferCache.current;

      if (!buffer) {
        setIsAudioLoading(true);
        const base64Data = await generateSpeech(insight.text);
        if (!base64Data) throw new Error("No audio data received");

        const bytes = decodeBase64(base64Data);
        // Gemini TTS typically returns 24kHz mono PCM
        buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        audioBufferCache.current = buffer;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback error:", error);
      alert("다정한 목소리를 가져오는 중에 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Reset audio cache when insight changes
  useEffect(() => {
    stopAudio();
    audioBufferCache.current = null;
  }, [insight?.text]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative group">
      {/* Image Section */}
      <div className="relative aspect-square w-full bg-gray-100">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
            <div className="w-full h-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <i className="fas fa-magic text-gray-300 text-3xl animate-bounce"></i>
              <p className="text-gray-400 text-xs mt-2">당신의 마음 풍경을<br/>정성껏 그리는 중...</p>
            </div>
          </div>
        ) : insight?.imageUrl ? (
          <img 
            src={insight.imageUrl} 
            alt="Mind Landscape" 
            className="w-full h-full object-cover transition-opacity duration-700 ease-in"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <i className="fas fa-sparkles text-white text-4xl opacity-20"></i>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
              <i className="fas fa-comment-dots text-sm"></i>
            </div>
            <h3 className="font-bold text-gray-800">오늘의 마음 분석</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Audio Playback Button */}
            {insight?.text && (
              <button 
                onClick={handlePlayAudio}
                disabled={isAudioLoading || loading}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isAudioLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : isPlaying 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95'
                }`}
                title={isPlaying ? "재생 중지" : "분석 내용 듣기"}
              >
                <i className={`fas ${isAudioLoading ? 'fa-circle-notch fa-spin' : isPlaying ? 'fa-stop' : 'fa-volume-up'}`}></i>
                <span>{isPlaying ? '중지' : '듣기'}</span>
              </button>
            )}

            <button 
              onClick={onRefresh}
              disabled={loading || isAudioLoading}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 shadow-sm'
              }`}
              title="분석 새로고침"
            >
              <i className={`fas fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
              <span>새로고침</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-4/6 animate-pulse"></div>
          </div>
        ) : (
          <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
            {insight?.text || "기록을 추가하면 AI가 당신의 마음을 읽어줄 거예요."}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIInsight;
