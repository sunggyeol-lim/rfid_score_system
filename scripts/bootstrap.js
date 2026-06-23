const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');

console.log('🚀 프레임워크 개발 환경 초기화(Bootstrap)를 시작합니다...');

// 1. package.json 파일 존재 여부 확인 및 생성
if (!fs.existsSync(packageJsonPath)) {
  console.log('📝 package.json 파일이 없습니다. 기본 템플릿을 생성합니다.');
  const defaultPackageJson = {
    name: "rfid-score-system",
    version: "1.0.0",
    description: "No-Coding SDLC Automation Framework Project",
    main: "src/index.js",
    scripts: {
      "test": "jest",
      "lint": "eslint \"src/**/*.js\""
    },
    dependencies: {},
    devDependencies: {
      "jest": "^29.7.0"
    }
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(defaultPackageJson, null, 2), 'utf-8');
}

// 2. npm install 실행
console.log('📦 의존성 라이브러리(Jest 등)를 설치하고 있습니다. 잠시만 기다려주세요...');
try {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Windows PowerShell 실행 정책 우회 옵션은 npm.cmd 호출 시 불필요하나,
  // 쉘 오버헤드로 인한 오류 방지를 위해 shell: true 옵션 부여
  execSync(`${npmCmd} install`, { 
    cwd: rootDir, 
    stdio: 'inherit',
    shell: true 
  });
  console.log('✅ 의존성 설치가 성공적으로 완료되었습니다.');
} catch (error) {
  console.error('❌ 의존성 설치 중 오류가 발생했습니다:', error.message);
  console.error('수동으로 "npm install"을 실행해야 할 수 있습니다.');
  process.exit(1);
}

// 3. 기본 소스 폴더 구성
const srcDir = path.join(rootDir, 'src');
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir);
  console.log('📁 src 폴더를 생성했습니다.');
}

console.log('🎉 환경 초기화가 성공적으로 끝났습니다. 이제 에이전트 개발을 시작할 수 있습니다!');
