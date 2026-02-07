
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MoodEntry, MOOD_CONFIGS, PatternAnalysisResult, NUANCE_PAIRS } from "./types";

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

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const fullHistory = entries
    .map(e => {
      const nuanceStr = e.nuances 
        ? Object.values(e.nuances).join(', ') 
        : '';
      return `- [${MOOD_CONFIGS[e.mood].emoji}] 기분: ${MOOD_CONFIGS[e.mood].label} ${nuanceStr ? `(${nuanceStr})` : ''} / 메모: ${e.note}`;
    })
    .join("\n");

  const patternPrompt = `
    사용자의 감정 기록들을 분석하여 특정 상황이나 심리 상태 사이의 상관관계를 찾아내세요.
    기본 기분 이외에도 '불안', '걱정', '죄책감' 등의 상세 감정 뉘앙스를 함께 고려하여 분석하세요.
    
    기록 리스트:
    ${fullHistory}
    
    응답 형식 (JSON):
    {
      "summary": "사용자의 전반적인 심리 상태와 감정 스펙트럼에 대한 다정한 요약 (2문장)",
      "patterns": [
        {
          "situation": "특정 심리적 상황 (예: 자기 전 불안함이 높을 때, 당당함이 느껴지는 성취의 순간)",
          "moodEmoji": "그 상황에서 주로 나타나는 이모지",
          "description": "감정의 상관관계에 대한 짧은 심리학적 설명"
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

export const generateSpeech = async (text: string): Promise<string | undefined> => {
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
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return undefined;
  }
};
