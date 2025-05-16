// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // CORS 허용 필요
const { getChatbotResponse } = require("./rag_chat");
const { db } = require("./firebase"); // Firestore 연결

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/chat/rag", async (req, res) => {
  console.log("✅ [1] 요청 수신됨: /chat/rag");

  try {
    const { history } = req.body;
    console.log("✅ [2] 요청 바디 파싱 성공:", history);

    const latestMsg = history[history.length - 1]?.content || "No message";
    console.log("📥 [3] 사용자 마지막 입력:", latestMsg);

    const aiReply = await getChatbotResponse(history);
    console.log("🤖 [4] Gemini 응답:", aiReply);

    await db.collection("chat_history").add({
      timestamp: new Date(),
      message: latestMsg,
      response: aiReply,
    });
    console.log("📝 [5] Firestore 저장 성공");

    res.json({ response: aiReply });
    console.log("📤 [6] 응답 전송 완료");
  } catch (err) {
    console.error("🔥 [에러 발생]", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log("✅ Server is running at http://0.0.0.0:3000");
});

