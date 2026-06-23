const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

console.log('🔍 정적 코드 분석 및 문법 검사(Linting)를 실행합니다...');

function getJsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const jsFiles = getJsFiles(srcDir);
if (jsFiles.length === 0) {
  console.log('ℹ️ 검사할 JavaScript 소스 파일이 src 폴더에 존재하지 않습니다.');
  process.exit(0);
}

let hasError = false;

// 1. 기본 Node.js 구문 에러 검사 (Syntax Check)
jsFiles.forEach(file => {
  const relativePath = path.relative(rootDir, file);
  try {
    // node --check [filepath] 는 실행하지 않고 문법적 오류만 검증함
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
    console.log(`✅ ${relativePath}: 문법 검사 통과`);
  } catch (error) {
    console.error(`❌ ${relativePath}: 문법 에러 발견!`);
    console.error(error.stderr ? error.stderr.toString() : error.message);
    hasError = true;
  }
});

// 2. ESLint 구동 시도 (패키지가 존재하고 설정되어 있을 때만 실행)
try {
  const eslintPath = path.join(rootDir, 'node_modules', '.bin', 'eslint');
  const eslintCmd = process.platform === 'win32' ? `${eslintPath}.cmd` : eslintPath;
  
  if (fs.existsSync(eslintCmd) || fs.existsSync(eslintPath)) {
    console.log('🏃 ESLint 검사를 시작합니다...');
    execSync(`"${eslintCmd}" "src/**/*.js"`, { stdio: 'inherit', shell: true });
    console.log('✅ ESLint 스타일 가이드 검사 통과');
  }
} catch (error) {
  // ESLint 에러 발생 시
  console.error('❌ ESLint 검사 실패 (스타일 오류 또는 경고 존재):');
  hasError = true;
}

if (hasError) {
  console.error('\n🚨 코드 정적 검사를 통과하지 못했습니다. 코드를 수정해 주세요.');
  process.exit(1);
} else {
  console.log('\n🎉 모든 정적 코드 검사가 성공적으로 완료되었습니다!');
  process.exit(0);
}
