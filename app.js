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

// 발로란트 선택 요원 임시 저장 변수
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

// 오버워치 2 경쟁전 티어 데이터
const OW_TIER_DATA = [
  { name: "언랭크", value: "Unranked", icon: "❓" },
  { name: "브론즈", value: "Bronze", icon: "🥉" },
  { name: "실버", value: "Silver", icon: "🥈" },
  { name: "골드", value: "Gold", icon: "🥇" },
  { name: "플래티넘", value: "Platinum", icon: "💎" },
  { name: "다이아몬드", value: "Diamond", icon: "💠" },
  { name: "마스터", value: "Master", icon: "👑" },
  { name: "그랜드마스터", value: "Grandmaster", icon: "🔥" },
  { name: "챔피언", value: "Champion", icon: "🌟" }
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

  alert('회원가입이 완료되었습니다! 생성한 아이디와 비밀번호로 로그인해 주세요.');
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

  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');

  if (sessionError) {
    console.error("세션 가져오기 에러:", sessionError);
    return;
  }

  if (session && session.user) {
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

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    const nicknameElem = document.getElementById('userNickname');
    const badgeElem = document.getElementById('userBadge');

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

    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
}

supabaseClient.auth.onAuthStateChange(() => {
  checkAuthState();
});

// =============================================================
// 3. 발로란트 요원 및 티어 이미지 선택기 제어
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
    btn.setAttribute('data-tier', tier.name);
    btn.onclick = () => selectTier(tier.name, btn);

    btn.innerHTML = `
      <img src="${tier.img}" alt="${tier.label}" title="${tier.label}" />
      <span class="tier-name">${tier.label}</span>
    `;
    container.appendChild(btn);
  });
}

function selectTier(tierName, btnEl) {
  document.getElementById('valoTier').value = tierName;
  const container = document.getElementById('valoTierContainer');
  container.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('selected'));
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
// 4. 오버워치 2 데이터 (유저가 지정한 원래 역할군 배치 유지) 및 티어/영웅 선택기 제어
// =============================================================

const OW_HERO_DATA = {
  "돌격": [
    { name: "D.Va", img: "images/heroes/디바.png" },
    { name: "디몬", img: "images/heroes/디몬.png" },
    { name: "도미나", img: "images/heroes/도미나.png" },
    { name: "해저드", img: "images/heroes/해저드.png" },
    { name: "둠피스트", img: "images/heroes/둠피스트.png" },
    { name: "마우가", img: "images/heroes/마우가.png" },
    { name: "시그마", img: "images/heroes/시그마.png" },
    { name: "윈스턴", img: "images/heroes/윈스턴.png" },
    { name: "라인하르트", img: "images/heroes/라인하르트.png" },
    { name: "로드호그", img: "images/heroes/로드호그.png" },
    { name: "자리야", img: "images/heroes/자리야.png" },
    { name: "오리사", img: "images/heroes/오리사.png" },
    { name: "레킹볼", img: "images/heroes/레킹볼.png" },
    { name: "정커퀸", img: "images/heroes/정커퀸.png" },
    { name: "라마트라", img: "images/heroes/라마트라.png" }
  ],
  "공격": [
    { name: "겐지", img: "images/heroes/겐지.png" },
    { name: "캐서디", img: "images/heroes/캐서디.png" },
    { name: "리퍼", img: "images/heroes/리퍼.png" },
    { name: "솔저: 76", img: "images/heroes/솔저.png" },
    { name: "트레이서", img: "images/heroes/트레이서.png" },
    { name: "메이", img: "images/heroes/메이.png" },
    { name: "바스티온", img: "images/heroes/바스티온.png" },
    { name: "한조", img: "images/heroes/한조.png" },
    { name: "토르비욘", img: "images/heroes/토르비욘.png" },
    { name: "위도우메이커", img: "images/heroes/위도우메이커.png" },
    { name: "정크랫", img: "images/heroes/정크랫.png" },
    { name: "파라", img: "images/heroes/파라.png" },
    { name: "시메트라", img: "images/heroes/시메트라.png" },
    { name: "애쉬", img: "images/heroes/애쉬.png" },
    { name: "에코", img: "images/heroes/에코.png" },
    { name: "소전", img: "images/heroes/소전.png" },
    { name: "벤처", img: "images/heroes/벤처.png" },
    { name: "시온", img: "images/heroes/시온.png" },
    { name: "시에라", img: "images/heroes/시에라.png" },
    { name: "엠레", img: "images/heroes/엠레.png" },
    { name: "벤데타", img: "images/heroes/벤데타.png" },
    { name: "안란", img: "images/heroes/안란.png" },
    { name: "프레야", img: "images/heroes/프레야.png" }
  ],
  "지원": [
    { name: "독트린", img: "images/heroes/독트린.png" },
    { name: "우양", img: "images/heroes/우양.png" },
    { name: "솜브라", img: "images/heroes/솜브라.png" },
    { name: "메르시", img: "images/heroes/메르시.png" },
    { name: "루시우", img: "images/heroes/루시우.png" },
    { name: "아나", img: "images/heroes/아나.png" },
    { name: "젠야타", img: "images/heroes/젠야타.png" },
    { name: "바티스트", img: "images/heroes/바티스트.png" },
    { name: "모이라", img: "images/heroes/모이라.png" },
    { name: "브리기테", img: "images/heroes/브리기테.png" },
    { name: "키리코", img: "images/heroes/키리코.png" },
    { name: "일리아리", img: "images/heroes/일리아리.png" },
    { name: "라이프위버", img: "images/heroes/라이프위버.png" },
    { name: "주노", img: "images/heroes/주노.png" },
    { name: "제트팩캣", img: "images/heroes/제트팩캣.png" },
    { name: "미즈키", img: "images/heroes/미즈키.png" }
  ]
};

