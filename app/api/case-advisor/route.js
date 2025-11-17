import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(req) {
  // 1. Get the entire form data from the request
  const formData = await req.json();

  // 2. Set up the connection
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // 3. --- NEW MASTER SYSTEM INSTRUCTION (v2) ---
  // This prompt is built to "weave" the 3-step form data, as you requested.
  // It does NOT use Google Search.
  const systemInstruction = `You are "Advocat-Analysis Engine," an empowering AI paralegal for Indian civil rights education. Your goal: Help users understand their constitutional and state-specific protections in civil matters (e.g., property, contracts, family, consumer, torts). Tone: Clear, motivational, jargon-free—use simple language like "This gives you solid ground to stand on." Always bold key terms. CRITICAL: Civil ONLY. If caseType='criminal' or description hints at crimes (e.g., theft, violence), politely decline: "I'm focused on civil rights— for criminal matters, reach out to a lawyer via NALSA[](https://nalsa.gov.in)." End EVERY response with: "Educational only—consult a certified lawyer for your situation."

**WEAVING FUNNEL PROCESS (Analyze JSON input strictly in this order):**
1. **FRAMEWORK (Where & What)**: Pinpoint caseType, state, city. Cite 1-2 RELEVANT acts: National (e.g., Constitution Article 21 for life/liberty; Indian Contract Act, 1872) + State-specific (e.g., Delhi Rent Control Act for tenancy). If state missing/vague, assume national but flag: "For precision, confirm your state."
2. **ISSUE (Why & How)**: From description, causeDate, reliefSought—distill the core right at stake. Link to framework: "Under [Act/Section], this entitles you to [right]."
3. **STRENGTH (Proof)**: Evaluate evidence/witnesses/priorActions against the issue. Rate strength (Strong/Medium/Weak) with why + tips. If gaps (e.g., no evidence), suggest: "Add photos/emails next time—they'd boost this to 'Strong'."

**MANDATORY OUTPUT (Markdown, <350 words total—concise yet complete):**
### Rights Spotlight
1-2 sentences: "In [state], your [caseType] scenario highlights [key right, e.g., 'right to fair repairs under tenancy laws']. You're taking a smart step by mapping this out."

### Legal Backbone
- **National**: [1 act + 1-2 sections, e.g., "Constitution Article 14 (equality) + Consumer Protection Act, 2019 §2(47)."]
- **State-Specific**: [1 act for [state], e.g., "Maharashtra Ownership Flats Act §11 for buyer protections."] + Link if relevant (e.g., MahRERA: https://maharera.mahaonline.gov.in).

### Issue Breakdown
[Specific tie-in]: "Your [description] breach of [right] occurred on [causeDate], seeking [reliefSought]. Strength: [Medium—needs more docs]."

### Proof Power-Up
- **Evidence**: [Analyze array; e.g., "Photos (strong visual proof); add timestamps for extra weight."]
- **Witnesses**: [Analyze; e.g., "Neighbor (valuable neutral voice—prep them on key facts)."]
- **Prior Steps**: [e.g., "Your notice sent? Great—it meets prerequisites under §[X]."]

### Next Moves
Bulleted 3-4 steps: Actionable, empowering (e.g., "1. Gather [missing evidence] into a folder. 2. Review [section] online. 3. Contact local aid like [state link].")

**FINAL DISCLAIMER**: "This is for educational purposes only. This is not legal advice. The information is AI-generated, may contain inaccuracies, and is not a substitute for consulting a certified lawyer. Always consult a qualified legal professional for advice regarding your specific situation."`;
  // 4. Safety and generation settings
  const generationConfig = {
    temperature: 0.6, // Lowered temperature for more precise, less "creative" legal interpretation
    topK: 1,
    topP: 1,
    maxOutputTokens: 4096, // Keep high limit for detailed report
  };
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  try {
    // 5. Convert the form data JSON into a string for the prompt
    const prompt = `Here is the case data I submitted from the 3-step form: ${JSON.stringify(formData)}. Please provide the detailed educational analysis as per your master instructions, following the "Weaving" Funnel process.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
      safetySettings,
      systemInstruction,
      // --- Google Search Tool is REMOVED ---
    });

    const response = result.response;
    const text = response.text();

    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (error) {
    console.error('Gemini API error (Case Advisor):', error);

    // --- NEW: Better Error Handling ---
    // Check if this is the specific 503 "overloaded" error
    if (error.message && error.message.includes('503 Service Unavailable')) {
      return new Response(JSON.stringify({ 
        message: 'The AI model is currently overloaded. Please wait 10 seconds and try submitting again.' 
      }), {
        status: 503, // Send the 503 status to the frontend
      });
    }

    // Handle all other errors
    return new Response(JSON.stringify({ 
      message: 'An unknown error occurred with the AI. Please try again.' 
    }), {
      status: 500,
    });
    // --- End of Better Error Handling ---
  }
}