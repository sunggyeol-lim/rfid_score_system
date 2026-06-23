const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../score_system_db.json');

// 기본 Mock 학생 데이터
const defaultStudents = [
  { rfid_id: "A1B2C3D4", name: "김민준 (꿀벌반)", score: 0 },
  { rfid_id: "E5F6G7H8", name: "이서아 (조개반)", score: 0 },
  { rfid_id: "I9J0K1L2", name: "박도윤 (우주반)", score: 0 },
  { rfid_id: "M3N4O5P6", name: "최지우 (새싹반)", score: 0 }
];

// 초기 데이터 파일 세팅
function initDb() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      students: defaultStudents,
      score_logs: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('✅ Created JSON Database with Mock data at:', dbPath);
  }
}

// 데이터 읽기 헬퍼
function readData() {
  initDb();
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading JSON DB:', error);
    return { students: [], score_logs: [] };
  }
}

// 데이터 쓰기 헬퍼
function writeData(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to JSON DB:', error);
  }
}

const db = {
  // 전체 학생 목록 조회
  getStudents: () => {
    const data = readData();
    // 점수 내림차순 정렬 후 반환
    return data.students.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  },

  // 특정 학생 조회
  getStudentByRfid: (rfid_id) => {
    const data = readData();
    return data.students.find(s => s.rfid_id === rfid_id);
  },

  // 신규 학생 등록
  addStudent: (rfid_id, name) => {
    const data = readData();
    const exists = data.students.some(s => s.rfid_id === rfid_id);
    if (exists) {
      throw new Error('UNIQUE constraint failed: RFID ID already exists.');
    }
    const newStudent = { rfid_id, name, score: 0 };
    data.students.push(newStudent);
    writeData(data);
    return newStudent;
  },

  // 점수 부여 및 업데이트
  updateScore: (rfid_id, score_added) => {
    const data = readData();
    const student = data.students.find(s => s.rfid_id === rfid_id);
    if (!student) {
      return null;
    }

    // 점수 업데이트
    student.score += parseInt(score_added);

    // 로그 생성
    const newLog = {
      id: Date.now(),
      rfid_id,
      score_added: parseInt(score_added),
      timestamp: new Date().toISOString()
    };
    data.score_logs.push(newLog);

    writeData(data);
    return student;
  },

  // Jest 리소스 정리를 위한 mock close 인터페이스
  close: (callback) => {
    if (callback) callback();
  }
};

// 최초 실행시 DB 초기화 보장
initDb();

module.exports = db;
