const DB = {
    leagues: {
        epl: { name: "Premier League", clubs: ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea", "Tottenham"], avgOvr: 84 },
        laliga: { name: "La Liga", clubs: ["Real Madrid", "Barcelona", "Atletico", "Girona", "Sevilla"], avgOvr: 83 },
        bundes: { name: "Bundesliga", clubs: ["Bayern", "Leverkusen", "Dortmund", "RB Leipzig"], avgOvr: 82 },
        seriea: { name: "Serie A", clubs: ["Inter", "Milan", "Juventus", "Napoli", "Roma"], avgOvr: 82 },
        rpl: { name: "РПЛ", clubs: ["Зенит", "Спартак", "Краснодар", "ЦСКА", "Локомотив"], avgOvr: 76 }
    },
    topClubs: ["Real Madrid", "Man City", "Bayern", "Barcelona", "Liverpool", "Inter", "PSG"]
};

let gameState = null;

window.onload = () => {
    const saved = localStorage.getItem('fc26_v3_core');
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
        <div class="flex flex-col gap-6 py-6 h-full justify-center animate-in">
            <div class="text-center">
                <h1 class="text-4xl font-black italic text-blue-500 uppercase tracking-tighter">FC 26 PRO</h1>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Создай свою легенду</p>
            </div>
            <div class="card-glass p-6 rounded-[2.5rem] space-y-4">
                <input id="s-name" type="text" placeholder="Имя игрока" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold">
                <select id="s-pos" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold">
                    <option value="ST">Нападающий (ST)</option>
                    <option value="CAM">Полузащитник (CAM)</option>
                    <option value="CB">Защитник (CB)</option>
                </select>
                <select id="s-league" onchange="updateSetupClubs()" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold">
                    ${Object.keys(DB.leagues).map(k => `<option value="${k}">${DB.leagues[k].name}</option>`).join('')}
                </select>
                <select id="s-club" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl text-sm font-bold"></select>
                <button onclick="startCareer()" class="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Начать карьеру</button>
            </div>
        </div>
    `;
    updateSetupClubs();
}

function updateSetupClubs() {
    const league = document.getElementById('s-league').value;
    document.getElementById('s-club').innerHTML = DB.leagues[league].clubs.map(c => `<option value="${c}">${c}</option>`).join('');
}

function startCareer() {
    const name = document.getElementById('s-name').value || "Player";
    const leagueKey = document.getElementById('s-league').value;
    const club = document.getElementById('s-club').value;
    
    gameState = {
        player: { 
            name, club, pos: document.getElementById('s-pos').value, 
            ovr: 65, goals: 0, matches: 0, energy: 100, trophies: [], value: 1200000 
        },
        leagueKey,
        date: new Date(2026, 7, 15),
        leagueTable: DB.leagues[leagueKey].clubs.map(c => ({ name: c, pts: 0, goals: 0 })),
        news: [{
            date: "15 авг",
            title: "НОВЫЙ ТРАНСФЕР",
            text: `${name} официально присоединился к ${club}. Тренер рассчитывает на юного таланта.`
        }],
        history: []
    };
    saveAndRefresh();
    initGameUI();
}

function getOpponent() {
    const clubs = DB.leagues[gameState.leagueKey].clubs.filter(c => c !== gameState.player.club);
    return clubs[Math.floor(Math.random() * clubs.length)];
}

function showScreen(screen) {
    const main = document.getElementById('main-screen');
    if(window.matchInterval) clearInterval(window.matchInterval);
    
    // Обновление активной кнопки навигации
    document.querySelectorAll('nav button').forEach(b => b.className = 'nav-item flex flex-col items-center gap-1 text-slate-400');
    const navIdx = { home:0, training:1, league:2, profile:3, media:4 }[screen];
    document.querySelectorAll('nav button')[navIdx].classList.replace('text-slate-400', 'text-blue-400');

    switch(screen) {
        case 'home':
            const opp = getOpponent();
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-900 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <div class="relative z-10">
                            <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest">Следующий матч</p>
                            <div class="flex justify-between items-center mt-4">
                                <span class="text-lg font-black italic uppercase">${gameState.player.club}</span>
                                <span class="text-xl font-black italic opacity-30">VS</span>
                                <span class="text-lg font-black opacity-50 italic uppercase">${opp}</span>
                            </div>
                            <button onclick="simulateMatch('${opp}')" class="w-full mt-6 bg-white text-blue-900 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition shadow-lg">Выйти на поле</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="card-glass p-5 rounded-3xl">
                            <p class="text-[9px] text-slate-500 uppercase font-black mb-1">Рыночная цена</p>
                            <p class="text-lg font-black text-blue-400">€${(gameState.player.value / 1000000).toFixed(1)}M</p>
                        </div>
                        <div class="card-glass p-5 rounded-3xl">
                            <p class="text-[9px] text-slate-500 uppercase font-black mb-1">Выносливость</p>
                            <p class="text-lg font-black text-green-400">${gameState.player.energy}%</p>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'training':
            main.innerHTML = `
                <h2 class="text-xl font-black italic uppercase mb-4 tracking-tighter">Тренировочная база</h2>
                <div class="space-y-3">
                    <div onclick="train('ovr')" class="card-glass p-5 rounded-2xl flex justify-between items-center active:bg-white/5 transition cursor-pointer">
                        <div><p class="font-black italic uppercase text-sm">Силовая тренировка</p><p class="text-[10px] text-slate-500 uppercase">-15% Энергии / +0.2 OVR</p></div>
                        <span class="text-blue-400 text-xl">⚽</span>
                    </div>
                    <div onclick="train('energy')" class="card-glass p-5 rounded-2xl flex justify-between items-center active:bg-white/5 transition cursor-pointer">
                        <div><p class="font-black italic uppercase text-sm">День отдыха</p><p class="text-[10px] text-slate-500 uppercase">+1 День / +40% Энергии</p></div>
                        <span class="text-green-400 text-xl">🔋</span>
                    </div>
                </div>
            `;
            break;

        case 'league':
            main.innerHTML = `
                <h2 class="text-xl font-black italic uppercase mb-4 tracking-tighter text-blue-500">Турнирная таблица</h2>
                <div class="card-glass rounded-3xl overflow-hidden">
                    <table class="w-full text-left text-[11px]">
                        <tr class="bg-white/5 text-slate-400 uppercase font-black"><th class="p-4">Клуб</th><th class="p-4 text-center">Г</th><th class="p-4 text-center">О</th></tr>
                        ${gameState.leagueTable.sort((a,b) => b.pts - a.pts || b.goals - a.goals).map((c, i) => `
                            <tr class="border-t border-white/5 ${c.name === gameState.player.club ? 'bg-blue-600/20' : ''}">
                                <td class="p-4 font-bold uppercase italic">${i+1}. ${c.name}</td>
                                <td class="p-4 text-center font-bold text-slate-400">${c.goals}</td>
                                <td class="p-4 text-center font-black text-blue-400">${c.pts}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
            break;

        case 'profile':
            main.innerHTML = `
                <div class="card-glass p-6 rounded-[2.5rem] text-center animate-in">
                    <div class="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black italic mb-4">${gameState.player.name[0]}</div>
                    <h2 class="text-2xl font-black italic uppercase">${gameState.player.name}</h2>
                    <p class="text-blue-500 font-bold text-[10px] uppercase mb-6 tracking-widest">${gameState.player.club}</p>
                    <div class="grid grid-cols-2 gap-4 mb-6 text-left">
                        <div class="bg-slate-800/50 p-4 rounded-2xl"><p class="text-[8px] text-slate-500 uppercase font-black">Голы</p><p class="text-xl font-black">${gameState.player.goals}</p></div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl"><p class="text-[8px] text-slate-500 uppercase font-black">Матчи</p><p class="text-xl font-black">${gameState.player.matches}</p></div>
                    </div>
                    <button onclick="resetGame()" class="text-[9px] font-bold text-red-500 uppercase opacity-30">Удалить карьеру</button>
                </div>
            `;
            break;

        case 'media':
            main.innerHTML = `
                <h2 class="text-xl font-black italic uppercase mb-4 tracking-tighter">Новости спорта</h2>
                <div class="space-y-4">
                    ${gameState.news.slice().reverse().map(n => `
                        <div class="bg-white text-black p-5 rounded-3xl transform rotate-[0.5deg]">
                            <p class="text-[9px] font-black text-blue-600 uppercase mb-1">${n.date}</p>
                            <h3 class="text-lg font-black italic uppercase leading-tight mb-2">${n.title}</h3>
                            <p class="text-[11px] font-medium text-slate-700 italic leading-snug">${n.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
    }
}

function simulateMatch(oppName) {
    if(gameState.player.energy < 20) return alert("Вы слишком устали для игры!");
    
    const main = document.getElementById('main-screen');
    let minute = 0; let pGoals = 0; let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col justify-center items-center py-10 animate-in">
            <div id="m-time" class="text-8xl font-black italic text-blue-500 mb-8">0'</div>
            <div class="w-full flex justify-around items-center px-6">
                <div class="text-center w-1/3"><p class="text-xs font-black uppercase italic">${gameState.player.club}</p></div>
                <div id="m-score" class="text-6xl font-black italic w-1/3 text-center">0 : 0</div>
                <div class="text-center w-1/3"><p class="text-xs font-black uppercase italic opacity-40">${oppName}</p></div>
            </div>
            <div id="m-log" class="mt-12 text-[12px] font-bold text-slate-500 uppercase italic">Матч начинается...</div>
        </div>
    `;

    window.matchInterval = setInterval(() => {
        minute += 2;
        document.getElementById('m-time').innerText = minute + "'";
        
        if(Math.random() > 0.94) {
            const isMe = Math.random() > 0.6;
            if(isMe) { 
                pGoals++; score[0]++; 
                document.getElementById('m-log').innerHTML = `<span class="text-green-500 animate-pulse">⚽ ГОООЛ! ВЫ ЗАБИЛИ (${minute}')</span>`;
            } else { 
                score[1]++; 
                document.getElementById('m-log').innerHTML = `<span class="opacity-50">Гол: ${oppName} (${minute}')</span>`; 
            }
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
        }

        if(minute >= 90) {
            clearInterval(window.matchInterval);
            finishMatch(pGoals, score, oppName);
        }
    }, 60);
}

function finishMatch(goals, res, oppName) {
    const dateStr = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    
    // 1. Статистика игрока
    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.energy -= 20;
    gameState.player.ovr += (goals * 0.15) + (res[0] > res[1] ? 0.05 : 0);
    gameState.player.value += (goals * 350000) + 150000;

    // 2. Обновление таблицы
    const myClub = gameState.leagueTable.find(c => c.name === gameState.player.club);
    const oppClub = gameState.leagueTable.find(c => c.name === oppName);
    myClub.goals += res[0]; oppClub.goals += res[1];
    if(res[0] > res[1]) myClub.pts += 3; else if(res[0] === res[1]) { myClub.pts += 1; oppClub.pts += 1; } else oppClub.pts += 3;

    // 3. Симуляция остальных игр лиги
    gameState.leagueTable.forEach(c => {
        if(c.name !== gameState.player.club && c.name !== oppName) {
            const r = Math.random();
            if(r > 0.6) c.pts += 3; else if(r > 0.4) c.pts += 1;
            c.goals += Math.floor(Math.random() * 3);
        }
    });

    // 4. Новости
    if(goals > 0) {
        gameState.news.push({
            date: dateStr,
            title: `БЛЕСТЯЩАЯ ИГРА ${gameState.player.name.toUpperCase()}`,
            text: `Благодаря ${goals} голам в ворота ${oppName}, игрок становится героем тура.`
        });
    }

    // 5. Трансферная логика (шанс после матча)
    if(Math.random() > 0.85 && gameState.player.ovr > 72) {
        const potentialClub = DB.topClubs[Math.floor(Math.random() * DB.topClubs.length)];
        if(potentialClub !== gameState.player.club) {
            setTimeout(() => {
                if(confirm(`📩 ТРАНСФЕРНОЕ ПРЕДЛОЖЕНИЕ!\n${potentialClub} предлагает контракт. Цена: €${(gameState.player.value/1000000).toFixed(1)}M. Принять?`)) {
                    gameState.news.push({
                        date: dateStr,
                        title: "ГРОМКИЙ ПЕРЕХОД",
                        text: `${gameState.player.name} покидает ${gameState.player.club} и переходит в ${potentialClub}!`
                    });
                    gameState.player.club = potentialClub;
                    saveAndRefresh();
                }
            }, 1000);
        }
    }

    gameState.date = new Date(gameState.date.getTime() + 7 * 24 * 60 * 60 * 1000);
    saveAndRefresh();
    setTimeout(() => showScreen('home'), 1200);
}

function train(type) {
    if(type === 'ovr') {
        if(gameState.player.energy < 15) return alert("Нужен отдых!");
        gameState.player.ovr += 0.2; gameState.player.energy -= 15;
    } else {
        gameState.player.energy = Math.min(100, gameState.player.energy + 40);
        gameState.date = new Date(gameState.date.getTime() + 24 * 60 * 60 * 1000);
    }
    saveAndRefresh();
    showScreen('training');
}

function saveAndRefresh() {
    localStorage.setItem('fc26_v3_core', JSON.stringify(gameState));
    updateHeader();
}

function updateHeader() {
    document.getElementById('top-bar').classList.replace('opacity-0', 'opacity-100');
    document.getElementById('bottom-nav').classList.replace('opacity-0', 'opacity-100');
    document.getElementById('player-name-display').innerText = gameState.player.name;
    document.getElementById('player-club-display').innerText = gameState.player.club;
    document.getElementById('player-ovr-display').innerText = Math.floor(gameState.player.ovr);
    document.getElementById('game-date').innerText = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function initGameUI() {
    updateHeader();
    showScreen('home');
}

function resetGame() { if(confirm("Удалить все данные карьеры?")) { localStorage.clear(); location.reload(); } }
