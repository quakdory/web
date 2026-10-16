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

async function createSnsPost() {
  const input = document.getElementById('snsContentInput');
  if (!input || !input.value.trim()) return;
  alert('SNS 피드 기능이 연동되었습니다.');
  input.value = '';
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
    { name: "뉴 정크 시티", img: "images/maps/ove/뉴정크시티.webp" },
    { name: "수라바사", img: "images/maps/ove/수라바사.webp" },
    { name: "아틀리스", img: "images/maps/ove/아틀리스.webp" },
    //호위//
    { name: "샴발리 수도원", img: "images/maps/ove/샴발리.webp" },
    { name: "서킷 로얄", img: "images/maps/ove/서킷로얄.webp" },
    { name: "감시기지: 지브롤터", img: "images/maps/ove/지브롤터.webp" },
    { name: "66번 국도", img: "images/maps/ove/66번 국도.webp" },
    { name: "도라도", img: "images/maps/ove/도라도.webp" },
    { name: "리알토", img: "images/maps/ove/리알토.webp" },
    { name: "쓰레기촌", img: "images/maps/ove/쓰레기촌.webp" },
    { name: "하바나", img: "images/maps/ove/하바나.webp" },
    { name: "그림스뵈튼", img: "images/maps/ove/그림스뵈튼.webp" },
    //쟁탈//
    { name: "네팔", img: "images/maps/ove/네팔.webp" },
    { name: "리장 타워", img: "images/maps/ove/리장타워.webp" },
    { name: "부산", img: "images/maps/ove/부산.webp" },
    { name: "사모아", img: "images/maps/ove/사모아.webp" },
    { name: "오아시스", img: "images/maps/ove/오아시스.webp" },
    { name: "일리오스", img: "images/maps/ove/일리오스.webp" },
    { name: "남극 반도", img: "images/maps/ove/남극반도.webp" },
    //혼합//
    { name: "할리우드", img: "images/maps/ove/할리우드.webp" },
    { name: "왕의 길", img: "images/maps/ove/왕의길.webp" },
    { name: "눔바니", img: "images/maps/ove/눔바니.webp" },
    { name: "미드타운", img: "images/maps/ove/미드타운.webp" },
    { name: "블리자드 월드", img: "images/maps/ove/블리자드월드.webp" },
    { name: "아이헨발데", img: "images/maps/ove/아이헨발데.webp" },
    { name: "파라이수", img: "images/maps/ove/파라이수.webp" },
    { name: "네온 교차로", img: "images/maps/ove/네온 교차로.webp" },
    //밀기//
    { name: "뉴 퀸 스트리트", img: "images/maps/ove/뉴퀸스트리트.webp" },
    { name: "이스페란사", img: "images/maps/ove/이스페란사.webp" },
    { name: "콜로세오", img: "images/maps/ove/콜로세오.webp" },
    { name: "루나사피", img: "images/maps/ove/루나사피.webp" },

  ],
  lol: [
    { name: "소환사의 협곡", img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop" },
    { name: "칼바람 나락", img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop" }
  ]
};

async function loadMapVoteView(gameType = 'valo') {
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

  const maps = GAME_MAPS[gameType] || GAME_MAPS['valo'];

  let html = `
    <div style="margin-bottom: 20px; display: flex; gap: 10px;">
      <button class="filter-btn ${gameType === 'valo' ? 'active' : ''}" onclick="loadMapVoteView('valo')">발로란트</button>
      <button class="filter-btn ${gameType === 'ow' ? 'active' : ''}" onclick="loadMapVoteView('ow')">오버워치</button>
      <button class="filter-btn ${gameType === 'lol' ? 'active' : ''}" onclick="loadMapVoteView('lol')">롤</button>
    </div>
    <div class="map-card-grid">
  `;

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