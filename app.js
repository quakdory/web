const SUPABASE_URL = 'https://jetgwtyziyoihwowsupc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldGd3dHl6aXlvaWh3b3dzdXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDcxOTgsImV4cCI6MjEwNzEyMzE5OH0.-xUQ6ryxMPMr6sTvW_nCG7FtUNLX9olofS81FSVaUzM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;
let currentFilter = 'all';

let tempSelectedAgents = {
  main: [],
  sub: []
};

// 오버워치 2 선호 영웅 임시 저장 객체
let tempOwSelectedAgents = {
  main: [],
  sub: []
};

// 오버워치 2 한글 영웅명 기반 에셋 데이터
const OW_HEROES = {
  "돌격": [
    "디바", "둠피스트", "마우가", "오리사", "윈ส턴", 
    "레킹볼", "시그마", "라마트라", "라인하르트", "로드호그", "자리아"
  ],
  "공격": [
    "겐지", "캐시디", "리퍼", "솔저: 76", "솜브라", "트레이서", 
    "바스티온", "한조", "정크랫", "메이", "토르비욘", "위도우메이커", 
    "시메트라", "파라", "에코", "소전", "벤처", "애쉬", "주노"
  ],
  "지원": [
    "아나", "바티스트", "브리기테", "일리아리", "키리코", 
    "라이프위버", "루시우", "메르시", "모이라", "젠야타"
  ]
};

let VALO_AGENT_DATA = {
  '타격대': [],
  '척후대': [],
  '감시자': [],
  '전략가': []
};

const ROLE_MAPPING = {
  'Duelist': '타격대',
  'Initiator': '척후대',
  'Sentinel': '감시자',
  'Controller': '전략가'
};

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

function makeEmailFromUsername(username) {
  return `${username.trim().toLowerCase()}@myapp.local`;
}

async function fetchValorantAgents() {
  try {
    const res = await fetch('https://valorant-api.com/v1/agents?language=ko-KR&isPlayableCharacter=true');
    const json = await res.json();
    if (json.status === 200 && json.data) {
      VALO_AGENT_DATA = { '타격대': [], '척후대': [], '감시자': [], '전략가': [] };
      json.data.forEach(agent => {
        const roleName = agent.role ? ROLE_MAPPING[agent.role.displayName] || agent.role.displayName : null;
        if (roleName && VALO_AGENT_DATA[roleName]) {
          VALO_AGENT_DATA[roleName].push({ name: agent.displayName, img: agent.displayIcon });
        }
      });
      Object.keys(VALO_AGENT_DATA).forEach(role => {
        VALO_AGENT_DATA[role].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      });
    }
  } catch (err) {
    console.error('발로란트 요원 API 로딩 실패:', err);
  }
}

// =============================================================
// 로그인 / 회원가입 유틸리티 및 Supabase Auth 로직
// =============================================================

function switchAuthTab(type) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTabBtn = document.getElementById('authTabLoginBtn');
  const signupTabBtn = document.getElementById('authTabSignupBtn');

  if (type === 'login') {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    loginTabBtn.classList.add('active');
    signupTabBtn.classList.remove('active');
  } else {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    signupTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;
  const nickname = document.getElementById('signupNickname').value;
  
  const email = makeEmailFromUsername(username);

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  
  if (error) {
    alert('회원가입 실패: ' + error.message);
    return;
  }

  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert([{ id: data.user.id, nickname: nickname, is_admin: false }]);

    if (profileError) {
      console.error('프로필 생성 에러:', profileError);
    }
  }

  await supabaseClient.auth.signOut();
  alert('회원가입이 완료되었습니다! 가입하신 아이디와 비밀번호로 로그인해 주세요.');
  document.getElementById('signupForm').reset();
}

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

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

async function checkAuthState() {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("세션 가져오기 에러:", sessionError);
    return;
  }

  if (session) {
    currentUser = session.user;

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("프로필 조회 에러:", profileError);
    }

    currentProfile = profile;

    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const nicknameElem = document.getElementById('userNickname');
    const badgeElem = document.getElementById('userBadge');

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

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

supabaseClient.auth.onAuthStateChange(() => {
  checkAuthState();
});

