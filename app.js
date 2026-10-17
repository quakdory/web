const SUPABASE_URL = 'https://jetgwtyziyoihwowsupc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldGd3dHl6aXlvaWh3b3dzdXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDcxOTgsImV4cCI6MjEwNzEyMzE5OH0.-xUQ6ryxMPMr6sTvW_nCG7FtUNLX9olofS81FSVaUzM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let currentProfile = null;
let currentFilter = 'all';

let tempSelectedAgents = { main: [], sub: [] };
let tempOwSelectedAgents = { main: [], sub: [] };

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

let VALO_AGENT_DATA = { '타격대': [], '척후대': [], '감시자': [], '전략가': [] };

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
  { name: "브론즈", label: '브론즈', img: "images/tiers/브론즈.webp" },
  { name: "실버", label: '실버', img: "images/tiers/실버.webp" },
  { name: "골드", label: '골드', img: "images/tiers/골드.webp" },
  { name: "플래티넘", label: '플래티넘', img: "images/tiers/플래티넘.webp" },
  { name: "에메랄드", label: '에메랄드', img: "images/tiers/에메랄드.webp" },
  { name: "다이아몬드", label: '다이아몬드', img: "images/tiers/다이아몬드.webp" },
  { name: "마스터", label: '마스터', img: "images/tiers/마스터.webp" },
  { name: "그랜드마스터", label: '그랜드마스터', img: "images/tiers/그랜드마스터.webp" },
  { name: "챔피언", label: '챔피언', img: "images/tiers/챔피언.webp" },
  { name: "챌린저", label: '챌린저', img: "images/tiers/챌린저.webp" },
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

let currentLolTargetType = 'main';
let tempLolSelectedChampions = { main: [], sub: [] };
let LOL_LATEST_VERSION = '14.24.1';
let LOL_CHAMPIONS = { "탑": [], "정글": [], "미드": [], "원딜": [], "서폿": [] };

async function fetchAllLolChampions() {
  try {
    const verRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await verRes.json();
    if (versions && versions.length > 0) LOL_LATEST_VERSION = versions[0];

    const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/data/ko_KR/champion.json`);
    const champJson = await champRes.json();
    
    LOL_CHAMPIONS = { "탑": [], "정글": [], "미드": [], "원딜": [], "서폿": [] };
    const championsArray = Object.values(champJson.data);

    championsArray.forEach(champ => {
      const champData = { ko: champ.name, en: champ.id };
      Object.keys(LOL_CHAMPIONS).forEach(pos => { LOL_CHAMPIONS[pos].push(champData); });
    });
  } catch (err) {
    console.error('롤 전체 챔피언 로딩 실패:', err);
  }
}

function openLolChampModal(type) {
  currentLolTargetType = type;
  const modal = document.getElementById('lolChampModal');
  if (modal) modal.classList.add('active');
  filterLolChampions('all');
}

function closeLolChampModal() {
  const modal = document.getElementById('lolChampModal');
  if (modal) modal.classList.remove('active');
  renderSelectedLolChampionsView();
}

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
        if (found) { enId = found.en; break; }
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
    await supabaseClient
      .from('profiles')
      .upsert([{ id: data.user.id, nickname: nickname, is_admin: false }]);
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
  } else {
    await checkAuthState();
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

async function checkAuthState() {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) return;

  if (session) {
    currentUser = session.user;
    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle();

    currentProfile = profileData;

    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const nicknameElem = document.getElementById('userNickname');
    const badgeElem = document.getElementById('userBadge');

    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    const displayNickname = currentProfile?.nickname || currentUser.email.split('@')[0];
    if (nicknameElem) nicknameElem.textContent = displayNickname;

    if (badgeElem) {
      if (currentProfile?.is_admin) {
        badgeElem.textContent = '관리자';
        badgeElem.classList.add('admin');
      } else {
        badgeElem.textContent = '로스터';
        badgeElem.classList.remove('admin');
      }
    }

    const newScrimBtn = document.querySelector('button[onclick="openModal()"]');
    const adminTabBtn = document.getElementById('navAdminTabBtn');

    if (currentProfile?.is_admin) {
      if (newScrimBtn) newScrimBtn.style.display = 'inline-block';
      if (adminTabBtn) adminTabBtn.style.display = 'inline-block';
    } else {
      if (newScrimBtn) newScrimBtn.style.display = 'none';
      if (adminTabBtn) adminTabBtn.style.display = 'none';
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
    btn.innerHTML = `<img src="${agent.img}" alt="${agent.name}" /><span class="agent-name">${agent.name}</span>`;
    container.appendChild(btn);
  });
}

function updateAgentBadges(type) {
  const container = document.getElementById(type === 'main' ? 'valoMainAgentContainer' : 'valoSubAgentContainer');
  if (!container) return;
  const selected = tempSelectedAgents[type];
  
  container.querySelectorAll('.agent-btn').forEach(btn => {
    btn.classList.remove('selected');
    const existingBadge = btn.querySelector('.select-badge');
    if (existingBadge) existingBadge.remove();
  });

  selected.forEach((agentName, index) => {
    const btn = container.querySelector(`.agent-btn[data-agent="${agentName}"]`);
    if (btn) {
      btn.classList.add('selected');
      const badge = document.createElement('div');
      badge.className = 'select-badge agent-rank-badge';
      badge.textContent = index + 1;
      btn.appendChild(badge);
    }
  });
}

function toggleAgentSelect(type, agentName) {
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

function renderOwTierPicker(selectedTierName = '브론즈') {
  const container = document.getElementById('owTierContainer');
  if (!container) return;
  container.innerHTML = '';
  
  const owTierInput = document.getElementById('owTier');
  if (owTierInput) owTierInput.value = selectedTierName;

  Ow_TIER_DATA.forEach(tier => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tier-btn ${tier.name === selectedTierName ? 'selected' : ''}`;
    btn.onclick = () => selectOwTier(tier.name, btn);
    btn.innerHTML = `<img src="${tier.img}" alt="${tier.label}" /><span class="tier-name">${tier.label}</span>`;
    container.appendChild(btn);
  });
}

function selectOwTier(tierName, btnEl) {
  const owTierInput = document.getElementById('owTier');
  if (owTierInput) owTierInput.value = tierName;

  const container = document.getElementById('owTierContainer');
  if (container) {
    container.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('selected'));
  }
  btnEl.classList.add('selected');
}

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
    item.onclick = () => toggleOwAgent(type, heroName);
    container.appendChild(item);
  });
}

