import { GoogleGenAI } from "@google/genai";
import { prompt } from "./prompt.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyze a waste image using Gemini AI
 * @param {Buffer} imageBuffer - Uploaded image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Object>} - Structured JSON result
 */
export const analyzeWasteImage = async (imageBuffer, mimeType) => {
  try {
    const imageBase64 = imageBuffer.toString("base64");
// gemini-2.0-flash-lite
//gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      config: { temperature: 0.3 },
    });

    const rawText = response.text.replace(/```json|```/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      throw new Error("Invalid JSON format from Gemini AI.");
    }

    if (typeof analysis.containsWaste !== "boolean") {
      throw new Error("AI response missing 'containsWaste' field.");
    }

    return { ...analysis, imageBase64 };
  } catch (error) {
    console.error("Gemini analysis error:", error.message);
    throw new Error(error.message || "Failed to analyze waste image.");
  }
};
