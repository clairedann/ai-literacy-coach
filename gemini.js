/**
 * AI Literacy Coach - Gemini Integration Wrapper
 */

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
 * Sends the user prompt to the analysis backend (serverless function).
 */
export async function analyzePrompt(apiKey, modelId, userPrompt) {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userPrompt,
                modelId
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Analysis Error:", error);
        throw error;
    }
}