function toggleOwAgent(type, heroName) {
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

  container.querySelectorAll('.agent-picker-item').forEach(item => {
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

function closeProfileModal() {
  document.getElementById('profileModal')?.classList.remove('active');
}

function switchGameTab(gameType) {
  // 모든 탭 컨텐츠와 버튼의 active 클래스 제거
  document.querySelectorAll('.game-profile-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.game-sub-tabs button').forEach(el => el.classList.remove('active'));

  // 선택한 게임의 탭과 내용에 active 클래스 부여
  const targetContent = document.getElementById(`${gameType}ProfileTab`);
  const targetBtn = document.getElementById(`${gameType}TabBtn`);

  if (targetContent) targetContent.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
}

function openProfileModal() {
  if (!currentUser || !currentProfile) return;

  document.getElementById('editUsername').value = currentUser.email.split('@')[0];
  document.getElementById('editNickname').value = currentProfile.nickname || '';
  document.getElementById('currentPassword').value = '';
  document.getElementById('editPassword').value = '';

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
  document.getElementById('owId').value = ow.game_id || '';
  renderOwTierPicker(ow.tier || '브론즈');

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

  const lol = currentProfile.lol_info || {};
  document.getElementById('lolId').value = lol.game_id || '';
  document.getElementById('lolTier').value = lol.tier || 'Unranked';
  document.getElementById('lolMainRole').value = lol.main_role || '';
  document.getElementById('lolSubRole').value = lol.sub_role || '';
  
  tempLolSelectedChampions.main = lol.main_champs || [];
  tempLolSelectedChampions.sub = lol.main_champs || [];
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

    const { error: authErr } = await supabaseClient.auth.signInWithPassword({
      email: currentUser.email,
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
  if (targetTab) targetTab.classList.add('active');
  
  const targetBtn = document.getElementById('nav' + tabId.charAt(0).toUpperCase() + tabId.slice(1) + 'Btn');
  if (targetBtn) targetBtn.classList.add('active-tab-btn');

  if (tabId === 'team') {
    showTeamSubtab('auto');
  }
  
  if (tabId === 'mapVote') {
    setTimeout(() => { loadMapVoteScrims(); }, 50);
  }

  if (tabId === 'adminTab') {
    loadAdminScrimManager();
    loadAdminUserManager();
  }
}

function showTeamSubtab(subtabName) {
  document.querySelectorAll('.team-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));

  if (subtabName === 'auto') {
    document.getElementById('autoView').classList.add('active');
    document.getElementById('subAutoBtn').classList.add('active');
    loadTeamScrimSelect();
  } else if (subtabName === 'draft') {
    document.getElementById('draftView').classList.add('active');
    document.getElementById('subDraftBtn').classList.add('active');
    initDraftTab();
  } else if (subtabName === 'auction') {
    document.getElementById('auctionView').classList.add('active');
    document.getElementById('subAuctionBtn').classList.add('active');
  }
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

  if (currentFilter !== 'all') {
    if (currentFilter === 'val' || currentFilter === 'valo') {
      query = query.in('game', ['valo', 'val', 'VALORANT', 'valorant']);
    } else {
      query = query.eq('game', currentFilter);
    }
  }

  const { data: scrims, error } = await query;
  if (error) { 
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

    // 날짜 포맷팅
    const timeDisplay = scrim.scrim_time ? new Date(scrim.scrim_time).toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }) : '일시 미정';

    // 💡 박스 높이 고정 및 스크롤 처리 (max-height: 160px; overflow-y: auto;)
    let participantsHtml = '<div class="scrim-participants-box" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.1); max-height: 160px; overflow-y: auto; padding-right: 4px;">';
    participantsHtml += `<p style="font-size: 0.85rem; font-weight: bold; margin-bottom: 6px; color: var(--text-secondary); position: sticky; top: 0; background: var(--card-bg, #fff); z-index: 1;">참여 멤버 (${currentCount}/${scrim.max_players})</p>`;
    
    if (participants.length === 0) {
      participantsHtml += '<p style="font-size: 0.8rem; color: #888;">아직 참여한 인원이 없습니다.</p>';
    } else {
      participantsHtml += '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">';
      
      participants.forEach(p => {
        const profile = p.profiles || {};
        const nickname = profile.nickname || '알 수 없음';
        
        let champList = [];
        let tierText = '';
        
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
              imgUrl = `https://ddragon.leagueoflegends.com/cdn/${LOL_LATEST_VERSION}/img/champion/${enId}.png`;
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
    const displayGameBadge = scrim.game === 'valo' ? 'VAL' : scrim.game.toUpperCase();

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="game-badge ${scrim.game}">${displayGameBadge}</span>
        ${(currentProfile?.is_admin || scrim.host_id === currentUser?.id) ? `<button class="btn-danger-sm" onclick="deleteScrim('${scrim.id}')">삭제</button>` : ''}
      </div>
      <h3>${scrim.title}</h3>
      <p style="margin: 4px 0; font-size: 0.85rem; color: var(--primary-color); font-weight: bold;">⏰ 일시: ${timeDisplay}</p>
      <p style="margin: 4px 0; font-size: 0.9rem;">참여 인원: <strong>${currentCount}</strong> / ${scrim.max_players} 명</p>
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
  if (!confirm('정말 이 내전을 삭제하시겠습니까?')) return;

  const { error } = await supabaseClient.from('scrims').delete().eq('id', scrimId);
  
  if (error) {
    alert('내전 삭제 실패: ' + error.message);
    return;
  }

  alert('내전이 성공적으로 삭제되었습니다.');
  
  // 🔄 내전 목록 및 관리자 화면 갱신
  fetchScrims();
  if (typeof loadAdminScrimManager === 'function' && currentProfile?.is_admin) {
    loadAdminScrimManager();
  }
}

async function loadTeamScrimSelect() {
  const selectEl = document.getElementById('teamScrimSelect');
  if (!selectEl) return;

  selectEl.innerHTML = '<option value="">내전 목록을 불러오는 중...</option>';

  const { data: scrims, error } = await supabaseClient
    .from('scrims')
    .select('id, title, game, current_players, max_players, balanced_teams')
    .order('created_at', { ascending: false });

  if (error || !scrims || scrims.length === 0) {
    selectEl.innerHTML = '<option value="">등록된 내전이 없습니다.</option>';
    return;
  }

  let html = '<option value="">-- 팀을 나눌 내전을 선택하세요 --</option>';
  scrims.forEach(scrim => {
    const gameLabel = scrim.game === 'valo' ? '발로란트' : scrim.game === 'ow' ? '오버워치' : '롤';
    html += `<option value="${scrim.id}">[${gameLabel}] ${scrim.title} (${scrim.current_players || 0}/${scrim.max_players}명)</option>`;
  });

  selectEl.innerHTML = html;

  selectEl.onchange = async () => {
    const scrimId = selectEl.value;
    if (!scrimId) return;
    const { data: scrimData } = await supabaseClient.from('scrims').select('balanced_teams').eq('id', scrimId).single();
    if (scrimData && scrimData.balanced_teams) {
      renderMMRTeamList('teamAList', scrimData.balanced_teams.teamA, scrimData.balanced_teams.teamA.reduce((acc, c) => acc + c.mmr, 0));
      renderMMRTeamList('teamBList', scrimData.balanced_teams.teamB, scrimData.balanced_teams.teamB.reduce((acc, c) => acc + c.mmr, 0));
    }
  };
}

async function generateBalancedTeamsFromMMR() {
  if (!currentProfile?.is_admin) {
    alert('팀 섞기(자동 팀 나누기) 권한은 관리자에게만 있습니다.');
    return;
  }

  const selectEl = document.getElementById('teamScrimSelect');
  const scrimId = selectEl ? selectEl.value : null;
  if (!scrimId) { 
    alert('내전을 먼저 선택해 주세요.'); 
    return; 
  }

  const { data: scrim } = await supabaseClient.from('scrims').select('game, title').eq('id', scrimId).single();
  const gameType = scrim ? scrim.game : 'valo';
  const mmrKey = `${gameType}_mmr`;

  const { data: participants } = await supabaseClient
    .from('scrim_participants')
    .select(`
      user_id, 
      profiles ( 
        nickname, 
        valo_info, ow_info, lol_info, 
        valo_mmr, ow_mmr, lol_mmr 
      )
    `)
    .eq('scrim_id', scrimId);

  if (!participants || participants.length < 2) { 
    alert('팀을 나누려면 최소 2명 이상의 참가자가 필요합니다.'); 
    return; 
  }

  const players = participants.map(m => {
    const p = m.profiles || {};
    let tier = 'Unranked';
    if (gameType === 'valo') tier = p.valo_info?.tier || 'Unranked';
    else if (gameType === 'ow') tier = p.ow_info?.tier || 'Unranked';
    else if (gameType === 'lol') tier = p.lol_info?.tier || 'Unranked';

    const mmr = p[mmrKey] || convertTierToMMR(gameType, tier);
    return { nickname: p.nickname || '알 수 없음', tier: tier, mmr: mmr };
  });

  players.sort((a, b) => b.mmr - a.mmr);

  const teamA = [];
  const teamB = [];
  let sumA = 0;
  let sumB = 0;

  players.forEach((player) => {
    if (sumA <= sumB) {
      teamA.push(player);
      sumA += player.mmr;
    } else {
      teamB.push(player);
      sumB += player.mmr;
    }
  });

  await supabaseClient.from('scrims').update({
    balanced_teams: { teamA, teamB }
  }).eq('id', scrimId);

  renderMMRTeamList('teamAList', teamA, sumA);
  renderMMRTeamList('teamBList', teamB, sumB);
}

function renderMMRTeamList(elementId, teamMembers, totalMMR) {
  const listEl = document.getElementById(elementId);
  if (!listEl) return;
  
  const isAdmin = currentProfile?.is_admin || false;
  const avgMMR = Math.round(totalMMR / (teamMembers.length || 1));

  let headerHtml = '';
  if (isAdmin) {
    headerHtml = `<div style="margin-bottom: 10px; font-weight: bold; font-size: 0.9rem; color: var(--primary-color);">📊 팀 총 MMR: ${totalMMR}점 (평균: ${avgMMR}점)</div>`;
  } else {
    headerHtml = `<div style="margin-bottom: 10px; font-weight: bold; font-size: 0.9rem; color: var(--primary-color);">📊 밸런스 섞인 팀 구성 결과</div>`;
  }

  let html = headerHtml;

  teamMembers.forEach(m => {
    const mmrSpan = isAdmin ? `<span style="font-size: 0.85rem; font-weight: bold; color: var(--primary-color);">${m.mmr} pts</span>` : '';
    html += `
      <li style="padding: 8px 12px; margin: 4px 0; background: rgba(0,0,0,0.03); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${m.nickname}</strong> <span style="font-size:0.8rem; color:var(--text-muted);">[${m.tier}]</span>
        </div>
        ${mmrSpan}
      </li>
    `;
  });

  listEl.innerHTML = html;
}

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
    { name: "뉴 정크 시티", img: "images/maps/ove/뉴정크시티.webp", mode: "플래시포인트" },
    { name: "수라바사", img: "images/maps/ove/수라바사.webp", mode: "플래시포인트" },
    { name: "아틀리스", img: "images/maps/ove/아틀리스.webp", mode: "플래시포인트" },
    { name: "샴발리 수도원", img: "images/maps/ove/샴발리.webp", mode: "호위" },
    { name: "서킷 로얄", img: "images/maps/ove/서킷로얄.webp", mode: "호위" },
    { name: "감시기지: 지브롤터", img: "images/maps/ove/지브롤터.webp", mode: "호위" },
    { name: "66번 국도", img: "images/maps/ove/66번 국도.webp", mode: "호위" },
    { name: "도라도", img: "images/maps/ove/도라도.webp", mode: "호위" },
    { name: "리알토", img: "images/maps/ove/리알토.webp", mode: "호위" },
    { name: "쓰레기촌", img: "images/maps/ove/쓰레기촌.webp", mode: "호위" },
    { name: "하바나", img: "images/maps/ove/하바나.webp", mode: "호위" },
    { name: "그림스뵈튼", img: "images/maps/ove/그림스뵈튼.webp", mode: "호위" },
    { name: "네팔", img: "images/maps/ove/네팔.webp", mode: "쟁탈" },
    { name: "리장 타워", img: "images/maps/ove/리장타워.webp", mode: "쟁탈" },
    { name: "부산", img: "images/maps/ove/부산.webp", mode: "쟁탈" },
    { name: "사모아", img: "images/maps/ove/사모아.webp", mode: "쟁탈" },
    { name: "오아시스", img: "images/maps/ove/오아시스.webp", mode: "쟁탈" },
    { name: "일리오스", img: "images/maps/ove/일리오스.webp", mode: "쟁탈" },
    { name: "남극 반도", img: "images/maps/ove/남극반도.webp", mode: "쟁탈" },
    { name: "할리우드", img: "images/maps/ove/할리우드.webp", mode: "혼합" },
    { name: "왕의 길", img: "images/maps/ove/왕의길.webp", mode: "혼합" },
    { name: "눔바니", img: "images/maps/ove/눔바니.webp", mode: "혼합" },
    { name: "미드타운", img: "images/maps/ove/미드타운.webp", mode: "혼합" },
    { name: "블리자드 월드", img: "images/maps/ove/블리자드월드.webp", mode: "혼합" },
    { name: "아이헨발데", img: "images/maps/ove/아이헨발데.webp", mode: "혼합" },
    { name: "파라이수", img: "images/maps/ove/파라이수.webp", mode: "혼합" },
    { name: "네온 교차로", img: "images/maps/ove/네온 교차로.webp", mode: "혼합" },
    { name: "뉴 퀸 스트리트", img: "images/maps/ove/뉴퀸스트리트.webp", mode: "밀기" },
    { name: "이스페란사", img: "images/maps/ove/이스페란사.webp", mode: "밀기" },
    { name: "콜로세오", img: "images/maps/ove/콜로세오.webp", mode: "밀기" },
    { name: "루나사피", img: "images/maps/ove/루나사피.webp", mode: "밀기" },
  ],
};

async function loadMapVoteScrims() {
  const selectEl = document.getElementById('mapVoteScrimSelect');
  const container = document.getElementById('mapVoteContainer');
  if (!selectEl) return;

  if (!currentUser || !currentProfile) {
    selectEl.innerHTML = '<option value="">로그인이 필요합니다.</option>';
    if (container) container.innerHTML = '<div class="placeholder-box">로그인 후 맵 투표를 이용하실 수 있습니다.</div>';
    return;
  }

  selectEl.innerHTML = '<option value="">참가 중인 내전을 불러오는 중...</option>';

  const { data: myParticipations, error } = await supabaseClient
    .from('scrim_participants')
    .select(`
      scrim_id,
      scrims (
        id, title, game, max_players, current_players, map_votes,
        scrim_participants (
          user_id,
          profiles ( nickname )
        )
      )
    `)
    .eq('user_id', currentUser.id);

  if (error || !myParticipations || myParticipations.length === 0) {
    selectEl.innerHTML = '<option value="">참가 중인 내전이 없습니다.</option>';
    if (container) container.innerHTML = '<div class="placeholder-box">현재 참가 중인 내전이 없습니다. 내전 탭에서 먼저 내전에 참가해 주세요!</div>';
    return;
  }

  selectEl.innerHTML = '<option value="">-- 투표할 내전을 선택하세요 --</option>';
  window.myActiveScrims = [];
  
  myParticipations.forEach(item => {
    const scrim = item.scrims;
    if (scrim) {
      window.myActiveScrims.push(scrim);
      const opt = document.createElement('option');
      opt.value = scrim.id;
      opt.textContent = `[${(scrim.game || '').toUpperCase()}] ${scrim.title} (${scrim.current_players || 0}/${scrim.max_players}명)`;
      selectEl.appendChild(opt);
    }
  });

  if (container) container.innerHTML = '<div class="placeholder-box">위에서 참가 중인 내전을 선택해 주세요.</div>';
}

function onMapVoteScrimChange() {
  const selectEl = document.getElementById('mapVoteScrimSelect');
  const container = document.getElementById('mapVoteContainer');
  if (!selectEl || !container) return;

  const scrimId = selectEl.value;
  if (!scrimId) {
    container.innerHTML = '<div class="placeholder-box">위에서 참가 중인 내전을 선택해 주세요.</div>';
    return;
  }

  const selectedScrim = window.myActiveScrims?.find(s => s.id == scrimId);
  if (!selectedScrim) return;

  const participants = selectedScrim.scrim_participants || [];
  const isParticipant = participants.some(p => p.user_id === currentUser.id);

  if (!isParticipant) {
    container.innerHTML = '<div class="placeholder-box danger-notice" style="color: #ff4757; border: 1px solid #ff4757; background: rgba(255,71,87,0.1); padding: 15px; border-radius: 10px;">⚠️ 해당 내전의 참가자만 맵 투표에 참여할 수 있습니다.</div>';
    return;
  }

  renderMapVoteCards(selectedScrim);
}

let currentOwMapMode = 'all';

function renderMapVoteCards(scrim) {
  const container = document.getElementById('mapVoteContainer');
  if (!container) return;

  const gameType = scrim.game;

  if (gameType === 'lol') {
    container.innerHTML = `
      <div class="placeholder-box" style="padding: 30px; text-align: center; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 16px;">
        <h4 style="color: #3b82f6; margin-bottom: 8px;">🔵 리그 오브 레전드 내전 안내</h4>
        <p style="color: var(--text-muted); margin: 0;">리그 오브 레전드는 '소환사의 협곡' 단일 맵으로 진행되므로 맵 투표가 별도로 필요하지 않습니다!</p>
      </div>
    `;
    return;
  }

  const allMaps = GAME_MAPS[gameType] || GAME_MAPS['valo'];
  const votes = scrim.map_votes || {};
  const userNick = currentProfile?.nickname || currentUser.email.split('@')[0];

  let modeTabsHtml = '';
  if (gameType === 'ow') {
    const modes = ['all', '호위', '쟁탈', '혼합', '밀기', '플래시포인트'];
    const modeLabels = { 'all': '전체 보기', '호위': '호위', '쟁탈': '쟁탈', '혼합': '혼합', '밀기': '밀기', '플래시포인트': '플래시포인트' };
    
    modeTabsHtml = `
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
        ${modes.map(mode => `
          <button type="button" class="filter-btn ${currentOwMapMode === mode ? 'active' : ''}" style="padding: 8px 16px; font-size: 0.9rem;" onclick="setOwMapModeFilter('${scrim.id}', '${mode}')">
            ${modeLabels[mode]}
          </button>
        `).join('')}
      </div>
    `;
  }

  const maps = allMaps.filter(map => {
    if (gameType === 'ow' && currentOwMapMode !== 'all') {
      return map.mode === currentOwMapMode;
    }
    return true;
  });

  const adminResetBtnHtml = currentProfile?.is_admin ? `
    <button class="btn-danger-sm" style="padding: 6px 12px; font-size: 0.85rem;" onclick="adminResetMapVotes('${scrim.id}')">
      💥 [관리자] 맵 투표 전체 초기화
    </button>
  ` : '';

  let html = `
    <div style="margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
      <span style="font-size: 1rem; font-weight: bold; color: var(--text-color);">🎯 [${gameType.toUpperCase()}] ${scrim.title} 맵 투표 현황</span>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">참가자 인증 완료 ✔️ (1인 1표)</span>
        ${adminResetBtnHtml}
      </div>
    </div>
    ${modeTabsHtml}
    <div class="map-card-grid">
  `;

  if (maps.length === 0) {
    html += `<div class="placeholder-info" style="grid-column: 1/-1;">해당 모드에 속한 맵이 없습니다.</div>`;
  } else {
    maps.forEach(map => {
      const mapVoters = votes[map.name] || [];
      const count = mapVoters.length;
      const hasVotedThisMap = mapVoters.includes(userNick);
      const modeBadgeText = map.mode ? `<span style="background: rgba(249,115,22,0.2); color: #f97316; padding: 2px 6px; border-radius: 6px; font-size: 0.7rem; font-weight: bold; margin-left: 6px;">${map.mode}</span>` : '';

      html += `
        <div class="map-vote-card ${hasVotedThisMap ? 'voted' : ''}" onclick="submitScrimMapVote('${scrim.id}', '${map.name}')">
          <div class="map-card-bg" style="background-image: url('${map.img}');"></div>
          <div class="map-card-overlay" style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%);"></div>
          <div class="map-card-content" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; padding: 14px; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; z-index: 2;">
            
            <div style="width: 100%; margin-bottom: 6px;">
              <h3 class="map-title" style="margin: 0; color: #fff; font-size: 1.05rem; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">
                ${map.name} ${modeBadgeText}
              </h3>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <span style="background: ${hasVotedThisMap ? '#10b981' : 'rgba(0,0,0,0.6)'}; color: #fff; padding: 3px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: bold;">
                🔥 ${count}표
              </span>
              <span class="map-vote-btn" style="font-size: 0.75rem; font-weight: bold; color: ${hasVotedThisMap ? '#34d399' : '#d1d5db'}; background: rgba(0,0,0,0.4); padding: 4px 10px; border-radius: 6px;">
                ${hasVotedThisMap ? '✔️ 내 투표 완료' : '클릭하여 투표하기'}
              </span>
            </div>

          </div>
        </div>
      `;
    });
  }

  html += `</div>`;
  container.innerHTML = html;
}

function setOwMapModeFilter(scrimId, mode) {
  currentOwMapMode = mode;
  const selectedScrim = window.myActiveScrims?.find(s => s.id == scrimId);
  if (selectedScrim) renderMapVoteCards(selectedScrim);
}

async function submitScrimMapVote(scrimId, mapName) {
  if (!currentUser || !currentProfile) {
    alert('로그인 후 투표할 수 있습니다.');
    return;
  }

  const selectedScrim = window.myActiveScrims?.find(s => s.id == scrimId);
  if (!selectedScrim) return;

  if (!selectedScrim.map_votes) selectedScrim.map_votes = {};

  const userNick = currentProfile.nickname || currentUser.email.split('@')[0];

  Object.keys(selectedScrim.map_votes).forEach(m => {
    selectedScrim.map_votes[m] = (selectedScrim.map_votes[m] || []).filter(nick => nick !== userNick);
    if (selectedScrim.map_votes[m].length === 0) delete selectedScrim.map_votes[m];
  });

  const currentMapVoters = selectedScrim.map_votes[mapName] || [];
  const alreadyVoted = currentMapVoters.includes(userNick);

  if (alreadyVoted) {
    selectedScrim.map_votes[mapName] = currentMapVoters.filter(nick => nick !== userNick);
    if (selectedScrim.map_votes[mapName].length === 0) delete selectedScrim.map_votes[mapName];
  } else {
    if (!selectedScrim.map_votes[mapName]) selectedScrim.map_votes[mapName] = [];
    selectedScrim.map_votes[mapName].push(userNick);
  }

  const { error } = await supabaseClient
    .from('scrims')
    .update({ map_votes: selectedScrim.map_votes })
    .eq('id', scrimId);

  if (error) {
    alert('투표 반영 실패: ' + error.message);
    return;
  }

  renderMapVoteCards(selectedScrim);
}

async function adminResetMapVotes(scrimId) {
  if (!currentProfile?.is_admin) return;
  if (!confirm('정말 이 내전의 모든 맵 투표 기록을 전체 취소(초기화)하시겠습니까?')) return;

  const { error } = await supabaseClient.from('scrims').update({ map_votes: {} }).eq('id', scrimId);
  if (error) {
    alert('맵 투표 초기화 실패: ' + error.message);
    return;
  }

  alert('모든 맵 투표 내역이 성공적으로 초기화되었습니다!');
  const selectedScrim = window.myActiveScrims?.find(s => s.id == scrimId);
  if (selectedScrim) {
    selectedScrim.map_votes = {};
    renderMapVoteCards(selectedScrim);
  }
}

function convertTierToMMR(gameType, tierName) {
  if (!tierName) return 1200;
  const lower = tierName.toLowerCase();

  if (gameType === 'valo') {
    if (lower.includes('iron') || lower.includes('아이언')) return 800;
    if (lower.includes('bronze') || lower.includes('브론즈')) return 1000;
    if (lower.includes('silver') || lower.includes('실버')) return 1200;
    if (lower.includes('gold') || lower.includes('골드')) return 1400;
    if (lower.includes('platinum') || lower.includes('플래티넘')) return 1600;
    if (lower.includes('diamond') || lower.includes('다이아')) return 1800;
    if (lower.includes('ascendant') || lower.includes('초월자')) return 2000;
    if (lower.includes('immortal') || lower.includes('불멸')) return 2200;
    if (lower.includes('radiant') || lower.includes('레디언트')) return 2400;
  } else if (gameType === 'ow') {
    if (lower.includes('브론즈')) return 900;
    if (lower.includes('실버')) return 1100;
    if (lower.includes('골드')) return 1300;
    if (lower.includes('플래티넘')) return 1500;
    if (lower.includes('다이아몬드')) return 1700;
    if (lower.includes('마스터')) return 1900;
    if (lower.includes('그랜드마스터')) return 2100;
    if (lower.includes('챔피언') || lower.includes('챌린저')) return 2300;
  } else if (gameType === 'lol') {
    if (lower.includes('iron') || lower.includes('아이언')) return 800;
    if (lower.includes('bronze') || lower.includes('브론즈')) return 1000;
    if (lower.includes('silver') || lower.includes('실버')) return 1200;
    if (lower.includes('gold') || lower.includes('골드')) return 1400;
    if (lower.includes('platinum') || lower.includes('플래티넘')) return 1600;
    if (lower.includes('emerald') || lower.includes('에메랄드')) return 1750;
    if (lower.includes('diamond') || lower.includes('다이아')) return 1900;
    if (lower.includes('master') || lower.includes('마스터')) return 2100;
    if (lower.includes('grandmaster') || lower.includes('그랜드마스터')) return 2300;
    if (lower.includes('challenger') || lower.includes('챌린저')) return 2500;
  }

  return 1200;
}

async function adminPromptChangeMMR(userId, currentNickname, gameType) {
  if (!currentProfile?.is_admin) return;

  const targetUser = cachedAdminUsers.find(u => u.id === userId);
  const mmrKey = `${gameType}_mmr`;
  const currentMMR = targetUser ? (targetUser[mmrKey] || 1200) : 1200;
  const gameName = gameType === 'valo' ? '발로란트' : gameType === 'ow' ? '오버워치' : '롤';

  const newMMRStr = prompt(`[${currentNickname}] 선수의 ${gameName} MMR 점수를 입력하세요 (현재: ${currentMMR}점):`, currentMMR);
  if (newMMRStr === null) return;

  const newMMR = parseInt(newMMRStr, 10);
  if (isNaN(newMMR)) {
    alert('올바른 숫자 점수를 입력해 주세요.');
    return;
  }

  const updateData = {};
  updateData[mmrKey] = newMMR;

  const { error } = await supabaseClient.from('profiles').update(updateData).eq('id', userId);
  if (error) {
    alert('MMR 수정 실패: ' + error.message);
    return;
  }

  alert(`${gameName} MMR이 ${newMMR}점으로 성공적으로 수정되었습니다!`);
  loadAdminUserManager();
}

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
  initRealtimeSubscriptions();
});

let draftState = {
  active: false,
  scrimId: null,
  leaderA: null,
  leaderB: null,
  teamA: [],
  teamB: [],
  availablePlayers: [],
  turn: 'A',
  round: 1
};

async function initDraftTab() {
  const draftView = document.getElementById('draftView');
  if (!draftView) return;

  const isAdmin = currentProfile?.is_admin || false;

  const selectEl = document.getElementById('draftScrimSelect');
  if (selectEl && selectEl.value) {
    const { data: scrimData } = await supabaseClient.from('scrims').select('draft_state').eq('id', selectEl.value).single();
    if (scrimData && scrimData.draft_state && scrimData.draft_state.active) {
      draftState = scrimData.draft_state;
    }
  }

  if (!draftState.active) {
    if (!isAdmin) {
      draftView.innerHTML = `
        <h3>📋 스네이크 드래프트 턴제 지명 (관전 모드)</h3>
        <p style="color: var(--text-muted); margin-top: 10px;">현재 드래프트 방이 생성되지 않았거나, 방 생성 권한은 관리자에게만 있습니다.</p>
        <div class="placeholder-box" style="margin-top: 20px;">
          관리자가 드래프트 세션을 개설하면 실시간으로 지명 현황을 확인할 수 있습니다! 👀
        </div>
      `;
      return;
    }

    draftView.innerHTML = `
      <h3>📋 스네이크 드래프트 턴제 지명 (관리자 제어 센터)</h3>
      <p>관리자 권한으로 팀장을 지정하고 드래프트 세션을 개설할 수 있습니다.</p>
      <div class="team-control-box" style="margin-top: 20px;">
        <h3>1. 드래프트를 진행할 내전 선택</h3>
        <div class="team-action-row" style="margin-top: 10px;">
          <select id="draftScrimSelect" onchange="onDraftScrimSelected()" style="flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color); font-weight: 600;">
            <option value="">내전 목록 불러오는 중...</option>
          </select>
        </div>

        <div id="leaderSelectBox" style="margin-top: 20px; display: none;">
          <h4 style="margin-bottom: 10px;">2. 양 팀 팀장 지정 (관리자 권한)</h4>
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
          <button class="btn-primary full-width" style="margin-top: 15px;" onclick="startDraftSession()">관리자 권한으로 드래프트 방 생성 및 시작</button>
        </div>
      </div>
    `;
    await loadScrimsForDraftSelect();
  } else {
    renderDraftBoard();
  }
}

async function loadScrimsForDraftSelect() {
  const selectEl = document.getElementById('draftScrimSelect');
  if (!selectEl) return;

  try {
    const { data, error } = await supabaseClient
      .from('scrims')
      .select('id, title, game, max_players, current_players')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      selectEl.innerHTML = '<option value="">진행 중인 내전이 없습니다.</option>';
      return;
    }

    selectEl.innerHTML = '<option value="">-- 내전을 선택하세요 --</option>' + data.map(scrim => {
      return `<option value="${scrim.id}" data-game="${scrim.game}">[${(scrim.game || '').toUpperCase()}] ${scrim.title} (${scrim.current_players || 0}/${scrim.max_players}명)</option>`;
    }).join('');
  } catch (err) {
    console.error('드래프트 내전 로드 오류:', err);
    selectEl.innerHTML = '<option value="">내전 목록을 불러오는 중 오류 발생</option>';
  }
}

async function onDraftScrimSelected() {
  const selectEl = document.getElementById('draftScrimSelect');
  const leaderBox = document.getElementById('leaderSelectBox');
  if (!selectEl || !selectEl.value) {
    if (leaderBox) leaderBox.style.display = 'none';
    return;
  }

  const scrimId = selectEl.value;
  
  const { data: scrimCheck } = await supabaseClient.from('scrims').select('draft_state').eq('id', scrimId).single();
  if (scrimCheck && scrimCheck.draft_state && scrimCheck.draft_state.active) {
    draftState = scrimCheck.draft_state;
    renderDraftBoard();
    return;
  }

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

function showPlayerProfileModal(player, gameType = 'valo') {
  const existingModal = document.getElementById('playerDetailModal');
  if (existingModal) existingModal.remove();

  const valo = player.valo_info || {};
  const ow = player.ow_info || {};
  const lol = player.lol_info || {};

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
          
          <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 14px; border: 1px solid var(--border-color); ${gameType === 'valo' ? 'border-left: 5px solid #ff4757;' : ''}">
            <h4 style="margin: 0 0 8px 0; color: #ff4757;">🔴 발로란트</h4>
            <p style="margin: 4px 0; font-size: 0.9rem;">아이디: <strong>${valo.game_id || '등록 안 함'}</strong></p>
            <p style="margin: 4px 0; font-size: 0.9rem;">티어: <strong>${valo.tier || 'Unranked'}</strong> | 주포지션: <strong>${valo.main_role || '없음'}</strong></p>
            <div style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">주 선호 요원:</div>
            ${renderAgentIcons(valo.main_agents, 'valo')}
          </div>

          <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 14px; border: 1px solid var(--border-color); ${gameType === 'ow' ? 'border-left: 5px solid #f97316;' : ''}">
            <h4 style="margin: 0 0 8px 0; color: #f97316;">🟠 오버워치 2</h4>
            <p style="margin: 4px 0; font-size: 0.9rem;">배틀태그: <strong>${ow.game_id || '등록 안 함'}</strong></p>
            <p style="margin: 4px 0; font-size: 0.9rem;">티어: <strong>${ow.tier || 'Unranked'}</strong> | 주포지션: <strong>${ow.main_role || '없음'}</strong></p>
            <div style="margin-top: 6px; font-size: 0.85rem; color: var(--text-muted);">주 선호 영웅:</div>
            ${renderAgentIcons(ow.main_agents, 'ow')}
          </div>

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

async function startDraftSession() {
  if (!currentProfile?.is_admin) {
    alert('드래프트 방 생성 및 팀장 지정 권한은 관리자에게만 있습니다.');
    return;
  }

  const selectEl = document.getElementById('draftScrimSelect');
  const scrimId = selectEl?.value;
  const leaderA = document.getElementById('leaderASelect')?.value;
  const leaderB = document.getElementById('leaderBSelect')?.value;

  if (!scrimId) { alert('내전을 선택해 주세요.'); return; }
  if (!leaderA || !leaderB) { alert('A팀장과 B팀장을 모두 지정해 주세요.'); return; }
  if (leaderA === leaderB) { alert('A팀장과 B팀장은 서로 다른 유저여야 합니다.'); return; }

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

  draftState = {
    active: true,
    scrimId: scrimId,
    scrimGame: scrimGame,
    leaderA: leaderA,
    leaderB: leaderB,
    teamA: [leaderAObj],
    teamB: [leaderBObj],
    availablePlayers: remainingPlayers,
    turn: 'A',
    round: 1
  };

  await supabaseClient.from('scrims').update({ draft_state: draftState }).eq('id', scrimId);
  renderDraftBoard();
}

function renderDraftBoard() {
  const draftView = document.getElementById('draftView');
  if (!draftView) return;

  const currentTeamName = draftState.turn === 'A' ? 'BLUE TEAM (A팀)' : 'RED TEAM (B팀)';
  const gameKey = draftState.scrimGame || 'valo';
  const isAdmin = currentProfile?.is_admin || false;
  const currentTurnLeader = draftState.turn === 'A' ? draftState.leaderA : draftState.leaderB;
  const isMyTurnToPick = isAdmin || (currentUser && currentUser.id === currentTurnLeader);

  const renderCardMiniIcons = (player) => {
    let list = [];
    if (gameKey === 'valo') list = player.valo_info?.main_agents || [];
    else if (gameKey === 'ow') list = player.ow_info?.main_agents || [];
    else if (gameKey === 'lol') list = player.lol_info?.main_champs || [];

    if (list.length === 0) return '<span style="font-size: 0.75rem; color: var(--text-muted);">주력 픽 없음</span>';

    let html = '<div style="display: flex; gap: 4px; justify-content: center; margin-top: 4px;">';
    list.forEach((name) => {
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
          🎯 지명 차례: ${currentTeamName} ${isMyTurnToPick ? '(내 차례!)' : ''}
        </span>
        ${isAdmin ? `<button class="btn-danger-sm" onclick="resetDraft()">드래프트 초기화</button>` : ''}
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
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">
        ${isMyTurnToPick ? '✨ 현재 귀하의 팀 지명 차례입니다! 선수를 선택하세요.' : '👀 현재 다른 팀의 지명 차례입니다. (로스터 관전 모드)'}
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-top: 10px;">
        ${draftState.availablePlayers.map((player, idx) => `
          <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
            <div style="cursor: pointer; text-align: center;" onclick='showPlayerProfileModal(${JSON.stringify(player)}, "${gameKey}")' title="클릭하여 상세 프로필 보기">
              <div style="font-weight: 700; color: var(--text-color); font-size: 0.95rem;">${player.nickname} 🔍</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">티어: ${player.tier}</div>${renderCardMiniIcons(player)}
            </div>
            ${isMyTurnToPick ? `<button class="btn-primary" style="padding: 6px 10px; font-size: 0.85rem; width: 100%; border-radius: 8px;" onclick="selectDraftPlayer(${idx})">선수 지명하기</button>` : `<button class="btn-secondary" style="padding: 6px 10px; font-size: 0.85rem; width: 100%; border-radius: 8px;" disabled>지명 대기중</button>`}
          </div>
        `).join('') || '<div class="placeholder-info" style="grid-column: 1 / -1; text-align: center; padding: 20px;">모든 선수가 지명되었습니다! 🎉</div>'}
      </div>
    </div>
  `;
}

async function selectDraftPlayer(index) {
  if (!currentUser) {
    alert('로그인 후 이용 가능합니다.');
    return;
  }

  const currentTurnLeader = draftState.turn === 'A' ? draftState.leaderA : draftState.leaderB;
  const isAdmin = currentProfile?.is_admin || false;

  if (currentUser.id !== currentTurnLeader && !isAdmin) {
    alert(`현재 지명 권한이 없습니다! (${draftState.turn === 'A' ? 'A팀장' : 'B팀장'}만 지명할 수 있습니다)`);
    return;
  }

  const selectedPlayer = draftState.availablePlayers.splice(index, 1)[0];

  if (draftState.turn === 'A') {
    draftState.teamA.push(selectedPlayer);
    draftState.turn = 'B';
  } else {
    draftState.teamB.push(selectedPlayer);
    draftState.turn = 'A';
    draftState.round++;
  }

  await supabaseClient.from('scrims').update({ draft_state: draftState }).eq('id', draftState.scrimId);
  renderDraftBoard();
}

async function resetDraft() {
  if (!currentProfile?.is_admin) return;
  if (!confirm('드래프트를 초기화하시겠습니까?')) return;

  if (draftState.scrimId) {
    await supabaseClient.from('scrims').update({ draft_state: { active: false } }).eq('id', draftState.scrimId);
  }

  draftState.active = false;
  initDraftTab();
}

async function loadAdminScrimManager() {
  if (!currentProfile?.is_admin) return;

  const container = document.getElementById('adminScrimManagerList');
  if (!container) return;
  container.innerHTML = '<p class="placeholder-info">내전 데이터를 불러오는 중...</p>';

  const { data: scrims, error } = await supabaseClient.from('scrims').select(`
    *,
    scrim_participants (
      user_id,
      profiles ( nickname )
    )
  `).order('created_at', { ascending: false });

  if (error || !scrims) {
    container.innerHTML = '<p class="placeholder-info">내전 데이터를 불러오지 못했습니다.</p>';
    return;
  }

  if (scrims.length === 0) {
    container.innerHTML = '<p class="placeholder-info">생성된 내전이 없습니다.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  scrims.forEach(scrim => {
    const parts = scrim.scrim_participants || [];
    html += `
      <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 14px; padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <div style="font-weight: bold; font-size: 1.1rem; color: var(--text-color);">[${(scrim.game || '').toUpperCase()}] ${scrim.title}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">참가 인원: ${parts.length} / ${scrim.max_players}명 | 개설일: ${new Date(scrim.created_at).toLocaleDateString()}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">
            참가자 목록: ${parts.length > 0 ? parts.map(p => `<span style="background:rgba(99,102,241,0.15); padding:2px 6px; border-radius:4px; margin-right:4px; display:inline-block;">${p.profiles?.nickname || '알 수 없음'} <button style="background:none; border:none; color:#f43f5e; cursor:pointer; font-weight:bold;" onclick="adminForceKickUser('${scrim.id}', '${p.user_id}')" title="강제 퇴장">×</button></span>`).join('') : '없음'}
          </div>
        </div>
        <div>
          <button class="btn-danger-sm" style="padding: 8px 14px; font-size: 0.85rem;" onclick="deleteScrim('${scrim.id}'); setTimeout(loadAdminScrimManager, 500);">내전 강제 삭제</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

async function adminForceKickUser(scrimId, userId) {
  if (!currentProfile?.is_admin) return;
  if (!confirm('정말 해당 유저를 이 내전에서 강제 퇴장시키겠습니까?')) return;

  const { error } = await supabaseClient.from('scrim_participants').delete().eq('scrim_id', scrimId).eq('user_id', userId);
  if (error) {
    alert('강제 퇴장 실패: ' + error.message);
    return;
  }

  const { data: rem } = await supabaseClient.from('scrim_participants').select('id').eq('scrim_id', scrimId);
  await supabaseClient.from('scrims').update({ current_players: rem ? rem.length : 0 }).eq('id', scrimId);

  alert('성공적으로 강제 퇴장시켰습니다.');
  loadAdminScrimManager();
  fetchScrims();
}

let cachedAdminUsers = [];

async function loadAdminUserManager() {
  if (!currentProfile?.is_admin) return;

  const container = document.getElementById('adminUserListContainer');
  if (!container) return;
  container.innerHTML = '<p class="placeholder-info">유저 목록을 불러오는 중...</p>';

  const { data: users, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .order('nickname', { ascending: true });

  if (error || !users) {
    container.innerHTML = '<p class="placeholder-info">유저 목록을 불러오지 못했습니다.</p>';
    return;
  }

  cachedAdminUsers = users;
  renderAdminUserList(cachedAdminUsers);
}

function renderAdminUserList(users) {
  const container = document.getElementById('adminUserListContainer');
  if (!container) return;

  const query = window._lastAdminSearchQuery || '';

  let searchBarWrapper = document.getElementById('adminUserSearchWrapper');
  if (!searchBarWrapper) {
    searchBarWrapper = document.createElement('div');
    searchBarWrapper.id = 'adminUserSearchWrapper';
    searchBarWrapper.style.marginBottom = '16px';
    searchBarWrapper.innerHTML = `
      <input type="text" id="adminUserSearchInput" placeholder="닉네임으로 유저 검색..." oninput="filterAdminUserList()" style="width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-color); font-size: 1rem;" />
    `;
    container.prepend(searchBarWrapper);
  }

  const searchInput = document.getElementById('adminUserSearchInput');
  if (searchInput && searchInput.value !== query) {
    searchInput.value = query;
  }

  let listWrapper = document.getElementById('adminUserCardListWrapper');
  if (!listWrapper) {
    listWrapper = document.createElement('div');
    listWrapper.id = 'adminUserCardListWrapper';
    container.appendChild(listWrapper);
  }

  if (!users || users.length === 0) {
    listWrapper.innerHTML = '<p class="placeholder-info">검색된 유저가 없습니다.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
  users.forEach(user => {
    const isAdmin = user.is_admin;
    const nickname = user.nickname || '닉네임 없음';
    const userId = user.id;

    const valoMMR = user.valo_mmr || convertTierToMMR('valo', user.valo_info?.tier);
    const owMMR = user.ow_mmr || convertTierToMMR('ow', user.ow_info?.tier);
    const lolMMR = user.lol_mmr || convertTierToMMR('lol', user.lol_info?.tier);

    html += `
      <div style="background: rgba(0,0,0,0.15); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="font-size: 1.1rem; font-weight: bold; color: var(--text-color);">${nickname}</span>
            <span class="badge ${isAdmin ? 'admin' : ''}" style="font-size: 0.75rem;">${isAdmin ? '👑 관리자' : '로스터'}</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">UUID: ${userId}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            📊 MMR — 발로: <strong style="color:#ff4757;">${valoMMR}</strong> | 오버: <strong style="color:#f97316;">${owMMR}</strong> | 롤: <strong style="color:#3b82f6;">${lolMMR}</strong>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
          <div style="display: flex; gap: 4px;">
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminPromptChangeMMR('${userId}', '${nickname}', 'valo')">VAL MMR</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminPromptChangeMMR('${userId}', '${nickname}', 'ow')">OW MMR</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="adminPromptChangeMMR('${userId}', '${nickname}', 'lol')">LoL MMR</button>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="adminPromptChangeNickname('${userId}', '${nickname}')">
              닉네임 변경
            </button>
            ${userId === currentUser?.id ? 
              '<span style="font-size: 0.85rem; color: var(--text-muted); font-weight: bold; margin-left: 6px;">(본인 계정)</span>' : 
              `<button class="${isAdmin ? 'btn-secondary' : 'btn-primary'}" style="padding: 6px 14px; font-size: 0.85rem;" onclick="toggleAdminRole('${userId}',${isAdmin})">
                ${isAdmin ? '권한 회수' : '관리자 부여'}
              </button>`
            }
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  listWrapper.innerHTML = html;
}

function filterAdminUserList() {
  const searchInput = document.getElementById('adminUserSearchInput');
  if (!searchInput) return;
  const query = searchInput.value.trim().toLowerCase();
  window._lastAdminSearchQuery = query;

  const filtered = cachedAdminUsers.filter(user => {
    const nick = (user.nickname || '').toLowerCase();
    const uid = (user.id || '').toLowerCase();
    return nick.includes(query) || uid.includes(query);
  });

  renderAdminUserList(filtered);
}

async function adminPromptChangeNickname(userId, currentNickname) {
  if (!currentProfile?.is_admin) return;

  const newNickname = prompt(`[${currentNickname}] 유저의 새로운 닉네임을 입력하세요:`, currentNickname);
  if (newNickname === null) return;
  if (!newNickname.trim()) {
    alert('변경할 닉네임을 올바르게 입력해 주세요.');
    return;
  }

  const { error } = await supabaseClient.from('profiles').update({ nickname: newNickname.trim() }).eq('id', userId);
  if (error) {
    alert('닉네임 변경 실패: ' + error.message);
    return;
  }

  alert('닉네임이 성공적으로 변경되었습니다!');
  loadAdminUserManager();
}

async function toggleAdminRole(userId, currentIsAdmin) {
  if (!currentProfile?.is_admin) return;

  const actionText = currentIsAdmin ? '관리자 권한을 회수하시겠습니까?' : '관리자 권한을 부여하시겠습니까?';
  if (!confirm(actionText)) return;

  const { error } = await supabaseClient.from('profiles').update({ is_admin: !currentIsAdmin }).eq('id', userId);
  if (error) {
    alert('권한 변경 실패: ' + error.message);
    return;
  }

  alert('권한이 성공적으로 변경되었습니다!');
  loadAdminUserManager();
}

function initRealtimeSubscriptions() {
  supabaseClient
    .channel('public:scrims_realtime_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scrims' }, (payload) => {
      const updated = payload.new;

      if (typeof fetchScrims === 'function') fetchScrims();

      const teamSelectEl = document.getElementById('teamScrimSelect');
      if (teamSelectEl && updated && teamSelectEl.value == updated.id && updated.balanced_teams) {
        renderMMRTeamList('teamAList', updated.balanced_teams.teamA, updated.balanced_teams.teamA.reduce((acc, c) => acc + c.mmr, 0));
        renderMMRTeamList('teamBList', updated.balanced_teams.teamB, updated.balanced_teams.teamB.reduce((acc, c) => acc + c.mmr, 0));
      }

      if (updated && updated.draft_state) {
        draftState = updated.draft_state;
        const isDraftTabActive = document.getElementById('draftView')?.classList.contains('active');
        if (isDraftTabActive) {
          renderDraftBoard();
        }
      }

      const mapVoteSelectEl = document.getElementById('mapVoteScrimSelect');
      if (mapVoteSelectEl && updated && mapVoteSelectEl.value == updated.id) {
        if (window.myActiveScrims) {
          const target = window.myActiveScrims.find(s => s.id == updated.id);
          if (target) {
            target.map_votes = updated.map_votes;
            renderMapVoteCards(target);
          }
        }
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scrim_participants' }, () => {
      if (typeof fetchScrims === 'function') fetchScrims();
    })
    .subscribe();
}

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1561153087945703477/eTBbjMzPmAi--48NwwClNA2X4Xnk7q1vcTR_TCWb49ZJtkJhJY-Avb4jvbFO8JBFvB3l';

async function sendDiscordWebhook(message) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('여기에')) return;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message, // 디스코드 채널에 전송될 텍스트 내용
      })
    });
  } catch (err) {
    console.error('디스코드 웹훅 전송 실패:', err);
  }
}

async function createScrim(e) {
  e.preventDefault();
  const game = document.getElementById('scrimGame').value;
  const title = document.getElementById('scrimTitle').value;
  const scrimTimeVal = document.getElementById('scrimTime').value; // 일시 값 가져오기
  const max_players = parseInt(document.getElementById('scrimMax').value, 10);

  // 날짜/시간 예쁘게 포맷팅 (예: 10월 20일(화) 21:00)
  const formattedTime = scrimTimeVal ? new Date(scrimTimeVal).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }) : '일시 미정';

  const { error } = await supabaseClient.from('scrims').insert([{ 
    game, 
    title, 
    scrim_time: scrimTimeVal, // DB 컬럼 저장 (Supabase에 scrim_time 컬럼 추가 권장)
    current_players: 1, 
    max_players, 
    status: '모집 중', 
    host_id: currentUser.id 
  }]);

  if (!error) { 
    closeModal(); 
    fetchScrims(); 

    // 🚀 디스코드 웹훅 알림에 일자 및 시간 정보 추가!
    await sendDiscordWebhook(`📢 **새로운 내전이 개설되었습니다!**\n> **[${game.toUpperCase()}]** ${title}\n> ⏰ **일시:** ${formattedTime}\n> 👥 **모집 인원:** 최대 ${max_players}명\n플랫폼에서 지금 바로 참가해 보세요!`);
  } else {
    alert('내전 생성 실패: ' + error.message);
  }
}
