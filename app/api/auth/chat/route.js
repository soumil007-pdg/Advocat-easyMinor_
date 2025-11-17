//backend page for general query chat
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(req) {
  const { prompt, mode = 'quick', history = [] } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // --- *** THIS IS THE FINAL CORRECTED SYSTEM INSTRUCTION *** ---
  // This is a simplified, "flattened" string to prevent the 400 Bad Request error.
  const systemInstruction = `You are "Advocat-Easy," an educational legal guide for non-criminal civil issues. Style: Clear, empowering. Use **bold headings** and - bullets for steps. CRITICAL: Civil issues ONLY. Decline all criminal law queries. Always end with "Educational only—consult certified lawyer." PROCESS: 1. Identify right. 2. Cite 1-2 law sections. 3. Connect law to issue. 4. Give bulleted next steps. LINKS: Use when relevant: National (NALSA [https://nalsa.gov.in]), Delhi (e-District [https://edistrict.delhigovt.nic.in]), Mumbai (MahRERA [https://maharera.mahaonline.gov.in]). MODES: 'Quick mode' is concise (under 150 words). 'Deep mode' is detailed with templates/pitfalls (under 400 words).`;
  // --- END OF CORRECTION ---

  // We apply the systemInstruction when we *get* the model
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: systemInstruction, // <-- Correctly placed here
  });

  // --- 1. FORMAT THE HISTORY FOR 'startChat' ---
  const chatHistory = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  // --- 2. FORMAT THE NEW PROMPT ---
  let userPrompt = '';
  if (mode === 'deep') {
    userPrompt = `Deep mode: ${prompt}. Full structure + template/pitfalls/links. Use - bullets. Under 400 words.`;
  } else {
    userPrompt = `Quick mode: ${prompt}. Concise structure + 1 section/steps (- bullets, basic link, no template). Under 150 words.`;
  }

  // --- 3. CONFIGURE GENERATION AND SAFETY (unchanged) ---
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

  try {
    // --- 4. START THE CHAT ---
    const chat = model.startChat({
      history: chatHistory,
      generationConfig,
      safetySettings,
    });

    // Send *only* the new prompt
    const result = await chat.sendMessage(userPrompt);

    const response = result.response;
    const text = response.text();

    // --- 5. READ THE METADATA ---
    console.log('Gemini usageMetadata:', result.response.usageMetadata); // For your server debugging

    const usage = result.response.usageMetadata;
    let tokensUsed = 0;

    if (usage && usage.totalTokenCount > 0) {
      tokensUsed = usage.totalTokenCount;
    } else if (usage && (usage.promptTokenCount > 0 || usage.candidatesTokenCount > 0)) {
      tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
    }
    
    console.log('Calculated tokensUsed:', tokensUsed); // For your server debugging

    return new Response(JSON.stringify({
      text,
      tokensUsed: tokensUsed, // Send the *real* tokens
      savedTokens: 0 // Frontend handles saved calculation
    }), { status: 200 });

  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({
      message: 'Error from AI',
      tokensUsed: 0,
      savedTokens: 0
    }), { status: 500 });
  }
}