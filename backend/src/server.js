const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 로컬 모든 접속 허용
    methods: ["GET", "POST"]
  }
});

// 1. 전체 학생 랭킹 조회 API
app.get('/api/students', (req, res) => {
  try {
    const students = db.getStudents();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. 신규 학생 등록 API
app.post('/api/students', (req, res) => {
  const { rfid_id, name } = req.body;
  if (!rfid_id || !name) {
    return res.status(400).json({ error: "rfid_id and name are required." });
  }

  try {
    const student = db.addStudent(rfid_id, name);
    // 등록 즉시 대시보드 갱신을 위해 브로드캐스팅
    io.emit('student_registered', student);
    res.status(201).json({ success: true, student });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed') || err.message.includes('already exists')) {
      return res.status(400).json({ error: "RFID ID already exists." });
    }
    res.status(500).json({ error: err.message });
  }
});

// 3. 점수 부여 API (핵심)
app.post('/api/score', (req, res) => {
  const { rfid_id, score_added } = req.body;
  
  if (!rfid_id || score_added === undefined) {
    return res.status(400).json({ error: "rfid_id and score_added are required." });
  }

  const scoreVal = parseInt(score_added);

  try {
    // 3.1. 학생 검색
    const student = db.getStudentByRfid(rfid_id);

    // 미등록 태그인 경우
    if (!student) {
      console.log(`⚠️ Unknown RFID Tag detected: ${rfid_id}`);
      // 대시보드로 미등록 카드 감지 이벤트 전송
      io.emit('unknown_tag', { rfid_id });
      return res.status(404).json({ success: false, error: "unknown_tag", rfid_id });
    }

    // 3.2. 점수 업데이트 및 로그 기록
    const updatedStudent = db.updateScore(rfid_id, scoreVal);
    
    const updatePayload = {
      rfid_id,
      name: updatedStudent.name,
      score_added: scoreVal,
      total_score: updatedStudent.score,
      timestamp: new Date().toISOString()
    };

    // 대시보드로 실시간 이벤트 브로드캐스팅
    io.emit('score_updated', updatePayload);
    console.log(`🎯 Score Updated: ${updatedStudent.name} (+${scoreVal}) -> Total: ${updatedStudent.score}`);

    res.json({ success: true, student: updatedStudent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. WebSocket 연결 로깅
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 포트 대기 (3000번 기본 사용)
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🐝 RFID Score Server is running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
