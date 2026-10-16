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
    "D.Mon", "D.Va", "도미나", "둠피스트", "라마트라", "라인하르트", "레킹볼",
    "로드호그", "마우가", "시그마", "오리사", "윈스턴", "자리야", "정커퀸", "해저드"
  ],
  "공격": [
    "겐지", "리퍼", "메이", "바스티온", "벤데타", "벤처", "소전", "솔저: 76",
    "시메트라", "시에라", "시온", "안란", "애쉬", "에코", "엠레", "위도우메이커",
    "정크랫", "캐서디", "토르비욘", "트레이서", "파라", "프레야", "한조"
  ],
  "지원": [
    "독트린", "라이프위버", "루시우", "메르시", "모이라", "미즈키", "바티스트",
    "브리기테", "솜브라", "아나", "우양", "일리아리", "제트팩 캣", "젠야타", "주노", "키리코"
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

const Ow_TIER_DATA = [
  { name: "브론즈", label: '브론즈', img: "images/tiers/ow/브론즈.webp" },
  { name: "실버", label: '실버', img: "images/tiers/ow/실버.webp" },
  { name: "골드", label: '골드', img: "images/tiers/ow/골드.webp" },
  { name: "플래티넘", label: '플래티넘', img: "images/tiers/ow/플래티넘.webp" },
  { name: "다이아몬드", label: '다이아몬드', img: "images/tiers/ow/다이아몬드.webp" },
  { name: "마스터", label: '마스터', img: "images/tiers/ow/마스터.webp" },
  { name: "그랜드마스터", label: '그랜드마스터', img: "images/tiers/ow/그랜드마스터.webp" },
  { name: "챔피언", label: '챔피언', img: "images/tiers/ow/챔피언.webp" },
  { name: "챌린저", label: '챌린저', img: "images/tiers/ow/챌린저.webp" },
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
// 리그 오브 레전드 173명 전체 자동 로딩 및 픽업 로직
// =============================================================
let currentLolTargetType = 'main'; // 'main' 혹은 'sub'
let tempLolSelectedChampions = { main: [], sub: [] };
let LOL_LATEST_VERSION = '14.24.1'; // 기본값 (API로 자동 갱신됨)

let LOL_CHAMPIONS = {
  "탑": [],
  "정글": [],
  "미드": [],
  "원딜": [],
  "서폿": []
};

// 라이엇 공식 API에서 173명 전체 챔피언 자동 로드
async function fetchAllLolChampions() {
  try {
    const verRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await verRes.json();
    if (versions && versions.length > 0) {
      LOL_LATEST_VERSION = versions[0];
    }

    const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/data/ko_KR/champion.json`);
    const champJson = await champRes.json();
    
    LOL_CHAMPIONS = { "탑": [], "정글": [], "미드": [], "원딜": [], "서폿": [] };
    const championsArray = Object.values(champJson.data);

    championsArray.forEach(champ => {
      const champData = {
        ko: champ.name,          // 한글 이름
        en: champ.id             // 영문 ID
      };

      Object.keys(LOL_CHAMPIONS).forEach(pos => {
        LOL_CHAMPIONS[pos].push(champData);
      });
    });

    console.log(`[롤 API] 총 ${championsArray.length}명의 챔피언 데이터 로드 완료!`);
  } catch (err) {
    console.error('롤 전체 챔피언 로딩 실패:', err);
  }
}

// 롤 챔피언 선택 모달 열기
function openLolChampModal(type) {
  currentLolTargetType = type;
  const modal = document.getElementById('lolChampModal');
  if (modal) modal.classList.add('active');
  
  filterLolChampions('all');
}

// 롤 챔피언 선택 모달 닫기
function closeLolChampModal() {
  const modal = document.getElementById('lolChampModal');
  if (modal) modal.classList.remove('active');
  
  renderSelectedLolChampionsView();
}

// 포지션 및 검색어에 따라 롤 챔피언 필터링
function filterLolChampions(position, btnElement = null) {
  if (btnElement) {
    document.querySelectorAll('#lolChampModal .filter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
  }

  const searchInput = document.getElementById('lolChampSearchInput');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const container = document.getElementById('lolModalChampContainer');
  if (!container) return;

  container.innerHTML = '';

  let targetList = [];
  if (position === 'all' || !LOL_CHAMPIONS[position]) {
    const allChamps = Object.values(LOL_CHAMPIONS).flat();
    const uniqueMap = new Map();
    allChamps.forEach(c => uniqueMap.set(c.ko, c));
    targetList = Array.from(uniqueMap.values());
  } else {
    targetList = LOL_CHAMPIONS[position];
  }

  const filtered = targetList.filter(champ => {
    if (!champ || !champ.ko) return false;
    return champ.ko.toLowerCase().includes(query) || (champ.en && champ.en.toLowerCase().includes(query));
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div class="placeholder-info" style="grid-column: 1/-1;">검색된 챔피언이 없습니다.</div>';
    return;
  }

  filtered.forEach(champ => {
    const koName = champ.ko;
    const enId = champ.en;

    const item = document.createElement('div');
    item.className = 'agent-picker-item';
    
    const isSelected = tempLolSelectedChampions[currentLolTargetType].includes(koName);
    if (isSelected) item.classList.add('selected');

    const imagePath = `https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/img/champion/${enId}.png`;

    item.innerHTML = `
      <img src="${imagePath}" alt="${koName}" onerror="this.src='https://via.placeholder.com/60?text=${encodeURIComponent(koName)}'" />
      <span class="agent-name">${koName}</span>
    `;

    if (isSelected) {
      const rankIdx = tempLolSelectedChampions[currentLolTargetType].indexOf(koName);
      const badge = document.createElement('div');
      badge.className = 'agent-rank-badge';
      badge.textContent = rankIdx + 1;
      item.appendChild(badge);
    }

    item.onclick = () => toggleLolSelection(currentLolTargetType, koName, item);
    container.appendChild(item);
  });
}

function onLolSearchInput() {
  const activeBtn = document.querySelector('#lolChampModal .filter-btn.active');
  let currentPos = 'all';
  if (activeBtn) {
    const text = activeBtn.textContent;
    if (text !== '전체') currentPos = text;
  }
  filterLolChampions(currentPos);
}

function toggleLolSelection(type, champName, element) {
  const list = tempLolSelectedChampions[type];
  const idx = list.indexOf(champName);

  if (idx > -1) {
    list.splice(idx, 1);
    element.classList.remove('selected');
    const badge = element.querySelector('.agent-rank-badge');
    if (badge) badge.remove();
  } else {
    if (list.length >= 3) {
      alert('선호 챔피언은 최대 3개까지만 선택할 수 있습니다!');
      return;
    }
    list.push(champName);
    element.classList.add('selected');
    
    const badge = document.createElement('div');
    badge.className = 'agent-rank-badge';
    badge.textContent = list.length;
    element.appendChild(badge);
  }
}

// 선택한 롤 챔피언들을 프로필 설정 화면에 렌더링하는 함수
function renderSelectedLolChampionsView() {
  ['main', 'sub'].forEach(type => {
    const containerId = type === 'main' ? 'lolMainChampContainer' : 'lolSubChampContainer';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const selectedList = tempLolSelectedChampions[type];

    if (!selectedList || selectedList.length === 0) {
      container.innerHTML = '<span class="placeholder-text" style="font-size:0.85rem; color:#888;">선택된 챔피언이 없습니다.</span>';
      return;
    }

    selectedList.forEach((koName, index) => {
      let enId = koName;
      for (let pos in LOL_CHAMPIONS) {
        const found = LOL_CHAMPIONS[pos].find(c => c.ko === koName);
        if (found) {
          enId = found.en;
          break;
        }
      }

      const item = document.createElement('div');
      item.className = 'agent-picker-item selected';
      item.style.pointerEvents = 'none';

      const imagePath = `https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/img/champion/${enId}.png`;
      item.innerHTML = `
        <img src="${imagePath}" alt="${koName}" onerror="this.src='https://via.placeholder.com/60?text=${encodeURIComponent(koName)}'" />
        <span class="agent-name">${koName}</span>
        <div class="agent-rank-badge">${index + 1}</div>
      `;
      container.appendChild(item);
    });
  });
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
        badgeElem.textContent = '관리자';
        badgeElem.classList.add('admin');
      } else {
        badgeElem.textContent = '로스터';
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
// 오버워치 2 영웅 선택 로직
// =============================================================
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
    
    const imagePath = `images/ove/${heroName}.png`; 

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
  
  tempLolSelectedChampions.main = lol.main_champs || [];
  tempLolSelectedChampions.sub = lol.sub_champs || [];
  renderSelectedLolChampionsView();

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
    sub_role: document.getElementById('lolSubRole').value,
    main_champs: tempLolSelectedChampions.main,
    sub_champs: tempLolSelectedChampions.sub
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
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = isDarkMode ? '☀️' : '🌙';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active-tab-btn'));
  
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  const targetBtn = document.getElementById('nav' + tabId.charAt(0).toUpperCase() + tabId.slice(1) + 'Btn');
  if (targetBtn) {
    targetBtn.classList.add('active-tab-btn');
  }

  if (tabId === 'team') showTeamSubtab('auto');
  
  // 💡 맵 투표 탭을 누를 때 맵 목록 그리기가 확실하게 실행되도록 설정
  if (tabId === 'mapVote') {
    setTimeout(() => {
      loadMapVoteView('valo');
    }, 50);
  }
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

  // 참여자들의 롤, 발로란트, 오버워치 정보까지 모두 함께 조인(Join)하여 가져옴
  let query = supabaseClient.from('scrims').select(`
    *, 
    scrim_participants ( 
      user_id, 
      profiles ( 
        nickname, 
        valo_info, 
        ow_info, 
        lol_info 
      ) 
    )
  `).order('created_at', { ascending: false });

  if (currentFilter !== 'all') query = query.eq('game', currentFilter);

  const { data: scrims, error } = await query;
  if (error) { 
    console.error('내전 로딩 에러:', error);
    list.innerHTML = '내전 로딩 오류'; 
    return; 
  }
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

    // 참여자 목록 HTML 생성 (아이콘 이미지 포함)
    let participantsHtml = '<div class="scrim-participants-box" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.1);">';
    participantsHtml += `<p style="font-size: 0.85rem; font-weight: bold; margin-bottom: 6px; color: var(--text-secondary);">참여 멤버 (${currentCount}/${scrim.max_players})</p>`;
    
    if (participants.length === 0) {
      participantsHtml += '<p style="font-size: 0.8rem; color: #888;">아직 참여한 인원이 없습니다.</p>';
    } else {
      participantsHtml += '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">';
      
      participants.forEach(p => {
        const profile = p.profiles || {};
        const nickname = profile.nickname || '알 수 없음';
        
        let champList = [];
        let tierText = '';
        
        // 종목별 선호 캐릭터 및 티어 추출
        if (scrim.game === 'valo') {
          const valo = profile.valo_info || {};
          champList = valo.main_agents || [];
          tierText = valo.tier || 'Unranked';
        } else if (scrim.game === 'ow') {
          const ow = profile.ow_info || {};
          champList = ow.main_agents || [];
          tierText = ow.tier || 'Unranked';
        } else if (scrim.game === 'lol') {
          const lol = profile.lol_info || {};
          champList = lol.main_champs || [];
          tierText = lol.tier || 'Unranked';
        }

        // 캐릭터 아이콘 이미지 태그들을 조합할 HTML 생성
        let champIconsHtml = '';
        if (champList.length === 0) {
          champIconsHtml = '<span style="font-size: 0.75rem; color: #888;">픽 없음</span>';
        } else {
          champIconsHtml = '<div style="display: flex; gap: 4px; align-items: center;">';
          champList.forEach((cName, idx) => {
            let imgUrl = '';
            
            if (scrim.game === 'valo') {
              for (let role in VALO_AGENT_DATA) {
                const found = VALO_AGENT_DATA[role].find(a => a.name === cName);
                if (found) { imgUrl = found.img; break; }
              }
            } else if (scrim.game === 'ow') {
              imgUrl = `images/ove/${cName}.png`;
            } else if (scrim.game === 'lol') {
              let enId = cName;
              for (let pos in LOL_CHAMPIONS) {
                const found = LOL_CHAMPIONS[pos].find(champ => champ.ko === cName);
                if (found) { enId = found.en; break; }
              }
              imgUrl = `https://ddragon.leagueoflegends.com/cdn/${typeof LOL_LATEST_VERSION !== 'undefined' ? LOL_LATEST_VERSION : '14.24.1'}/img/champion/${enId}.png`;
            }

            champIconsHtml += `
              <div style="position: relative; width: 24px; height: 24px;" title="${cName} (${idx + 1}순위)">
                <img src="${imgUrl}" alt="${cName}" style="width: 100%; height: 100%; border-radius: 4px; object-fit: cover; border: 1px solid rgba(0,0,0,0.1);" onerror="this.src='https://via.placeholder.com/24?text=?'" />
                <span style="position: absolute; bottom: -3px; right: -3px; background: var(--accent-color, #4f46e5); color: #fff; font-size: 9px; width: 10px; height: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${idx + 1}</span>
              </div>
            `;
          });
          champIconsHtml += '</div>';
        }

        participantsHtml += `
          <li style="font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.02); padding: 5px 8px; border-radius: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong>${nickname}</strong> 
              <span style="font-size: 0.75rem; color: #666;">[${tierText}]</span>
            </div>
            <div>${champIconsHtml}</div>
          </li>
        `;
      });
      participantsHtml += '</ul>';
    }
    participantsHtml += '</div>';

    const card = document.createElement('div');
    card.className = 'scrim-card';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="game-badge ${scrim.game}">${scrim.game.toUpperCase()}</span>
        ${(currentProfile?.is_admin || scrim.host_id === currentUser?.id) ? `<button class="btn-danger-sm" onclick="deleteScrim('${scrim.id}')">삭제</button>` : ''}
      </div>
      <h3>${scrim.title}</h3>
      <p style="margin: 6px 0; font-size: 0.9rem;">참여 인원: <strong>${currentCount}</strong> / ${scrim.max_players} 명</p>
      
      ${participantsHtml}

      <div style="margin-top: 12px;">
        ${isJoined ? `<button class="btn-secondary full-width" onclick="cancelScrim('${scrim.id}')">참가 취소</button>` : isFull ? `<button class="btn-secondary full-width" disabled>모집 마감</button>` : `<button class="btn-primary full-width" onclick="applyScrim('${scrim.id}', ${currentCount},${scrim.max_players})">참가 신청</button>`}
      </div>
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