// =============================================================
// 발로란트 선택 로직
// =============================================================
function renderTierPicker(selectedTierName = 'Unranked') {
  const container = document.getElementById('valoTierContainer');
  if (!container) return;
  container.innerHTML = '';
  document.getElementById('valoTier').value = selectedTierName;

  VALO_TIER_DATA.forEach(tier => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tier-btn ${tier.name === selectedTierName ? 'selected' : ''}`;
    btn.onclick = () => selectTier(tier.name, btn);
    btn.innerHTML = `<img src="${tier.img}" alt="${tier.label}" /><span class="tier-name">${tier.label}</span>`;
    container.appendChild(btn);
  });
}

function selectTier(tierName, btnEl) {
  document.getElementById('valoTier').value = tierName;
  const container = document.getElementById('valoTierContainer');
  container.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
}

function updateAgentSelection(type) {
  const roleSelect = document.getElementById(type === 'main' ? 'valoMainRole' : 'valoSubRole');
  const container = document.getElementById(type === 'main' ? 'valoMainAgentContainer' : 'valoSubAgentContainer');
  const selectedRole = roleSelect.value;
  const agents = VALO_AGENT_DATA[selectedRole] || [];

  container.innerHTML = '';
  tempSelectedAgents[type] = [];

  if (agents.length === 0) {
    container.innerHTML = '<p class="placeholder-info">역할군을 먼저 선택해 주세요.</p>';
    return;
  }

  agents.forEach(agent => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'agent-btn';
    btn.setAttribute('data-agent', agent.name);
    btn.onclick = () => toggleAgentSelect(type, agent.name, btn);
    btn.innerHTML = `<img src="${agent.img}" alt="${agent.name}" /><span class="agent-name">${agent.name}</span><div class="select-badge"></div>`;
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
      alert('요원은 최대 3개까지 선택할 수 있습니다.');
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
// 오버워치 2 영웅 선택 로직 (web/images/ove/[한글명].png 반영)
// =============================================================
// 오버워치 2 역할군 선택 시 경로 수정 버전
function updateOwAgentSelection(type) {
  const roleSelectId = type === 'main' ? 'owMainRole' : 'owSubRole';
  const containerId = type === 'main' ? 'owMainAgentContainer' : 'owSubAgentContainer';
  const selectedRole = document.getElementById(roleSelectId).value;
  const container = document.getElementById(containerId);

  if (!container) return;
  container.innerHTML = '';
  tempOwSelectedAgents[type] = [];

  if (!selectedRole || !OW_HEROES[selectedRole]) {
    container.innerHTML = '<span class="placeholder-text">역할군을 먼저 선택해 주세요.</span>';
    return;
  }

  OW_HEROES[selectedRole].forEach(heroName => {
    const item = document.createElement('div');
    item.className = 'agent-picker-item';
    
    // 절대 경로(/web/...) 대신 현재 문서 기준 상대 경로로 설정
    // 만약 index.html과 web 폴더가 같은 위치라면 'web/images/ove/...', 
    // index.html 자체가 이미 web 폴더 내부라면 'images/ove/...' 로 지정해야 합니다.
    const imagePath = `web/images/ove/${heroName}.png`; 

    item.innerHTML = `
      <img src="${imagePath}" alt="${heroName}" title="${heroName}" onerror="this.onerror=null; this.src='images/ove/${heroName}.png';" />
      <span class="agent-name">${heroName}</span>
    `;
    item.onclick = () => toggleOwAgent(type, heroName, item);
    container.appendChild(item);
  });
}

function toggleOwAgent(type, heroName, element) {
  const list = tempOwSelectedAgents[type];
  const index = list.indexOf(heroName);

  if (index > -1) {
    list.splice(index, 1);
  } else {
    if (list.length >= 3) {
      alert('선호 영웅은 최대 3개까지만 선택할 수 있습니다.');
      return;
    }
    list.push(heroName);
  }
  updateOwAgentBadges(type);
}

function updateOwAgentBadges(type) {
  const containerId = type === 'main' ? 'owMainAgentContainer' : 'owSubAgentContainer';
  const container = document.getElementById(containerId);
  const list = tempOwSelectedAgents[type];

  if (!container) return;

  const items = container.querySelectorAll('.agent-picker-item');
  items.forEach(item => {
    const name = item.querySelector('.agent-name').textContent;
    const badgeIdx = list.indexOf(name);
    
    const existingBadge = item.querySelector('.agent-rank-badge');
    if (existingBadge) existingBadge.remove();

    if (badgeIdx > -1) {
      item.classList.add('selected');
      const badge = document.createElement('div');
      badge.className = 'agent-rank-badge';
      badge.textContent = badgeIdx + 1;
      item.appendChild(badge);
    } else {
      item.classList.remove('selected');
    }
  });
}

// =============================================================
// 프로필 모달 열기 및 저장 로직
// =============================================================
function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function openProfileModal() {
  if (!currentUser || !currentProfile) return;

  document.getElementById('editUsername').value = currentUser.email.split('@')[0];
  document.getElementById('editNickname').value = currentProfile.nickname || '';
  document.getElementById('currentPassword').value = '';
  document.getElementById('editPassword').value = '';

  // 1. 발로란트 정보 로드
  const valo = currentProfile.valo_info || {};
  document.getElementById('valoId').value = valo.game_id || '';
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

  // 2. 오버워치 2 정보 로드
  const ow = currentProfile.ow_info || {};
  document.getElementById('owId').value = ow.game_id || '';
  document.getElementById('owTier').value = ow.tier || 'Unranked';

  if (ow.main_role) {
    document.getElementById('owMainRole').value = ow.main_role;
    updateOwAgentSelection('main');
    tempOwSelectedAgents.main = ow.main_agents || [];
    updateOwAgentBadges('main');
  } else {
    document.getElementById('owMainRole').value = "";
    updateOwAgentSelection('main');
  }

  if (ow.sub_role) {
    document.getElementById('owSubRole').value = ow.sub_role;
    updateOwAgentSelection('sub');
    tempOwSelectedAgents.sub = ow.sub_agents || [];
    updateOwAgentBadges('sub');
  } else {
    document.getElementById('owSubRole').value = "";
    updateOwAgentSelection('sub');
  }

  // 3. 롤 정보 로드
  const lol = currentProfile.lol_info || {};
  document.getElementById('lolId').value = lol.game_id || '';
  document.getElementById('lolTier').value = lol.tier || 'Unranked';
  document.getElementById('lolMainRole').value = lol.main_role || '';
  document.getElementById('lolSubRole').value = lol.sub_role || '';

  switchGameTab('valo');
  document.getElementById('profileModal')?.classList.add('active');
}

async function saveFullProfile(e) {
  e.preventDefault();

  const nickname = document.getElementById('editNickname').value;
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('editPassword').value;

  const valoId = document.getElementById('valoId').value;
  if (valoId && !valoId.includes('#')) {
    alert('발로란트 아이디는 아이디#태그 형식으로 입력해 주세요.');
    return;
  }

  if (newPassword.trim().length > 0) {
    if (!currentPassword) {
      alert('비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다.');
      return;
    }
    if (newPassword.trim().length < 6) {
      alert('새 비밀번호는 6자리 이상이어야 합니다.');
      return;
    }

    const email = currentUser.email;
    const { error: authErr } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: currentPassword
    });

    if (authErr) {
      alert('현재 비밀번호가 일치하지 않습니다.');
      return;
    }

    const { error: updateAuthErr } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (updateAuthErr) {
      alert('비밀번호 변경 실패: ' + updateAuthErr.message);
      return;
    }
  }

  const valoInfo = {
    game_id: valoId,
    tier: document.getElementById('valoTier').value,
    main_role: document.getElementById('valoMainRole').value,
    sub_role: document.getElementById('valoSubRole').value,
    main_agents: tempSelectedAgents.main,
    sub_agents: tempSelectedAgents.sub
  };

  const owInfo = {
    game_id: document.getElementById('owId').value,
    tier: document.getElementById('owTier').value,
    main_role: document.getElementById('owMainRole').value,
    sub_role: document.getElementById('owSubRole').value,
    main_agents: tempOwSelectedAgents.main,
    sub_agents: tempOwSelectedAgents.sub
  };

  const lolInfo = {
    game_id: document.getElementById('lolId').value,
    tier: document.getElementById('lolTier').value,
    main_role: document.getElementById('lolMainRole').value,
    sub_role: document.getElementById('lolSubRole').value
  };

  const { error } = await supabaseClient
    .from('profiles')
    .update({ 
      nickname: nickname,
      valo_info: valoInfo,
      ow_info: owInfo,
      lol_info: lolInfo
    })
    .eq('id', currentUser.id);

  if (error) {
    alert('프로필 저장 실패: ' + error.message);
  } else {
    alert('프로필 설정이 성공적으로 저장되었습니다!');
    closeProfileModal();
    checkAuthState();
  }
}

// =============================================================
// 기타 유틸리티 및 탭 제어 함수
// =============================================================
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-tab-btn'));
  
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');
  const targetBtn = document.getElementById('nav' + tabId.charAt(0).toUpperCase() + tabId.slice(1) + 'Btn');
  if (targetBtn) targetBtn.classList.add('active-tab-btn');

  if (tabId === 'team') showTeamSubtab('auto');
}

function showTeamSubtab(subtabId) {
  document.querySelectorAll('.team-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById(subtabId + 'View');
  if (targetView) targetView.classList.add('active');
  const targetBtn = document.getElementById('sub' + subtabId.charAt(0).toUpperCase() + subtabId.slice(1) + 'Btn');
  if (targetBtn) targetBtn.classList.add('active');

  if (subtabId === 'auto') loadScrimOptionsForTeamTab();
}

function goToMain() {
  showTab('scrim');
  filterGame('all');
}

function openModal() { document.getElementById('scrimModal')?.classList.add('active'); }
function closeModal() { document.getElementById('scrimModal')?.classList.remove('active'); document.getElementById('scrimForm')?.reset(); }

async function fetchScrims() {
  const list = document.getElementById('scrimList');
  if (!list) return;
  list.innerHTML = '<p class="placeholder-info">내전 목록을 불러오는 중...</p>';

  let query = supabaseClient.from('scrims').select(`*, scrim_participants ( user_id, profiles ( nickname, valo_info ) )`).order('created_at', { ascending: false });
  if (currentFilter !== 'all') query = query.eq('game', currentFilter);

  const { data: scrims, error } = await query;
  if (error) { list.innerHTML = '내전 로딩 오류'; return; }
  renderScrims(scrims);
}

function renderScrims(scrims) {
  const list = document.getElementById('scrimList');
  if (!list) return;
  list.innerHTML = '';

  if (!scrims || scrims.length === 0) {
    list.innerHTML = '<p class="placeholder-info">등록된 내전이 없습니다.</p>';
    return;
  }

  scrims.forEach(scrim => {
    const participants = scrim.scrim_participants || [];
    const currentCount = participants.length;
    const isFull = currentCount >= scrim.max_players;
    const isJoined = currentUser && participants.some(p => p.user_id === currentUser.id);

    const card = document.createElement('div');
    card.className = 'scrim-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="game-badge ${scrim.game}">${scrim.game.toUpperCase()}</span>
        ${(currentProfile?.is_admin || scrim.host_id === currentUser?.id) ? `<button class="btn-danger-sm" onclick="deleteScrim('${scrim.id}')">삭제</button>` : ''}
      </div>
      <h3>${scrim.title}</h3>
      <p style="margin: 6px 0; font-size: 0.9rem;">참여 인원: <strong>${currentCount}</strong> / ${scrim.max_players} 명</p>
      <div style="margin-top: 12px;">${isJoined ? `<button class="btn-secondary full-width" onclick="cancelScrim('${scrim.id}')">참가 취소</button>` : isFull ? `<button class="btn-secondary full-width" disabled>모집 마감</button>` : `<button class="btn-primary full-width" onclick="applyScrim('${scrim.id}', ${currentCount},${scrim.max_players})">참가 신청</button>`}</div>
    `;
    list.appendChild(card);
  });
}

