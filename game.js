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
    const saved = localStorage.getItem('fc26_final_v2');
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
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">The Journey Starts</p>
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
                <button onclick="startCareer()" class="w-full bg-blue-600 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition">Подписать контракт</button>
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
    gameState = {
        player: { 
            name, club: document.getElementById('s-club').value, pos: document.getElementById('s-pos').value, 
            ovr: 65, goals: 0, matches: 0, energy: 100, trophies: [], value: 1500000 
        },
        date: new Date(2026, 7, 15),
        leagueTable: DB.leagues[document.getElementById('s-league').value].clubs.map(c => ({ name: c, pts: 0 })),
        history: ["Начало легенды"]
    };
    saveAndRefresh();
}

function showScreen(screen) {
    const main = document.getElementById('main-screen');
    if(window.matchInterval) clearInterval(window.matchInterval);
    
    document.querySelectorAll('nav button').forEach(b => b.classList.replace('text-blue-400', 'text-slate-400'));

    switch(screen) {
        case 'home':
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-900 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                        <div class="relative z-10">
                            <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest">Следующая игра</p>
                            <div class="flex justify-between items-center mt-4">
                                <span class="text-xl font-black italic uppercase">${gameState.player.club}</span>
                                <span class="text-2xl font-black italic opacity-20">VS</span>
                                <span class="text-xl font-black opacity-40 italic uppercase">Opponent</span>
                            </div>
                            <button onclick="simulateMatch()" class="w-full mt-6 bg-white text-blue-900 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition shadow-lg">Играть матч</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="card-glass p-5 rounded-3xl text-center">
                            <p class="text-[9px] text-slate-500 uppercase font-black mb-1">Стоимость</p>
                            <p class="text-lg font-black text-blue-400">€${(gameState.player.value / 1000000).toFixed(1)}M</p>
                        </div>
                        <div class="card-glass p-5 rounded-3xl text-center">
                            <p class="text-[9px] text-slate-500 uppercase font-black mb-1">Энергия</p>
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
                    <div onclick="train('ovr')" class="card-glass p-5 rounded-2xl flex justify-between items-center active:scale-95 transition">
                        <div><p class="font-black italic uppercase text-sm">Работа с мячом</p><p class="text-[10px] text-slate-500 uppercase">-15% Энергии</p></div>
                        <span class="text-blue-400 font-black">+0.2 OVR</span>
                    </div>
                    <div onclick="train('energy')" class="card-glass p-5 rounded-2xl flex justify-between items-center active:scale-95 transition">
                        <div><p class="font-black italic uppercase text-sm">Спа-процедуры</p><p class="text-[10px] text-slate-500 uppercase">+1 День отдыха</p></div>
                        <span class="text-green-400 font-black">+40% Energy</span>
                    </div>
                </div>
            `;
            break;

        case 'league':
            main.innerHTML = `
                <h2 class="text-xl font-black italic uppercase mb-4 tracking-tighter text-blue-500">Таблица лиги</h2>
                <div class="card-glass rounded-3xl overflow-hidden">
                    <table class="w-full text-left text-[11px]">
                        <tr class="bg-white/5 text-slate-400 uppercase font-black"><th class="p-4">Клуб</th><th class="p-4 text-center">Очки</th></tr>
                        ${gameState.leagueTable.sort((a,b) => b.pts - a.pts).map((c, i) => `
                            <tr class="border-t border-white/5 ${c.name === gameState.player.club ? 'bg-blue-600/20' : ''}">
                                <td class="p-4 font-bold uppercase italic">${i+1}. ${c.name}</td>
                                <td class="p-4 text-center font-black">${c.pts}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
            break;

        case 'profile':
            main.innerHTML = `
                <div class="card-glass p-6 rounded-[2.5rem] text-center animate-in">
                    <div class="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black italic shadow-2xl mb-4 border-2 border-white/10">${gameState.player.name[0]}</div>
                    <h2 class="text-2xl font-black italic uppercase">${gameState.player.name}</h2>
                    <p class="text-blue-500 font-bold text-[10px] uppercase mb-6 tracking-widest">${gameState.player.club} | ${gameState.player.pos}</p>
                    
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5"><p class="text-[8px] text-slate-500 uppercase font-black">Голы</p><p class="text-2xl font-black">${gameState.player.goals}</p></div>
                        <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5"><p class="text-[8px] text-slate-500 uppercase font-black">Матчи</p><p class="text-2xl font-black">${gameState.player.matches}</p></div>
                    </div>
                    
                    <div class="text-left space-y-2">
                        <p class="text-[9px] font-black text-slate-500 uppercase mb-2">Достижения:</p>
                        <div class="flex flex-wrap gap-2">
                            ${gameState.player.trophies.length > 0 ? 
                                gameState.player.trophies.map(t => `<span class="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter italic">🏆 ${t}</span>`).join('') 
                                : '<span class="text-slate-600 italic text-[10px] font-bold">Наград пока нет...</span>'}
                        </div>
                    </div>
                    <button onclick="resetGame()" class="mt-8 text-[8px] font-bold text-red-500/50 uppercase tracking-[0.3em] active:text-red-500 transition">Сбросить карьеру</button>
                </div>
            `;
            break;

        case 'media':
            const news = [
                `Весь мир говорит о ${gameState.player.name}!`,
                `Трансферные слухи: ${gameState.player.name} заинтересовал грандов.`,
                `${gameState.player.club} планирует повысить зарплату своей звезде.`
            ];
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="bg-white text-black p-6 rounded-[2.5rem] shadow-2xl transform rotate-1">
                        <p class="text-[10px] font-black text-red-600 uppercase border-b border-black/10 pb-1 mb-3">Football Insider</p>
                        <h3 class="text-2xl font-black italic uppercase leading-none mb-3 tracking-tighter">"${news[Math.floor(Math.random()*news.length)]}"</h3>
                        <p class="text-xs font-medium text-slate-700 italic">"После великолепной серии игр, молодой талант из ${gameState.player.club} стал главной темой всех спортивных заголовков."</p>
                    </div>
                </div>
            `;
            break;
    }
}

function simulateMatch() {
    if(gameState.player.energy < 20) return alert("❌ Игрок слишком устал!");
    
    const main = document.getElementById('main-screen');
    let minute = 0; let pGoals = 0; let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col justify-between py-10 animate-in">
            <button onclick="showScreen('home')" class="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1 self-start">🏠 База</button>
            <div class="text-center">
                <div id="m-time" class="text-7xl font-black italic text-blue-500 mb-4">0'</div>
                <div class="flex justify-around items-center px-4">
                    <div class="w-1/3"><p class="text-xs font-black uppercase italic">${gameState.player.club}</p></div>
                    <div id="m-score" class="text-5xl font-black italic w-1/3">0 : 0</div>
                    <div class="w-1/3 opacity-30"><p class="text-xs font-black uppercase italic">Opponent</p></div>
                </div>
            </div>
            <div id="m-log" class="text-center h-12 flex items-center justify-center px-10 text-[11px] font-bold text-slate-500 uppercase italic">Матч начался...</div>
        </div>
    `;

    window.matchInterval = setInterval(() => {
        minute += 2;
        document.getElementById('m-time').innerText = minute + "'";
        
        if(Math.random() > 0.94) {
            const isMe = Math.random() > 0.6;
            if(isMe) { 
                pGoals++; score[0]++; 
                document.getElementById('m-log').innerHTML = `<span class="text-green-500 animate-bounce">⚽ ГОООЛ! ВЫ ЗАБИЛИ!</span>`;
            } else { 
                score[1]++; 
                document.getElementById('m-log').innerHTML = `<span class="opacity-50">Гол соперника...</span>`; 
            }
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
        }

        if(minute >= 90) {
            clearInterval(window.matchInterval);
            finishMatch(pGoals, score);
        }
    }, 60);
}

function finishMatch(goals, res) {
    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.energy -= 20;
    gameState.player.ovr += (goals * 0.15);
    gameState.player.value += (goals * 300000) + 150000;
    
    const clubTable = gameState.leagueTable.find(c => c.name === gameState.player.club);
    if(res[0] > res[1]) clubTable.pts += 3; else if(res[0] === res[1]) clubTable.pts += 1;

    gameState.date = new Date(gameState.date.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // ПРОВЕРКИ СОБЫТИЙ
    // 1. Золотой мяч (декабрь)
    if(gameState.date.getMonth() === 11 && !gameState.history.includes(`Ballon d'Or ${gameState.date.getFullYear()}`)) {
        if(gameState.player.goals > 20 && gameState.player.ovr > 78) {
            gameState.player.trophies.push(`Золотой Мяч ${gameState.date.getFullYear()}`);
            gameState.history.push(`Ballon d'Or ${gameState.date.getFullYear()}`);
            alert("✨ ЭТО ИСТОРИЯ! Вы получили ЗОЛОТОЙ МЯЧ!");
        }
    }

    // 2. Трансфер (шанс)
    if(Math.random() > 0.88 && gameState.player.ovr > 75) {
        const nextClub = DB.topClubs[Math.floor(Math.random() * DB.topClubs.length)];
        if(nextClub !== gameState.player.club) {
            setTimeout(() => {
                if(confirm(`📩 ПРЕДЛОЖЕНИЕ! ${nextClub} хочет купить вас за €${(gameState.player.value / 1000000).toFixed(1)}M. Принять?`)) {
                    gameState.player.club = nextClub;
                    gameState.history.push(`Переход в ${nextClub}`);
                    saveAndRefresh();
                }
            }, 500);
        }
    }

    saveAndRefresh();
    setTimeout(() => showScreen('home'), 1500);
}

function train(type) {
    if(type === 'ovr') {
        if(gameState.player.energy < 15) return alert("Слишком устал!");
        gameState.player.ovr += 0.2; gameState.player.energy -= 15;
    } else {
        gameState.player.energy = Math.min(100, gameState.player.energy + 40);
        gameState.date = new Date(gameState.date.getTime() + 24 * 60 * 60 * 1000);
    }
    saveAndRefresh();
    showScreen('training');
}

function saveAndRefresh() {
    localStorage.setItem('fc26_final_v2', JSON.stringify(gameState));
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

function resetGame() { if(confirm("Удалить карьеру?")) { localStorage.clear(); location.reload(); } }
