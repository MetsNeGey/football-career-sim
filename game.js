const clubsData = {
    epl: ["Manchester City", "Liverpool", "Arsenal", "Chelsea", "Man United"],
    laliga: ["Real Madrid", "FC Barcelona", "Atletico Madrid", "Girona", "Real Sociedad"],
    bundes: ["Bayern Munich", "Bayer Leverkusen", "Dortmund", "RB Leipzig"]
};

let gameState = null;

// Запуск при загрузке
window.onload = () => {
    const saved = localStorage.getItem('fb_career_save_v2');
    if (saved) {
        gameState = JSON.parse(saved);
        initGameUI();
    } else {
        updateClubList();
    }
};

function updateClubList() {
    const league = document.getElementById('setup-league').value;
    const clubSelect = document.getElementById('setup-club');
    clubSelect.innerHTML = clubsData[league].map(c => `<option value="${c}">${c}</option>`).join('');
}

function startGame() {
    const nameInput = document.getElementById('setup-name').value;
    if (!nameInput) return alert("Введите имя!");

    gameState = {
        player: {
            name: nameInput,
            age: 17,
            ovr: 65,
            position: document.getElementById('setup-pos').value,
            club: document.getElementById('setup-club').value,
            stats: { goals: 0, matches: 0 },
            energy: 100,
            money: 5000
        },
        history: [`Подписан первый контракт с ${document.getElementById('setup-club').value}`],
        season: 2026
    };

    saveGame();
    initGameUI();
}

function initGameUI() {
    document.getElementById('top-bar').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    renderHomeScreen();
}

function saveGame() {
    localStorage.setItem('fb_career_save_v2', JSON.stringify(gameState));
    updateTopBar();
}

function updateTopBar() {
    if (!gameState) return;
    document.getElementById('player-name').innerText = gameState.player.name;
    document.getElementById('current-club').innerText = gameState.player.club;
    document.getElementById('player-ovr').innerText = Math.floor(gameState.player.ovr);
    document.getElementById('player-pos').innerText = gameState.player.position;
}

function renderHomeScreen() {
    updateTopBar();
    const main = document.getElementById('main-screen');
    main.innerHTML = `
        <div class="animate-fade-in">
            <div class="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 rounded-3xl mb-6 shadow-xl relative overflow-hidden">
                <div class="relative z-10">
                    <p class="text-[10px] font-bold opacity-60 uppercase">Следующий матч</p>
                    <div class="flex justify-between items-center mt-4">
                        <span class="text-xl font-black">${gameState.player.club}</span>
                        <span class="text-2xl font-black italic opacity-30">VS</span>
                        <span class="text-xl font-black text-blue-200 uppercase">Opponent</span>
                    </div>
                    <button onclick="simulateMatch()" class="w-full mt-6 bg-white text-blue-900 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition shadow-lg">
                        Играть матч
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div onclick="trainPlayer()" class="bg-slate-800 p-5 rounded-2xl border border-slate-700 active:bg-slate-700 transition">
                    <div class="text-2xl mb-2">⚡</div>
                    <p class="font-bold text-sm">Тренировка</p>
                    <div class="w-full bg-slate-900 h-1.5 mt-2 rounded-full overflow-hidden">
                        <div class="bg-blue-500 h-full" style="width: ${gameState.player.energy}%"></div>
                    </div>
                    <p class="text-[9px] text-slate-500 mt-1">Энергия: ${gameState.player.energy}%</p>
                </div>
                <div onclick="restPlayer()" class="bg-slate-800 p-5 rounded-2xl border border-slate-700 active:bg-slate-700 transition">
                    <div class="text-2xl mb-2">🛌</div>
                    <p class="font-bold text-sm">Отдых</p>
                    <p class="text-[9px] text-slate-500 mt-1">Восстановить силы</p>
                </div>
            </div>
        </div>
    `;
}

