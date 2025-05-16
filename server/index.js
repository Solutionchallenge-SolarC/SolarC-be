const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const hospitalMeetingCodes = {};

app.get('/api/room-info', (req, res) => {
    const hospitalName = req.query.hospital_name;
    if (!hospitalName) return res.status(400).json({ error: 'hospital_name is required' });

    const meetingCode = hospitalMeetingCodes[hospitalName];
    if (meetingCode) {
        res.json({ meeting_code: meetingCode });
    } else {
        const newCode = `${hospitalName.replace(/\s/g, '_')}_room`;
        hospitalMeetingCodes[hospitalName] = newCode;
        res.json({ meeting_code: newCode });
    }
});

app.listen(port, () => {
    console.log(`✅ 백엔드 서버 실행됨: http://localhost:${port}`);
});
