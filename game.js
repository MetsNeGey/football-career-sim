// Данные игры
const LEAGUES = {
    epl: { name: "Premier League", clubs: ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea"] },
    laliga: { name: "La Liga", clubs: ["Real Madrid", "Barcelona", "Atletico", "Girona"] }
};

let gameState = null;
let matchInterval = null;

window.onload = () => {
    const saved = localStorage.getItem('fb_career_v3');
    if (saved) {
        gameState = JSON.parse(saved);
        initGameUI();
    } else {
        renderSetupScreen();
    }
};

// --- ЭКРАН СОЗДАНИЯ ---
function renderSetupScreen() {
    const main = document.getElementById('main-screen');
    main.innerHTML = `
        <div class="flex flex-col gap-6 py-10 animate-fade-in">
            <div class="text-center">
                <h1 class="text-4xl font-black italic text-blue-500 uppercase">FC 26</h1>
                <p class="text-slate-400 uppercase text-[10px] tracking-[0.2em]">Создание карьеры</p>
            </div>
            <div class="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                <input id="s-name" type="text" placeholder="Ваше Имя" class="w-full bg-slate-900 p-4 rounded-2xl mb-4 border border-slate-700 outline-none">
                <select id="s-pos" class="w-full bg-slate-900 p-4 rounded-2xl mb-4 border border-slate-700">
                    <option value="ST">Нападающий (ST)</option>
                    <option value="CAM">Полузащитник (CAM)</option>
                    <option value="CB">Защитник (CB)</option>
                </select>
                <select id="s-league" onchange="updateSetupClubs()" class="w-full bg-slate-900 p-4 rounded-2xl mb-4 border border-slate-700">
                    <option value="epl">Английская Премьер-Лига</option>
                    <option value="laliga">Ла Лига (Испания)</option>
                </select>
                <select id="s-club" class="w-full bg-slate-900 p-4 rounded-2xl mb-6 border border-slate-700"></select>
                <button onclick="finishSetup()" class="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95">Начать путь</button>
            </div>
        </div>
    `;
    updateSetupClubs();
}

function updateSetupClubs() {
    const league = document.getElementById('s-league').value;
    const clubSelect = document.getElementById('s-club');
    clubSelect.innerHTML = LEAGUES[league].clubs.map(c => `<option value="${c}">${c}</option>`).join('');
}

function finishSetup() {
    const name = document.getElementById('s-name').value;
    if (!name) return alert("Введите имя!");
    
    gameState = {
        player: { name, ovr: 68, pos: document.getElementById('s-pos').value, club: document.getElementById('s-club').value, goals: 0, matches: 0, energy: 100 },
        date: new Date(2026, 7, 10), // 10 Авг 2026
        history: ["Подписан профессиональный контракт"],
        leagueTable: LEAGUES[document.getElementById('s-league').value].clubs.map(c => ({ name: c, pts: 0, g: 0 }))
    };
    saveGame();
    initGameUI();
}

// --- СИСТЕМА ИНТЕРФЕЙСА ---
function initGameUI() {
    document.getElementById('top-bar').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    updateGlobalUI();
    showScreen('home');
}

function updateGlobalUI() {
    document.getElementById('player-name-display').innerText = gameState.player.name;
    document.getElementById('player-club-display').innerText = gameState.player.club;
    document.getElementById('player-ovr-display').innerText = Math.floor(gameState.player.ovr);
    document.getElementById('game-date').innerText = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function saveGame() { localStorage.setItem('fb_career_v3', JSON.stringify(gameState)); }

// --- НАВИГАЦИЯ ---
function showScreen(screen) {
    const main = document.getElementById('main-screen');
    // Сброс активных кнопок
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    switch(screen) {
        case 'home': renderHome(main); break;
        case 'profile': renderProfile(main); break;
        case 'league': renderLeague(main); break;
        case 'calendar': renderCalendar(main); break;
        case 'media': renderMedia(main); break;
    }
}

// --- ГЛАВНЫЙ ЭКРАН ---
function renderHome(main) {
    main.innerHTML = `
        <div class="animate-fade-in">
            <div class="bg-gradient-to-br from-blue-600 to-indigo-900 p-6 rounded-3xl mb-6 shadow-xl shadow-blue-500/10">
                <p class="text-[10px] font-bold opacity-60 uppercase">Следующий тур</p>
                <div class="flex justify-between items-center mt-4">
                    <span class="text-xl font-black">${gameState.player.club}</span>
                    <span class="text-xs font-bold text-blue-300">19:00</span>
                    <span class="text-xl font-black opacity-40">Opponent</span>
                </div>
                <button onclick="startMatchSimulation()" class="w-full mt-6 bg-white text-blue-900 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition">В Бой</button>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Энергия</p>
                    <div class="w-full bg-slate-900 h-2 mt-2 rounded-full overflow-hidden">
                        <div class="bg-green-500 h-full" style="width: ${gameState.player.energy}%"></div>
                    </div>
                </div>
                <div class="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Голы</p>
                    <p class="text-xl font-black mt-1">${gameState.player.goals}</p>
                </div>
            </div>
        </div>
    `;
}

// --- СИМУЛЯЦИЯ МАТЧА (УЛУЧШЕННАЯ) ---
function startMatchSimulation() {
    const main = document.getElementById('main-screen');
    let minute = 0;
    let myGoals = 0;
    let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col bg-slate-900">
            <div class="bg-slate-800 p-6 rounded-b-3xl text-center shadow-2xl">
                <p id="match-time" class="text-3xl font-black text-blue-500 italic mb-2">0'</p>
                <div class="flex justify-around items-center">
                    <span class="text-lg font-bold">${gameState.player.club}</span>
                    <span id="match-score" class="text-4xl font-black">0 : 0</span>
                    <span class="text-lg font-bold opacity-40">Opponent</span>
                </div>
            </div>
            <div id="match-log" class="flex-grow overflow-y-auto p-4 mt-4 text-sm font-medium">
                <div class="match-log-entry">Матч начался! Трибуны ревут!</div>
            </div>
        </div>
    `;

    matchInterval = setInterval(() => {
        minute += Math.floor(Math.random() * 5) + 1;
        if (minute >= 90) {
            minute = 90;
            clearInterval(matchInterval);
            finishMatch(myGoals);
        }
        
        document.getElementById('match-time').innerText = minute + "'";
        
        // Случайные события
        if (Math.random() > 0.85) {
            const isMe = Math.random() > 0.6;
            const log = document.getElementById('match-log');
            const entry = document.createElement('div');
            entry.className = "match-log-entry";
            
            if (isMe) {
                myGoals++;
                score[0]++;
                entry.innerHTML = `<span class="text-green-400 font-bold">${minute}' ГООООЛ!</span> Вы забиваете шикарным ударом!`;
            } else {
                score[1]++;
                entry.innerHTML = `<span class="text-red-400 font-bold">${minute}' Гол...</span> Соперник реализует момент.`;
            }
            document.getElementById('match-score').innerText = `${score[0]} : ${score[1]}`;
            log.prepend(entry);
        }
    }, 1000);
}

