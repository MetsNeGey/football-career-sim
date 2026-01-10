const app = document.getElementById("app");

// ------------------ НАСТРОЙКИ ------------------
const clubs = ["Real Madrid", "FC Barcelona", "Manchester United", "Liverpool", "Juventus", "Bayern Munich", "PSG", "Chelsea"];
const seasonsTotal = 30;

// ------------------ СОХРАНЕНИЕ ------------------
let career = JSON.parse(localStorage.getItem("career")) || {
  player: {
    name: "Игрок",
    position: "ST",
    rating: 65,
    stamina: 100,
    goals: 0,
    assists: 0,
    speed: 65,
    dribbling: 60,
    shooting: 62,
    defense: 40,
    transferCost: 5_000_000
  },
  club: clubs[Math.floor(Math.random()*clubs.length)],
  season: 1,
  trophies: [],
  matchHistory: [],
  transferHistory: [],
  calendar: []
};

// ------------------ ФУНКЦИИ ------------------

// ---------- СОХРАНЕНИЕ ----------
function saveCareer(){ localStorage.setItem("career", JSON.stringify(career)); }

// ---------- ГЛАВНОЕ МЕНЮ ----------
function home(){
  app.innerHTML = `
    <div class="card">
      <h1>⚽ Football Career</h1>
      <div class="menu-buttons">
        <button onclick="careerScreen()">Продолжить карьеру</button>
        <button onclick="newCareer()">Новая карьера</button>
        <button onclick="playerProfile()">Профиль игрока</button>
        <button onclick="showTransferHistory()">История трансферов</button>
        <button onclick="showTrophies()">Трофейная комната</button>
      </div>
    </div>
  `;
}

// ---------- НОВАЯ КАРЬЕРА ----------
function newCareer(){
  career = {
    player: {
      name: "Игрок",
      position: "ST",
      rating: 65,
      stamina: 100,
      goals: 0,
      assists: 0,
      speed: 65,
      dribbling: 60,
      shooting: 62,
      defense: 40,
      transferCost: 5_000_000
    },
    club: clubs[Math.floor(Math.random()*clubs.length)],
    season: 1,
    trophies: [],
    matchHistory: [],
    transferHistory: [{club: clubs[Math.floor(Math.random()*clubs.length)], season: 1, cost: 0}],
    calendar: generateCalendar()
  };
  saveCareer();
  careerScreen();
}

// ---------- КАЛЕНДАРЬ СЕЗОНА ----------
function generateCalendar(){
  let cal = [];
  for(let i=0;i<seasonsTotal;i++){
    let opponent = clubs[Math.floor(Math.random()*clubs.length)];
    while(opponent === career.club) opponent = clubs[Math.floor(Math.random()*clubs.length)];
    cal.push({week:i+1, opponent, played:false, score:null});
  }
  return cal;
}

// ---------- ПРОФИЛЬ ИГРОКА ----------
function playerProfile(){
  let p = career.player;
  app.innerHTML = `
    <div class="card">
      <h2>Профиль игрока: ${p.name}</h2>
      <div class="stat">Позиция: ${p.position}</div>
      <div class="stat">Рейтинг: ${p.rating}</div>
      <div class="progress"><div style="width:${p.rating}%"></div></div>
      <div class="stat">Выносливость: ${p.stamina}%</div>
      <div class="progress"><div style="width:${p.stamina}%"></div></div>
      <div class="stat">Скорость: ${p.speed}</div>
      <div class="progress"><div style="width:${p.speed}%"></div></div>
      <div class="stat">Дриблинг: ${p.dribbling}</div>
      <div class="progress"><div style="width:${p.dribbling}%"></div></div>
      <div class="stat">Удар: ${p.shooting}</div>
      <div class="progress"><div style="width:${p.shooting}%"></div></div>
      <div class="stat">Защита: ${p.defense}</div>
      <div class="progress"><div style="width:${p.defense}%"></div></div>
      <div class="stat">Стоимость трансфера: $${p.transferCost.toLocaleString()}</div>
      <button onclick="home()">Назад</button>
    </div>
  `;
}

