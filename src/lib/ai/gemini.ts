import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

/**
 * Get a Gemini Flash chat model instance
 */
export function getGeminiModel(systemInstruction?: string) {
  return genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 1024,
    },
  });
}

/**
 * Generate a chat response with Gemini Flash
 */
export async function generateChatResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: "user" | "model"; content: string }>,
  userMessage: string,
  context?: string
): Promise<string> {
  const model = getGeminiModel(systemPrompt);

  // Build the history with context
  const history = conversationHistory.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({ history });

  // Build the user message with RAG context
  let fullMessage = userMessage;
  if (context) {
    fullMessage = `[RELEVANT KNOWLEDGE BASE CONTEXT]\n${context}\n\n[END CONTEXT]\n\nCustomer message: ${userMessage}`;
  }

  const result = await chat.sendMessage(fullMessage);
  const response = result.response;

  return response.text();
}

/**
 * Simple text generation (non-chat)
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const model = getGeminiModel(systemInstruction);
  const result = await model.generateContent(prompt);
  return result.response.text();
}
