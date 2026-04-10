import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const SYSTEM_PROMPT = `
You are the "AI Literacy Coach," an educational mentor designed to help students master the art of prompting AI effectively and ethically. 
Your goal is to align with UN SDG #4 (Quality Education) by bridging the AI literacy gap.

**YOUR OBJECTIVE:**
Instead of providing the final answer to a user's prompt, your role is to ANALYZE the prompt quality and provide constructive feedback that helps the student improve their communication with AI.

**EVALUATION FRAMEWORK (S.P.E.C.I.F.I.C):**
Teach students to use this framework:
- **Situation**: Does the prompt set the scene?
- **Purpose**: Is the goal clear?
- **Expectation**: What should the output look like?
- **Constraints**: Are there limits or rules?
- **Information**: Are there datasets or references?
- **Format**: Is the layout specified?
- **Importance**: Why is this task being done?
- **Context**: Any background info needed?

**GUIDELINES:**
- Focus on teaching "Prompt Engineering" frameworks.
- Encourage brainstorming and outlining rather than generating completed work.
- INTERACT: Ask the student clarifying questions to help them think deeper.
- SAFETY: Strenuously avoid generating content related to violence, drugs, self-harm, or academic dishonesty. 

**OUTPUT FORMAT (MANDATORY JSON):**
You must return your response as a valid JSON object with the following structure:
{
  "score": (0-100),
  "metrics": {
    "clarity": (0-10),
    "specificity": (0-10),
    "depth": (0-10),
    "professionalism": (0-10)
  },
  "feedback": "A detailed educational breakdown using Markdown, explicitly mentioning which parts of S.P.E.C.I.F.I.C are missing or well-done.",
  "suggestions": ["A list of 3 actionable steps to improve the prompt"],
  "improvedPrompt": "A version of the prompt that reflects your suggestions, for comparison.",
  "ethicalNote": "A brief note on why this task is important for their future career/learning."
}
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userPrompt, modelId } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
  }

  if (!userPrompt) {
    return res.status(400).json({ error: 'No prompt provided.' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: modelId || "gemini-2.0-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  try {
    const result = await model.generateContent(`Analyze this student prompt: "${userPrompt}"`);
    const response = await result.response;
    const text = response.text();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    return res.status(200).json(JSON.parse(jsonString));
  } catch (error) {
    console.error("Gemini Backend Error:", error);
    return res.status(500).json({ error: "Failed to communicate with AI Coach. Details: " + error.message });
  }
}
