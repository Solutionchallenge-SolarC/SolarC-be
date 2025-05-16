// rag_chat.js (수정본 - 디버깅 로그 추가)
const { retrieveSimilarQnA } = require("./firestore_retriever");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// ✅ Gemini API 키 직접 입력 (혹은 .env 처리 가능)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function detectLanguage(text) {
  const korean = /[\u3131-\uD79D]/ugi;
  return korean.test(text) ? "ko" : "en";
}

async function translateToEnglish(text) {
  const prompt = `Translate this Korean sentence into natural English:\n"${text}"`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  });
  return result.response.text().trim();
}

async function getChatbotResponse(history) {
  try {
    if (!history || history.length === 0) throw new Error("❗ 히스토리가 비어있습니다.");

    const latestUserMessage = history[history.length - 1].content;
    const language = detectLanguage(latestUserMessage);
    console.log("📥 사용자 메시지:", latestUserMessage);
    console.log("🌐 감지된 언어:", language);

    const searchText = language === 'ko'
      ? await translateToEnglish(latestUserMessage)
      : latestUserMessage;

    console.log("🔍 변환된 검색 텍스트:", searchText);

    const contextQnA = await retrieveSimilarQnA(searchText);
    console.log("📚 QnA 문맥:", contextQnA);

    const contextBlock = contextQnA.map((item, i) => {
      return `Q${i + 1}: ${item.question}\nA${i + 1}: ${item.answer}`;
    }).join("\n\n");

    const chatHistoryFormatted = history.map(h => {
      const prefix = h.role === "user" ? "User" : "Assistant";
      return `${prefix}: ${h.content}`;
    }).join("\n");

    const responseLanguagePrompt = language === 'ko'
      ? `🧾 **Possible Cause**\n🧴 **What To Do**\n🏥 **When To See a Doctor**를 포함하여 따뜻한 말투의 한국어로 답해주세요.`
      : `Respond in clear, simple English using:\n🧾 **Possible Cause**\n🧴 **What To Do**\n🏥 **When To See a Doctor**`;

    const systemInstruction = `
You are a dermatology chatbot for outdoor workers.
Avoid medical jargon. Keep responses short and kind.
Use the following QnA context to help answer:

${contextBlock}
`;

    const prompt = `
${systemInstruction}

User's chat history:
${chatHistoryFormatted}

${responseLanguagePrompt}
`;

    console.log("🧠 최종 프롬프트 →\n", prompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const output = result?.response?.text()?.trim();
    console.log("🤖 Gemini 응답:", output);

    if (!output) throw new Error("❌ Gemini 응답이 비어있음");

    return output;
  } catch (error) {
    console.error("🔥 Gemini 처리 중 오류:", error);
    return "⚠️ Gemini 응답 처리에 실패했습니다.";
  }
}

module.exports = { getChatbotResponse };