let owSelectedHeroes = {
  main: [],
  sub: []
};

// 오버워치 티어 선택기 렌더링 함수
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
      <span style="font-size: 22px; margin-bottom: 4px;">${tier.icon}</span>
      <span class="tier-name">${tier.name}</span>
    `;
    container.appendChild(btn);
  });
}

function selectOWTier(tierValue, btnEl) {
  document.getElementById('owTier').value = tierValue;
  const container = document.getElementById('owTierContainer');
  container.querySelectorAll('.tier-btn').forEach(btn => btn.classList.remove('selected'));
  btnEl.classList.add('selected');
}

function updateOWHeroSelection(type) {
  const roleSelect = document.getElementById(type === 'main' ? 'owMainRole' : 'owSubRole');
  const container = document.getElementById(type === 'main' ? 'owMainHeroContainer' : 'owSubHeroContainer');
  
  if (!roleSelect || !container) return;

  const selectedRole = roleSelect.value;
  const heroes = OW_HERO_DATA[selectedRole] || [];

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
        <div style="display:none; width:100%; height:100%; justify-content:center; align-items:center; font-weight:900; font-size:0.8rem; color:var(--accent-purple);">
          ${hero.name.substring(0, 2)}
        </div>
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
    if (list.length >= 3) {
      alert('선호 영웅은 최대 3개까지만 선택할 수 있습니다.');
      return;
    }
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

  selected.forEach((heroName, index) => {
    const btn = container.querySelector(`.agent-btn[data-hero="${heroName}"]`);
    if (btn) {
      btn.classList.add('selected');
      btn.querySelector('.select-badge').textContent = index + 1;
    }
  });
}

// =============================================================
// 5. 프로필 설정 모달 및 통합 저장
// =============================================================

function openProfileModal() {
  if (!currentUser || !currentProfile) return;

  document.getElementById('editUsername').value = currentUser.email.split('@')[0];
  document.getElementById('editNickname').value = currentProfile.nickname || '';

  // 발로란트 정보 설정
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

  // 오버워치 정보 설정
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

  // 발로란트 데이터 검증
  const valoId = document.getElementById('valoId').value;
  if (valoId && !valoId.includes('#')) {
    alert('발로란트 아이디는 아이디#태그 형식으로 입력해 주세요.');
    return;
  }

  const valoMainRole = document.getElementById('valoMainRole').value;
  const valoMainAgents = tempSelectedAgents.main;
  if (valoMainRole && valoMainAgents.length === 0) {
    alert('발로란트 주 역할군의 선호 요원을 최소 1명 선택해 주세요.');
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

  // 오버워치 데이터 검증
  const owId = document.getElementById('owId') ? document.getElementById('owId').value : '';
  if (owId && !owId.includes('#')) {
    alert('오버워치 배틀태그는 아이디#태그 형식으로 입력해 주세요.');
    return;
  }

  const owMainRole = document.getElementById('owMainRole').value;
  const owMainHeroes = owSelectedHeroes.main;
  if (owMainRole && owMainHeroes.length === 0) {
    alert('오버워치 주 역할군의 선호 영웅을 최소 1명 선택해 주세요.');
    return;
  }

  const owInfo = {
    game_id: owId,
    tier: document.getElementById('owTier').value,
    main_role: owMainRole,
    sub_role: document.getElementById('owSubRole').value,
    main_heroes: owMainHeroes,
    sub_heroes: owSelectedHeroes.sub
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
      valo_info: valoInfo,
      ow_info: owInfo
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

// 프로필 모달 내 게임 선택 탭 전환 함수
function switchGameProfileTab(gameCode) {
  document.querySelectorAll('.game-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.game-panel').forEach(panel => panel.classList.remove('active'));

  const targetPanel = document.getElementById(`${gameCode}ProfilePanel`);
  const targetBtn = Array.from(document.querySelectorAll('.game-tab-btn')).find(btn => 
    btn.getAttribute('onclick')?.includes(`'${gameCode}'`)
  );

  if (targetPanel) targetPanel.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
}

// =============================================================
// 6. UI / 네비게이션 / 내전(Scrim) 관리
// =============================================================

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  const targetTab = document.getElementById(tabId) || document.getElementById(tabId + 'Tab');
  if (targetTab) targetTab.classList.add('active');

  if (tabId === 'team' || tabId === 'teamTab') {
    showTeamSubtab('auto');
  }
}

function showTeamSubtab(subtabId) {
  document.querySelectorAll('.team-view').forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(subtabId + 'View');
  if (targetView) targetView.classList.add('active');

  if (subtabId === 'auto') {
    loadScrimOptionsForTeamTab();
  }
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

async function applyScrim(scrimId, currentCount, maxPlayers) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
  if (!session || !session.user) {
    alert('로그인이 필요한 서비스입니다.');
    return;
  }

  currentUser = session.user;

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

async function cancelScrim(scrimId) {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session || !session.user) {
    alert('로그인이 필요합니다.');
    return;
  }

  currentUser = session.user;

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

// =============================================================
// 7. 팀 구성 (자동 서브탭) 로직
// =============================================================

async function loadScrimOptionsForTeamTab() {
  const selectEl = document.getElementById('teamScrimSelect');
  if (!selectEl) return;

  selectEl.innerHTML = '<option value="">내전을 불러오는 중...</option>';

  try {
    const { data: scrims, error } = await supabaseClient
      .from('scrims')
      .select('id, title, game, current_players, max_players')
      .order('created_at', { ascending: false });

    if (error) {
      selectEl.innerHTML = '<option value="">내전 목록을 불러오지 못했습니다.</option>';
      return;
    }

    if (!scrims || scrims.length === 0) {
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
  } catch (err) {
    selectEl.innerHTML = '<option value="">불러오기 중 오류가 발생했습니다.</option>';
  }
}

async function generateRandomTeamsFromTab() {
  const selectEl = document.getElementById('teamScrimSelect');
  const scrimId = selectEl ? selectEl.value : null;

  if (!scrimId) {
    alert('팀을 나눌 내전을 먼저 선택해 주세요.');
    return;
  }

  const { data: participants, error } = await supabaseClient
    .from('scrim_participants')
    .select(`
      user_id,
      profiles ( nickname, valo_info, ow_info )
    `)
    .eq('scrim_id', scrimId);

  if (error || !participants || participants.length === 0) {
    alert('선택한 내전에 참가자가 없거나 목록을 불러올 수 없습니다.');
    return;
  }

  const shuffled = [...participants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const half = Math.ceil(shuffled.length / 2);
  const teamA = shuffled.slice(0, half);
  const teamB = shuffled.slice(half);

  renderTeamList('teamAList', teamA);
  renderTeamList('teamBList', teamB);
}

function renderTeamList(elementId, teamMembers) {
  const listEl = document.getElementById(elementId);
  if (!listEl) return;
  listEl.innerHTML = '';

  if (teamMembers.length === 0) {
    listEl.innerHTML = '<li>배정된 팀원이 없습니다.</li>';
    return;
  }

  teamMembers.forEach(member => {
    const profile = member.profiles || {};
    const valo = profile.valo_info || {};
    const tier = valo.tier || 'Unranked';
    const mainRole = valo.main_role ? ` (${valo.main_role})` : '';

    const li = document.createElement('li');
    li.style.padding = '8px 0';
    li.style.borderBottom = '1px solid #eee';
    li.innerHTML = `
      <strong>${profile.nickname || '알 수 없음'}</strong> 
      <span style="font-size:0.85rem; color:#666;">[${tier}]${mainRole}</span>
    `;
    listEl.appendChild(li);
  });
}

// =============================================================
// 8. Supabase Realtime (실시간 구독 설정)
// =============================================================

function subscribeToRealtimeChanges() {
  supabaseClient
    .channel('public-scrims-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scrims' },
      () => {
        fetchScrims();
        if (typeof loadScrimOptionsForTeamTab === 'function') {
          loadScrimOptionsForTeamTab();
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'scrim_participants' },
      () => {
        fetchScrims();
      }
    )
    .subscribe();
}

// 초기화 및 실시간 구독 시작
document.addEventListener('DOMContentLoaded', async () => {
  await fetchValorantAgents();
  checkAuthState();
  subscribeToRealtimeChanges();
});