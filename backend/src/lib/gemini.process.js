import { GoogleGenAI } from "@google/genai";
import { prompt } from "./prompt.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyze a waste image using Gemini AI
 * @param {Buffer} imageBuffer - Uploaded image buffer
 * @param {string} mimeType - Image MIME type (e.g., "image/jpeg")
 * @returns {Promise<Object>} - Clean structured JSON result
 */
export const analyzeWasteImage = async (imageBuffer, mimeType) => {
  try {
    const imageBase64 = imageBuffer.toString("base64");

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
      config: {
        temperature: 0.3, // more deterministic
      },
    });

    // 🧹 Clean AI response
    const rawText = response.text.replace(/```json|```/g, "").trim();

    // 🧩 Parse and validate JSON
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
