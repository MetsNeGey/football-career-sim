const DB = {
    // Логотипы (используем прозрачные заглушки, которые выглядят как щиты)
    logos: {
        "Man City": "https://media.api-sports.io/football/teams/50.png",
        "Arsenal": "https://media.api-sports.io/football/teams/42.png",
        "Liverpool": "https://media.api-sports.io/football/teams/40.png",
        "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
        "Barcelona": "https://media.api-sports.io/football/teams/529.png",
        "Зенит": "https://media.api-sports.io/football/teams/597.png",
        "Спартак": "https://media.api-sports.io/football/teams/558.png",
        "default": "https://media.api-sports.io/football/teams/1.png"
    },
    leagues: {
        epl: { name: "Premier League", clubs: ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea", "Tottenham"] },
        laliga: { name: "La Liga", clubs: ["Real Madrid", "Barcelona", "Atletico", "Girona", "Sevilla"] },
        rpl: { name: "РПЛ", clubs: ["Зенит", "Спартак", "Краснодар", "ЦСКА", "Локомотив"] }
    },
    items: [
        { id: 'boots', name: 'Бутсы Elite', price: 50000, bonus: 'Шанс гола +8%', icon: '👟' },
        { id: 'chef', name: 'Личный повар', price: 120000, bonus: 'Энергия -8% за матч', icon: '🥗' },
        { id: 'gym', name: 'Личный зал', price: 300000, bonus: 'Тренировка +0.4 OVR', icon: '🏗️' }
    ]
};

// Генератор состава (фейковые игроки для атмосферы)
function generateSquad(clubName) {
    const positions = ['GK', 'LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST'];
    return positions.map((pos, i) => ({
        name: i === 9 ? gameState.player.name : `Игрок ${i + 1}`,
        pos: pos,
        ovr: i === 9 ? Math.floor(gameState.player.ovr) : Math.floor(70 + Math.random() * 15),
        isPlayer: i === 9
    }));
}

let gameState = null;

window.onload = () => {
    const saved = localStorage.getItem('fc26_pro_v2');
    if (saved) {
        gameState = JSON.parse(saved);
        gameState.date = new Date(gameState.date);
        initGameUI();
    } else {
        renderSetupScreen();
    }
};

function renderSetupScreen() {
    const main = document.getElementById('main-screen');
    main.innerHTML = `
        <div class="flex flex-col gap-6 py-10 h-full justify-center animate-in">
            <div class="text-center mb-4">
                <h1 class="text-5xl font-black italic text-blue-500 uppercase">FC 26</h1>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Path to Legend</p>
            </div>
            <div class="card-glass p-6 space-y-4">
                <input id="s-name" type="text" placeholder="ИМЯ ФУТБОЛИСТА" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500 font-bold uppercase">
                <select id="s-league" onchange="updateSetupClubs()" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-bold uppercase"></select>
                <select id="s-club" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-bold uppercase"></select>
                <button onclick="startCareer()" class="w-full bg-blue-600 py-5 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-900/20">Начать путь</button>
            </div>
        </div>
    `;
    const lSelect = document.getElementById('s-league');
    lSelect.innerHTML = Object.keys(DB.leagues).map(k => `<option value="${k}">${DB.leagues[k].name}</option>`).join('');
    updateSetupClubs();
}

function updateSetupClubs() {
    const league = document.getElementById('s-league').value;
    document.getElementById('s-club').innerHTML = DB.leagues[league].clubs.map(c => `<option value="${c}">${c}</option>`).join('');
}

function startCareer() {
    const name = document.getElementById('s-name').value || "Player";
    const club = document.getElementById('s-club').value;
    const leagueKey = document.getElementById('s-league').value;

    gameState = {
        player: { 
            name, club, ovr: 65, goals: 0, matches: 0, 
            energy: 100, money: 10000, hype: 15, discipline: 50,
            inventory: [], trophies: [], transferHistory: [club]
        },
        leagueKey,
        date: new Date(2026, 7, 15),
        leagueTable: DB.leagues[leagueKey].clubs.map(c => ({ name: c, pts: 0, goals: 0 })),
        news: [{ date: "15 авг", title: "КОНТРАКТ ПОДПИСАН", text: `${name} официально перешел в ${club}. Фанаты в восторге!` }]
    };
    saveAndRefresh();
    initGameUI();
}

function showScreen(screen) {
    const main = document.getElementById('main-screen');
    if(window.matchInterval) clearInterval(window.matchInterval);
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-blue-500', 'text-slate-500'));
    const idx = { home:0, club:1, league:2, profile:3, media:4 }[screen];
    document.querySelectorAll('.nav-btn')[idx].classList.replace('text-slate-500', 'text-blue-500');

    switch(screen) {
        case 'home':
            const opp = DB.leagues[gameState.leagueKey].clubs.filter(c => c !== gameState.player.club).sort(() => Math.random() - 0.5)[0];
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="card-glass p-6 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent">
                        <div class="flex justify-between items-center mb-6">
                            <div class="text-center w-1/3">
                                <img src="${DB.logos[gameState.player.club] || DB.logos.default}" class="w-12 h-12 mx-auto mb-2 object-contain">
                                <p class="text-[10px] font-black uppercase">${gameState.player.club}</p>
                            </div>
                            <div class="text-xs font-black opacity-20 italic">VS</div>
                            <div class="text-center w-1/3">
                                <img src="${DB.logos[opp] || DB.logos.default}" class="w-12 h-12 mx-auto mb-2 object-contain opacity-40">
                                <p class="text-[10px] font-black uppercase opacity-40">${opp}</p>
                            </div>
                        </div>
                        <button onclick="simulateMatch('${opp}')" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Выйти на поле</button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div onclick="train('ovr')" class="card-glass p-4 active:bg-white/5 transition">
                            <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Тренировка</p>
                            <p class="text-sm font-black italic uppercase">Зал +0.2 OVR</p>
                        </div>
                        <div onclick="train('rest')" class="card-glass p-4 active:bg-white/5 transition">
                            <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Отдых</p>
                            <p class="text-sm font-black italic uppercase">Сон +45 🔋</p>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'club':
            const squad = generateSquad(gameState.player.club);
            main.innerHTML = `
                <div class="space-y-3 animate-in">
                    <div class="flex items-center gap-3 mb-4">
                        <img src="${DB.logos[gameState.player.club] || DB.logos.default}" class="w-10 h-10 object-contain">
                        <h2 class="text-xl font-black italic uppercase">Состав клуба</h2>
                    </div>
                    ${squad.map(p => `
                        <div class="p-3 rounded-xl flex justify-between items-center ${p.isPlayer ? 'player-card' : 'bg-white/5 border border-white/5'}">
                            <div class="flex items-center gap-4">
                                <span class="text-[10px] font-black text-blue-500 w-4">${p.pos}</span>
                                <span class="font-bold uppercase ${p.isPlayer ? 'text-white' : 'text-slate-400'}">${p.name}</span>
                            </div>
                            <span class="font-black italic text-lg ${p.isPlayer ? 'text-yellow-500' : 'text-slate-600'}">${p.ovr}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            break;

        case 'league':
            const table = [...gameState.leagueTable].sort((a,b) => b.pts - a.pts || b.goals - a.goals);
            main.innerHTML = `
                <div class="card-glass overflow-hidden animate-in">
                    <table class="w-full text-left text-[11px]">
                        <tr class="bg-white/5 text-slate-500 uppercase font-black"><th class="p-4 w-12">#</th><th class="p-4">Клуб</th><th class="p-4 text-center">О</th></tr>
                        ${table.map((c, i) => `
                            <tr class="border-t border-white/5 ${c.name === gameState.player.club ? 'bg-blue-600/20' : ''}">
                                <td class="p-4 font-black opacity-30">${i+1}</td>
                                <td class="p-4 flex items-center gap-2 font-bold uppercase italic">
                                    <img src="${DB.logos[c.name] || DB.logos.default}" class="w-4 h-4 object-contain">
                                    ${c.name}
                                </td>
                                <td class="p-4 text-center font-black text-blue-400">${c.pts}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
            break;

        case 'profile':
            const marketValue = (gameState.player.ovr * 1200000) + (gameState.player.goals * 500000);
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="card-glass p-6 text-center">
                        <div class="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black italic shadow-2xl mb-4 border-4 border-white/10">
                            ${gameState.player.name[0]}
                        </div>
                        <h2 class="text-2xl font-black italic uppercase">${gameState.player.name}</h2>
                        <p class="text-blue-500 font-bold text-[10px] uppercase tracking-widest mt-1">Трансферная цена: €${(marketValue/1000000).toFixed(1)}M</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="card-glass p-4">
                            <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Статистика</p>
                            <p class="text-xs font-bold text-slate-300">Матчи: ${gameState.player.matches}</p>
                            <p class="text-xs font-bold text-slate-300">Голы: ${gameState.player.goals}</p>
                        </div>
                        <div class="card-glass p-4">
                            <p class="text-[8px] text-slate-500 font-black uppercase mb-1">Карьера</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${gameState.player.transferHistory.map(h => `<span class="text-[8px] bg-white/10 px-1 rounded font-bold">${h}</span>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="card-glass p-5">
                        <h3 class="text-[10px] font-black uppercase text-slate-500 mb-3 italic">Магазин предметов</h3>
                        <div class="space-y-2">
                            ${DB.items.map(item => {
                                const bought = gameState.player.inventory.includes(item.id);
                                return `
                                    <div onclick="buyItem('${item.id}', ${item.price})" class="flex justify-between items-center p-3 bg-white/5 rounded-xl ${bought ? 'opacity-30' : ''}">
                                        <div class="flex items-center gap-3">
                                            <span class="text-xl">${item.icon}</span>
                                            <div><p class="font-bold text-[12px] uppercase">${item.name}</p><p class="text-[8px] text-blue-400">${item.bonus}</p></div>
                                        </div>
                                        <p class="font-black text-green-400 italic">${bought ? 'ЕСТЬ' : '€'+item.price.toLocaleString()}</p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <button onclick="resetGame()" class="w-full text-[8px] font-bold text-white/10 uppercase py-4">Сброс карьеры</button>
                </div>
            `;
            break;

        case 'media':
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    ${gameState.news.slice().reverse().map(n => `
                        <div class="bg-white text-slate-900 p-5 rounded-2xl">
                            <p class="text-[9px] font-black text-blue-600 uppercase mb-1">Breaking News • ${n.date}</p>
                            <h3 class="text-lg font-black italic uppercase leading-none mb-2">${n.title}</h3>
                            <p class="text-[11px] font-medium leading-tight opacity-80">${n.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
    }
}

function simulateMatch(oppName) {
    if(gameState.player.energy < 20) return alert("Вы слишком истощены! Нужен отдых.");
    
    const main = document.getElementById('main-screen');
    let minute = 0; let pGoals = 0; let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col justify-between py-12 animate-in text-center">
            <div>
                <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Live Match</p>
                <div id="m-time" class="text-8xl font-black italic mb-8">0'</div>
                <div class="flex justify-around items-center px-4">
                    <div class="w-1/3">
                        <img src="${DB.logos[gameState.player.club] || DB.logos.default}" class="w-12 h-12 mx-auto mb-2 object-contain">
                        <div class="text-[10px] font-black uppercase">${gameState.player.club}</div>
                    </div>
                    <div id="m-score" class="text-6xl font-black italic w-1/3">0 : 0</div>
                    <div class="w-1/3">
                        <img src="${DB.logos[oppName] || DB.logos.default}" class="w-12 h-12 mx-auto mb-2 object-contain opacity-40">
                        <div class="text-[10px] font-black uppercase opacity-40">${oppName}</div>
                    </div>
                </div>
            </div>
            <div id="m-log" class="text-[12px] font-black text-slate-500 uppercase italic animate-pulse">Матч начался...</div>
        </div>
    `;

    window.matchInterval = setInterval(() => {
        minute += 3;
        document.getElementById('m-time').innerText = minute + "'";
        
        // РЕАЛИСТИЧНЫЙ ШАНС (баланс: победа ~45%, ничья ~25%, поражение ~30%)
        let eventChance = Math.random();
        
        // Шанс игрока забить (баланс изменен, чтобы было больше побед)
        let playerGoalChance = 0.94;
        if(gameState.player.inventory.includes('boots')) playerGoalChance = 0.91;

        if(eventChance > playerGoalChance) {
            pGoals++; score[0]++;
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
            document.getElementById('m-log').innerHTML = `<span class="text-green-500 italic">⚽ ГОООЛ! ${gameState.player.name.toUpperCase()}!</span>`;
        } else if(eventChance < 0.04) { // Шанс соперника забить (снижен)
            score[1]++;
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
            document.getElementById('m-log').innerHTML = `<span class="opacity-40 italic">Гол: ${oppName}...</span>`;
        }

        if(minute >= 90) {
            clearInterval(window.matchInterval);
            finishMatch(pGoals, score, oppName);
        }
    }, 50);
}

function finishMatch(goals, res, oppName) {
    const salary = 2500 + (goals * 1200) + (res[0] > res[1] ? 2000 : 0);
    const dateStr = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.money += salary;
    
    let energyLoss = 28;
    if(gameState.player.inventory.includes('chef')) energyLoss = 20;
    gameState.player.energy = Math.max(0, gameState.player.energy - energyLoss);

    // Рост OVR за результативность
    gameState.player.ovr += (goals * 0.15) + (res[0] > res[1] ? 0.05 : 0);

    // Турнирная таблица
    const myC = gameState.leagueTable.find(c => c.name === gameState.player.club);
    const opC = gameState.leagueTable.find(c => c.name === oppName);
    if(res[0] > res[1]) myC.pts += 3; else if(res[0] === res[1]) { myC.pts += 1; opC.pts += 1; } else opC.pts += 3;

    // Послематчевое событие
    if(Math.random() > 0.7) {
        const choice = confirm("СМИ: 'Вы довольны игрой?'\n\nOK - 'Команда — это всё' (+Дисциплина)\nОтмена - 'Я лучший в мире' (+Хайп)");
        if(choice) { gameState.player.discipline += 5; } else { gameState.player.hype += 10; }
    }

    gameState.date = new Date(gameState.date.getTime() + 7 * 24 * 60 * 60 * 1000);
    saveAndRefresh();
    alert(`Матч завершен! Счет ${res[0]}:${res[1]}. Вы заработали €${salary.toLocaleString()}`);
    showScreen('home');
}

function train(type) {
    if(type === 'ovr') {
        if(gameState.player.energy < 20) return alert("Нужен отдых!");
        let gain = gameState.player.inventory.includes('gym') ? 0.4 : 0.2;
        gameState.player.ovr += gain;
        gameState.player.energy -= 20;
    } else {
        gameState.player.energy = Math.min(100, gameState.player.energy + 45);
        gameState.date = new Date(gameState.date.getTime() + 24 * 60 * 60 * 1000);
    }
    saveAndRefresh();
    showScreen('home');
}

function buyItem(id, price) {
    if(gameState.player.money < price) return alert("Недостаточно денег!");
    if(gameState.player.inventory.includes(id)) return alert("Уже есть!");
    gameState.player.money -= price;
    gameState.player.inventory.push(id);
    saveAndRefresh();
    showScreen('profile');
}

function saveAndRefresh() {
    localStorage.setItem('fc26_pro_v2', JSON.stringify(gameState));
    updateHeader();
}

function updateHeader() {
    document.getElementById('top-bar').classList.replace('opacity-0', 'opacity-100');
    document.getElementById('bottom-nav').classList.replace('opacity-0', 'opacity-100');
    document.getElementById('player-name-display').innerText = gameState.player.name;
    document.getElementById('player-club-display').innerText = gameState.player.club;
    document.getElementById('player-ovr-display').innerText = Math.floor(gameState.player.ovr);
    document.getElementById('player-money-display').innerText = '€' + gameState.player.money.toLocaleString();
    document.getElementById('game-date').innerText = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    
    // Энергия
    const eBar = document.getElementById('energy-bar');
    eBar.style.width = gameState.player.energy + '%';
    
    // Логотип
    const logo = document.getElementById('player-club-logo');
    logo.src = DB.logos[gameState.player.club] || DB.logos.default;
    logo.classList.remove('hidden');
}

function initGameUI() {
    updateHeader();
    showScreen('home');
}

function resetGame() { if(confirm("Сбросить весь прогресс карьеры?")) { localStorage.clear(); location.reload(); } }
