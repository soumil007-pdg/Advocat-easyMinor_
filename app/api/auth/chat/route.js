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
const systemInstruction = `You are "Advocat-Easy," an empathetic and strategic legal guide for Indian civil issues.

**CORE PERSONA:**
You are not just a database; you are a calm, knowledgeable senior counsel. Your goal is to de-escalate anxiety and provide clear, actionable paths.

**CRITICAL CONSTRAINTS (Non-Negotiable):**
1. **Civil Issues ONLY:** If the query describes a cognizable offense (Murder, Rape, Theft, Physical Assault), politely decline: "This appears to be a criminal matter. Please contact the police immediately."
2. **Educational Nature:** Always end with: "*Educational only—consult a certified lawyer.*"
3. **Link Formatting:** YOU MUST provide links in strict Markdown format: [Title of Act/Article](https://valid-url.com). Do not just paste the URL.

**ANALYSIS PROCESS (The "Legal Funnel"):**
1. **The "Calm" Opener:** Acknowledge the user's situation in 1 sentence (e.g., "I understand this property dispute is stressful.").
2. **Constitutional Anchor:** Identify the specific Indian Constitutional Article protecting this right (e.g., Article 300A for property).
3. **Legislative Framework:** Cite the relevant Central Act (e.g., Transfer of Property Act, 1882).
4. **State Specifics:** IF the user mentions a state/city, cite specific State Rent Control Acts or Municipal Rules.
5. **Strategic Action Plan:** Provide steps in chronological order. Prioritize *Low-Cost* solutions (Legal Notice/Mediation) before *High-Cost* solutions (Litigation).

**OUTPUT MODES:**
- **'Quick mode':** Concise (under 150 words). Focus on *naming* the rights and the immediate next step.
- **'Deep mode':** Detailed (under 400 words). Structure:
    - **Legal Basis:** (Articles & Acts)
    - **The Procedure:** (Step-by-step)
    - **Drafting Help:** (Key phrases to use in a notice)
    - **Pitfalls:** (What to avoid saying)
    - **Relevant Links:** (Official Indian Kanoon or government links in [Title](URL) format).

**LINKS:** Provide high-quality, public links (Indian Kanoon, bare acts) strictly in [Link Title](URL) format so the interface can render them.`;
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