function switchGameTab(gameType) {
  document.querySelectorAll('.game-profile-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.game-subtab-btn').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById('gameView' + gameType.charAt(0).toUpperCase() + gameType.slice(1));
  const targetBtn = document.getElementById('gameTab' + gameType.charAt(0).toUpperCase() + gameType.slice(1) + 'Btn');

  if (targetView) targetView.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
}

// =============================================================
// 게임별 맵 정보 및 고화질 배경 이미지 데이터
// =============================================================
const GAME_MAPS = {
  valo: [
    { name: "스플릿", img: "images/maps/val/스플릿.webp" },
    { name: "바인드", img: "images/maps/val/바인드.webp" },
    { name: "헤이븐", img: "images/maps/val/헤이븐.webp" },
    { name: "어센트", img: "images/maps/val/어센트.webp" },
    { name: "아이스박스", img: "images/maps/val/아이스박스.webp" },
    { name: "브리즈", img: "images/maps/val/브리즈.webp" },
    { name: "프랙처", img: "images/maps/val/프랙처.webp" },
    { name: "펄", img: "images/maps/val/펄.webp" },
    { name: "로터스", img: "images/maps/val/로터스.webp" },
    { name: "선셋", img: "images/maps/val/선셋.webp" },
    { name: "어비스", img: "images/maps/val/어비스.webp" },
    { name: "코로드", img: "images/maps/val/코로드.webp" },
    { name: "서밋", img: "images/maps/val/서밋.webp" },

  ],
  ow: [
    // 플래시포인트
    { name: "뉴 정크 시티", img: "images/maps/ove/뉴정크시티.webp", mode: "플래시포인트" },
    { name: "수라바사", img: "images/maps/ove/수라바사.webp", mode: "플래시포인트" },
    { name: "아틀리스", img: "images/maps/ove/아틀리스.webp", mode: "플래시포인트" },
    // 호위
    { name: "샴발리 수도원", img: "images/maps/ove/샴발리.webp", mode: "호위" },
    { name: "서킷 로얄", img: "images/maps/ove/서킷로얄.webp", mode: "호위" },
    { name: "감시기지: 지브롤터", img: "images/maps/ove/지브롤터.webp", mode: "호위" },
    { name: "66번 국도", img: "images/maps/ove/66번 국도.webp", mode: "호위" },
    { name: "도라도", img: "images/maps/ove/도라도.webp", mode: "호위" },
    { name: "리알토", img: "images/maps/ove/리알토.webp", mode: "호위" },
    { name: "쓰레기촌", img: "images/maps/ove/쓰레기촌.webp", mode: "호위" },
    { name: "하바나", img: "images/maps/ove/하바나.webp", mode: "호위" },
    { name: "그림스뵈튼", img: "images/maps/ove/그림스뵈튼.webp", mode: "호위" },
    // 쟁탈
    { name: "네팔", img: "images/maps/ove/네팔.webp", mode: "쟁탈" },
    { name: "리장 타워", img: "images/maps/ove/리장타워.webp", mode: "쟁탈" },
    { name: "부산", img: "images/maps/ove/부산.webp", mode: "쟁탈" },
    { name: "사모아", img: "images/maps/ove/사모아.webp", mode: "쟁탈" },
    { name: "오아시스", img: "images/maps/ove/오아시스.webp", mode: "쟁탈" },
    { name: "일리오스", img: "images/maps/ove/일리오스.webp", mode: "쟁탈" },
    { name: "남극 반도", img: "images/maps/ove/남극반도.webp", mode: "쟁탈" },
    // 혼합
    { name: "할리우드", img: "images/maps/ove/할리우드.webp", mode: "혼합" },
    { name: "왕의 길", img: "images/maps/ove/왕의길.webp", mode: "혼합" },
    { name: "눔바니", img: "images/maps/ove/눔바니.webp", mode: "혼합" },
    { name: "미드타운", img: "images/maps/ove/미드타운.webp", mode: "혼합" },
    { name: "블리자드 월드", img: "images/maps/ove/블리자드월드.webp", mode: "혼합" },
    { name: "아이헨발데", img: "images/maps/ove/아이헨발데.webp", mode: "혼합" },
    { name: "파라이수", img: "images/maps/ove/파라이수.webp", mode: "혼합" },
    { name: "네온 교차로", img: "images/maps/ove/네온 교차로.webp", mode: "혼합" },
    // 밀기
    { name: "뉴 퀸 스트리트", img: "images/maps/ove/뉴퀸스트리트.webp", mode: "밀기" },
    { name: "이스페란사", img: "images/maps/ove/이스페란사.webp", mode: "밀기" },
    { name: "콜로세오", img: "images/maps/ove/콜로세오.webp", mode: "밀기" },
    { name: "루나사피", img: "images/maps/ove/루나사피.webp", mode: "밀기" },
  ],

  lol: [
    { name: "소환사의 협곡", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop" },
    { name: "칼바람 나락", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop" }
  ]
};

// 현재 선택된 오버워치 맵 세부 모드 ('all', '쟁탈', '호위', '플래시포인트', '밀기', '혼합')
let currentOwMapMode = 'all';

async function loadMapVoteView(gameType = 'valo', owMode = 'all') {
  currentOwMapMode = owMode;
  const container = document.getElementById('mapVoteContainer');
  if (!container) return;

  container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">투표 현황을 불러오는 중...</p>';

  // DB에서 해당 게임의 모든 투표 데이터 가져오기
  const { data: votes, error } = await supabaseClient
    .from('map_votes')
    .select('*')
    .eq('game_type', gameType);

  if (error) {
    console.error('투표 현황 로딩 실패:', error);
  }

  // 맵별 투표 수 집계 객체 생성
  const voteCounts = {};
  let userVotedMap = null;

  if (votes) {
    votes.forEach(v => {
      voteCounts[v.map_name] = (voteCounts[v.map_name] || 0) + 1;
      if (currentUser && v.user_id === currentUser.id) {
        userVotedMap = v.map_name; // 내가 이미 투표한 맵
      }
    });
  }

  // 게임별 맵 데이터 가져오기
  let maps = GAME_MAPS[gameType] || GAME_MAPS['valo'];

  // 오버워치이고 세부 모드가 선택된 경우 필터링
  if (gameType === 'ow' && owMode !== 'all') {
    maps = maps.filter(map => map.mode === owMode);
  }

  let html = `
    <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button class="filter-btn ${gameType === 'valo' ? 'active' : ''}" onclick="loadMapVoteView('valo')">발로란트</button>
      <button class="filter-btn ${gameType === 'ow' ? 'active' : ''}" onclick="loadMapVoteView('ow', 'all')">오버워치</button>
      <button class="filter-btn ${gameType === 'lol' ? 'active' : ''}" onclick="loadMapVoteView('lol')">롤</button>
    </div>
  `;

  // 오버워치 탭일 때만 5개 세부 모드 탭 노출
  if (gameType === 'ow') {
    const owModes = [
      { key: 'all', label: '전체' },
      { key: '쟁탈', label: '쟁탈' },
      { key: '호위', label: '호위' },
      { key: '플래시포인트', label: '플래시포인트' },
      { key: '밀기', label: '밀기' },
      { key: '혼합', label: '혼합' }
    ];

    html += `<div style="margin-bottom: 20px; display: flex; gap: 6px; flex-wrap: wrap;">`;
    owModes.forEach(mode => {
      html += `<button class="filter-btn ${currentOwMapMode === mode.key ? 'active' : ''}" style="font-size: 0.85rem; padding: 6px 12px;" onclick="loadMapVoteView('ow', '${mode.key}')">${mode.label}</button>`;
    });
    html += `</div>`;
  }

  html += `<div class="map-card-grid">`;

  maps.forEach(map => {
    const count = voteCounts[map.name] || 0;
    const isMyVote = (userVotedMap === map.name);

    html += `
      <div class="map-vote-card ${isMyVote ? 'voted' : ''}" onclick="castMapVote('${gameType}', '${map.name}')">
        <div class="map-card-bg" style="background-image: url('${map.img}');"></div>
        <div class="map-card-overlay"></div>
        <div class="map-card-content">
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center; margin-bottom: 4px;">
            <h3 class="map-title" style="margin: 0;">${map.name}</h3>
            <span style="background: ${isMyVote ? '#10b981' : 'rgba(0,0,0,0.6)'}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
              🔥 ${count}표
            </span>
          </div>
          <span class="map-vote-btn">${isMyVote ? '✔️ 내 투표 완료' : '클릭하여 투표하기'}</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

async function castMapVote(gameType, mapName) {
  if (!currentUser) {
    alert('로그인 후 투표할 수 있습니다.');
    return;
  }

  console.log('투표 시도:', { userId: currentUser.id, gameType, mapName });

  // 1. 기존에 이 게임에서 투표한 내역이 있는지 확인
  const { data: existing, error: selectError } = await supabaseClient
    .from('map_votes')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('game_type', gameType)
    .maybeSingle();

  if (selectError) {
    console.error('기존 투표 조회 에러:', selectError);
    return;
  }

  if (existing) {
    if (existing.map_name === mapName) {
      // 이미 같은 맵에 투표한 경우 -> 투표 취소
      const { error: deleteError } = await supabaseClient
        .from('map_votes')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('투표 취소 에러:', deleteError);
        alert('투표 취소 실패: ' + deleteError.message);
      } else {
        alert(`[${mapName}] 투표가 취소되었습니다.`);
        loadMapVoteView(gameType);
      }
    } else {
      // 다른 맵에 투표했던 경우 -> 투표 맵 변경
      const { error: updateError } = await supabaseClient
        .from('map_votes')
        .update({ map_name: mapName })
        .eq('id', existing.id);

      if (updateError) {
        console.error('투표 변경 에러:', updateError);
        alert('투표 변경 실패: ' + updateError.message);
      } else {
        alert(`[${mapName}] (으)로 투표가 변경되었습니다!`);
        loadMapVoteView(gameType);
      }
    }
  } else {
    // 신규 투표 생성
    const { error: insertError } = await supabaseClient
      .from('map_votes')
      .insert([{ user_id: currentUser.id, game_type: gameType, map_name: mapName }]);

    if (insertError) {
      console.error('신규 투표 저장 에러:', insertError);
      alert('투표 저장 실패: ' + insertError.message);
    } else {
      alert(`[${mapName}]에 투표가 완료되었습니다!`);
      loadMapVoteView(gameType);
    }
  }
}

// 앱 실행 시 초기화 이벤트 리스너
document.addEventListener('DOMContentLoaded', async () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = '☀️';
  }

  await fetchValorantAgents();
  await fetchAllLolChampions(); 
  checkAuthState();

  // 앱이 켜질 때 맵 투표 컨테이너도 미리 채워두기
  loadMapVoteView('valo');

  // 💡 [실시간 구독 설정] 다른 사람이 투표하거나 변경했을 때 화면 자동 갱신
  supabaseClient
    .channel('public:map_votes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'map_votes' }, (payload) => {
      // 현재 열려있는 게임 타입 기준으로 화면 새로고침
      const activeFilterBtn = document.querySelector('#mapVoteContainer .filter-btn.active');
      let currentGame = 'valo';
      if (activeFilterBtn) {
        const text = activeFilterBtn.textContent;
        if (text.includes('오버워치')) currentGame = 'ow';
        else if (text.includes('롤')) currentGame = 'lol';
      }
      loadMapVoteView(currentGame);
    })
    .subscribe();
});

// --- 기존 팀 구성 서브 탭 전환 함수 내 드래프트 연동 보완 ---
function showTeamSubtab(subtabName) {
  // 모든 뷰 비활성화
  document.querySelectorAll('.team-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));

  if (subtabName === 'auto') {
    document.getElementById('autoView').classList.add('active');
    document.getElementById('subAutoBtn').classList.add('active');
  } else if (subtabName === 'draft') {
    document.getElementById('draftView').classList.add('active');
    document.getElementById('subDraftBtn').classList.add('active');
    // 드래프트 탭 진입 시 내전 셀렉트박스 업데이트 및 초기 보드 렌더링
    initDraftTab();
  } else if (subtabName === 'auction') {
    document.getElementById('auctionView').classList.add('active');
    document.getElementById('subAuctionBtn').classList.add('active');
  }
}

// --- 스네이크 드래프트 시스템 상태 ---
let draftState = {
  active: false,
  scrimId: null,
  leaderA: null, // A팀장 user_id
  leaderB: null, // B팀장 user_id
  teamA: [],
  teamB: [],
  availablePlayers: [],
  turn: 'A', // 'A' 또는 'B'
  round: 1
};

// 드래프트 탭 초기화 및 내전 선택 / 팀장 지정 화면 렌더링
async function initDraftTab() {
  const draftView = document.getElementById('draftView');
  if (!draftView) return;

  if (!draftState.active) {
    draftView.innerHTML = `
      <h3>📋 스네이크 드래프트 턴제 지명</h3>
      <p>팀장이 순서대로 팀원을 지명하는 드래프트 전용 공간입니다.</p>
      <div class="team-control-box" style="margin-top: 20px;">
        <h3>1. 드래프트를 진행할 내전 선택</h3>
        <div class="team-action-row" style="margin-top: 10px;">
          <select id="draftScrimSelect" onchange="onDraftScrimSelected()" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color); font-weight: 600;">
            <option value="">내전 목록 불러오는 중...</option>
          </select>
        </div>

        <div id="leaderSelectBox" style="margin-top: 20px; display: none;">
          <h4 style="margin-bottom: 10px;">2. 양 팀 팀장 지정</h4>
          <div class="form-grid-2">
            <div class="form-group">
              <label style="color: #6366f1;">🟦 BLUE TEAM (A팀장)</label>
              <select id="leaderASelect" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                <option value="">A팀장 선택</option>
              </select>
            </div>
            <div class="form-group">
              <label style="color: #f43f5e;">🟥 RED TEAM (B팀장)</label>
              <select id="leaderBSelect" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                <option value="">B팀장 선택</option>
              </select>
            </div>
          </div>
          <button class="btn-primary full-width" style="margin-top: 15px;" onclick="startDraftSession()">드래프트 방 생성 및 시작</button>
        </div>
      </div>
    `;
    await loadScrimsForDraftSelect();
  } else {
    renderDraftBoard();
  }
}

// Supabase에서 내전 목록과 실제 참가자 수를 조회하여 드래프트 셀렉트박스에 채우기
async function loadScrimsForDraftSelect() {
  try {
    const { data, error } = await supabaseClient.from('scrims').select(`
      id, title, game, max_players,
      scrim_participants ( user_id )
    `).order('created_at', { ascending: false });

    const selectEl = document.getElementById('draftScrimSelect');
    if (!selectEl) return;

    if (error || !data || data.length === 0) {
      selectEl.innerHTML = '<option value="">진행 중인 내전이 없습니다.</option>';
      return;
    }

    selectEl.innerHTML = '<option value="">-- 내전을 선택하세요 --</option>' + data.map(scrim => {
      const count = scrim.scrim_participants ? scrim.scrim_participants.length : 0;
      return `<option value="${scrim.id}">[${(scrim.game || '').toUpperCase()}] ${scrim.title} (${count}/${scrim.max_players}명)</option>`;
    }).join('');
  } catch (err) {
    console.error('드래프트 내전 로드 오류:', err);
  }
}

// 내전 선택 시 해당 내전의 참가자들로 팀장 드롭다운 채우기
async function onDraftScrimSelected() {
  const selectEl = document.getElementById('draftScrimSelect');
  const leaderBox = document.getElementById('leaderSelectBox');
  if (!selectEl || !selectEl.value) {
    if (leaderBox) leaderBox.style.display = 'none';
    return;
  }

  const scrimId = selectEl.value;
  const { data: participantsData } = await supabaseClient
    .from('scrim_participants')
    .select(`user_id, profiles ( nickname )`)
    .eq('scrim_id', scrimId);

  if (!participantsData || participantsData.length < 2) {
    alert('드래프트를 진행하려면 최소 2명 이상의 참가자가 필요합니다.');
    if (leaderBox) leaderBox.style.display = 'none';
    return;
  }

  const optionsHtml = '<option value="">팀장 선택</option>' + participantsData.map(p => {
    const nick = p.profiles?.nickname || '알 수 없음';
    return `<option value="${p.user_id}">${nick}</option>`;
  }).join('');

  document.getElementById('leaderASelect').innerHTML = optionsHtml;
  document.getElementById('leaderBSelect').innerHTML = optionsHtml;
  if (leaderBox) leaderBox.style.display = 'block';
}

// --- 1. 상세 프로필 보기 모달 팝업 렌더링 (선호 영웅/챔피언 3개 아이콘 및 순위 포함) ---
function showPlayerProfileModal(player, gameType = 'valo') {
  const existingModal = document.getElementById('playerDetailModal');
  if (existingModal) existingModal.remove();

  const valo = player.valo_info || {};
  const ow = player.ow_info || {};
  const lol = player.lol_info || {};

  // 요원/챔피언 아이콘 HTML 생성 헬퍼 함수
  const renderAgentIcons = (list, type) => {
    if (!list || list.length === 0) return '<span style="font-size: 0.8rem; color: var(--text-muted);">선택된 영웅/챔피언 없음</span>';
    
    let html = '<div style="display: flex; gap: 8px; margin-top: 6px; align-items: center;">';
    list.forEach((name, idx) => {
      let imgUrl = '';
      if (type === 'valo') {
        for (let role in VALO_AGENT_DATA) {
          const found = VALO_AGENT_DATA[role].find(a => a.name === name);
          if (found) { imgUrl = found.img; break; }
        }
      } else if (type === 'ow') {
        imgUrl = `images/ove/${name}.png`;
      } else if (type === 'lol') {
        let enId = name;
        for (let pos in LOL_CHAMPIONS) {
          const found = LOL_CHAMPIONS[pos].find(c => c.ko === name);
          if (found) { enId = found.en; break; }
        }
        imgUrl = `https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/img/champion/${enId}.png`;
      }

      const rankNum = idx + 1;
      html += `
        <div style="position: relative; width: 36px; height: 36px;" title="${name} (${rankNum}순위)">
          <img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.src='https://via.placeholder.com/36?text=?'" />
          <span style="position: absolute; bottom: -4px; right: -4px; background: var(--primary-color); color: #fff; font-size: 10px; width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">${rankNum}</span>
        </div>
      `;
    });
    html += '</div>';
    return html;
  };

  const modalHtml = `
    <div id="playerDetailModal" class="modal active" style="z-index: 1050;">
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3>🎮 ${player.nickname} 선수의 상세 프로필</h3>
          <button class="close-btn" onclick="document.getElementById('playerDetailModal').remove()">&times;</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px; max-height: 65vh; overflow-y: auto; padding-right: 4px;">
          
          <!-- 발로란트 정보 -->
          <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 14px; border: 1px solid var(--border-color); ${gameType === 'valo' ? 'border-left: 5px solid #ff4757;' : ''}">
            <h4 style="margin: 0 0 8px 0; color: #ff4757;">🔴 발로란트</h4>
            <p style="margin: 4px 0; font-size: 0.9rem;">아이디: <strong>${valo.game_id || '등록 안 함'}</strong></p>
            <p style="margin: 4px 0; font-size: 0.9rem;">티어: <strong>${valo.tier || 'Unranked'}</strong> | 주포지션: <strong>${valo.main_role || '없음'}</strong></p>
            <div style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">주 선호 요원:</div>
            ${renderAgentIcons(valo.main_agents, 'valo')}
          </div>

          <!-- 오버워치 2 정보 -->
          <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 14px; border: 1px solid var(--border-color); ${gameType === 'ow' ? 'border-left: 5px solid #f97316;' : ''}">
            <h4 style="margin: 0 0 8px 0; color: #f97316;">🟠 오버워치 2</h4>
            <p style="margin: 4px 0; font-size: 0.9rem;">배틀태그: <strong>${ow.game_id || '등록 안 함'}</strong></p>
            <p style="margin: 4px 0; font-size: 0.9rem;">티어: <strong>${ow.tier || 'Unranked'}</strong> | 주포지션: <strong>${ow.main_role || '없음'}</strong></p>
            <div style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">주 선호 영웅:</div>
            ${renderAgentIcons(ow.main_agents, 'ow')}
          </div>

          <!-- 롤 정보 -->
          <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 14px; border: 1px solid var(--border-color); ${gameType === 'lol' ? 'border-left: 5px solid #3b82f6;' : ''}">
            <h4 style="margin: 0 0 8px 0; color: #3b82f6;">🔵 리그 오브 레전드</h4>
            <p style="margin: 4px 0; font-size: 0.9rem;">소환사명: <strong>${lol.game_id || '등록 안 함'}</strong></p>
            <p style="margin: 4px 0; font-size: 0.9rem;">티어: <strong>${lol.tier || 'Unranked'}</strong> | 주라인: <strong>${lol.main_role || '없음'}</strong></p>
            <div style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">주 선호 챔피언:</div>
            ${renderAgentIcons(lol.main_champs, 'lol')}
          </div>

        </div>
        <div class="modal-actions" style="margin-top: 20px;">
          <button class="btn-primary full-width" onclick="document.getElementById('playerDetailModal').remove()">확인</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --- 2. 드래프트 세션 시작 (내전의 종목 정보 scrim.game을 함께 보관) ---
async function startDraftSession() {
  const selectEl = document.getElementById('draftScrimSelect');
  const scrimId = selectEl?.value;
  const leaderA = document.getElementById('leaderASelect')?.value;
  const leaderB = document.getElementById('leaderBSelect')?.value;

  if (!scrimId) { alert('내전을 선택해 주세요.'); return; }
  if (!leaderA || !leaderB) { alert('A팀장과 B팀장을 모두 지정해 주세요.'); return; }
  if (leaderA === leaderB) { alert('A팀장과 B팀장은 서로 다른 유저여야 합니다.'); return; }

  // 선택된 내전의 종목(game) 가져오기
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const scrimGame = selectedOption.getAttribute('data-game') || 'valo';

  const { data: participantsData } = await supabaseClient
    .from('scrim_participants')
    .select(`user_id, profiles ( nickname, valo_info, ow_info, lol_info )`)
    .eq('scrim_id', scrimId);

  if (!participantsData) return;

  let leaderAObj = null;
  let leaderBObj = null;
  const remainingPlayers = [];

  participantsData.forEach(p => {
    const profile = p.profiles || {};
    
    // 내전 종목에 맞는 티어와 주 포지션 우선 추출
    let tier = 'Unranked';
    if (scrimGame === 'valo') tier = profile.valo_info?.tier || 'Unranked';
    else if (scrimGame === 'ow') tier = profile.ow_info?.tier || 'Unranked';
    else if (scrimGame === 'lol') tier = profile.lol_info?.tier || 'Unranked';

    const formatted = {
      user_id: p.user_id,
      nickname: profile.nickname || '알 수 없음',
      tier: tier,
      valo_info: profile.valo_info,
      ow_info: profile.ow_info,
      lol_info: profile.lol_info
    };

    if (p.user_id === leaderA) leaderAObj = formatted;
    else if (p.user_id === leaderB) leaderBObj = formatted;
    else remainingPlayers.push(formatted);
  });

  draftState.active = true;
  draftState.scrimId = scrimId;
  draftState.scrimGame = scrimGame; // 내전 종목 저장
  draftState.leaderA = leaderA;
  draftState.leaderB = leaderB;
  draftState.teamA = [leaderAObj];
  draftState.teamB = [leaderBObj];
  draftState.availablePlayers = remainingPlayers;
  draftState.turn = 'A';
  draftState.round = 1;

  renderDraftBoard();
}

// --- 3. 드래프트 화면 렌더링 (내전 종목별 맞춤 프로필 요약 카드 표현) ---
function renderDraftBoard() {
  const draftView = document.getElementById('draftView');
  if (!draftView) return;

  const currentTeamName = draftState.turn === 'A' ? 'BLUE TEAM (A팀)' : 'RED TEAM (B팀)';
  const gameKey = draftState.scrimGame || 'valo';

  // 카드 내부에 해당 내전 종목의 선호 요원/챔피언 아이콘들을 미리 보여주는 렌더러
  const renderCardMiniIcons = (player) => {
    let list = [];
    if (gameKey === 'valo') list = player.valo_info?.main_agents || [];
    else if (gameKey === 'ow') list = player.ow_info?.main_agents || [];
    else if (gameKey === 'lol') list = player.lol_info?.main_champs || [];

    if (list.length === 0) return '<span style="font-size: 0.75rem; color: var(--text-muted);">주력 픽 없음</span>';

    let html = '<div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">';
    list.forEach((name, idx) => {
      let imgUrl = '';
      if (gameKey === 'valo') {
        for (let role in VALO_AGENT_DATA) {
          const found = VALO_AGENT_DATA[role].find(a => a.name === name);
          if (found) { imgUrl = found.img; break; }
        }
      } else if (gameKey === 'ow') {
        imgUrl = `images/ove/${name}.png`;
      } else if (gameKey === 'lol') {
        let enId = name;
        for (let pos in LOL_CHAMPIONS) {
          const found = LOL_CHAMPIONS[pos].find(c => c.ko === name);
          if (found) { enId = found.en; break; }
        }
        imgUrl = `https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/img/champion/${enId}.png`;
      }

      html += `
        <div style="position: relative; width: 22px; height: 22px;" title="${name}">
          <img src="${imgUrl}" alt="${name}" style="width: 100%; height: 100%; border-radius: 4px; object-fit: cover; border: 1px solid var(--border-color);" onerror="this.src='https://via.placeholder.com/22?text=?'" />
        </div>
      `;
    });
    html += '</div>';
    return html;
  };

  draftView.innerHTML = `
    <div class="content-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3>📋 스네이크 드래프트 지명 중 [${gameKey.toUpperCase()}] (Round ${draftState.round})</h3>
      <div style="display: flex; gap: 10px; align-items: center;">
        <span class="badge" style="background: ${draftState.turn === 'A' ? '#6366f1' : '#f43f5e'}; color: white; padding: 6px 14px;">
          🎯 지명 차례: ${currentTeamName}
        </span>
        ${(currentProfile?.is_admin) ? `<button class="btn-danger-sm" onclick="resetDraft()">드래프트 초기화</button>` : ''}
      </div>
    </div>

    <div class="team-result-grid" style="margin-bottom: 20px;">
      <div class="team-card-box team-a" style="border-color: ${draftState.turn === 'A' ? '#6366f1' : 'var(--border-color)'};">
        <h4 style="color: #6366f1;">👑 BLUE TEAM (A팀)</h4>
        <ul class="team-member-list">
          ${draftState.teamA.map((p, i) => `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick='showPlayerProfileModal(${JSON.stringify(p)}, "${gameKey}")'>
              <div>
                ${i === 0 ? '👑 [팀장] ' : ''}<strong>${p.nickname}</strong>
                <span style="color: var(--text-muted); font-size: 0.8rem;">(${p.tier})</span>
              </div>
              <span style="font-size: 0.75rem; color: var(--primary-color);">🔍 프로필</span>
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="team-card-box team-b" style="border-color: ${draftState.turn === 'B' ? '#f43f5e' : 'var(--border-color)'};">
        <h4 style="color: #f43f5e;">👑 RED TEAM (B팀)</h4>
        <ul class="team-member-list">
          ${draftState.teamB.map((p, i) => `
            <li style="padding: 6px 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick='showPlayerProfileModal(${JSON.stringify(p)}, "${gameKey}")'>
              <div>
                ${i === 0 ? '👑 [팀장] ' : ''}<strong>${p.nickname}</strong>
                <span style="color: var(--text-muted); font-size: 0.8rem;">(${p.tier})</span>
              </div>
              <span style="font-size: 0.75rem; color: var(--primary-color);">🔍 프로필</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>

    <div class="team-control-box">
      <h4>지명 대기 선수 목록</h4>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">선수 카드를 클릭하면 상세 프로필을 볼 수 있고, [선수 지명하기] 버튼을 누르면 현재 차례인 팀에 영입됩니다.</p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 10px;">
        ${draftState.availablePlayers.map((player, idx) => `
          <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div style="cursor: pointer; text-align: center;" onclick='showPlayerProfileModal(${JSON.stringify(player)}, "${gameKey}")' title="클릭하여 상세 프로필 보기">
              <div style="font-weight: 700; color: var(--text-color); font-size: 0.95rem;">${player.nickname} 🔍</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">티어: ${player.tier}</div>${renderCardMiniIcons(player)}
            </div>
            <button class="btn-primary" style="padding: 6px 10px; font-size: 0.85rem; width: 100%; border-radius: 8px;" onclick="selectDraftPlayer(${idx})">선수 지명하기</button>
          </div>
        `).join('') || '<div class="placeholder-info" style="grid-column: 1 / -1; text-align: center; padding: 20px;">모든 선수가 지명되었습니다! 🎉</div>'}
      </div>
    </div>
  `;
}

// 4. 내전 목록 로드 시 종목(game) 속성을 option 태그에 함께 담아주도록 보완
async function loadScrimsForDraftSelect() {
  try {
    const { data, error } = await supabaseClient.from('scrims').select(`
      id, title, game, max_players,
      scrim_participants ( user_id )
    `).order('created_at', { ascending: false });

    const selectEl = document.getElementById('draftScrimSelect');
    if (!selectEl) return;

    if (error || !data || data.length === 0) {
      selectEl.innerHTML = '<option value="">진행 중인 내전이 없습니다.</option>';
      return;
    }

    selectEl.innerHTML = '<option value="">-- 내전을 선택하세요 --</option>' + data.map(scrim => {
      const count = scrim.scrim_participants ? scrim.scrim_participants.length : 0;
      return `<option value="${scrim.id}" data-game="${scrim.game}">[${(scrim.game || '').toUpperCase()}] ${scrim.title} (${count}/${scrim.max_players}명)</option>`;
    }).join('');
  } catch (err) {
    console.error('드래프트 내전 로드 오류:', err);
  }
}

// 선수 지명 실행
function selectDraftPlayer(index) {
  if (!currentUser) {
    alert('로그인 후 이용 가능합니다.');
    return;
  }

  const currentTurnLeader = draftState.turn === 'A' ? draftState.leaderA : draftState.leaderB;
  const isAdmin = currentProfile?.is_admin || false;

  if (currentUser.id !== currentTurnLeader && !isAdmin) {
    alert(`현재 지명 권한이 없습니다! (${draftState.turn === 'A' ? 'A팀장' : 'B팀장'}만 지명 가능합니다)`);
    return;
  }

  const selectedPlayer = draftState.availablePlayers.splice(index, 1)[0];

  if (draftState.turn === 'A') {
    draftState.teamA.push(selectedPlayer);
  } else {
    draftState.teamB.push(selectedPlayer);
  }

  if (draftState.turn === 'A') {
    draftState.turn = 'B';
  } else {
    draftState.turn = 'A';
    draftState.round++;
  }

  renderDraftBoard();
}

// 드래프트 초기화
function resetDraft() {
  if (!confirm('드래프트를 초기화하시겠습니까?')) return;
  draftState.active = false;
  initDraftTab();
}