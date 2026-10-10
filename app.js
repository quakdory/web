// =============================================================
// 1. Supabase 초기화 및 전역 변수
// =============================================================
const SUPABASE_URL = 'https://jetgwtyziyoihwowsupc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldGd3dHl6aXlvaWh3b3dzdXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDcxOTgsImV4cCI6MjEwNzEyMzE5OH0.-xUQ6ryxMPMr6sTvW_nCG7FtUNLX9olofS81FSVaUzM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;
let currentFilter = 'all';
let currentActiveScrimId = null;

let tempSelectedAgents = { main: [], sub: [] };
let VALO_AGENT_DATA = { '타격대': [], '척후대': [], '감시자': [], '전략가': [] };

const ROLE_MAPPING = {
  'Duelist': '타격대',
  'Initiator': '척후대',
  'Sentinel': '감시자',
  'Controller': '전략가'
};

const VALO_TIER_DATA = [
  { name: '언랭크', label: '언랭크', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png' },
  { name: '아이언', label: '아이언', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/3/smallicon.png' },
  { name: '브론즈', label: '브론즈', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/6/smallicon.png' },
  { name: '실버', label: '실버', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/9/smallicon.png' },
  { name: '골드', label: '골드', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/12/smallicon.png' },
  { name: '플래티넘', label: '플래티넘', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/15/smallicon.png' },
  { name: '다이아몬드', label: '다이아', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/18/smallicon.png' },
  { name: '초월자', label: '초월자', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/21/smallicon.png' },
  { name: '불멸', label: '불멸', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/smallicon.png' },
  { name: 'Radiant', label: '레디언트', img: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png' }
];

const OW_TIER_DATA = [
  { name: "언랭크", value: "Unranked", icon: "images/tiers/언랭크.png" },
  { name: "브론즈", value: "Bronze", icon: "images/tiers/브론즈.png" },
  { name: "실버", value: "Silver", icon: "images/tiers/실버.png" },
  { name: "골드", value: "Gold", icon: "images/tiers/골드.png" },
  { name: "플래티넘", value: "Platinum", icon: "images/tiers/플래티넘.png" },
  { name: "에메랄드", value: "Emerald", icon: "images/tiers/에메랄드.png" },
  { name: "다이아몬드", value: "Diamond", icon: "images/tiers/다이아몬드.png" },
  { name: "마스터", value: "Master", icon: "images/tiers/마스터.png" },
  { name: "그랜드마스터", value: "Grandmaster", icon: "images/tiers/그랜드마스터.png" },
  { name: "챔피언", value: "Champion", icon: "images/tiers/챔피언.png" }
];

let owSelectedHeroes = { main: [], sub: [] };

// 발로란트/오버워치 한글 티어 매핑 헬퍼 함수
function getKoreanTierLabel(tierKey) {
  if (!tierKey) return '언랭크';
  const valoFound = VALO_TIER_DATA.find(t => t.name.toLowerCase() === tierKey.toLowerCase() || t.label === tierKey);
  if (valoFound) return valoFound.label;
  const owFound = OW_TIER_DATA.find(t => t.value.toLowerCase() === tierKey.toLowerCase() || t.name === tierKey);
  if (owFound) return owFound.name;
  return tierKey;
}

// 요원/영웅 이미지 찾기 헬퍼 함수
function getAgentOrHeroImg(name) {
  if (!name) return '';
  for (const role in VALO_AGENT_DATA) {
    const found = VALO_AGENT_DATA[role].find(a => a.name === name);
    if (found) return found.img;
  }
  for (const role in OW_HERO_DATA) {
    const found = OW_HERO_DATA[role].find(h => h.name === name);
    if (found) return found.img;
  }
  return '';
}

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
// 2. 인증 및 세션 관리
// =============================================================
async function handleSignUp(e) {
  e.preventDefault();
  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;
  const nickname = document.getElementById('signupNickname').value;
  const email = makeEmailFromUsername(username);

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) { alert('회원가입 실패: ' + error.message); return; }

  if (data.user) {
    await supabaseClient.from('profiles').upsert([{ id: data.user.id, nickname: nickname, is_admin: false }]);
  }
  await supabaseClient.auth.signOut();
  alert('회원가입이 완료되었습니다! 로그인해 주세요.');
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
  } else {
    await checkAuthState();
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

async function checkAuthState() {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');

  if (error) { console.error(error); return; }

  if (session && session.user) {
    currentUser = session.user;
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
    currentProfile = profile;

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    const nicknameElem = document.getElementById('userNickname');
    const badgeElem = document.getElementById('userBadge');
    if (nicknameElem) nicknameElem.textContent = profile?.nickname || currentUser.email.split('@')[0];

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
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
}

supabaseClient.auth.onAuthStateChange(() => { checkAuthState(); });

// =============================================================
// 3. 발로란트 / 오버워치 피커 제어
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
  document.getElementById('valoTierContainer').querySelectorAll('.tier-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
}

function renderOWTierPicker(selectedTierValue = 'Unranked') {
  const container = document.getElementById('owTierContainer');
  if (!container) return;
  container.innerHTML = '';
  document.getElementById('owTier').value = selectedTierValue;

  OW_TIER_DATA.forEach(tier => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tier-btn ${tier.value === selectedTierValue ? 'selected' : ''}`;
    btn.onclick = () => selectOWTier(tier.value, btn);
    btn.innerHTML = `
      <div style="width: 36px; height: 36px; display: flex; justify-content: center; align-items: center; margin-bottom: 4px;">
        <img src="${tier.icon}" alt="${tier.name}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <span style="display: none; font-size: 11px; font-weight: 800; color: var(--accent-purple);">${tier.name.substring(0, 2)}</span>
      </div>
      <span class="tier-name">${tier.name}</span>
    `;
    container.appendChild(btn);
  });
}

function selectOWTier(tierValue, btnEl) {
  document.getElementById('owTier').value = tierValue;
  document.getElementById('owTierContainer').querySelectorAll('.tier-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
}

const OW_HERO_DATA = {
  "돌격": [
    { name: "D.Va", img: "images/heroes/디바.png" }, { name: "디몬", img: "images/heroes/디몬.png" },
    { name: "도미나", img: "images/heroes/도미나.png" }, { name: "해저드", img: "images/heroes/해저드.png" },
    { name: "둠피스트", img: "images/heroes/둠피스트.png" }, { name: "마우가", img: "images/heroes/마우가.png" },
    { name: "시그마", img: "images/heroes/시그마.png" }, { name: "윈스턴", img: "images/heroes/윈스턴.png" },
    { name: "라인하르트", img: "images/heroes/라인하르트.png" }, { name: "로드호그", img: "images/heroes/로드호그.png" },
    { name: "자리야", img: "images/heroes/자리야.png" }, { name: "오리사", img: "images/heroes/오리사.png" },
    { name: "레킹볼", img: "images/heroes/레킹볼.png" }, { name: "정커퀸", img: "images/heroes/정커퀸.png" },
    { name: "라마트라", img: "images/heroes/라마트라.png" }
  ],
  "공격": [
    { name: "겐지", img: "images/heroes/겐지.png" }, { name: "캐서디", img: "images/heroes/캐서디.png" },
    { name: "리퍼", img: "images/heroes/리퍼.png" }, { name: "솔저: 76", img: "images/heroes/솔저.png" },
    { name: "트레이서", img: "images/heroes/트레이서.png" }, { name: "메이", img: "images/heroes/메이.png" },
    { name: "바스티온", img: "images/heroes/바스티온.png" }, { name: "한조", img: "images/heroes/한조.png" },
    { name: "토르비욘", img: "images/heroes/토르비욘.png" }, { name: "위도우메이커", img: "images/heroes/위도우메이커.png" },
    { name: "정크랫", img: "images/heroes/정크랫.png" }, { name: "파라", img: "images/heroes/파라.png" },
    { name: "시메트라", img: "images/heroes/시메트라.png" }, { name: "애쉬", img: "images/heroes/애쉬.png" },
    { name: "에코", img: "images/heroes/에코.png" }, { name: "소전", img: "images/heroes/소전.png" },
    { name: "벤처", img: "images/heroes/벤처.png" }, { name: "시온", img: "images/heroes/시온.png" },
    { name: "시에라", img: "images/heroes/시에라.png" }, { name: "엠레", img: "images/heroes/엠레.png" },
    { name: "벤데타", img: "images/heroes/벤데타.png" }, { name: "안란", img: "images/heroes/안란.png" },
    { name: "프레야", img: "images/heroes/프레야.png" }
  ],
  "지원": [
    { name: "독트린", img: "images/heroes/독트린.png" }, { name: "우양", img: "images/heroes/우양.png" },
    { name: "솜브라", img: "images/heroes/솜브라.png" }, { name: "메르시", img: "images/heroes/메르시.png" },
    { name: "루시우", img: "images/heroes/루시우.png" }, { name: "아나", img: "images/heroes/아나.png" },
    { name: "젠야타", img: "images/heroes/젠야타.png" }, { name: "바티스트", img: "images/heroes/바티스트.png" },
    { name: "모이라", img: "images/heroes/모이라.png" }, { name: "브리기테", img: "images/heroes/브리기테.png" },
    { name: "키리코", img: "images/heroes/키리코.png" }, { name: "일리아리", img: "images/heroes/일리아리.png" },
    { name: "라이프위버", img: "images/heroes/라이프위버.png" }, { name: "주노", img: "images/heroes/주노.png" },
    { name: "제트팩캣", img: "images/heroes/제트팩캣.png" }, { name: "미즈키", img: "images/heroes/미즈키.png" }
  ]
};

function updateAgentSelection(type) {
  const roleSelect = document.getElementById(type === 'main' ? 'valoMainRole' : 'valoSubRole');
  const container = document.getElementById(type === 'main' ? 'valoMainAgentContainer' : 'valoSubAgentContainer');
  const agents = VALO_AGENT_DATA[roleSelect.value] || [];
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
    if (selected.length >= 3) { alert('최대 3개까지 선택할 수 있습니다.'); return; }
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
  selected.forEach((name, idx) => {
    const btn = container.querySelector(`.agent-btn[data-agent="${name}"]`);
    if (btn) {
      btn.classList.add('selected');
      btn.querySelector('.select-badge').textContent = idx + 1;
    }
  });
}

function updateOWHeroSelection(type) {
  const roleSelect = document.getElementById(type === 'main' ? 'owMainRole' : 'owSubRole');
  const container = document.getElementById(type === 'main' ? 'owMainHeroContainer' : 'owSubHeroContainer');
  const heroes = OW_HERO_DATA[roleSelect.value] || [];
  container.innerHTML = '';
  owSelectedHeroes[type] = [];

  if (heroes.length === 0) {
    container.innerHTML = '<p class="placeholder-text" style="font-size: 0.85rem; color: var(--text-muted); grid-column: span 4;">역할군을 먼저 선택해 주세요.</p>';
    return;
  }

  heroes.forEach(hero => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'agent-btn';
    btn.setAttribute('data-hero', hero.name);
    btn.onclick = () => toggleOWHeroSelect(type, hero.name, btn);
    btn.innerHTML = `
      <div style="width: 100%; aspect-ratio: 1/1; background: var(--bg-element); border-radius: 6px; overflow: hidden; display: flex; justify-content: center; align-items: center; border: 1px solid var(--border-color);">
        <img src="${hero.img}" alt="${hero.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div style="display:none; width:100%; height:100%; justify-content:center; align-items:center; font-weight:900; font-size:0.8rem; color:var(--accent-purple);">${hero.name.substring(0, 2)}</div>
      </div>
      <span class="agent-name" style="margin-top: 6px; font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${hero.name}</span>
      <div class="select-badge"></div>
    `;
    container.appendChild(btn);
  });
}

function toggleOWHeroSelect(type, heroName, btnEl) {
  let list = owSelectedHeroes[type];
  const index = list.indexOf(heroName);
  if (index > -1) {
    list.splice(index, 1);
  } else {
    if (list.length >= 3) { alert('최대 3개까지 선택할 수 있습니다.'); return; }
    list.push(heroName);
  }
  updateOWHeroBadges(type);
}

function updateOWHeroBadges(type) {
  const container = document.getElementById(type === 'main' ? 'owMainHeroContainer' : 'owSubHeroContainer');
  const selected = owSelectedHeroes[type];
  container.querySelectorAll('.agent-btn').forEach(btn => {
    btn.classList.remove('selected');
    btn.querySelector('.select-badge').textContent = '';
  });
  selected.forEach((name, idx) => {
    const btn = container.querySelector(`.agent-btn[data-hero="${name}"]`);
    if (btn) {
      btn.classList.add('selected');
      btn.querySelector('.select-badge').textContent = idx + 1;
    }
  });
}

// =============================================================
// 4. 프로필 및 설정 관리
// =============================================================
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

  const ow = currentProfile.ow_info || {};
  const owIdInput = document.getElementById('owId');
  if (owIdInput) owIdInput.value = ow.game_id || '';
  renderOWTierPicker(ow.tier || 'Unranked');

  if (ow.main_role) {
    document.getElementById('owMainRole').value = ow.main_role;
    updateOWHeroSelection('main');
    owSelectedHeroes.main = ow.main_heroes || [];
    updateOWHeroBadges('main');
  } else {
    document.getElementById('owMainRole').value = "";
    document.getElementById('owMainHeroContainer').innerHTML = '<p class="placeholder-text" style="font-size: 0.85rem; color: var(--text-muted); grid-column: span 4;">역할군을 먼저 선택해 주세요.</p>';
  }

  if (ow.sub_role) {
    document.getElementById('owSubRole').value = ow.sub_role;
    updateOWHeroSelection('sub');
    owSelectedHeroes.sub = ow.sub_heroes || [];
    updateOWHeroBadges('sub');
  } else {
    document.getElementById('owSubRole').value = "";
    document.getElementById('owSubHeroContainer').innerHTML = '<p class="placeholder-text" style="font-size: 0.85rem; color: var(--text-muted); grid-column: span 4;">역할군을 먼저 선택해 주세요.</p>';
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
  if (valoId && !valoId.includes('#')) { alert('발로란트 아이디는 아이디#태그 형식으로 입력해 주세요.'); return; }

  const valoInfo = {
    game_id: valoId,
    tier: document.getElementById('valoTier').value,
    main_role: document.getElementById('valoMainRole').value,
    sub_role: document.getElementById('valoSubRole').value,
    main_agents: tempSelectedAgents.main,
    sub_agents: tempSelectedAgents.sub
  };

  const owId = document.getElementById('owId') ? document.getElementById('owId').value : '';
  if (owId && !owId.includes('#')) { alert('오버워치 배틀태그는 아이디#태그 형식으로 입력해 주세요.'); return; }

  const owInfo = {
    game_id: owId,
    tier: document.getElementById('owTier').value,
    main_role: document.getElementById('owMainRole').value,
    sub_role: document.getElementById('owSubRole').value,
    main_heroes: owSelectedHeroes.main,
    sub_heroes: owSelectedHeroes.sub
  };

  if (newPassword.trim().length >= 6) {
    const { error: pwdError } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (pwdError) { alert('비밀번호 변경 실패: ' + pwdError.message); return; }
  }

  const { error } = await supabaseClient.from('profiles').update({ 
    nickname: nickname, valo_info: valoInfo, ow_info: owInfo 
  }).eq('id', currentUser.id);

  if (error) {
    alert('프로필 저장 실패: ' + error.message);
  } else {
    alert('프로필이 성공적으로 저장되었습니다!');
    closeProfileModal();
    checkAuthState();
  }
}

function switchGameProfileTab(gameCode) {
  document.querySelectorAll('.game-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.game-panel').forEach(panel => panel.classList.remove('active'));

  const targetPanel = document.getElementById(`${gameCode}ProfilePanel`);
  const targetBtn = Array.from(document.querySelectorAll('.game-tab-btn')).find(btn => btn.getAttribute('onclick')?.includes(`'${gameCode}'`));

  if (targetPanel) targetPanel.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
}

// =============================================================
// 5. 테마, 내전 및 팀 구성 관리
// =============================================================
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem('theme');
  const btn = document.getElementById('themeToggleBtn');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (btn) btn.textContent = '☀️';
  } else {
    document.body.classList.remove('dark-mode');
    if (btn) btn.textContent = '🌙';
  }
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  const targetTab = document.getElementById(tabId) || document.getElementById(tabId + 'Tab');
  if (targetTab) targetTab.classList.add('active');
  if (tabId === 'team' || tabId === 'teamTab') showTeamSubtab('auto');
}

function showTeamSubtab(subtabId) {
  document.querySelectorAll('.team-view').forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(subtabId + 'View');
  if (targetView) targetView.classList.add('active');
  
  if (subtabId === 'auto') {
    loadScrimOptionsForTeamTab();
  } else if (subtabId === 'draft') {
    loadDraftScrimOptions(); 
  }
}

function goToMain() {
  showTab('scrim');
  filterGame('all');
}

function openModal() { document.getElementById('scrimModal')?.classList.add('active'); }
function closeModal() {
  document.getElementById('scrimModal')?.classList.remove('active');
  document.getElementById('scrimForm')?.reset();
}

async function fetchScrims() {
  const list = document.getElementById('scrimList');
  if (!list) return;
  list.innerHTML = '<p class="placeholder-text">내전 목록을 불러오는 중...</p>';

  let query = supabaseClient.from('scrims').select(`*, scrim_participants ( user_id, profiles ( nickname ) )`).order('created_at', { ascending: false });
  if (currentFilter !== 'all') query = query.eq('game', currentFilter);

  const { data: scrims, error } = await query;
  if (error) { list.innerHTML = `<p style="color:red">내전 로딩 오류: ${error.message}</p>`; return; }
  renderScrims(scrims);
}

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
    const isJoined = currentUser && participants.some(p => p.user_id === currentUser.id);
    const participantNames = participants.map(p => p.profiles?.nickname || '알 수 없음').join(', ');

    const card = document.createElement('div');
    card.className = 'scrim-card';
    card.setAttribute('data-game', scrim.game);

    let actionBtnHtml = '';
    if (isJoined) {
      actionBtnHtml = `<button class="btn-secondary btn-sm" onclick="cancelScrim('${scrim.id}')">참가 취소</button>`;
    } else if (isFull) {
      actionBtnHtml = `<button class="btn-secondary btn-sm" disabled>모집 마감</button>`;
    } else {
      actionBtnHtml = `<button class="btn-primary btn-sm" onclick="applyScrim('${scrim.id}', ${currentCount}, ${scrim.max_players})">참가 신청</button>`;
    }

    const deleteBtnHtml = (currentProfile?.is_admin || (currentUser && scrim.host_id === currentUser.id)) 
      ? `<button class="btn-danger btn-sm" onclick="deleteScrim('${scrim.id}')">삭제</button>` : '';

    card.innerHTML = `
      <div class="scrim-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="game-badge ${scrim.game}">${scrim.game.toUpperCase()}</span>
        <div>${deleteBtnHtml}</div>
      </div>
      <h3>${scrim.title}</h3>
      <p style="margin: 8px 0; font-size: 0.9rem;"><strong>참여 인원:</strong> ${currentCount} / ${scrim.max_players} 명</p>
      <p style="margin-bottom: 12px; font-size: 0.85rem; color: #666;" title="${participantNames}"><strong>참가자:</strong> ${participantNames || '없음'}</p>
      <div>${actionBtnHtml}</div>
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

async function applyScrim(scrimId, currentCount, maxPlayers) {
  if (!currentUser) { alert('로그인이 필요한 서비스입니다.'); return; }
  if (currentCount >= maxPlayers) { alert('정원이 가득 찼습니다.'); return; }

  const { error } = await supabaseClient.from('scrim_participants').insert([{ scrim_id: scrimId, user_id: currentUser.id }]);
  if (error) { alert('참가 신청 실패: ' + error.message); return; }

  const newCount = currentCount + 1;
  await supabaseClient.from('scrims').update({ current_players: newCount, status: newCount >= maxPlayers ? '마감' : '모집 중' }).eq('id', scrimId);
  alert('참가 신청 완료!');
  fetchScrims();
}

async function cancelScrim(scrimId) {
  if (!currentUser) return;
  if (!confirm('참가를 취소하시겠습니까?')) return;

  const { error } = await supabaseClient.from('scrim_participants').delete().eq('scrim_id', scrimId).eq('user_id', currentUser.id);
  if (error) { alert('취소 실패: ' + error.message); return; }

  const { data: remaining } = await supabaseClient.from('scrim_participants').select('id').eq('scrim_id', scrimId);
  await supabaseClient.from('scrims').update({ current_players: remaining ? remaining.length : 0, status: '모집 중' }).eq('id', scrimId);
  alert('참가가 취소되었습니다.');
  fetchScrims();
}

async function deleteScrim(scrimId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabaseClient.from('scrims').delete().eq('id', scrimId);
  if (error) alert('삭제 실패: ' + error.message);
  else fetchScrims();
}

async function loadScrimOptionsForTeamTab() {
  const selectEl = document.getElementById('teamScrimSelect');
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">내전을 불러오는 중...</option>';

  const { data: scrims, error } = await supabaseClient.from('scrims').select('id, title, game, current_players, max_players').order('created_at', { ascending: false });
  if (error || !scrims || scrims.length === 0) {
    selectEl.innerHTML = '<option value="">진행 중인 내전이 없습니다.</option>';
    return;
  }

  selectEl.innerHTML = '<option value="">-- 내전을 선택해 주세요 --</option>';
  scrims.forEach(scrim => {
    const opt = document.createElement('option');
    opt.value = scrim.id;
    opt.textContent = `[${scrim.game.toUpperCase()}] ${scrim.title} (${scrim.current_players}/${scrim.max_players}명)`;
    selectEl.appendChild(opt);
  });
}

async function generateRandomTeamsFromTab() {
  const scrimId = document.getElementById('teamScrimSelect')?.value;
  if (!scrimId) { alert('팀을 나눌 내전을 선택해 주세요.'); return; }

  const { data: participants, error } = await supabaseClient.from('scrim_participants').select(`user_id, profiles ( nickname, valo_info, ow_info )`).eq('scrim_id', scrimId);
  if (error || !participants || participants.length === 0) { alert('참가자가 없습니다.'); return; }

  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const half = Math.ceil(shuffled.length / 2);
  renderTeamList('teamAList', shuffled.slice(0, half));
  renderTeamList('teamBList', shuffled.slice(half));
}

function renderTeamList(elementId, teamMembers) {
  const listEl = document.getElementById(elementId);
  if (!listEl) return;
  listEl.innerHTML = '';

  if (teamMembers.length === 0) {
    listEl.innerHTML = '<li style="padding: 10px; color: var(--text-muted);">배정된 팀원이 없습니다.</li>';
    return;
  }

  teamMembers.forEach(member => {
    const profile = member.profiles || {};
    const valo = profile.valo_info || {};
    const ow = profile.ow_info || {};
    
    const rawTier = valo.tier || ow.tier || 'Unranked';
    const tier = getKoreanTierLabel(rawTier);
    const mainRole = valo.main_role || ow.main_role || '미설정';
    const mainAgents = valo.main_agents || ow.main_heroes || [];
    
    let agentsImgsHtml = '';
    if (mainAgents.length > 0) {
      agentsImgsHtml = mainAgents.map(name => {
        const imgUrl = getAgentOrHeroImg(name);
        if (imgUrl) {
          return `<img src="${imgUrl}" alt="${name}" title="${name}" style="width: 20px; height: 20px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" />`;
        }
        return `<span style="font-size: 0.75rem;">${name}</span>`;
      }).join('');
    }

    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.padding = '10px 12px';
    li.style.marginBottom = '6px';
    li.style.background = 'var(--bg-element)';
    li.style.borderRadius = 'var(--radius-sm)';
    li.style.border = '1px solid var(--border-color)';
    li.style.fontSize = '0.9rem';

    li.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <strong style="color: var(--text-main);">${profile.nickname || '알 수 없음'}</strong>
        <span style="font-size: 0.75rem; padding: 2px 6px; background: var(--accent-glow); color: var(--accent-purple); border-radius: 4px; font-weight: 700;">${mainRole}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-muted);">
        <span style="font-weight: 600;">[${tier}]</span>
        <div style="display: flex; align-items: center; gap: 3px;">${agentsImgsHtml}</div>
      </div>
    `;
    listEl.appendChild(li);
  });
}

function subscribeToRealtimeChanges() {
  supabaseClient.channel('public-scrims-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scrims' }, () => {
      fetchScrims();
      loadScrimOptionsForTeamTab();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scrim_participants' }, () => { fetchScrims(); })
    .subscribe();
}

// =============================================================
// 실시간 팀장 드래프트 시스템 로직 (방장 지정 + 턴 권한 제어)
// =============================================================
let activeDraftScrim = null;
let draftChannel = null;

async function loadDraftScrimOptions() {
  const selectEl = document.getElementById('draftScrimSelect');
  if (!selectEl) return;
  selectEl.innerHTML = '<option value="">내전을 불러오는 중...</option>';

  const { data: scrims, error } = await supabaseClient.from('scrims').select('id, title, game, current_players, max_players').order('created_at', { ascending: false });
  if (error || !scrims || scrims.length === 0) {
    selectEl.innerHTML = '<option value="">진행 중인 내전이 없습니다.</option>';
    return;
  }

  selectEl.innerHTML = '<option value="">-- 내전을 선택해 주세요 --</option>';
  scrims.forEach(scrim => {
    const opt = document.createElement('option');
    opt.value = scrim.id;
    opt.textContent = `[${scrim.game.toUpperCase()}] ${scrim.title} (${scrim.current_players}/${scrim.max_players}명)`;
    selectEl.appendChild(opt);
  });
}

async function loadDraftData() {
  const scrimId = document.getElementById('draftScrimSelect')?.value;
  const adminBox = document.getElementById('draftAdminBox');
  const boardContainer = document.getElementById('draftBoardContainer');

  if (!scrimId) {
    if (adminBox) adminBox.style.display = 'none';
    if (boardContainer) boardContainer.style.display = 'none';
    return;
  }

  if (draftChannel) {
    supabaseClient.removeChannel(draftChannel);
  }

  const { data: scrim, error } = await supabaseClient.from('scrims').select(`*, scrim_participants ( user_id, profiles ( nickname, valo_info, ow_info ) )`).eq('id', scrimId).single();
  
  if (error || !scrim) {
    alert('내전 정보를 불러오지 못했습니다.');
    return;
  }

  activeDraftScrim = scrim;

  const isHostOrAdmin = currentProfile?.is_admin || (currentUser && scrim.host_id === currentUser.id);
  if (adminBox) adminBox.style.display = isHostOrAdmin ? 'block' : 'none';

  if (isHostOrAdmin) {
    populateCaptainSelects(scrim.scrim_participants);
  }

  if (scrim.draft_status && scrim.draft_status !== 'ready') {
    if (boardContainer) boardContainer.style.display = 'block';
    renderLiveDraftBoard(scrim);
  } else {
    if (boardContainer) boardContainer.style.display = 'none';
  }

  draftChannel = supabaseClient.channel(`draft-${scrimId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scrims', filter: `id=eq.${scrimId}` }, payload => {
      activeDraftScrim = payload.new;
      activeDraftScrim.scrim_participants = scrim.scrim_participants;
      if (document.getElementById('draftBoardContainer').style.display === 'block') {
        renderLiveDraftBoard(activeDraftScrim);
      }
    })
    .subscribe();
}

function populateCaptainSelects(participants) {
  const selectA = document.getElementById('captainASelect');
  const selectB = document.getElementById('captainBSelect');
  if (!selectA || !selectB) return;

  selectA.innerHTML = '<option value="">A팀 팀장 선택</option>';
  selectB.innerHTML = '<option value="">B팀 팀장 선택</option>';

  participants.forEach(p => {
    const nick = p.profiles?.nickname || '알 수 없음';
    selectA.innerHTML += `<option value="${p.user_id}">${nick}</option>`;
    selectB.innerHTML += `<option value="${p.user_id}">${nick}</option>`;
  });
}

async function initializeDraft() {
  const capA = document.getElementById('captainASelect').value;
  const capB = document.getElementById('captainBSelect').value;
  const mode = document.getElementById('draftModeSelect').value;

  if (!capA || !capB) {
    alert('A팀과 B팀 팀장을 모두 선택해 주세요.');
    return;
  }
  if (capA === capB) {
    alert('동일 인물을 양팀 팀장으로 지정할 수 없습니다.');
    return;
  }

  const participants = activeDraftScrim.scrim_participants || [];
  const captainAObj = participants.find(p => p.user_id === capA);
  const captainBObj = participants.find(p => p.user_id === capB);
  const pool = participants.filter(p => p.user_id !== capA && p.user_id !== capB);

  const teamA = [captainAObj];
  const teamB = [captainBObj];

  const updatePayload = {
    draft_status: 'in_progress',
    captain_a: capA,
    captain_b: capB,
    current_turn: 'A',
    draft_mode: mode,
    team_a: teamA,
    team_b: teamB,
    draft_pool: pool
  };

  const { error } = await supabaseClient.from('scrims').update(updatePayload).eq('id', activeDraftScrim.id);
  if (error) {
    alert('드래프트 시작 실패: ' + error.message);
  } else {
    document.getElementById('draftBoardContainer').style.display = 'block';
  }
}

function renderLiveDraftBoard(scrim) {
  const banner = document.getElementById('draftTurnBanner');
  const poolList = document.getElementById('draftPlayerPoolList');
  const teamAList = document.getElementById('draftTeamAList');
  const teamBList = document.getElementById('draftTeamBList');

  const pool = scrim.draft_pool || [];
  const teamA = scrim.team_a || [];
  const teamB = scrim.team_b || [];
  const currentTurn = scrim.current_turn; 
  const isFinished = scrim.draft_status === 'finished' || pool.length === 0;

  const currentCaptainId = currentTurn === 'A' ? scrim.captain_a : scrim.captain_b;
  const isMyTurn = currentUser && currentUser.id === currentCaptainId && !isFinished;

  const participants = scrim.scrim_participants || [];
  const capAObj = participants.find(p => p.user_id === scrim.captain_a);
  const capBObj = participants.find(p => p.user_id === scrim.captain_b);

  const capANameElem = document.getElementById('teamACaptainName');
  const capBNameElem = document.getElementById('teamBCaptainName');
  if (capANameElem) capANameElem.textContent = capAObj?.profiles?.nickname || '지정 안 됨';
  if (capBNameElem) capBNameElem.textContent = capBObj?.profiles?.nickname || '지정 안 됨';

  if (isFinished) {
    banner.textContent = "🎉 드래프트가 성공적으로 종료되었습니다!";
    banner.style.background = 'rgba(16, 185, 129, 0.2)';
  } else {
    const captainNick = currentTurn === 'A' ? capAObj?.profiles?.nickname : capBObj?.profiles?.nickname;
    if (isMyTurn) {
      banner.textContent = `🔥 [내 턴입니다!] 당신은 현재 ${currentTurn}팀 팀장(${captainNick})입니다. 지명할 참가자를 선택하세요!`;
      banner.style.background = 'rgba(16, 185, 129, 0.3)';
    } else {
      banner.textContent = `🎯 현재 [${currentTurn} 팀] 차례입니다. (팀장: ${captainNick} 님 지명 중)`;
      banner.style.background = 'var(--accent-glow)';
    }
  }

  poolList.innerHTML = '';
  if (pool.length === 0) {
    poolList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem; padding: 10px;">대기 참가자가 없습니다.</li>';
  } else {
    pool.forEach((member, idx) => {
      const p = member.profiles || {};
      const valo = p.valo_info || {};
      const ow = p.ow_info || {};
      const rawTier = valo.tier || ow.tier || 'Unranked';
      const tier = getKoreanTierLabel(rawTier);
      const mainRole = valo.main_role || ow.main_role || '미설정';
      const mainItems = valo.main_agents || ow.main_heroes || [];
      
      let agentsImgsHtml = '';
      if (mainItems.length > 0) {
        agentsImgsHtml = mainItems.slice(0, 2).map(name => {
          const imgUrl = getAgentOrHeroImg(name);
          if (imgUrl) {
            return `<img src="${imgUrl}" alt="${name}" title="${name}" style="width: 20px; height: 20px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" />`;
          }
          return `<span style="font-size: 0.75rem;">${name}</span>`;
        }).join('');
      }

      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '10px 14px';
      li.style.background = 'var(--bg-element)';
      li.style.borderRadius = 'var(--radius-sm)';
      li.style.border = '1px solid var(--border-color)';

      li.innerHTML = `
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
            <strong style="font-size: 0.95rem; color: var(--text-main);">${p.nickname || '알 수 없음'}</strong>
            <span style="font-size: 0.75rem; padding: 2px 6px; background: var(--accent-glow); color: var(--accent-purple); border-radius: 4px; font-weight: 700;">${mainRole}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-muted);">
            <span style="font-weight: 600;">[${tier}]</span>
            <div style="display: flex; align-items: center; gap: 3px;">${agentsImgsHtml}</div>
          </div>
        </div>
        ${isMyTurn ? `<button class="btn-primary btn-sm" onclick="executePick(${idx})">지명하기</button>` : ''}
      `;
      poolList.appendChild(li);
    });
  }

  const renderTeamMemberList = (containerEl, members, captainId) => {
    containerEl.innerHTML = '';
    if (members.length === 0) {
      containerEl.innerHTML = '<li style="color: var(--text-muted); font-size: 0.85rem; padding: 6px;">팀원이 없습니다.</li>';
      return;
    }
    members.forEach((m) => {
      const p = m.profiles || {};
      const valo = p.valo_info || {};
      const ow = p.ow_info || {};
      const mainRole = valo.main_role || ow.main_role || '미설정';
      const rawTier = valo.tier || ow.tier || 'Unranked';
      const tier = getKoreanTierLabel(rawTier);
      const mainItems = valo.main_agents || ow.main_heroes || [];
      const isCaptain = m.user_id === captainId;

      let agentsImgsHtml = '';
      if (mainItems.length > 0) {
        agentsImgsHtml = mainItems.slice(0, 2).map(name => {
          const imgUrl = getAgentOrHeroImg(name);
          if (imgUrl) {
            return `<img src="${imgUrl}" alt="${name}" title="${name}" style="width: 18px; height: 18px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" />`;
          }
          return `<span style="font-size: 0.7rem;">${name}</span>`;
        }).join('');
      }

      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.style.padding = '8px 4px';
      li.style.borderBottom = '1px solid var(--border-color)';
      li.style.fontSize = '0.9rem';

      li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="color: var(--text-main);">${p.nickname || '알 수 없음'}</strong>
          <span style="font-size: 0.75rem; padding: 2px 6px; background: var(--accent-glow); color: var(--accent-purple); border-radius: 4px; font-weight: 700;">${mainRole}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">[${tier}]</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="display: flex; align-items: center; gap: 2px;">${agentsImgsHtml}</div>
          ${isCaptain ? '<span style="color: var(--accent-purple); font-weight: 800; font-size: 0.75rem; background: var(--accent-glow); padding: 2px 6px; border-radius: 4px;">👑 캡틴</span>' : ''}
        </div>
      `;
      containerEl.appendChild(li);
    });
  };

  renderTeamMemberList(teamAList, teamA, scrim.captain_a);
  renderTeamMemberList(teamBList, teamB, scrim.captain_b);
}

async function executePick(poolIndex) {
  if (!activeDraftScrim) return;

  const scrim = activeDraftScrim;
  const pool = [...(scrim.draft_pool || [])];
  const teamA = [...(scrim.team_a || [])];
  const teamB = [...(scrim.team_b || [])];
  const currentTurn = scrim.current_turn;

  const picked = pool.splice(poolIndex, 1)[0];

  if (currentTurn === 'A') {
    teamA.push(picked);
  } else {
    teamB.push(picked);
  }

  let nextTurn = currentTurn;
  const totalPickedCount = teamA.length + teamB.length - 2; 

  if (scrim.draft_mode === 'snake') {
    const pattern = ['A', 'B', 'B', 'A'];
    nextTurn = pattern[(totalPickedCount) % 4];
  } else {
    nextTurn = currentTurn === 'A' ? 'B' : 'A';
  }

  const isFinished = pool.length === 0;

  const { error } = await supabaseClient.from('scrims').update({
    draft_pool: pool,
    team_a: teamA,
    team_b: teamB,
    current_turn: nextTurn,
    draft_status: isFinished ? 'finished' : 'in_progress'
  }).eq('id', scrim.id);

  if (error) {
    alert('지명 실패: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  loadSavedTheme();
  await fetchValorantAgents();
  checkAuthState();
  subscribeToRealtimeChanges();
});

function switchAuthView(viewType) {
  const loginView = document.getElementById('loginView');
  const signupView = document.getElementById('signupView');

  if (viewType === 'signup') {
    if (loginView) loginView.style.display = 'none';
    if (signupView) signupView.style.display = 'block';
  } else {
    if (loginView) loginView.style.display = 'block';
    if (signupView) signupView.style.display = 'none';
  }
}

// =============================================================
// 6. 맵 데이터 및 맵 밴/픽 투표 시스템
// =============================================================
const VALO_MAP_DATA = [
  { name: '어센트', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/blt720076a084c68831/60ee111425dc2c4ff2c7f465/Ascent_LoadingScreen.png' },
  { name: '바인드', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/blt7c85854746f13bc4/5ee7333cf9704e0ffe63a350/Bind_LoadingScreen.png' },
  { name: '헤이븐', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/blt56f5e3df16d566e5/5ee7333c16260e0ffe1f4215/Haven_LoadingScreen.png' },
  { name: '로터스', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/bltecccd334e3a0937a/63b27b87c71fb26487e4ea6a/Lotus_Loading_Screen.png' },
  { name: '선셋', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/blt181515b026613867/64de581c37c22cb87ee64188/Sunset_Loading_Screen.png' },
  { name: '아이스박스', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/blt36d6c697816110f2/5f79563402777174e2a1b945/Icebox_LoadingScreen.png' },
  { name: '펄', img: 'https://images.contentstack.io/v3/assets/bltb6530b271fca0b16/blt42b87e2213717df0/629c48873d6e5c544d6da3a7/Pearl_LoadingScreen.png' }
];

const OW_MAP_DATA_BY_MODE = {
  "쟁탈": [
    { name: "네팔", img: "images/maps/ove/네팔.png" },
    { name: "부산", img: "images/maps/ove/부산.png" },
    { name: "오아시스", img: "images/maps/ove/오아시스.png" },
    { name: "남극반도", img: "images/maps/ove/남극반도.png" },
    { name: "일리오스", img: "images/maps/ove/일리오스.png" },
    { name: "사모아", img: "images/maps/ove/사모아.png" },
    { name: "리장 타워", img: "images/maps/ove/리장타워.png" }
  ],
  "호위": [
    { name: "샴발리 수도원", img: "images/maps/ove/샴발리.png" },
    { name: "서킷 로얄", img: "images/maps/ove/서킷로얄.png" },
    { name: "감시기지: 지브롤터", img: "images/maps/ove/지브롤터.png" },
    { name: "도라도", img: "images/maps/ove/도라도.png" },
    { name: "쓰레기촌", img: "images/maps/ove/쓰레기촌.png" },
    { name: "리알토", img: "images/maps/ove/리알토.png" },
    { name: "하바나", img: "images/maps/ove/하바나.png" },
    { name: "66번 국도", img: "images/maps/ove/66번국도.png" },
    { name: "그림스뵈튼", img: "images/maps/ove/그림스뵈튼.png" }
  ],
  "혼합": [
    { name: "할리우드", img: "images/maps/ove/할리우드.png" },
    { name: "왕의 길", img: "images/maps/ove/왕의길.png" },
    { name: "미드타운", img: "images/maps/ove/미드타운.png" },
    { name: "아이헨발데", img: "images/maps/ove/아이헨발데.png" },
    { name: "네온교차로", img: "images/maps/ove/네온교차로.png" },
    { name: "파라이수", img: "images/maps/ove/파라이수.png" },
    { name: "블리자드 월드", img: "images/maps/ove/블리자드월드.png" },
    { name: "눔바니", img: "images/maps/ove/눔바니.png" }
  ],
  "밀기": [
    { name: "뉴 퀸 스트리트", img: "images/maps/ove/뉴퀸스트리트.png" },
    { name: "이스페란사", img: "images/maps/ove/이스페란사.png" },
    { name: "콜로세오", img: "images/maps/ove/콜로세오.png" },
    { name: "루나사피", img: "images/maps/ove/루나사피.png" }
  ],
  "플래시포인트": 
    { name: "뉴 정크 시티", img: "images/maps/ove/뉴정크시티.png" },
    { name: "수라바사", img: "images/maps/ove/수라바사.png" },
    { name: "아틀리스", img: "images/maps/ove/아틀리스.png" }
};

async function initializeMapVeto(scrimId, gameType) {
  let initialPool = [];
  
  if (gameType === 'valorant') {
    initialPool = [...VALO_MAP_DATA];
  } else {
    initialPool = Object.values(OW_MAP_DATA_BY_MODE).flat();
  }

  const { error } = await supabaseClient.from('scrims').update({
    map_pool: initialPool,
    map_veto_status: 'in_progress',
    current_map_turn: 'A',
    veto_history: [],
    selected_maps: []
  }).eq('id', scrimId);

  if (error) {
    alert('맵 투표 시작 실패: ' + error.message);
  } else {
    alert('맵 투표가 시작되었습니다!');
  }
}

async function handleMapVetoClick(mapName) {
  if (!activeDraftScrim) return;
  const scrim = activeDraftScrim;
  
  if (scrim.map_veto_status !== 'in_progress') {
    alert('진행 중인 맵 투표가 아닙니다.');
    return;
  }

  const currentTurn = scrim.current_map_turn;
  const currentCaptainId = currentTurn === 'A' ? scrim.captain_a : scrim.captain_b;
  if (!currentUser || currentUser.id !== currentCaptainId) {
    alert(`현재는 [${currentTurn}팀] 팀장 차례입니다.`);
    return;
  }

  let pool = [...(scrim.map_pool || [])];
  let history = [...(scrim.veto_history || [])];
  let selected = [...(scrim.selected_maps || [])];

  const isBanPhase = history.length < 2; 
  const actionType = isBanPhase ? 'ban' : 'pick';

  const targetIndex = pool.findIndex(m => m.name === mapName);
  if (targetIndex === -1) return;
  const clickedMap = pool.splice(targetIndex, 1)[0];

  if (actionType === 'ban') {
    history.push({ team: currentTurn, action: 'ban', map: clickedMap.name });
  } else {
    history.push({ team: currentTurn, action: 'pick', map: clickedMap.name });
    selected.push(clickedMap);
  }

  const nextTurn = currentTurn === 'A' ? 'B' : 'A';
  const isFinished = history.length >= 3; 

  const { error } = await supabaseClient.from('scrims').update({
    map_pool: pool,
    veto_history: history,
    selected_maps: selected,
    current_map_turn: isFinished ? null : nextTurn,
    map_veto_status: isFinished ? 'finished' : 'in_progress'
  }).eq('id', scrim.id);

  if (error) {
    alert('투표 반영 실패: ' + error.message);
  }
}

function renderMapVetoBoard(scrim) {
  const container = document.getElementById('mapVetoBoardContainer');
  if (!container) return;

  const pool = scrim.map_pool || [];
  const history = scrim.veto_history || [];
  const selectedMaps = scrim.selected_maps || [];
  const currentTurn = scrim.current_map_turn;
  const status = scrim.map_veto_status;

  const isFinished = status === 'finished';
  const currentCaptainId = currentTurn === 'A' ? scrim.captain_a : scrim.captain_b;
  const isMyTurn = currentUser && currentUser.id === currentCaptainId && !isFinished;

  let html = `
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
      <h3 style="margin-bottom: 10px; font-size: 1.1rem; color: var(--text-main);">🗺️ 실시간 맵 밴/픽 현황</h3>
      
      <div style="padding: 10px; background: var(--accent-glow); border-radius: 8px; margin-bottom: 15px; text-align: center; font-weight: 700; color: var(--accent-purple);">
        ${isFinished ? '🎉 최종 경기 맵이 확정되었습니다!' : `🔥 현재 [${currentTurn}팀] 턴입니다! (${isMyTurn ? '당신이 맵을 선택할 차례입니다!' : '상대 팀장이 고르는 중...'})`}
      </div>

      <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: var(--text-muted);">선택 가능한 맵 목록</h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px;">
        ${pool.map(map => `
          <div onclick="${isMyTurn ? `handleMapVetoClick('${map.name}')` : ''}" style="background: var(--bg-element); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; text-align: center; cursor: ${isMyTurn ? 'pointer' : 'default'}; transition: 0.2s;">
            <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 6px; overflow: hidden; margin-bottom: 6px;">
              <img src="${map.img}" alt="${map.name}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${map.name}</span>
          </div>
        `).join('')}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <div style="background: var(--bg-element); padding: 12px; border-radius: 8px;">
          <strong style="font-size: 0.85rem; color: var(--text-muted);">❌ 밴/픽 기록</strong>
          <ul style="margin-top: 6px; padding-left: 16px; font-size: 0.85rem;">
            ${history.map(h => `<li>[${h.team}팀] ${h.map} (${h.action.toUpperCase()})</li>`).join('')}
          </ul>
        </div>
        <div style="background: var(--bg-element); padding: 12px; border-radius: 8px;">
          <strong style="font-size: 0.85rem; color: var(--accent-purple);">⭐ 최종 확정 맵</strong>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            ${selectedMaps.map(m => `<span style="padding: 4px 8px; background: var(--accent-purple); color: white; border-radius: 4px; font-weight: 700; font-size: 0.8rem;">${m.name}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  container.innerHTML = html;
}