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

// 사용자 아이디를 Supabase 인증용 가짜 이메일 포맷으로 변환
function makeEmailFromUsername(username) {
  return `${username.trim().toLowerCase()}@myapp.local`;
}

// 1. 회원가입 처리
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

  // 회원가입 성공 시 profiles 테이블에 닉네임 기본 저장
  if (data.user) {
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .upsert([{ id: data.user.id, nickname: nickname, is_admin: false }]);

    if (profileError) {
      console.error('프로필 생성 에러:', profileError);
    }
  }

  // 가입 완료 후 자동 로그인 방지 및 세션 정리
  await supabaseClient.auth.signOut();

  alert('회원가입이 완료되었습니다! 가입하신 아이디와 비밀번호로 로그인해 주세요.');
  document.getElementById('signupForm').reset();
}

// 2. 로그인 처리
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

// 3. 로그아웃 처리
async function handleLogout() {
  await supabaseClient.auth.signOut();
}

// 4. 세션 및 권한(관리자/일반유저) 상태 검사
async function checkAuthState() {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError) {
    console.error("세션 가져오기 에러:", sessionError);
    return;
  }

  if (session) {
    currentUser = session.user;

    // 프로필 정보 가져오기
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profileError) {
      console.error("프로필 조회 에러:", profileError);
    }

    currentProfile = profile;

    // 화면 전환 (로그인 창 숨기고 메인 화면 표시)
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const nicknameElem = document.getElementById('userNickname');
    const badgeElem = document.getElementById('userBadge');

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    const displayNickname = profile?.nickname || currentUser.email.split('@')[0];
    if (nicknameElem) nicknameElem.textContent = displayNickname;

    // 관리자 배지 설정
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

// 인증 상태 변화 감지 리스너
supabaseClient.auth.onAuthStateChange(() => {
  checkAuthState();
});

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

function openProfileModal() {
  if (!currentUser || !currentProfile) return;
  document.getElementById('editUsername').value = currentUser.email.split('@')[0];
  document.getElementById('editNickname').value = currentProfile.nickname || '';

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
    alert('발로란트 아이디는 아이디#태그 형식으로 입력해 주세요.');
    return;
  }

  const valoInfo = {
    game_id: valoId,
    tier: document.getElementById('valoTier').value,
    main_role: document.getElementById('valoMainRole').value,
    sub_role: document.getElementById('valoSubRole').value,
    main_agents: tempSelectedAgents.main,
    sub_agents: tempSelectedAgents.sub
  };

  if (newPassword.trim().length >= 6) {
    await supabaseClient.auth.updateUser({ password: newPassword });
  }

  const { error } = await supabaseClient.from('profiles').update({ nickname, valo_info: valoInfo }).eq('id', currentUser.id);
  if (error) {
    alert('프로필 저장 실패: ' + error.message);
  } else {
    alert('프로필이 성공적으로 저장되었습니다!');
    closeProfileModal();
    checkAuthState();
  }
}

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