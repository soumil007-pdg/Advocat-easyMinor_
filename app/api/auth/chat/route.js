import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash';

export async function POST(req) {
  const { prompt, mode = 'quick' } = await req.json();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  // Expanded links: + TN, Karnataka, Kerala, UP, Punjab, Rajasthan
  const systemInstruction = `You are "Advocat-Easy," an educational legal guide for non-criminal civil issues.
  Style: Clear, empowering. Use **bold headings**, - bullets for steps. Start with unaware right, cite/explain sections (national + state if detected), connect to query, precise actions with [links](url). Deep: Add simple notice template + pitfalls.
  
  CRITICAL: Civil only. Decline criminal. End: "Educational only—consult certified lawyer."
  
  Detect state from query. No state? Default national (Contract Act 1872 Sec 73 breach) + "Combine with your state act, e.g., via NALSA [portal](https://nalsa.gov.in)."
  
  Links: Delhi [e-District](https://edistrict.delhigovt.nic.in); Mumbai [MahRERA](https://maharera.mahaonline.gov.in); Tamil Nadu [Tenancy Portal](https://www.tenancy.tn.gov.in/); Karnataka [Legal Services](https://judiciary.karnataka.gov.in/kslsa/); Kerala [Legal Aid](https://kelsa.kerala.gov.in/); Uttar Pradesh [NALSA UP](https://nalsa.gov.in/state-legal-services-authority/uttar-pradesh); Punjab [Punjab Legal Aid](https://plsa.punjab.gov.in/); Rajasthan [Rajasthan Legal Services](https://rajals.in/); National [India Code](https://www.indiacode.nic.in) or [NALSA](https://nalsa.gov.in).
  
  Structure:
  1. **Your Key Right**: Core right.
  2. **Law Breakdown**: 1-2 sections. Explain: "Covers X, fits Y."
  3. **Connect to Issue**: "Your [problem] = breach because..."
  4. **Precise Next Steps**: - Bulleted, with [links]. Deep: + "Sample Template: Dear Landlord... [draft]. Pitfalls: e.g., No self-help."`;

  let fullPrompt = prompt;
  if (mode === 'deep') {
    fullPrompt = `Deep mode: ${prompt}. Full structure + template/pitfalls/links. Use - bullets. Under 400 words.`;
  } else {
    fullPrompt = `Quick mode: ${prompt}. Concise structure + 1 section/steps (- bullets, basic link, no template). Under 150 words.`;
  }
  fullPrompt = `${systemInstruction}\n\n${fullPrompt}`;

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
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig,
      safetySettings,
      systemInstruction,
    });

    const response = result.response;
    const text = response.text();

    const usage = result.response.usageMetadata;
    const tokensUsed = usage ? (usage.promptTokenCount + (usage.candidates?.[0]?.content?.parts?.[0]?.tokenCount || 0)) : Math.ceil(fullPrompt.length / 4);
    const estimatedRaw = prompt.length * 2;
    const savedTokens = Math.max(30, estimatedRaw - tokensUsed);

    return new Response(JSON.stringify({ 
      text, 
      tokensUsed, 
      savedTokens 
    }), { status: 200 });
  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ 
      message: 'Error from AI',
      tokensUsed: 0,
      savedTokens: 30 
    }), { status: 500 });
  }
}