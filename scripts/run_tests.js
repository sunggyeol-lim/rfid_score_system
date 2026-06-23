const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'docs', 'LATEST_TEST_REPORT.md');
const testReportTemplatePath = path.join(rootDir, 'templates', 'TEST_REPORT.md');

console.log('🧪 자동화 테스트 러너(Test Runner)를 실행합니다...');

// docs 폴더가 없으면 생성
const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}

let testPassed = false;
let testOutput = '';
let testErrorDetails = '';

try {
  const jestCmd = process.platform === 'win32' 
    ? path.join(rootDir, 'node_modules', '.bin', 'jest.cmd')
    : path.join(rootDir, 'node_modules', '.bin', 'jest');

  if (!fs.existsSync(jestCmd)) {
    console.log('⚠️ Jest가 설치되지 않았습니다. 먼저 bootstrap 스크립트를 실행해주세요.');
    process.exit(1);
  }

  // 테스트 실행 및 아웃풋 수집 (stdio: pipe로 스트림을 가져옴)
  console.log('🏃 Jest 테스트 구동 중...');
  const outputBuffer = execSync(`"${jestCmd}" --passWithNoTests`, { 
    cwd: rootDir,
    env: { ...process.env, FORCE_COLOR: '0' }, // 색상 코드 제외하고 텍스트로 수집
    shell: true
  });
  
  testOutput = outputBuffer.toString();
  testPassed = true;
  console.log(testOutput);
  console.log('✅ 모든 테스트 케이스가 무사히 통과되었습니다!');
} catch (error) {
  testPassed = false;
  // 에러 아웃풋에 테스트 실패 상세 정보가 포함됨
  testOutput = error.stdout ? error.stdout.toString() : '';
  testErrorDetails = error.stderr ? error.stderr.toString() : error.message;
  
  console.error('❌ 일부 테스트가 실패했거나 오류가 발생했습니다.');
  console.error(testErrorDetails);
}

// 3. 테스트 결과 보고서 생성 (docs/LATEST_TEST_REPORT.md)
let templateContent = '';
if (fs.existsSync(testReportTemplatePath)) {
  templateContent = fs.readFileSync(testReportTemplatePath, 'utf-8');
} else {
  templateContent = `# 검증 결과 리포트\n* 상태: {STATUS}\n\n## 테스트 상세 로그\n\`\`\`\n{LOGS}\n\`\`\``;
}

const statusText = testPassed ? '🟩 PASS (성공)' : '🟥 FAIL (실패)';
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

let finalReport = templateContent
  .replace('[YYYY-MM-DD HH:MM:SS]', now)
  .replace('[에이전트 이름]', 'Antigravity Test Automator')
  .replace('[PASS / FAIL]', statusText);

// 정적 분석 부분은 Lint 실행 스크립트에서 채워지도록 유연하게 둠
// 여기서는 테스트 로그를 상세 기술 부분에 바인딩
const logsSection = `### 📊 테스트 실행 로그 (Jest Output)\n\`\`\`text\n${testOutput || '테스트 없음'}\n${testErrorDetails}\n\`\`\``;
finalReport += `\n\n${logsSection}\n`;

fs.writeFileSync(reportPath, finalReport, 'utf-8');
console.log(`📝 테스트 검증 보고서가 업데이트되었습니다: docs/LATEST_TEST_REPORT.md`);

// 테스트 실패 시 쉘 종료 코드를 1로 주어 CI/CD나 에이전트 루프가 감지하게 함
if (!testPassed) {
  process.exit(1);
} else {
  process.exit(0);
}
