
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MoodEntry, MOOD_CONFIGS, PatternAnalysisResult } from "./types";

/**
 * 상황-감정 패턴 심층 분석
 */
export const analyzePatterns = async (entries: MoodEntry[]): Promise<PatternAnalysisResult> => {
  if (entries.length < 3) {
    return { 
      summary: "기록이 조금 더 쌓이면 당신만의 특별한 마음 패턴을 발견해드릴 수 있어요.", 
      patterns: [] 
    };
  }

  // Initialize with API key directly from process.env as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fullHistory = entries
    .map(e => `- [${MOOD_CONFIGS[e.mood].emoji}] 상황/메모: ${e.note}`)
    .join("\n");

  const patternPrompt = `
    사용자의 메모들을 분석하여 특정 상황이나 키워드와 감정 사이의 상관관계를 찾아내세요.
    예를 들어 "커피를 마실 때 주로 즐거워함", "회사 업무 이야기가 나올 때 불안해함" 같은 패턴을 3개 정도 추출하세요.
    
    기록 리스트:
    ${fullHistory}
    
    응답 형식 (JSON):
    {
      "summary": "사용자의 전반적인 생활 패턴과 감정 경향에 대한 다정한 요약 (2문장)",
      "patterns": [
        {
          "situation": "상황 키워드 (예: 친구와의 만남, 조용한 새벽)",
          "moodEmoji": "그 상황에서 주로 느끼는 감정의 이모지",
          "description": "상황과 감정의 연결 이유에 대한 짧은 설명"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: patternPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            patterns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  situation: { type: Type.STRING },
                  moodEmoji: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["situation", "moodEmoji", "description"]
              }
            }
          },
          required: ["summary", "patterns"]
        }
      }
    });

    return JSON.parse(response.text || '{"summary": "", "patterns": []}');
  } catch (error) {
    console.error("Gemini Pattern Error:", error);
    return { summary: "패턴을 분석하는 중에 잠시 오류가 발생했어요.", patterns: [] };
  }
};

/**
 * 텍스트를 다정한 목소리로 읽어주는 오디오 데이터 생성 (TTS)
 */
export const generateSpeech = async (text: string): Promise<string | undefined> => {
  // Initialize right before call to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    // Return the base64 encoded audio data from candidates
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return undefined;
  }
};
