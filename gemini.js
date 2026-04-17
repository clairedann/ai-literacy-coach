/**
 * AI Literacy Coach - Gemini Integration Wrapper (BYOK Mode)
 */
import { SYSTEM_PROMPT } from './constants.js';

/**
 * Robustly extracts and parses JSON from a string that might contain extra text or markdown blocks.
 */
function extractJSON(text) {
    try {
        // Try to find the first '{' and last '}'
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("No JSON object found in response");
        }

        const jsonString = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Extraction Error:", e, "Original text:", text);
        throw new Error("The AI provided an invalid response format. Please try again.");
    }
}

/**
 * Sends the user prompt directly to Google Gemini using the provided API Key.
 */
export async function analyzePrompt(apiKey, modelId, userPrompt) {
    if (!apiKey) throw new Error("API Key is required.");
    
    try {
        // Dynamic import of the Google AI SDK from CDN
        const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = await import('https://esm.run/@google/generative-ai');
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ];

        const model = genAI.getGenerativeModel({ 
            model: modelId || "gemini-1.5-flash",
            systemInstruction: SYSTEM_PROMPT,
            safetySettings
        });

        const result = await model.generateContent(`Analyze this student prompt: "${userPrompt}"`);
        const response = await result.response;
        const text = response.text();
        
        return extractJSON(text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error.message.includes("SAFETY")) {
            throw new Error("Your prompt was flagged by safety filters. Please keep it educational and appropriate.");
        }
        throw new Error(error.message || "Failed to communicate with Gemini. Please check your API key.");
    }
}
