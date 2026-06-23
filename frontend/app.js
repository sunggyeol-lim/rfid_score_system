// ==========================================
// RFID Score System Dashboard JS
// ==========================================

const API_BASE_URL = 'http://localhost:3000';
let socket;
let studentsList = [];

// 1. 테마 메타데이터 정의 (모듈화 구조)
const THEME_CONFIGS = {
  honeybee: {
    icon: '🐝',
    toastAvatar: '🍯',
    particleClass: 'particle-bee'
  },
  ocean: {
    icon: '🐬',
    toastAvatar: '🌊',
    particleClass: 'particle-bubble'
  },
  kids: {
    icon: '🎈',
    toastAvatar: '🎁',
    particleClass: 'particle-balloon'
  }
};

let currentTheme = 'honeybee';

// 2. 초기화 및 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  fetchStudents();
  initSocket();
  initRegisterModal();
});

// 3. 테마 스위처 설정 (모듈화)
function initThemeSwitcher() {
  const buttons = document.querySelectorAll('.theme-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.dataset.theme;
      setTheme(selectedTheme);
      
      // 버튼 활성화 갱신
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function setTheme(themeId) {
  if (!THEME_CONFIGS[themeId]) return;
  
  currentTheme = themeId;
  
  // 1. Body 클래스 교체로 CSS 변수들 일괄 적용
  document.body.className = `theme-${themeId}`;
  
  // 2. 상단 타이틀 아이콘 및 마스코트 교체
  document.querySelector('.theme-icon').textContent = THEME_CONFIGS[themeId].icon;
  
  // 3. 챔피언 및 토스트 마스코트 리소스 업데이트
  updateChampionAvatar();
  
  console.log(`🎨 테마가 전환되었습니다: ${themeId}`);
}

// 4. API로부터 학생 목록 조회 및 랭킹 렌더링
async function fetchStudents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/students`);
    studentsList = await response.json();
    renderRanking();
  } catch (error) {
    console.error('❌ 학생 데이터를 가져오는데 실패했습니다:', error);
    document.getElementById('ranking-list').innerHTML = 
      `<div class="loading-state">서버와 연결할 수 없습니다. 백엔드를 확인해주세요.</div>`;
  }
}

// 랭킹 렌더링 함수
function renderRanking() {
  const rankingListContainer = document.getElementById('ranking-list');
  rankingListContainer.innerHTML = '';

  if (studentsList.length === 0) {
    rankingListContainer.innerHTML = '<div class="loading-state">등록된 학생이 없습니다.</div>';
    return;
  }

  // 1. 챔피언(1등) 데이터 추출 및 반영
  const champion = studentsList[0];
  const champNameEl = document.getElementById('champ-name');
  const champScoreEl = document.getElementById('champ-score-val');
  
  if (champion) {
    champNameEl.textContent = champion.name;
    champScoreEl.textContent = champion.score;
  } else {
    champNameEl.textContent = '대기 중...';
    champScoreEl.textContent = '0';
  }
  updateChampionAvatar();

  // 2. 2등부터 전체 순위 렌더링
  studentsList.forEach((student, index) => {
    const rankNum = index + 1;
    let badgeClass = '';
    if (rankNum === 1) badgeClass = 'rank-badge-1';
    else if (rankNum === 2) badgeClass = 'rank-badge-2';
    else if (rankNum === 3) badgeClass = 'rank-badge-3';

    const rankItem = document.createElement('div');
    rankItem.className = 'ranking-item';
    rankItem.id = `student-card-${student.rfid_id}`;
    rankItem.innerHTML = `
      <div class="rank-left">
        <div class="rank-number ${badgeClass}">${rankNum}</div>
        <div class="rank-name">${student.name}</div>
      </div>
      <div class="rank-right">
        <div class="rank-score">${student.score}</div>
        <div class="rank-score-unit">점</div>
      </div>
    `;
    rankingListContainer.appendChild(rankItem);
  });
}

function updateChampionAvatar() {
  const champAvatarEl = document.getElementById('champ-avatar');
  champAvatarEl.textContent = THEME_CONFIGS[currentTheme].icon;
}

// 5. Socket.io 실시간 통신 설정
function initSocket() {
  socket = io(API_BASE_URL);

  socket.on('connect', () => {
    console.log('⚡ WebSocket connected to Backend Server');
  });

  // 점수 획득 이벤트 수신
  socket.on('score_updated', (data) => {
    console.log('🎯 Score Update received:', data);
    handleLiveScoreUpdate(data);
  });

  // 미등록 태그 감지 이벤트 수신
  socket.on('unknown_tag', (data) => {
    console.log('⚠️ Unknown RFID scanned:', data.rfid_id);
    showRegisterModal(data.rfid_id);
  });

  // 신규 학생 등록 완료 수신
  socket.on('student_registered', (data) => {
    console.log('📝 New student registered:', data);
    // 학생 리스트에 추가 후 재배치
    studentsList.push(data);
    sortAndReRender();
  });
}

// 실시간 점수 업데이트 처리
function handleLiveScoreUpdate(data) {
  // 1. 로컬 목록 데이터 업데이트
  const student = studentsList.find(s => s.rfid_id === data.rfid_id);
  if (student) {
    student.score = data.total_score;
  } else {
    // 혹시 리스트에 없던 학생이면 강제 패치
    fetchStudents();
    return;
  }

  // 2. 랭킹 정렬 및 갱신
  sortAndReRender();

  // 3. UI 효과 및 파티클 트리거
  triggerToast(data.name, data.score_added);
  spawnParticles();

  // 4. 해당 학생 카드에 하이라이트 애니메이션
  const card = document.getElementById(`student-card-${data.rfid_id}`);
  if (card) {
    card.style.transform = 'scale(1.08)';
    card.style.borderColor = 'var(--primary-color)';
    setTimeout(() => {
      card.style.transform = '';
      card.style.borderColor = '';
    }, 1000);
  }
}

// 랭킹 정렬 및 렌더링
function sortAndReRender() {
  studentsList.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  renderRanking();
}

// 6. 실시간 팝업 알림 (Toast) 작동
let toastTimeout;
function triggerToast(name, scoreAdded) {
  const toast = document.getElementById('realtime-toast');
  const toastAvatar = document.getElementById('toast-avatar');
  const toastName = document.getElementById('toast-student-name');
  const toastScore = document.getElementById('toast-added-score');

  // 아바타 및 내용 설정
  toastAvatar.textContent = THEME_CONFIGS[currentTheme].toastAvatar;
  toastName.textContent = name;
  toastScore.textContent = `+${scoreAdded}`;

  // 토스트 노출
  toast.className = ''; // Toast 노출
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.className = 'toast-hidden';
  }, 4000);
}

// 7. 화면 파티클 생성 효과 (Honeybee, Ocean, Kids 테마별 비주얼)
function spawnParticles() {
  const container = document.getElementById('particle-container');
  const particleClass = THEME_CONFIGS[currentTheme].particleClass;
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = `particle ${particleClass}`;
    
    // 시작 랜덤 위치 및 딜레이 설정
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.bottom = '0px';
    particle.style.animationDelay = `${Math.random() * 0.8}s`;
    particle.style.fontSize = `${Math.random() * 1 + 1}rem`;
    
    container.appendChild(particle);
    
    // 애니메이션 종료 시 제거
    particle.addEventListener('animationend', () => {
      particle.remove();
    });
  }
}

// 8. 신규 학생 가입 모달 제어
let targetRfidId = '';
function initRegisterModal() {
  const modal = document.getElementById('register-modal');
  const btnCancel = document.getElementById('btn-cancel-reg');
  const btnSubmit = document.getElementById('btn-submit-reg');
  const nameInput = document.getElementById('reg-student-name');

  btnCancel.addEventListener('click', () => {
    modal.className = 'modal-hidden';
    nameInput.value = '';
  });

  btnSubmit.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid_id: targetRfidId, name: name })
      });
      const resData = await response.json();
      
      if (response.ok) {
        modal.className = 'modal-hidden';
        nameInput.value = '';
        console.log('✅ 신규 학생 등록 완료:', resData);
      } else {
        alert(resData.error || '등록 실패');
      }
    } catch (err) {
      console.error('Error registering student:', err);
    }
  });
}

function showRegisterModal(rfidId) {
  targetRfidId = rfidId;
  document.getElementById('modal-rfid-id').textContent = rfidId;
  document.getElementById('register-modal').className = ''; // 모달 노출
  document.getElementById('reg-student-name').focus();
}
