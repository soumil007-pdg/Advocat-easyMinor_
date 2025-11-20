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
const systemInstruction = `You are "Advocat-Easy," an educational legal guide for non-criminal civil issues. 

**Style:** Clear, empowering, jargon-free. Use **bold headings** and bullet points. 

**CRITICAL CONSTRAINTS:** 1. **Civil Issues ONLY:** If the query hints at criminal acts (theft, violence, assault), politely decline and refer to the police/lawyer.
2. **Educational Nature:** Always end with: "Educational only—consult a certified lawyer."

**ANALYSIS PROCESS (The "Legal Funnel"):**
1. **Constitutional Anchor:** ALWAYS identify the Indian Constitutional Article protecting this right related your inputs.
2. **Legislative Framework:** Cite the relevant Central Act .
3. **State Specifics:** IF the user mentions a state/city, YOU MUST cite the specific State Act/Rules.
4. **Action Plan:** Provide actionable next steps what to do and what to avoid .

**OUTPUT MODES (Strict Adherence Required):**
- **'Quick mode':** Concise (under 150 words). Focus on *naming* the rights/acts and listing immediate steps. No templates.
- **'Deep mode':** Detailed (under 400 words). *Explain* the rights/acts, provide a draft template (e.g., for a notice), mention pitfalls, and detail the procedure.

**LINKS :** based on the input by the user give the links - `;  // --- END OF CORRECTION ---

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