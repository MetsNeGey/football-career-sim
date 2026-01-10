/* Football Career — расширенный прототип
   Русский интерфейс, реалистичная модель матчей, таблица лиги, календарь, профиль, трансферы, трофеи.
*/

const app = document.getElementById('app');

// ----- КЛУБЫ (англ названия) -----
const CLUBS = [
  "Real Madrid","FC Barcelona","Manchester United","Liverpool",
  "Juventus","Bayern Munich","PSG","Chelsea","Atletico Madrid","Manchester City"
];

// ----- ПАРАМЕТРЫ -----
const MATCH_MINUTE_MS = 350; // скорость проигрывания минуты матча в прототипе
const HOME_ADV = 0.20; // домашнее преимущество в lambda
const BASE_ATTACK = 1.15; // базовая вероятность голов (чем больше, тем больше голов)

// ----- ИНИЦИАЛИЗАЦИЯ И СОХРАНЕНИЕ -----
let career = loadCareer();

function loadCareer(){
  const raw = localStorage.getItem('career_v2');
  if(raw) {
    try { return JSON.parse(raw); } catch(e){ }
  }
  // дефолт (если нет сохранения)
  return {
    player: createDefaultPlayer(),
    club: CLUBS[0],
    season: 1,
    trophies: [],
    matchHistory: [],
    transferHistory: [],
    leagueTable: [],
    fixtures: [], // каждый матч: {round, home, away, played, score}
  };
}

function saveCareer(){ localStorage.setItem('career_v2', JSON.stringify(career)); }

// ----- ВСПОМОГАТЕЛЬНЫЕ -----
function createDefaultPlayer(){
  return {
    name: "Игрок",
    position: "ST",
    rating: 66,
    stamina: 100,
    goals: 0,
    assists: 0,
    speed: 66,
    dribbling: 64,
    shooting: 66,
    defense: 40,
    transferCost: 6_000_000
  };
}

function rndChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// ----- НОВАЯ КАРЬЕРА: выбор клуба и генерация календаря -----
function newCareerStart(){
  app.innerHTML = `
    <div class="card">
      <div class="header">
        <div class="title"><div class="logo">FC</div><div><div class="h1">Новая карьера</div><div class="small">Выберите клуб</div></div></div>
      </div>
      <div style="height:10px"></div>
      <div class="card">
        <div class="small-muted">Нажмите на клуб, чтобы выбрать стартовый клуб для вашей карьеры</div>
        <div class="club-select" id="clubList"></div>
      </div>
      <div class="small-muted">Игрок: Имя — <strong>${career.player.name}</strong> (можно изменить позже)</div>
      <div style="height:8px"></div>
      <button onclick="home()">Отмена</button>
    </div>
  `;
  const list = document.getElementById('clubList');
  CLUBS.forEach(c=>{
    const el = document.createElement('div');
    el.className='club-card';
    el.innerHTML = `<strong>${c}</strong><div class="small-muted">Средняя сила</div>`;
    el.onclick = ()=>{
      career = {
        player: createDefaultPlayer(),
        club: c,
        season: 1,
        trophies: [],
        matchHistory: [],
        transferHistory: [{club: c, season: 1, cost: 0}],
        leagueTable: [],
        fixtures: generateFixtures(CLU BS_SAFE())
      };
      career.fixtures = generateFixtures(CLU BS_SAFE()); // generate after club set
      career.leagueTable = createEmptyTable(CLUBS);
      scheduleSeasonFixtures();
      saveCareer();
      careerScreen();
    };
    list.appendChild(el);
  });

  // helper to avoid broken tokenization of CLUBS inside template
  function CLU BS_SAFE(){ return CLUBS; }
}

