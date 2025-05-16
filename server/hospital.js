const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ API 키 실제 발급값으로 교체
const genAI = new GoogleGenerativeAI('AIzaSyA2JkMh9phker4s0dOSRpNOUCw9FmZS9Uc');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // ✅ 안정적인 모델 사용

const SURVEY_QUESTIONS = {
    bkl: [
        { id: 1, question: '해당 피부 증식이 중년 이후 연령에 발생했나요?' },
        { id: 2, question: '병변의 표면이 밀랍처럼 광택 있고 피부에 붙어있는 모습인가요?' }
    ]
};

app.get('/survey/:disease/start', (req, res) => {
    const disease = req.params.disease;
    const questions = SURVEY_QUESTIONS[disease];
    if (!questions) {
        return res.status(404).json({ message: '질병을 찾을 수 없습니다.' });
    }
    res.json({ questions });
});

app.post('/survey/:disease/submit', async (req, res) => {
    const { user_id, disease, answers } = req.body;
    if (req.params.disease !== disease) {
        return res.status(400).json({ message: '제출된 질병 정보가 잘못되었습니다.' });
    }

    let summary = '설문 결과:\n';
    answers.forEach(ans => {
        summary += `문항 ${ans.id}: ${ans.answer}\n`;
    });

    const chatPrompt = `사용자가 ${disease} 설문에 응답했습니다:\n${summary}\n의심되는 질병이나 진료 권고를 간단하게 전달해주세요.`;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: chatPrompt }] }]
        });

        const responseText = result.response.text();
        res.json({
            message: '설문 제출 완료',
            chatbot_response: responseText
        });
    } catch (err) {
        console.error('❌ Gemini 오류:', err);
        res.status(500).json({
            error: '챗봇 처리 중 오류 발생',
            details: err.toString()
        });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`✅ 서버 실행됨: http://localhost:${port}`);
});