function finishMatch(goals) {
    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.energy -= 20;
    gameState.date.setDate(gameState.date.getDate() + 7); // +неделя
    saveGame();
    setTimeout(() => {
        alert(`Матч окончен! Вы забили: ${goals}`);
        updateGlobalUI();
        showScreen('home');
    }, 1500);
}

// --- ЭКРАНЫ МЕНЮ ---
function renderLeague(main) {
    main.innerHTML = `
        <h2 class="text-xl font-black italic uppercase mb-4">Таблица Лиги</h2>
        <div class="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
            <table class="w-full text-left text-xs">
                <tr class="bg-slate-700/50 text-slate-400 font-bold uppercase"><th class="p-4">Клуб</th><th class="p-4 text-right">Очки</th></tr>
                ${gameState.leagueTable.sort((a,b) => b.pts - a.pts).map(c => `
                    <tr class="border-t border-slate-700">
                        <td class="p-4 font-bold ${c.name === gameState.player.club ? 'text-blue-400' : ''}">${c.name}</td>
                        <td class="p-4 text-right">${c.pts}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `;
}

function renderProfile(main) {
    main.innerHTML = `
        <h2 class="text-xl font-black italic uppercase mb-4">Профиль Игрока</h2>
        <div class="bg-slate-800 p-6 rounded-3xl border border-slate-700 mb-4">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-black italic">${gameState.player.name[0]}</div>
                <div>
                    <h3 class="text-2xl font-black italic">${gameState.player.name}</h3>
                    <p class="text-blue-400 font-bold uppercase text-xs">${gameState.player.pos}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-center">
                <div class="bg-slate-900 p-4 rounded-2xl">
                    <p class="text-[8px] text-slate-500 uppercase mb-1">Возраст</p><p class="font-black">17</p>
                </div>
                <div class="bg-slate-900 p-4 rounded-2xl">
                    <p class="text-[8px] text-slate-500 uppercase mb-1">Матчи</p><p class="font-black">${gameState.player.matches}</p>
                </div>
            </div>
        </div>
    `;
}

function renderCalendar(main) {
    main.innerHTML = `<h2 class="text-xl font-black italic uppercase mb-4 text-slate-500">Календарь пуст</h2>`;
}

function renderMedia(main) {
    main.innerHTML = `
        <h2 class="text-xl font-black italic uppercase mb-4">СМИ</h2>
        <div class="bg-white text-black p-4 rounded-xl shadow-xl">
            <p class="text-[8px] font-black uppercase text-red-600 border-b border-red-600 mb-2">Daily Football</p>
            <h3 class="font-bold text-lg leading-tight">"${gameState.player.name} готов к новому туру!"</h3>
            <p class="text-xs mt-2 italic text-slate-600">Скауты топ-клубов уже следят за юным дарованием из ${gameState.player.club}.</p>
        </div>
    `;
}