// ----- ГЕНЕРАЦИЯ ФИКСТУР: двукруговой календарь -----
function generateFixtures(clubs){
  // round-robin algorithm: generate rounds for first leg, then mirror for second leg
  const n = clubs.length;
  const rounds = [];
  const arr = clubs.slice();
  if(n % 2 === 1) arr.push(null); // bye if odd
  const m = arr.length;
  for(let r=0;r<m-1;r++){
    const pairs = [];
    for(let i=0;i<m/2;i++){
      const a = arr[i];
      const b = arr[m-1-i];
      if(a && b){
        // alternate home/away between rounds
        pairs.push({home: a, away: b});
      }
    }
    // rotate
    arr.splice(1,0,arr.pop());
    rounds.push(pairs);
  }
  // flatten to fixtures with rounds numbers; create second leg with reversed home/away
  const fixtures = [];
  for(let r=0;r<rounds.length;r++){
    rounds[r].forEach(p=>{
      fixtures.push({round: r+1, home: p.home, away: p.away, played:false, score:null});
    });
  }
  // second half
  const secondStart = fixtures.length;
  for(let r=0;r<rounds.length;r++){
    rounds[r].forEach(p=>{
      fixtures.push({round: rounds.length + r + 1, home: p.away, away: p.home, played:false, score:null});
    });
  }
  return fixtures;
}

// schedule helper to set career.fixtures if not set and ensure home/away available
function scheduleSeasonFixtures(){
  if(!career.fixtures || career.fixtures.length===0){
    career.fixtures = generateFixtures(CLUBS);
  }
  career.leagueTable = createEmptyTable(CLUBS);
  saveCareer();
}

// ----- ТАБЛИЦА ЛИГИ -----
function createEmptyTable(clubs){
  return clubs.map(c => ({club:c, played:0, wins:0, draws:0, losses:0, gf:0, ga:0, gd:0, pts:0}));
}

function updateTableFromResult(home, away, hg, ag){
  const table = career.leagueTable;
  const homeRow = table.find(r=>r.club===home);
  const awayRow = table.find(r=>r.club===away);
  if(!homeRow || !awayRow) return;
  homeRow.played++; awayRow.played++;
  homeRow.gf += hg; homeRow.ga += ag; homeRow.gd = homeRow.gf - homeRow.ga;
  awayRow.gf += ag; awayRow.ga += hg; awayRow.gd = awayRow.gf - awayRow.ga;
  if(hg>ag){ homeRow.wins++; awayRow.losses++; homeRow.pts += 3; }
  else if(hg<ag){ awayRow.wins++; homeRow.losses++; awayRow.pts += 3; }
  else { homeRow.draws++; awayRow.draws++; homeRow.pts++; awayRow.pts++; }
}

// ----- МАТЧ: реалистичная модель голов (Poisson) -----
function teamStrengthForClub(club){
  // базовая сила клуба можно задать в зависимости от позиции в CLUBS, но для простоты
  // assign stronger teams higher values
  const baseIndex = Math.max(0, CLUBS.indexOf(club));
  // stronger teams at start of array? We'll give City, Madrid, Barca high base:
  const profile = {
    "Real Madrid": 80,"FC Barcelona":79,"Manchester United":75,"Liverpool":78,
    "Juventus":74,"Bayern Munich":82,"PSG":80,"Chelsea":76,"Atletico Madrid":73,"Manchester City":85
  };
  return profile[club] || 70;
}

