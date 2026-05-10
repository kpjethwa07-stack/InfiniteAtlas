import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { ActivityType } from "../types";

const engine = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface GeneratedPlan {
  stops: {
    cityName: string;
    arrivalDateOffset: number; // days from start
    departureDateOffset: number; // days from start
    note: string;
    activities: {
      title: string;
      description: string;
      cost: number;
      type: ActivityType;
      duration: string;
    }[];
  }[];
  generalAdvice: {
    airlines: string[];
    taxiApps: string[];
    localTips: string;
  };
}

export async function generateSmartPlan(destination: string, durationDays: number, userPlan?: string): Promise<GeneratedPlan> {
  const contents = `Location: ${destination}, Duration: ${durationDays} days. ${userPlan ? `User: ${userPlan}` : ""}`;

  const response = await engine.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      systemInstruction: `You are a high-efficiency travel planner. Create a structured itinerary for the specified location and duration.
Requirements:
- Specify hotels as "stay" activities
- Recommend best airlines and regional taxi apps
- Provide realistic USD ($) costs
- Be concise but detailed
- Output in strict JSON format`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          stops: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                cityName: { type: Type.STRING },
                arrivalDateOffset: { type: Type.NUMBER },
                departureDateOffset: { type: Type.NUMBER },
                note: { type: Type.STRING },
                activities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      cost: { type: Type.NUMBER },
                      type: { 
                        type: Type.STRING, 
                        enum: Object.values(ActivityType)
                      },
                      duration: { type: Type.STRING }
                    },
                    required: ["title", "description", "cost", "type"]
                  }
                }
              },
              required: ["cityName", "arrivalDateOffset", "departureDateOffset", "activities"]
            }
          },
          generalAdvice: {
            type: Type.OBJECT,
            properties: {
              airlines: { type: Type.ARRAY, items: { type: Type.STRING } },
              taxiApps: { type: Type.ARRAY, items: { type: Type.STRING } },
              localTips: { type: Type.STRING }
            },
            required: ["airlines", "taxiApps", "localTips"]
          }
        },
        required: ["stops", "generalAdvice"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate response. Please try again.");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse response:", text);
    throw new Error("Invalid format returned. Please try again.");
  }
}
