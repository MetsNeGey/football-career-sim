const app = document.getElementById("app");
const params = new URLSearchParams(window.location.search);

const target = params.get("target") || "home";
const mode = params.get("mode") || "player";

const state = {
  player: {
    name: "Player One",
    position: "ST",
    rating: 65,
    goals: 0
  },
  career: {
    mode,
    club: "FC Start",
    season: 1
  }
};

function home() {
  app.innerHTML = `
    <h1>⚽ Football Career</h1>
    <button onclick="start('player')">Career: Player</button>
    <button onclick="start('manager')">Career: Manager</button>
  `;
}

function start(m) {
  state.career.mode = m;
  career();
}

function career() {
  app.innerHTML = `
    <h2>${state.career.mode.toUpperCase()} CAREER</h2>
    <p>Club: ${state.career.club}</p>
    <p>Season: ${state.career.season}</p>
    <button onclick="match()">Play Match</button>
    <button onclick="profile()">Profile</button>
  `;
}

function match() {
  const goals = Math.floor(Math.random() * 3);
  state.player.goals += goals;
  state.player.rating += goals;

  app.innerHTML = `
    <h2>🏟 Match Finished</h2>
    <p>Goals scored: ${goals}</p>
    <button onclick="career()">Back</button>
  `;
}

function profile() {
  app.innerHTML = `
    <h2>👤 Profile</h2>
    <p>Name: ${state.player.name}</p>
    <p>Rating: ${state.player.rating}</p>
    <p>Goals: ${state.player.goals}</p>
    <button onclick="career()">Back</button>
  `;
}

// Запуск по ссылке
if (target === "career") career();
else home();