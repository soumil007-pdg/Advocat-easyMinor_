import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const MODEL_NAME = 'gemini-1.0-pro';

export async function POST(req) {
  const { prompt } = await req.json();

  // 1. Set up the connection to Google AI
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // 2. This is the system instruction with your rules
  const systemInstruction = `You are "Advocat-Easy," a helpful legal-education chatbot.
Your style is knowledgeable, professional, and simple for anyone to understand.
You are NOT a lawyer and you CANNOT give real legal advice.
You can only provide general, educational information about legal topics.

Your primary focus is on civil law matters (like contracts, property, family law) and general legal concepts.
You MUST NOT answer questions related to criminal law (e.g., assault, theft, IPC sections, criminal defense, etc.).
If a user asks about a criminal case, you must politely decline and explain that your scope is limited to general and civil legal education, and that criminal matters are very serious and require a real lawyer.

Always include this disclaimer at the end of your response: "This is for educational purposes only. Always consult a certified lawyer for actual legal advice."`;
  // 3. Safety and generation settings
  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  // 4. Try to get a response from the AI
  try {
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
    // This is the part that sends the "Sorry,..." error
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ message: 'Error from AI' }), {
      status: 500,
    });
  }
}