function simulateMatch() {
    if (gameState.player.energy < 25) return alert("❌ Недостаточно энергии! Нужен отдых.");

    const goals = Math.random() > 0.7 ? (Math.random() > 0.9 ? 2 : 1) : 0;
    gameState.player.stats.goals += goals;
    gameState.player.stats.matches += 1;
    gameState.player.energy -= 25;
    
    if (goals > 0) gameState.player.ovr += 0.3;
    
    saveGame();
    alert(goals > 0 ? `⚽ ГОООЛ! Вы забили: ${goals}` : "⌛ Матч завершен. Сегодня без голов.");
    
    if (Math.random() > 0.6) setTimeout(checkRandomEvent, 600);
    renderHomeScreen();
}

function trainPlayer() {
    if (gameState.player.energy < 15) return alert("Слишком устал!");
    gameState.player.ovr += 0.15;
    gameState.player.energy -= 15;
    saveGame();
    renderHomeScreen();
}

function restPlayer() {
    gameState.player.energy = Math.min(100, gameState.player.energy + 40);
    saveGame();
    renderHomeScreen();
}

// СОБЫТИЯ
function checkRandomEvent() {
    const events = [
        { title: "👟 Спонсоры", text: "Adidas предлагает контракт!", action: () => { gameState.player.money += 2000; return "+€2000"; } },
        { title: "📺 Интервью", text: "Вас хвалят в прессе!", action: () => { gameState.player.ovr += 0.5; return "OVR +0.5"; } }
    ];
    const ev = events[Math.floor(Math.random() * events.length)];
    
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 event-modal-overlay flex items-center justify-center p-6 z-50 animate-fade-in";
    modal.innerHTML = `
        <div class="bg-slate-800 p-6 rounded-3xl border border-slate-700 w-full max-w-xs text-center shadow-2xl">
            <h3 class="text-xl font-black text-yellow-400 mb-2 uppercase italic">${ev.title}</h3>
            <p class="text-slate-300 text-sm mb-6">${ev.text}</p>
            <button id="event-btn" class="w-full bg-blue-600 py-3 rounded-xl font-bold uppercase tracking-widest">Принять</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('event-btn').onclick = () => {
        const res = ev.action();
        modal.remove();
        alert(res);
        saveGame();
        renderHomeScreen();
    };
}

// ЭКРАНЫ
function showScreen(type) {
    const main = document.getElementById('main-screen');
    if (type === 'home') renderHomeScreen();
    if (type === 'stats') {
        main.innerHTML = `
            <div class="animate-fade-in">
                <h2 class="text-2xl font-black mb-6 italic uppercase">Ваши достижения</h2>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                        <p class="text-3xl font-black text-blue-500">${gameState.player.stats.matches}</p>
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Матчи</p>
                    </div>
                    <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
                        <p class="text-3xl font-black text-green-500">${gameState.player.stats.goals}</p>
                        <p class="text-[10px] font-bold text-slate-500 uppercase">Голы</p>
                    </div>
                </div>
                <div class="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                    <p class="text-[10px] font-bold text-slate-500 uppercase mb-2">История</p>
                    <div class="text-xs space-y-2">${gameState.history.map(h => `<p>🔹 ${h}</p>`).reverse().join('')}</div>
                </div>
            </div>
        `;
    }
    if (type === 'settings') {
        main.innerHTML = `
            <div class="animate-fade-in flex flex-col gap-4">
                <button onclick="localStorage.clear(); location.reload();" class="bg-red-900/20 text-red-500 border border-red-900/50 p-4 rounded-2xl font-bold">
                    Сбросить карьеру
                </button>
            </div>
        `;
    }
    if (type === 'transfers') {
        main.innerHTML = `
            <div class="animate-fade-in text-center py-10">
                <div class="text-5xl mb-4">🤝</div>
                <h2 class="text-xl font-bold">Трансферное окно закрыто</h2>
                <p class="text-slate-500 text-sm px-10">Играйте больше матчей, чтобы получить предложения от топ-клубов.</p>
            </div>
        `;
    }
}