// ---------- ЭКРАН КАРЬЕРЫ ----------
function careerScreen(){
  let calendarHtml = career.calendar.map(match => {
    return `<div class="stat">Неделя ${match.week}: ${career.club} vs ${match.opponent} ${match.played ? ' - '+match.score : ''}</div>`;
  }).join("");

  app.innerHTML = `
    <div class="card">
      <h2>Клуб: ${career.club}</h2>
      <div class="stat">Рейтинг игрока: ${career.player.rating}</div>
      <div class="stat">Выносливость: ${career.player.stamina}%</div>
      <div class="stat">Голы: ${career.player.goals}</div>
      <div class="stat">Ассисты: ${career.player.assists}</div>
      <div class="menu-buttons">
        <button onclick="playNextMatch()">Следующий матч</button>
        <button onclick="showCalendar()">Календарь сезона</button>
        <button onclick="playerProfile()">Профиль игрока</button>
        <button onclick="showTrophies()">Трофейная комната</button>
        <button onclick="showTransferHistory()">История трансферов</button>
      </div>
    </div>
    <div class="card">
      <h3>Предстоящие матчи</h3>
      ${calendarHtml}
    </div>
  `;
}

// ---------- МАТЧ ----------
function playNextMatch(){
  let nextMatch = career.calendar.find(m => !m.played);
  if(!nextMatch){
    alert("Сезон окончен!");
    career.season++;
    career.calendar = generateCalendar();
    saveCareer();
    careerScreen();
    return;
  }
  matchScreen(nextMatch);
}

// ---------- ЭКРАН МАТЧА ----------
function matchScreen(match){
  let minute = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  let log = [];

  function simulateMinute(){
    minute++;
    if(Math.random()*100 < career.player.rating/3){
      homeGoals++;
      career.player.goals++;
      log.unshift(`${minute}' ⚽ Вы забили гол!`);
    }
    if(Math.random()*100 > 95){
      awayGoals++;
      log.unshift(`${minute}' ⚽ Противник забивает`);
    }
    career.player.stamina = Math.max(0, career.player.stamina - 0.5);
    renderMatch();
    if(minute >= 90){
      clearInterval(interval);
      match.played = true;
      match.score = `${homeGoals}:${awayGoals}`;
      career.matchHistory.push(match);
      // шанс на трофей
      if(homeGoals>awayGoals && Math.random()<0.05){
        career.trophies.push(`Кубок недели ${match.week}`);
      }
      saveCareer();
    }
  }

  function renderMatch(){
    app.innerHTML = `
      <div class="card match-header">
        <h2>${career.club} ${homeGoals}:${awayGoals} ${match.opponent}</h2>
        <strong>${minute}'</strong>
      </div>
      <div class="card">
        <div class="stat">Выносливость: ${Math.round(career.player.stamina)}%</div>
        <div class="progress"><div style="width:${career.player.stamina}%"></div></div>
      </div>
      <div class="card">
        <h3>События матча</h3>
        ${log.slice(0,5).map(e=>`<div class="log">${e}</div>`).join("")}
      </div>
      <button onclick="careerScreen()">Назад в карьеру</button>
    `;
  }

  renderMatch();
  let interval = setInterval(simulateMinute, 300);
}

// ---------- КАЛЕНДАРЬ СЕЗОНА ----------
function showCalendar(){
  let calendarHtml = career.calendar.map(match => {
    return `<div class="stat">Неделя ${match.week}: ${career.club} vs ${match.opponent} ${match.played ? ' - '+match.score : ''}</div>`;
  }).join("");
  app.innerHTML = `
    <div class="card">
      <h2>Календарь сезона</h2>
      ${calendarHtml}
      <button onclick="careerScreen()">Назад</button>
    </div>
  `;
}

// ---------- ТРОФЕИ ----------
function showTrophies(){
  let trophiesHtml = career.trophies.length ? career.trophies.map(t => `<div class="log">${t}</div>`).join("") : "Нет трофеев";
  app.innerHTML = `
    <div class="card">
      <h2>Трофейная комната</h2>
      ${trophiesHtml}
      <button onclick="careerScreen()">Назад</button>
    </div>
  `;
}

// ---------- ИСТОРИЯ ТРАНСФЕРОВ ----------
function showTransferHistory(){
  let historyHtml = career.transferHistory.length ? career.transferHistory.map(t => `<div class="log">Сезон ${t.season}: ${t.club} (Стоимость: $${t.cost.toLocaleString()})</div>`).join("") : "Нет трансферов";
  app.innerHTML = `
    <div class="card">
      <h2>История трансферов</h2>
      ${historyHtml}
      <button onclick="careerScreen()">Назад</button>
    </div>
  `;
}

// ------------------ СТАРТ ------------------
home();