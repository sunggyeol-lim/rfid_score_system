const request = require('supertest');
const { app } = require('./server');
const db = require('./db');

describe('🚀 RFID Score System Backend API Tests', () => {
  
  // 모든 테스트 케이스 실행 전에 데이터베이스 초기화 대기
  beforeAll((done) => {
    // DB 커넥션이 열릴 때까지 잠시 대기
    setTimeout(done, 1000);
  });

  afterAll((done) => {
    // 테스트 후 데이터베이스 커넥션 종료
    db.close(done);
  });

  test('1. GET /api/students - 전체 학생 목록 조회', async () => {
    const res = await request(app).get('/api/students');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('rfid_id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('score');
  });

  test('2. POST /api/score - 등록된 학생의 점수 부여 성공', async () => {
    const res = await request(app)
      .post('/api/score')
      .send({
        rfid_id: 'A1B2C3D4',
        score_added: 10
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student.name).toContain('김민준');
    expect(res.body.student.score).toBeGreaterThanOrEqual(10);
  });

  test('3. POST /api/score - 미등록 RFID 태그 예외 처리 (404)', async () => {
    const res = await request(app)
      .post('/api/score')
      .send({
        rfid_id: 'UNKNOWN_TEST_TAG',
        score_added: 5
      });
    
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toEqual('unknown_tag');
    expect(res.body.rfid_id).toEqual('UNKNOWN_TEST_TAG');
  });

  test('4. POST /api/students - 신규 학생 등록 및 중복 체크', async () => {
    const uniqueRfid = `TEST_${Date.now()}`;
    const newStudentName = '테스트 학생';

    // 4.1. 등록 성공 케이스
    const res1 = await request(app)
      .post('/api/students')
      .send({
        rfid_id: uniqueRfid,
        name: newStudentName
      });
    
    expect(res1.statusCode).toEqual(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.student.rfid_id).toEqual(uniqueRfid);
    expect(res1.body.student.name).toEqual(newStudentName);

    // 4.2. 중복 등록 예외 케이스 (400)
    const res2 = await request(app)
      .post('/api/students')
      .send({
        rfid_id: uniqueRfid,
        name: newStudentName
      });
    
    expect(res2.statusCode).toEqual(400);
    expect(res2.body.error).toContain('already exists');
  });

  test('5. POST /api/students - 필수 인자값 누락 예외 처리 (400)', async () => {
    const res = await request(app)
      .post('/api/students')
      .send({
        rfid_id: 'MISSING_NAME_TAG'
      });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('required');
  });

});
