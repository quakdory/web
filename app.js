// =============================================================
// 1. Supabase 초기화 및 전역 변수
// =============================================================
const SUPABASE_URL = 'https://jetgwtyziyoihwowsupc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldGd3dHl6aXlvaWh3b3dzdXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDcxOTgsImV4cCI6MjEwNzEyMzE5OH0.-xUQ6ryxMPMr6sTvW_nCG7FtUNLX9olofS81FSVaUzM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;
let currentFilter = 'all';

// 발로란트 선택 요원 임시 저장 변수 (주/부 역할군별 최대 3개)
let tempSelectedAgents = {
  main: [],
  sub: []
};

// 라이엇 API로부터 실시간 채워질 발로란트 요원 데이터 객체
let VALO_AGENT_DATA = {
  '타격대': [],
  '척후대': [],
  '감시자': [],
  '전략가': []
};

// 라이엇 API 영문 역할군 -> 한글 역할군 매핑 테이블
const ROLE_MAPPING = {
  'Duelist': '타격대',
  'Initiator': '척후대',
  'Sentinel': '감시자',
  'Controller': '전략가'
};

// 발로란트 티어 데이터 및 공식 아이콘 URL
const VALO_TIER_DATA = [
  { name: 'Unranked', label: '언랭크', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png' },
  { name: 'Iron', label: '아이언', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/3/smallicon.png' },
  { name: 'Bronze', label: '브론즈', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/6/smallicon.png' },
  { name: 'Silver', label: '실버', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/9/smallicon.png' },
  { name: 'Gold', label: '골드', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/12/smallicon.png' },
  { name: 'Platinum', label: '플래티넘', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/15/smallicon.png' },
  { name: 'Diamond', label: '다이아', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/18/smallicon.png' },
  { name: 'Ascendant', label: '초월자', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/smallicon.png' },
  { name: 'Immortal', label: '불멸', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/smallicon.png' },
  { name: 'Radiant', label: '레디언트', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png' }
];

// 아이디를 가짜 이메일 형식으로 변환하는 도우미 함수
function makeEmailFromUsername(username) {
  return `${username.trim().toLowerCase()}@myapp.local`;
}

// 라이엇 공식 API에서 실시간 발로란트 요원 목록 및 최신 초상화 로딩
async function fetchValorantAgents() {
  try {
    const res = await fetch('https://valorant-api.com/v1/agents?language=ko-KR&isPlayableCharacter=true');
    const json = await res.json();

    if (json.status === 200 && json.data) {
      VALO_AGENT_DATA = { '타격대': [], '척후대': [], '감시자': [], '전략가': [] };

      json.data.forEach(agent => {
        const roleName = agent.role ? ROLE_MAPPING[agent.role.displayName] || agent.role.displayName : null;

        if (roleName && VALO_AGENT_DATA[roleName]) {
          VALO_AGENT_DATA[roleName].push({
            name: agent.displayName,
            img: agent.displayIcon
          });
        }
      });

      // 가나다순 정렬
      Object.keys(VALO_AGENT_DATA).forEach(role => {
        VALO_AGENT_DATA[role].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      });
    }
  } catch (err) {
    console.error('발로란트 요원 API 로딩 실패:', err);
  }
}

// =============================================================
// 2. 인증 (Auth) 및 세션 관리
// =============================================================

// 회원가입 처리 (아이디 방식 + 자동 로그인 방지)
async function handleSignUp(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;
  const nickname = document.getElementById('signupNickname').value;

  const email = makeEmailFromUsername(username);

  // 1) Supabase Auth 계정 생성
  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  if (error) {
    alert('회원가입 실패: ' + error.message);
    return;
  }

  // 2) profiles 테이블에 프로필 저장 (upsert 사용으로 중복 키 에러 방지)
  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert([{ id: data.user.id, nickname: nickname, is_admin: false }]);

    if (profileError) {
      console.error('프로필 생성 에러:', profileError);
    }
  }

  // 3) 회원가입 직후 세션을 종료하여 로그인 화면 유지
  await supabaseClient.auth.signOut();

  alert('회원가입이 완료되었습니다! 생성한 아이디와 비밀번호로 로그인해 주세요.');
  document.getElementById('signupForm').reset();
}

// 로그인 처리
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const email = makeEmailFromUsername(username);

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert('로그인 실패: 아이디 또는 비밀번호를 확인해 주세요.');
    console.error('로그인 에러:', error);
  } else {
    await checkAuthState();
  }
}

// 로그아웃 처리
async function handleLogout() {
  await supabaseClient.auth.signOut();
}

// 유저 로그인 상태 및 프로필 확인
async function checkAuthState() {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("세션 가져오기 에러:", sessionError);
    return;
  }

  if (session) {
    currentUser = session.user;

    // profiles 테이블 조회
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("프로필 조회 에러:", profileError);
    }

    currentProfile = profile;

    // UI 컨테이너 제어
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const nicknameElem = document.getElementById('userNickname');
    const badgeElem = document.getElementById('userBadge');

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    // 닉네임 및 권한 배지 반영
    const displayNickname = profile?.nickname || currentUser.email.split('@')[0];
    if (nicknameElem) nicknameElem.textContent = displayNickname;

    if (badgeElem) {
      if (profile?.is_admin) {
        badgeElem.textContent = '👑 관리자';
        badgeElem.classList.add('admin');
      } else {
        badgeElem.textContent = '일반유저';
        badgeElem.classList.remove('admin');
      }
    }

    fetchScrims();
  } else {
    currentUser = null;
    currentProfile = null;
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');

    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
}

// 인증 상태 실시간 감지
supabaseClient.auth.onAuthStateChange(() => {
  checkAuthState();
});

// =============================================================
// 3. 발로란트 요원 및 티어 이미지 선택기 제어
// =============================================================

// 티어 선택 UI 동적 생성 함수
function renderTierPicker(selectedTierName = 'Unranked') {
  const container = document.getElementById('valoTierContainer');
  if (!container) return;

  container.innerHTML = '';
  document.getElementById('valoTier').value = selectedTierName;

  VALO_TIER_DATA.forEach(tier => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tier-btn ${tier.name === selectedTierName ? 'selected' : ''}`;
    btn.setAttribute('data-tier', tier.name);
    btn.onclick = () => selectTier(tier.name, btn);

    btn.innerHTML = `
      <img src="${tier.img}" alt="${tier.label}" title="${tier.label}" />
      <span class="tier-name">${tier.label}</span>
    `;
    container.appendChild(btn);
  });
}

// 티어 버튼 클릭 처리 함수
function selectTier(tierName, btnEl) {
  document.getElementById('valoTier').value = tierName;

  const container = document.getElementById('valoTierContainer');
  container.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('selected'));
  btnEl.classList.add('selected');
}

// 요원 선택기 생성 함수
function updateAgentSelection(type) {
  const roleSelect = document.getElementById(type === 'main' ? 'valoMainRole' : 'valoSubRole');
  const container = document.getElementById(type === 'main' ? 'valoMainAgentContainer' : 'valoSubAgentContainer');
  const selectedRole = roleSelect.value;
  const agents = VALO_AGENT_DATA[selectedRole] || [];

  container.innerHTML = '';
  tempSelectedAgents[type] = [];

  if (agents.length === 0) {
    container.innerHTML = '<p class="placeholder-text">역할군을 먼저 선택해 주세요.</p>';
    return;
  }

  agents.forEach(agent => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'agent-btn';
    btn.setAttribute('data-agent', agent.name);
    btn.onclick = () => toggleAgentSelect(type, agent.name, btn);

    btn.innerHTML = `
      <img src="${agent.img}" alt="${agent.name}" title="${agent.name}" onerror="this.style.display='none';" />
      <span class="agent-name">${agent.name}</span>
      <div class="select-badge"></div>
    `;
    container.appendChild(btn);
  });
}

function toggleAgentSelect(type, agentName, btnEl) {
  let selected = tempSelectedAgents[type];
  const index = selected.indexOf(agentName);

  if (index > -1) {
    selected.splice(index, 1);
  } else {
    if (selected.length >= 3) {
      alert('요원은 최대 3명까지 선택할 수 있습니다.');
      return;
    }
    selected.push(agentName);
  }

  updateAgentBadges(type);
}

function updateAgentBadges(type) {
  const container = document.getElementById(type === 'main' ? 'valoMainAgentContainer' : 'valoSubAgentContainer');
  const selected = tempSelectedAgents[type];

  container.querySelectorAll('.agent-btn').forEach(btn => {
    btn.classList.remove('selected');
    btn.querySelector('.select-badge').textContent = '';
  });

  selected.forEach((agentName, index) => {
    const btn = container.querySelector(`.agent-btn[data-agent="${agentName}"]`);
    if (btn) {
      btn.classList.add('selected');
      btn.querySelector('.select-badge').textContent = index + 1;
    }
  });
}

// =============================================================
// 4. 프로필 설정 모달 및 통합 저장
// =============================================================

function openProfileModal() {
  if (!currentUser || !currentProfile) return;

  document.getElementById('editUsername').value = currentUser.email.split('@')[0];
  document.getElementById('editNickname').value = currentProfile.nickname || '';

  const valo = currentProfile.valo_info || {};
  document.getElementById('valoId').value = valo.game_id || '';

  // 티어 이미지 선택기 렌더링
  renderTierPicker(valo.tier || 'Unranked');

  if (valo.main_role) {
    document.getElementById('valoMainRole').value = valo.main_role;
    updateAgentSelection('main');
    tempSelectedAgents.main = valo.main_agents || [];
    updateAgentBadges('main');
  } else {
    document.getElementById('valoMainRole').value = "";
    updateAgentSelection('main');
  }

  if (valo.sub_role) {
    document.getElementById('valoSubRole').value = valo.sub_role;
    updateAgentSelection('sub');
    tempSelectedAgents.sub = valo.sub_agents || [];
    updateAgentBadges('sub');
  } else {
    document.getElementById('valoSubRole').value = "";
    updateAgentSelection('sub');
  }

  document.getElementById('profileModal')?.classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profileModal')?.classList.remove('active');
}

async function saveFullProfile(e) {
  e.preventDefault();

  const nickname = document.getElementById('editNickname').value;
  const newPassword = document.getElementById('editPassword').value;

  const valoId = document.getElementById('valoId').value;
  if (valoId && !valoId.includes('#')) {
    alert('발로란트 아이디는 아이디#태그 (예: HIDE#KR1) 형식으로 입력해 주세요.');
    return;
  }

  const valoMainRole = document.getElementById('valoMainRole').value;
  const valoMainAgents = tempSelectedAgents.main;

  if (valoMainRole && valoMainAgents.length === 0) {
    alert('주 역할군의 선호 요원을 최소 1명(1번) 선택해 주세요.');
    return;
  }

  const valoInfo = {
    game_id: valoId,
    tier: document.getElementById('valoTier').value,
    main_role: valoMainRole,
    sub_role: document.getElementById('valoSubRole').value,
    main_agents: valoMainAgents,
    sub_agents: tempSelectedAgents.sub
  };

  if (newPassword.trim().length >= 6) {
    const { error: pwdError } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (pwdError) {
      alert('비밀번호 변경 실패: ' + pwdError.message);
      return;
    }
  }

  const { error } = await supabaseClient
    .from('profiles')
    .update({ 
      nickname: nickname,
      valo_info: valoInfo
    })
    .eq('id', currentUser.id);

  if (error) {
    alert('프로필 저장 실패: ' + error.message);
  } else {
    alert('프로필 및 게임 설정이 성공적으로 저장되었습니다!');
    closeProfileModal();
    checkAuthState();
  }
}

// =============================================================
// 5. UI / 네비게이션 / 내전(Scrim) 관리
// =============================================================

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
}

function showTeamSubtab(subtabId) {
  document.querySelectorAll('.team-view').forEach(view => view.classList.remove('active'));
  document.getElementById(subtabId + 'View')?.classList.add('active');
}

function goToMain() {
  showTab('scrim');
  filterGame('all');
}

function openModal() {
  document.getElementById('scrimModal')?.classList.add('active');
}

function closeModal() {
  document.getElementById('scrimModal')?.classList.remove('active');
  document.getElementById('scrimForm')?.reset();
}

// 내전 목록 및 참가자(scrim_participants) 조인 조회
async function fetchScrims() {
  const list = document.getElementById('scrimList');
  if (!list) return;
  list.innerHTML = '<p class="placeholder-text">내전 목록을 불러오는 중...</p>';

  let query = supabaseClient
    .from('scrims')
    .select(`
      *,
      scrim_participants (
        user_id,
        profiles ( nickname )
      )
    `)
    .order('created_at', { ascending: false });

  if (currentFilter !== 'all') {
    query = query.eq('game', currentFilter);
  }

  const { data: scrims, error } = await query;

  if (error) {
    list.innerHTML = `<p style="color:red">내전 로딩 오류: ${error.message}</p>`;
    return;
  }

  renderScrims(scrims);
}

// 내전 카드 UI 렌더링 및 참가 상태 감지
function renderScrims(scrims) {
  const list = document.getElementById('scrimList');
  if (!list) return;
  list.innerHTML = '';

  if (!scrims || scrims.length === 0) {
    list.innerHTML = '<p class="placeholder-text">등록된 내전이 없습니다.</p>';
    return;
  }

  scrims.forEach(scrim => {
    const participants = scrim.scrim_participants || [];
    const currentCount = participants.length;
    const isFull = currentCount >= scrim.max_players;
    
    // 현재 유저의 참가 여부 확인
    const isJoined = currentUser && participants.some(p => p.user_id === currentUser.id);

    // 참가자 닉네임 목록 가공
    const participantNames = participants.map(p => p.profiles?.nickname || '알 수 없음').join(', ');

    const card = document.createElement('div');
    card.className = 'scrim-card';
    card.setAttribute('data-game', scrim.game);

    // 버튼 제어 (참가 취소 / 마감 / 참가 신청)
    let actionBtnHtml = '';
    if (isJoined) {
      actionBtnHtml = `<button class="btn-secondary btn-sm" onclick="cancelScrim('${scrim.id}')">참가 취소</button>`;
    } else if (isFull) {
      actionBtnHtml = `<button class="btn-secondary btn-sm" disabled>모집 마감</button>`;
    } else {
      actionBtnHtml = `<button class="btn-primary btn-sm" onclick="applyScrim('${scrim.id}', ${currentCount}, ${scrim.max_players})">참가 신청</button>`;
    }

    const deleteBtnHtml = (currentProfile?.is_admin || (currentUser && scrim.host_id === currentUser.id)) 
      ? `<button class="btn-danger btn-sm" onclick="deleteScrim('${scrim.id}')">삭제</button>` 
      : '';

    card.innerHTML = `
      <div class="scrim-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="game-badge ${scrim.game}">${scrim.game.toUpperCase()}</span>
        <div>${deleteBtnHtml}</div>
      </div>
      <h3>${scrim.title}</h3>
      <p style="margin: 8px 0; font-size: 0.9rem;">
        <strong>참여 인원:</strong> ${currentCount} / ${scrim.max_players} 명
      </p>
      <p style="margin-bottom: 12px; font-size: 0.85rem; color: #666;" title="${participantNames}">
        <strong>참가자:</strong> ${participantNames || '없음'}
      </p>
      <div>
        ${actionBtnHtml}
      </div>
    `;

    list.appendChild(card);
  });
}

function filterGame(gameType) {
  currentFilter = gameType;
  fetchScrims();
}

async function createScrim(event) {
  event.preventDefault();
  const game = document.getElementById('scrimGame').value;
  const title = document.getElementById('scrimTitle').value;
  const max_players = parseInt(document.getElementById('scrimMax').value, 10);

  const { error } = await supabaseClient.from('scrims').insert([
    { game, title, current_players: 1, max_players, status: '모집 중', host_id: currentUser.id }
  ]);

  if (error) {
    alert('내전 생성 실패: ' + error.message);
  } else {
    alert('새 내전이 등록되었습니다!');
    closeModal();
    fetchScrims();
  }
}

// 내전 참가 신청 처리
async function applyScrim(scrimId, currentCount, maxPlayers) {
  if (!currentUser) {
    alert('로그인이 필요한 서비스입니다.');
    return;
  }

  if (currentCount >= maxPlayers) {
    alert('이미 정원이 가득 찬 내전입니다.');
    return;
  }

  const { error: partError } = await supabaseClient
    .from('scrim_participants')
    .insert([{ scrim_id: scrimId, user_id: currentUser.id }]);

  if (partError) {
    alert('참가 신청 실패: ' + partError.message);
    return;
  }

  const newCount = currentCount + 1;
  const newStatus = newCount >= maxPlayers ? '마감' : '모집 중';

  await supabaseClient
    .from('scrims')
    .update({ current_players: newCount, status: newStatus })
    .eq('id', scrimId);

  alert('내전 참가 신청이 완료되었습니다!');
  fetchScrims();
}

// 내전 참가 취소 처리
async function cancelScrim(scrimId) {
  if (!currentUser) return;

  if (!confirm('정말 내전 참가를 취소하시겠습니까?')) return;

  const { error: delError } = await supabaseClient
    .from('scrim_participants')
    .delete()
    .eq('scrim_id', scrimId)
    .eq('user_id', currentUser.id);

  if (delError) {
    alert('참가 취소 실패: ' + delError.message);
    return;
  }

  const { data: remaining } = await supabaseClient
    .from('scrim_participants')
    .select('id')
    .eq('scrim_id', scrimId);

  const newCount = remaining ? remaining.length : 0;

  await supabaseClient
    .from('scrims')
    .update({ current_players: newCount, status: '모집 중' })
    .eq('id', scrimId);

  alert('참가가 취소되었습니다.');
  fetchScrims();
}

async function deleteScrim(scrimId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  const { error } = await supabaseClient.from('scrims').delete().eq('id', scrimId);
  if (error) {
    alert('삭제 실패: ' + error.message);
  } else {
    alert('삭제되었습니다.');
    fetchScrims();
  }
}

// 문서 로드 완료 시 API 로딩 및 초기 세션 검사
document.addEventListener('DOMContentLoaded', async () => {
  await fetchValorantAgents();
  checkAuthState();
});