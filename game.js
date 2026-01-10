const app = document.getElementById("app");

let interval = null;

const state = {
  player: {
    name: "Your Player",
    rating: 65,
    stamina: 100,
    goals: 0,
  },
  match: {
    minute: 0,
    homeGoals: 0,
    awayGoals: 0,
    log: []
  }
};

// ---------- ЭКРАН ГЛАВНЫЙ ----------
function home() {
  app.innerHTML = `
    <div class="card">
      <h1>⚽ Football Career</h1>
      <p>Realistic Football Simulator</p>
      <button onclick="startCareer()">Start Career</button>
    </div>
  `;
}

// ---------- ЭКРАН КАРЬЕРЫ ----------
function startCareer() {
  app.innerHTML = `
    <div class="card">
      <h2>👤 Player Profile</h2>
      <div class="stat"><span>Rating</span><span>${state.player.rating}</span></div>
      <div class="progress"><div style="width:${state.player.rating}%"></div></div>
      <div class="stat"><span>Stamina</span><span>${state.player.stamina}%</span></div>
      <div class="progress"><div style="width:${state.player.stamina}%"></div></div>
      <button onclick="startMatch()">Play Match</button>
    </div>
  `;
}

// ---------- МАТЧ ----------
function startMatch() {
  state.match.minute = 0;
  state.match.homeGoals = 0;
  state.match.awayGoals = 0;
  state.match.log = [];

  renderMatch();

  interval = setInterval(() => {
    state.match.minute++;

    simulateEvent();
    renderMatch();

    if (state.match.minute >= 90) {
      clearInterval(interval);
      endMatch();
    }
  }, 500);
}

function simulateEvent() {
  const chance = Math.random() * 100;

  if (chance < state.player.rating / 3) {
    state.match.homeGoals++;
    state.player.goals++;
    state.match.log.unshift(`⚽ ${state.match.minute}' GOAL by you!`);
  } else if (chance > 95) {
    state.match.awayGoals++;
    state.match.log.unshift(`⚽ ${state.match.minute}' Opponent scores`);
  }

  state.player.stamina = Math.max(0, state.player.stamina - 0.6);
}

function renderMatch() {
  app.innerHTML = `
    <div class="card match-header">
      <h2>🏟 Match</h2>
      <strong>${state.match.minute}'</strong>
    </div>

    <div class="card">
      <h2>${state.match.homeGoals} : ${state.match.awayGoals}</h2>
      <div class="stat"><span>Stamina</span><span>${Math.round(state.player.stamina)}%</span></div>
      <div class="progress"><div style="width:${state.player.stamina}%"></div></div>
    </div>

    <div class="card">
      <h2>Live events</h2>
      ${state.match.log.slice(0,5).map(e => `<div class="log">${e}</div>`).join("")}
    </div>
  `;
}

function endMatch() {
  state.player.rating += state.match.homeGoals > 0 ? 1 : 0;

  app.innerHTML += `
    <div class="card">
      <h2>🏁 Match End</h2>
      <p>Final score: ${state.match.homeGoals}:${state.match.awayGoals}</p>
      <button onclick="startCareer()">Continue</button>
    </div>
  `;
}

// ---------- START ----------
home();