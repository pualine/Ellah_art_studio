import { GoogleGenAI } from "@google/genai";
import { GeneratedImage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the 'nano banana' equivalent model as per instructions
const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateEditedImage = async (
  imageBase64: string,
  imageMimeType: string,
  prompt: string
): Promise<GeneratedImage> => {
  try {
    // Clean base64 string if it contains metadata prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: imageMimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No content generated");
    }

    let generatedImage: GeneratedImage | null = null;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        const url = `data:${mimeType};base64,${part.inlineData.data}`;
        generatedImage = {
          url,
          mimeType,
        };
        break; // Assume one image for now
      }
    }

    if (!generatedImage) {
        // Fallback: Check if there is text that explains why image wasn't generated
        const textPart = parts.find(p => p.text);
        if (textPart?.text) {
             throw new Error(`The model returned text instead of an image: "${textPart.text.substring(0, 100)}..."`);
        }
        throw new Error("No image data found in response");
    }

    return generatedImage;

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "Failed to generate image");
  }
};