function filterGame(gameType) {
  currentFilter = gameType;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.filter-btn[data-filter="${gameType}"]`)?.classList.add('active');
  fetchScrims();
}

async function createScrim(e) {
  e.preventDefault();
  const game = document.getElementById('scrimGame').value;
  const title = document.getElementById('scrimTitle').value;
  const max_players = parseInt(document.getElementById('scrimMax').value, 10);

  const { error } = await supabaseClient.from('scrims').insert([{ game, title, current_players: 1, max_players, status: '모집 중', host_id: currentUser.id }]);
  if (!error) { closeModal(); fetchScrims(); }
}

async function applyScrim(scrimId, currentCount, maxPlayers) {
  if (currentCount >= maxPlayers) return;
  await supabaseClient.from('scrim_participants').insert([{ scrim_id: scrimId, user_id: currentUser.id }]);
  await supabaseClient.from('scrims').update({ current_players: currentCount + 1 }).eq('id', scrimId);
  fetchScrims();
}

async function cancelScrim(scrimId) {
  await supabaseClient.from('scrim_participants').delete().eq('scrim_id', scrimId).eq('user_id', currentUser.id);
  const { data: rem } = await supabaseClient.from('scrim_participants').select('id').eq('scrim_id', scrimId);
  await supabaseClient.from('scrims').update({ current_players: rem ? rem.length : 0 }).eq('id', scrimId);
  fetchScrims();
}

async function deleteScrim(scrimId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  await supabaseClient.from('scrims').delete().eq('id', scrimId);
  fetchScrims();
}

async function loadScrimOptionsForTeamTab() {
  const selectEl = document.getElementById('teamScrimSelect');
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">내전 로딩 중...</option>';

  const { data: scrims } = await supabaseClient.from('scrims').select('id, title, game, current_players, max_players').order('created_at', { ascending: false });
  if (!scrims || scrims.length === 0) {
    selectEl.innerHTML = '<option value="">진행 중인 내전이 없습니다.</option>';
    return;
  }

  selectEl.innerHTML = '<option value="">-- 팀을 나눌 내전을 선택하세요 --</option>';
  scrims.forEach(scrim => {
    const opt = document.createElement('option');
    opt.value = scrim.id;
    opt.textContent = `[${scrim.game.toUpperCase()}] ${scrim.title} (${scrim.current_players}/${scrim.max_players}명)`;
    selectEl.appendChild(opt);
  });
}

async function generateRandomTeamsFromTab() {
  const selectEl = document.getElementById('teamScrimSelect');
  const scrimId = selectEl ? selectEl.value : null;
  if (!scrimId) { alert('내전을 먼저 선택해 주세요.'); return; }

  const { data: participants } = await supabaseClient.from('scrim_participants').select(`user_id, profiles ( nickname, valo_info )`).eq('scrim_id', scrimId);
  if (!participants || participants.length === 0) { alert('참가자가 없습니다.'); return; }

  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const half = Math.ceil(shuffled.length / 2);
  renderTeamList('teamAList', shuffled.slice(0, half));
  renderTeamList('teamBList', shuffled.slice(half));
}

function renderTeamList(elementId, teamMembers) {
  const listEl = document.getElementById(elementId);
  if (!listEl) return;
  listEl.innerHTML = '';
  teamMembers.forEach(m => {
    const p = m.profiles || {};
    const v = p.valo_info || {};
    const li = document.createElement('li');
    li.style.padding = '8px 12px';
    li.style.margin = '4px 0';
    li.style.background = 'rgba(0,0,0,0.03)';
    li.style.borderRadius = '6px';
    li.innerHTML = `<strong>${p.nickname || '알 수 없음'}</strong> <span style="font-size:0.8rem; color:#666; float:right;">[${v.tier || 'Unranked'}] ${v.main_role ? '(' + v.main_role + ')' : ''}</span>`;
    listEl.appendChild(li);
  });
}

async function createSnsPost() {
  const input = document.getElementById('snsContentInput');
  if (!input || !input.value.trim()) return;
  alert('SNS 피드 기능이 연동되었습니다.');
  input.value = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchValorantAgents();
  checkAuthState();
});

// 프로필 모달 내 게임별 서브 탭 전환 함수
function switchGameTab(gameType) {
  document.querySelectorAll('.game-profile-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.game-subtab-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById('gameView' + gameType.charAt(0).toUpperCase() + gameType.slice(1));
  const targetBtn = document.getElementById('gameTab' + gameType.charAt(0).toUpperCase() + gameType.slice(1) + 'Btn');

  if (targetView) targetView.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
}