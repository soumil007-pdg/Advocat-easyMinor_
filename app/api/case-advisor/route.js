// app/api/case-advisor/route.js

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(req) {
  // 1. Get the entire form data from the request
  const formData = await req.json();

  // 2. Set up the connection (using the SAME key as your chat route)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // 3. This is the new, specific system instruction
  const systemInstruction = `You are an "Educational Case Analyzer."
Your goal is to provide a simple, educational summary of a civil legal case based on the JSON data provided by the user.
You are NOT a lawyer and you CANNOT give real legal advice.

**CRITICAL RULE:** You MUST NOT analyze or provide information on any criminal law matters (e.g., theft, assault, IPC sections, criminal defense, etc.).
If the user's data describes a criminal case, you MUST politely decline and explain that your scope is limited to general and civil legal education, and that criminal matters are very serious and require a real lawyer.

For all other civil cases (like contract, property, family law), you will receive case details as a JSON object.
Your response MUST be formatted in simple, easy-to-understand language for a layman.
Structure your response with these clear headings:

### Summary of Your Case
(Briefly summarize the facts from the user's description.)

### Key Legal Concepts
(Identify 1-3 general legal concepts involved, like "Breach of Contract" or "Property Rights." Explain them simply.)

### General Educational Next Steps
(Provide a list of general, educational steps a person *might* consider in such a situation, like "1. Organize all your evidence (contracts, emails, photos)." or "2. Consider sending a formal letter (legal notice) to the other party." or "3. Research the local small claims court process in your area.")

**ALWAYS** end your entire response with this exact disclaimer:
"This is for educational purposes only. This is not legal advice. Always consult a certified lawyer for actual legal advice regarding your specific situation."`;

  // 4. Safety and generation settings (same as your chat)
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  try {
    // 5. Convert the form data JSON into a string for the prompt
    const prompt = `Here is the case data I submitted: ${JSON.stringify(formData)}. Please provide the educational analysis.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
      systemInstruction,
    });

    const response = result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ message: 'Error from AI' }), {
      status: 500,
    });
  }
}