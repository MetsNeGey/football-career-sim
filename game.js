// 1. ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ (STATE)
let gameState = {
    player: {
        name: "L. Messi",
        age: 18,
        ovr: 72,
        position: "ST",
        club: "Inter Miami",
        stats: { goals: 0, assists: 0, matches: 0 },
        energy: 100,
        money: 15000
    },
    season: 2026,
    history: ["Начало карьеры в Inter Miami"]
};

// База данных клубов для трансферного рынка
const clubsDB = [
    { name: "Real Madrid", prestige: 95, color: "#ffffff" },
    { name: "Manchester City", prestige: 94, color: "#6caee0" },
    { name: "FC Barcelona", prestige: 92, color: "#a50044" },
    { name: "Bayern Munich", prestige: 91, color: "#dc052d" },
    { name: "PSG", prestige: 89, color: "#004170" },
    { name: "Juventus", prestige: 87, color: "#000000" },
    { name: "Borussia Dortmund", prestige: 85, color: "#fde100" }
];

// 2. СИСТЕМНЫЕ ФУНКЦИИ
window.onload = () => {
    loadGame();
    updateUI();
};

function saveGame() {
    localStorage.setItem('fb_career_save_v1', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('fb_career_save_v1');
    if (saved) gameState = JSON.parse(saved);
}

function updateUI() {
    document.getElementById('player-name').innerText = gameState.player.name;
    document.getElementById('current-club').innerText = `Клуб: ${gameState.player.club}`;
    document.getElementById('player-ovr').innerText = `OVR: ${gameState.player.ovr}`;
    saveGame();
}

// 3. КОНТРОЛЛЕР ЭКРАНОВ
function showScreen(screenType) {
    const main = document.getElementById('main-screen');
    
    if (screenType === 'home') {
        location.reload(); // Простой способ вернуться на главный экран
    } else if (screenType === 'transfers') {
        renderTransfers(main);
    } else if (screenType === 'stats') {
        renderStats(main);
    }
}

// 4. ЛОГИКА ТРАНСФЕРОВ
const transferMarket = {
    calculateValue: function(p) {
        let ageFactor = p.age < 23 ? 1.6 : (p.age > 30 ? 0.6 : 1.0);
        return ((Math.pow(p.ovr, 2.8) / 12000) * ageFactor).toFixed(1);
    },
    generateOffers: function() {
        const pVal = this.calculateValue(gameState.player);
        return clubsDB
            .filter(c => c.name !== gameState.player.club && gameState.player.ovr >= c.prestige - 15)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3)
            .map(c => ({
                club: c.name,
                fee: (pVal * (0.8 + Math.random() * 0.5)).toFixed(1),
                wage: Math.floor((gameState.player.ovr * 1200) * (c.prestige / 100))
            }));
    }
};

function renderTransfers(container) {
    const offers = transferMarket.generateOffers();
    const pVal = transferMarket.calculateValue(gameState.player);

    let html = `
        <div class="animate-fade-in">
            <h2 class="text-xl font-bold mb-4">Трансферный рынок</h2>
            <div class="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                <p class="text-slate-400 text-xs uppercase tracking-wider">Ваша стоимость</p>
                <p class="text-3xl font-black text-green-400">€${pVal}M</p>
            </div>
            <h3 class="text-sm text-slate-500 font-bold mb-3 uppercase">Предложения</h3>
    `;

    offers.forEach(o => {
        html += `
            <div class="bg-slate-800 p-4 rounded-xl mb-3 flex justify-between items-center border-l-4 border-blue-500 shadow-lg">
                <div>
                    <p class="font-bold text-lg">${o.club}</p>
                    <p class="text-xs text-slate-400 font-mono">Контракт: €${o.wage.toLocaleString()}/нед.</p>
                </div>
                <div class="text-right">
                    <p class="text-blue-400 font-bold">€${o.fee}M</p>
                    <button onclick="acceptOffer('${o.club}', ${o.fee})" class="bg-blue-600 text-white text-[10px] px-4 py-2 rounded-full mt-2 font-bold active:bg-blue-700">ПРИНЯТЬ</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html + `</div>`;
}

function acceptOffer(clubName, fee) {
    gameState.player.club = clubName;
    gameState.history.push(`${gameState.season}: Переход в ${clubName} за €${fee}M`);
    alert(`💼 Сделка закрыта! Добро пожаловать в ${clubName}!`);
    showScreen('home');
    updateUI();
}

// 5. СИМУЛЯЦИЯ МАТЧА
function simulateMatch() {
    if (gameState.player.energy < 15) {
        alert("❌ Игрок слишком истощен! Пропустите матч для отдыха.");
        return;
    }

    // Логика успеха (зависит от OVR)
    const luck = Math.random() * 100;
    let goals = 0;
    if (luck + (gameState.player.ovr / 2) > 85) goals = 1;
    if (luck + (gameState.player.ovr / 2) > 95) goals = 2;

    gameState.player.stats.goals += goals;
    gameState.player.stats.matches += 1;
    gameState.player.energy -= 20;

    // Шанс на прокачку OVR
    if (Math.random() > 0.7) {
        gameState.player.ovr += 1;
        alert(`⚽ Голы: ${goals}! Тренер доволен, OVR вырос до ${gameState.player.ovr}!`);
    } else {
        alert(`⚽ Матч завершен! Ваши голы: ${goals}`);
    }

    updateUI();
}

// 6. СТАТИСТИКА И ЭКСПОРТ
function renderStats(container) {
    const s = gameState.player.stats;
    container.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="text-xl font-bold mb-4">Статистика карьеры</h2>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl font-bold text-blue-400">${s.matches}</p>
                    <p class="text-xs text-slate-400">Матчи</p>
                </div>
                <div class="bg-slate-800 p-4 rounded-xl text-center">
                    <p class="text-2xl font-bold text-green-400">${s.goals}</p>
                    <p class="text-xs text-slate-400">Голы</p>
                </div>
            </div>
            <button onclick="exportStatsToCSV()" class="w-full bg-slate-700 py-3 rounded-xl font-bold mb-4">📥 Экспорт в CSV</button>
            <h3 class="font-bold mb-2">История</h3>
            <div class="text-sm text-slate-400 bg-slate-800 p-4 rounded-xl">
                ${gameState.history.map(h => `<p class="mb-1">🔹 ${h}</p>`).join('')}
            </div>
        </div>
    `;
}

function exportStatsToCSV() {
    const p = gameState.player;
    const csvRows = [
        ["Parameter", "Value"],
        ["Name", p.name],
        ["Club", p.club],
        ["OVR", p.ovr],
        ["Matches", p.stats.matches],
        ["Goals", p.stats.goals],
        ["History", gameState.history.join(" | ")]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `career_${p.name}.csv`;
    link.click();
}