function poissonRandom(lambda){
  // Knuth algorithm
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

function simulateMatchResult(home, away){
  // compute lambda (expected goals) for each side
  const homeStrength = teamStrengthForClub(home);
  const awayStrength = teamStrengthForClub(away);

  // player influence: player's rating gives small boost to home team if playing for them
  const playerPlaysForHome = (career.club === home);
  const playerInfluence = playerPlaysForHome ? (career.player.rating - 65) * 0.02 : 0;

  const attackHome = BASE_ATTACK + (homeStrength - awayStrength)/60 + HOME_ADV + playerInfluence;
  const attackAway = BASE_ATTACK + (awayStrength - homeStrength)/60 + (playerPlaysForHome ? -playerInfluence : 0);

  // clamp lambdas so typical match yields 0-4 goals per side
  const lambdaHome = clamp(attackHome, 0.4, 2.4);
  const lambdaAway = clamp(attackAway, 0.3, 2.1);

  const hg = poissonRandom(lambdaHome);
  const ag = poissonRandom(lambdaAway);

  // produce goal times distributed across 1..90
  const timesHome = distributeGoalsAcrossMinutes(hg);
  const timesAway = distributeGoalsAcrossMinutes(ag);

  return {hg, ag, timesHome, timesAway};
}

function distributeGoalsAcrossMinutes(n){
  const arr = [];
  for(let i=0;i<n;i++){
    // avoid too many clustered at minute 1 => uniform across 1..90 but prefer later minutes slightly
    const minute = Math.floor(1 + Math.pow(Math.random(), 0.6) * 89);
    arr.push(minute);
  }
  return arr.sort((a,b)=>a-b);
}

// ----- UI: Главная -----
function home(){
  saveCareer();
  app.innerHTML = `
  <div class="card header">
    <div class="title">
      <div class="logo">FC</div>
      <div>
        <div class="h1">Football Career</div>
        <div class="small">Полноценная карьера — прототип</div>
      </div>
    </div>
    <div><div class="small-muted">Сезон ${career.season} • Клуб: ${career.club}</div></div>
  </div>

  <div class="card">
    <div class="menu-buttons">
      <button onclick="careerScreen()">Продолжить карьеру</button>
      <button onclick="newCareerDialog()">Новая карьера</button>
      <button class="btn-ghost" onclick="playerProfile()">Профиль игрока</button>
    </div>
  </div>
  <div class="card">
    <div class="small-muted">Быстрые ссылки</div>
    <div class="row" style="margin-top:8px">
      <button class="btn-ghost" style="flex:1" onclick="showLeagueTable()">Таблица лиги</button>
      <button class="btn-ghost" style="flex:1" onclick="showFixtures()">Календарь</button>
    </div>
  </div>
  `;
}

// ----- Диалог новой карьеры (выбор клуба) -----
function newCareerDialog(){
  app.innerHTML = `
    <div class="card">
      <div class="h1">Новая карьера</div>
      <div class="small-muted">Выберите клуб и создайте игрока</div>
    </div>
    <div class="card">
      <div class="small-muted">Выберите клуб</div>
      <div id="clubgrid" class="club-select"></div>
      <div style="height:8px"></div>
      <div class="small-muted">Укажите имя игрока</div>
      <input id="playerName" placeholder="Введите имя" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-top:8px;background:transparent;color:#fff"/>
      <div style="height:8px"></div>
      <div class="row">
        <button onclick="createNewCareer()">Создать</button>
        <button class="btn-ghost" onclick="home()">Отмена</button>
      </div>
    </div>
  `;
  const grid = document.getElementById('clubgrid');
  CLUBS.forEach(c=>{
    const el = document.createElement('div');
    el.className='club-card';
    el.innerHTML = `<strong>${c}</strong><div class="small-muted">Сила: ${teamStrengthForClub(c)}</div>`;
    el.onclick = ()=> {
      document.querySelectorAll('.club-card').forEach(x=>x.style.boxShadow='none');
      el.style.boxShadow = 'inset 0 0 0 2px rgba(0,230,118,0.15)';
      el.dataset.selected = '1';
      document.selectedClub = c;
    };
    grid.appendChild(el);
  });
}

function createNewCareer(){
  const nameInput = document.getElementById('playerName');
  const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Игрок';
  const club = document.selectedClub || CLUBS[Math.floor(Math.random()*CLUBS.length)];
  career = {
    player: {...createDefaultPlayer(), name},
    club,
    season: 1,
    trophies: [],
    matchHistory: [],
    transferHistory: [{club, season:1, cost:0}],
    fixtures: generateFixtures(CLUBS),
    leagueTable: createEmptyTable(CLUBS)
  };
  scheduleSeasonFixtures();
  saveCareer();
  careerScreen();
}

// ----- Экран карьеры -----
function careerScreen(){
  saveCareer();
  const p = career.player;
  app.innerHTML = `
    <div class="card header">
      <div class="title"><div class="logo">FC</div><div><div class="h1">${career.club}</div><div class="small">Сезон ${career.season}</div></div></div>
      <div class="small-muted">Игрок: ${p.name} • Рейтинг ${p.rating}</div>
    </div>

    <div class="card">
      <div style="display:flex;gap:12px;align-items:center">
        <div style="flex:1">
          <div class="stat"><div>Рейтинг</div><div>${p.rating}</div></div>
          <div class="progress"><div style="width:${p.rating}%"></div></div>
          <div class="stat"><div>Выносливость</div><div>${Math.round(p.stamina)}%</div></div>
          <div class="progress"><div style="width:${p.stamina}%"></div></div>
        </div>
        <div style="width:120px;text-align:center">
          <div style="font-size:20px;font-weight:700">${p.goals}</div>
          <div class="small-muted">Голы</div>
          <div style="height:8px"></div>
          <div style="font-size:20px;font-weight:700">${p.assists}</div>
          <div class="small-muted">Ассисты</div>
        </div>
      </div>

      <div style="height:8px"></div>
      <div class="menu-buttons">
        <button onclick="playNextUnplayedFixture()">Играть следующий матч</button>
        <button class="btn-ghost" onclick="showFixtures()">Календарь</button>
        <button class="btn-ghost" onclick="showLeagueTable()">Таблица лиги</button>
        <button class="btn-ghost" onclick="playerProfile()">Профиль игрока</button>
      </div>
    </div>
  `;
}

// ----- КАЛЕНДАРЬ (список матчей) -----
function showFixtures(){
  saveCareer();
  const list = career.fixtures.map((m, i)=>{
    return `<div class="stat">${m.round}. ${m.home} — ${m.away} ${m.played ? ' • ' + m.score : ''} <button onclick="playFixture(${i})" style="margin-left:8px" class="btn-ghost">Играть</button></div>`;
  }).join('');
  app.innerHTML = `
    <div class="card">
      <div class="h1">Календарь сезона</div>
      <div class="small-muted">Нажмите «Играть» чтобы провести матч</div>
    </div>
    <div class="card">${list}</div>
    <div class="card"><button onclick="careerScreen()">Назад</button></div>
  `;
}

function playNextUnplayedFixture(){
  const idx = career.fixtures.findIndex(m=>!m.played);
  if(idx===-1){ alert('Сезон окончен — переход к следующему сезону'); career.season++; career.fixtures = generateFixtures(CLUBS); career.leagueTable = createEmptyTable(CLUBS); saveCareer(); careerScreen(); return; }
  playFixture(idx);
}

function playFixture(index){
  const fixture = career.fixtures[index];
  if(!fixture) return;
  matchScreen(fixture, index);
}

// ----- Таблица лиги -----
function showLeagueTable(){
  // sort
  career.leagueTable.sort((a,b)=>{
    if(b.pts!==a.pts) return b.pts - a.pts;
    if(b.gd!==a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  const rows = career.leagueTable.map((r, i)=>{
    return `<tr>
      <td>${i+1}. ${r.club}</td>
      <td>${r.played}</td>
      <td>${r.wins}</td>
      <td>${r.draws}</td>
      <td>${r.losses}</td>
      <td>${r.gf}</td>
      <td>${r.ga}</td>
      <td>${r.gd}</td>
      <td><strong>${r.pts}</strong></td>
    </tr>`;
  }).join('');
  app.innerHTML = `
    <div class="card">
      <div class="h1">Турнирная таблица</div>
      <div class="small-muted">Позиции обновляются после каждого сыгранного матча</div>
    </div>
    <div class="card">
      <table class="table">
        <thead><tr><th>Клуб</th><th>И</th><th>В</th><th>Н</th><th>П</th><th>±</th><th>Проп.</th><th>Рзн</th><th>О</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="card"><button onclick="careerScreen()">Назад</button></div>
  `;
}

// ----- ПРОФИЛЬ ИГРОКА -----
function playerProfile(){
  const p = career.player;
  app.innerHTML = `
    <div class="card">
      <div class="h1">Профиль игрока</div>
      <div class="small-muted">Имя и основные навыки</div>
    </div>
    <div class="card">
      <div class="stat"><div>Имя</div><div>${p.name}</div></div>
      <div class="stat"><div>Позиция</div><div>${p.position}</div></div>
      <div class="stat"><div>Рейтинг</div><div>${p.rating}</div></div>
      <div class="progress"><div style="width:${p.rating}%"></div></div>
      <div class="stat"><div>Скорость</div><div>${p.speed}</div></div>
      <div class="progress"><div style="width:${p.speed}%"></div></div>
      <div class="stat"><div>Дриблинг</div><div>${p.dribbling}</div></div>
      <div class="progress"><div style="width:${p.dribbling}%"></div></div>
      <div class="stat"><div>Удар</div><div>${p.shooting}</div></div>
      <div class="progress"><div style="width:${p.shooting}%"></div></div>
      <div class="stat"><div>Защита</div><div>${p.defense}</div></div>
      <div class="progress"><div style="width:${p.defense}%"></div></div>
      <div class="stat"><div>Стоимость трансфера</div><div>$${p.transferCost.toLocaleString()}</div></div>
    </div>
    <div class="card">
      <div class="menu-buttons">
        <button onclick="home()">Назад</button>
        <button class="btn-ghost" onclick="showTransferHistory()">История трансферов</button>
        <button class="btn-ghost" onclick="showTrophies()">Трофейная комната</button>
      </div>
    </div>
  `;
}

// ----- ТРОФЕИ -----
function showTrophies(){
  const html = career.trophies.length ? career.trophies.map(t=>`<div class="log">🏆 ${t}</div>`).join('') : '<div class="small-muted">Трофеев нет</div>';
  app.innerHTML = `
    <div class="card">
      <div class="h1">Трофейная комната</div>
      <div class="small-muted">Все завоёванные трофеи</div>
    </div>
    <div class="card">${html}</div>
    <div class="card"><button onclick="careerScreen()">Назад</button></div>
  `;
}

// ----- ИСТОРИЯ ТРАНСФЕРОВ -----
function showTransferHistory(){
  const html = career.transferHistory.length ? career.transferHistory.map(t=>`<div class="log">Сезон ${t.season}: ${t.club} • $${t.cost.toLocaleString()}</div>`).join('') : '<div class="small-muted">Трансферов нет</div>';
  app.innerHTML = `
    <div class="card">
      <div class="h1">История трансферов</div>
      <div class="small-muted">Все переходы игрока</div>
    </div>
    <div class="card">${html}</div>
    <div class="card"><button onclick="careerScreen()">Назад</button></div>
  `;
}

// ----- ЭКРАН МАТЧА (таймер, лог событий, реалистичные голы) -----
function matchScreen(fixture, index){
  // compute match result in advance using Poisson, but reveal goals over time
  const {hg, ag, timesHome, timesAway} = simulateMatchResult(fixture.home, fixture.away);
  const pPlaysHome = career.club === fixture.home;
  let minute = 0;
  let homeGoals = 0, awayGoals = 0;
  let log = [];

  // mark fixture as played only at the end to allow replay if needed? We'll mark played true to avoid repeated playing:
  // but we will set played at end.

  function render(){
    app.innerHTML = `
      <div class="card match-header">
        <div>
          <div class="h1">${fixture.home} ${homeGoals}:${awayGoals} ${fixture.away}</div>
          <div class="small-muted">Текущая минута: ${minute}'</div>
        </div>
        <div class="small-muted">Сезон ${career.season}</div>
      </div>

      <div class="card">
        <div class="stat"><div>Выносливость</div><div>${Math.round(career.player.stamina)}%</div></div>
        <div class="progress"><div style="width:${career.player.stamina}%"></div></div>
      </div>

      <div class="card">
        <h3>События</h3>
        ${log.slice(0,6).map(l=>`<div class="log">${l}</div>`).join('')}
      </div>

      <div class="card footer-row">
        <button onclick="stopMatchAndReturn()">Остановить и вернуться</button>
        <div class="small-muted">Голы по плану: ${hg}:${ag}</div>
      </div>
    `;
  }

  let interval = setInterval(()=>{
    minute++;
    // check if a goal scheduled in this minute
    while(timesHome.includes(minute)){
      homeGoals++;
      log.unshift(`${minute}' ⚽ Гол — ${fixture.home} (${homeGoals})`);
      timesHome.splice(timesHome.indexOf(minute),1);
      if(career.club===fixture.home){ career.player.goals++; career.player.rating = clamp(career.player.rating + 1, 40, 95); }
    }
    while(timesAway.includes(minute)){
      awayGoals++;
      log.unshift(`${minute}' ⚽ Гол — ${fixture.away} (${awayGoals})`);
      timesAway.splice(timesAway.indexOf(minute),1);
      if(career.club===fixture.away){ career.player.goals++; career.player.rating = clamp(career.player.rating + 1, 40, 95); }
    }
    // small random events: yellow card, injury (rare)
    if(Math.random() < 0.01) log.unshift(`${minute}' 🟨 Желтая карточка`);
    if(Math.random() < 0.004){
      log.unshift(`${minute}' 🩹 Травма — игрок может быть заменен`);
      // stamina drop
      career.player.stamina = Math.max(10, career.player.stamina - 15);
    }
    // stamina decrease gradually
    career.player.stamina = Math.max(0, career.player.stamina - 0.4);
    render();
    if(minute >= 90){
      clearInterval(interval);
      // finalize score and update table/history
      fixture.played = true;
      const score = `${homeGoals}:${awayGoals}`;
      fixture.score = score;
      career.matchHistory.push({round:fixture.round, home:fixture.home, away:fixture.away, score, season:career.season});
      updateTableFromResult(fixture.home, fixture.away, homeGoals, awayGoals);
      // chance for trophy (low) — e.g., if you win many matches you may get trophy eventually; simple rule:
      if(fixture.home === career.club && homeGoals > awayGoals && Math.random() < 0.03){
        career.trophies.push(`Кубок: Победа в матче ${fixture.round}`);
      }
      // rating change: win +1, loss -1, draw 0
      if((career.club === fixture.home && homeGoals > awayGoals) || (career.club === fixture.away && awayGoals > homeGoals)){
        career.player.rating = clamp(career.player.rating + 1, 40, 95);
      } else if((career.club === fixture.home && homeGoals < awayGoals) || (career.club === fixture.away && awayGoals < homeGoals)){
        career.player.rating = clamp(career.player.rating - 1, 40, 95);
      }
      saveCareer();
      renderMatchEnd(fixture, score);
    }
  }, MATCH_MINUTE_MS);

  function stopMatchAndReturn(){
    clearInterval(interval);
    // keep progress so far (but do not finalize fixture)
    career.player.stamina = clamp(career.player.stamina,0,100);
    saveCareer();
    careerScreen();
  }

  render();
}

function renderMatchEnd(fixture, score){
  app.innerHTML = `
    <div class="card">
      <h2>Матч окончен</h2>
      <div class="small-muted">${fixture.home} ${score} ${fixture.away}</div>
    </div>
    <div class="card">
      <div class="menu-buttons">
        <button onclick="careerScreen()">Назад в карьеру</button>
        <button class="btn-ghost" onclick="showLeagueTable()">Посмотреть таблицу</button>
        <button class="btn-ghost" onclick="showFixtures()">Календарь</button>
      </div>
    </div>
  `;
}

// ----- Утилиты для отладки -----
function resetStorage(){
  localStorage.removeItem('career_v2');
  career = loadCareer();
  home();
}

// Start
if(!career.fixtures || career.fixtures.length === 0){
  career.fixtures = generateFixtures(CLUBS);
  career.leagueTable = createEmptyTable(CLUBS);
}
home();