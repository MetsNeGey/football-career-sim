const DB = {
    logos: {
        "Man City": "https://media.api-sports.io/football/teams/50.png",
        "Arsenal": "https://media.api-sports.io/football/teams/42.png",
        "Liverpool": "https://media.api-sports.io/football/teams/40.png",
        "Man Utd": "https://media.api-sports.io/football/teams/33.png",
        "Chelsea": "https://media.api-sports.io/football/teams/49.png",
        "Tottenham": "https://media.api-sports.io/football/teams/47.png",
        "Real Madrid": "https://media.api-sports.io/football/teams/541.png",
        "Barcelona": "https://media.api-sports.io/football/teams/529.png",
        "Atletico": "https://media.api-sports.io/football/teams/530.png",
        "Girona": "https://media.api-sports.io/football/teams/547.png",
        "Sevilla": "https://media.api-sports.io/football/teams/536.png",
        "Зенит": "https://media.api-sports.io/football/teams/597.png",
        "Спартак": "https://media.api-sports.io/football/teams/558.png",
        "Краснодар": "https://media.api-sports.io/football/teams/1066.png",
        "ЦСКА": "https://media.api-sports.io/football/teams/555.png",
        "Локомотив": "https://media.api-sports.io/football/teams/557.png",
        "default": "https://media.api-sports.io/football/teams/1.png"
    },
    // Реальные игроки для атмосферы
    squads: {
        "Man City": ["Ederson", "Walker", "Dias", "Akanji", "Gvardiol", "Rodri", "De Bruyne", "Foden", "Bernardo", "Haaland"],
        "Real Madrid": ["Courtois", "Carvajal", "Militao", "Rudiger", "Mendy", "Valverde", "Bellingham", "Vinicius", "Rodrygo", "Mbappe"],
        "Зенит": ["Adamov", "Santos", "Nino", "Erakovic", "Volkov", "Barrios", "Wendel", "Claudinho", "Glushenkov", "Cassierra"],
        "Спартак": ["Maximenko", "Babic", "Duarte", "Ryabchuk", "Denisov", "Umyarov", "Martins", "Barco", "Bongonda", "Ugalde"],
        "Barcelona": ["Ter Stegen", "Kounde", "Araujo", "Cubarsi", "Balde", "Pedri", "Gavi", "Yamal", "Raphinha", "Lewandowski"],
        "Arsenal": ["Raya", "White", "Saliba", "Gabriel", "Timber", "Rice", "Odegaard", "Saka", "Martinelli", "Havertz"]
    },
    leagues: {
        epl: { name: "Premier League", clubs: ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea", "Tottenham"] },
        laliga: { name: "La Liga", clubs: ["Real Madrid", "Barcelona", "Atletico", "Girona", "Sevilla"] },
        rpl: { name: "РПЛ", clubs: ["Зенит", "Спартак", "Краснодар", "ЦСКА", "Локомотив"] }
    }
};

let gameState = null;

window.onload = () => {
    const saved = localStorage.getItem('fc26_pro_v3');
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
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">Professional Career</p>
            </div>
            <div class="card-glass p-6 space-y-4">
                <input id="s-name" type="text" placeholder="ИМЯ ФУТБОЛИСТА" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500 font-bold uppercase">
                <select id="s-league" onchange="updateSetupClubs()" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-bold uppercase"></select>
                <select id="s-club" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-bold uppercase"></select>
                <button onclick="startCareer()" class="w-full bg-blue-600 py-5 rounded-xl font-black uppercase tracking-widest">Начать карьеру</button>
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
            name, club, ovr: 62, goals: 0, matches: 0, 
            energy: 100, money: 5000, 
            trainedToday: false,
            inventory: [], transferHistory: [club]
        },
        leagueKey,
        date: new Date(2026, 7, 1),
        leagueTable: DB.leagues[leagueKey].clubs.map(c => ({ name: c, pts: 0, goals: 0 })),
        news: [{ date: "1 авг", title: "НОВЫЙ КОНТРАКТ", text: `${name} присоединился к ${club}.` }]
    };
    saveAndRefresh();
    initGameUI();
}

function calculateValue() {
    // Реалистичная формула: База 400к + экспоненциальный рост от OVR
    const ovrFactor = Math.pow(gameState.player.ovr - 60, 2) * 50000;
    const goalsFactor = gameState.player.goals * 150000;
    return 450000 + ovrFactor + goalsFactor;
}

function showScreen(screen) {
    const main = document.getElementById('main-screen');
    if(window.matchInterval) clearInterval(window.matchInterval);
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-blue-500', 'text-slate-500'));
    const btnIdx = { home:0, club:1, league:2, profile:3, media:4 }[screen];
    document.querySelectorAll('.nav-btn')[btnIdx].classList.replace('text-slate-500', 'text-blue-500');

    switch(screen) {
        case 'home':
            const opp = DB.leagues[gameState.leagueKey].clubs.filter(c => c !== gameState.player.club).sort(() => Math.random() - 0.5)[0];
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="card-glass p-6 bg-gradient-to-br from-blue-600/20 to-transparent text-center">
                        <p class="text-[9px] font-black text-blue-400 uppercase mb-4 tracking-widest">Следующий матч</p>
                        <div class="flex justify-between items-center mb-8 px-4">
                            <div class="w-1/3 text-center">
                                <img src="${DB.logos[gameState.player.club] || DB.logos.default}" class="w-14 h-14 mx-auto mb-2 object-contain drop-shadow-lg">
                                <p class="text-[10px] font-black uppercase truncate">${gameState.player.club}</p>
                            </div>
                            <div class="text-2xl font-black italic opacity-20">VS</div>
                            <div class="w-1/3 text-center">
                                <img src="${DB.logos[opp] || DB.logos.default}" class="w-14 h-14 mx-auto mb-2 object-contain opacity-40">
                                <p class="text-[10px] font-black uppercase opacity-40 truncate">${opp}</p>
                            </div>
                        </div>
                        <button onclick="simulateMatch('${opp}')" class="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase shadow-lg shadow-blue-500/20 active:scale-95 transition">Выйти на поле</button>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div onclick="train('gym', 500)" class="card-glass p-4 ${gameState.player.trainedToday ? 'btn-disabled' : ''}">
                            <div class="flex justify-between mb-1"><span class="stat-label">Зал</span><span class="text-green-400 font-bold">€500</span></div>
                            <p class="text-xs font-black uppercase">+0.1 OVR / -20🔋</p>
                        </div>
                        <div onclick="train('rest', 0)" class="card-glass p-4">
                            <div class="flex justify-between mb-1"><span class="stat-label">Сон</span><span class="text-blue-400 font-bold">FREE</span></div>
                            <p class="text-xs font-black uppercase">Следующий день / +50🔋</p>
                        </div>
                    </div>
                    ${gameState.player.trainedToday ? '<p class="text-center text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Вы сегодня уже тренировались. Нужен отдых.</p>' : ''}
                </div>
            `;
            break;

        case 'club':
            const realSquad = DB.squads[gameState.player.club] || ["GK Navas", "DEF Ramos", "DEF Pepe", "MID Kroos", "MID Modric", "FWD Jota"];
            main.innerHTML = `
                <div class="space-y-3 animate-in">
                    <h2 class="text-sm font-black uppercase text-slate-500 mb-2 italic">Стартовый состав</h2>
                    ${realSquad.map((name, i) => `
                        <div class="p-3 bg-white/5 rounded-xl flex justify-between items-center border border-white/5">
                            <span class="text-[10px] font-black text-slate-500">${i+1}</span>
                            <span class="font-bold uppercase flex-grow ml-4 text-slate-300">${name}</span>
                            <span class="font-black italic text-slate-600">80+</span>
                        </div>
                    `).join('')}
                    <div class="p-3 player-card rounded-xl flex justify-between items-center border border-blue-500/30">
                        <span class="text-[10px] font-black text-blue-500">11</span>
                        <span class="font-black uppercase flex-grow ml-4">${gameState.player.name} (YOU)</span>
                        <span class="font-black italic text-yellow-500 text-lg">${Math.floor(gameState.player.ovr)}</span>
                    </div>
                </div>
            `;
            break;

        case 'league':
            const table = [...gameState.leagueTable].sort((a,b) => b.pts - a.pts || b.goals - a.goals);
            main.innerHTML = `
                <div class="card-glass overflow-hidden animate-in">
                    <table class="w-full text-left text-[11px]">
                        <tr class="bg-white/5 text-slate-500 uppercase font-black"><th class="p-4">#</th><th class="p-4">Клуб</th><th class="p-4 text-center">О</th></tr>
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
            const val = calculateValue();
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="card-glass p-6 text-center">
                        <div class="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-3">${gameState.player.name[0]}</div>
                        <h2 class="text-xl font-black uppercase italic">${gameState.player.name}</h2>
                        <div class="mt-4 flex justify-around">
                            <div><p class="stat-label">Стоимость</p><p class="font-black text-green-400 italic">€${(val/1000000).toFixed(2)}M</p></div>
                            <div><p class="stat-label">Голы</p><p class="font-black text-yellow-500 italic">${gameState.player.goals}</p></div>
                            <div><p class="stat-label">Матчи</p><p class="font-black text-slate-300 italic">${gameState.player.matches}</p></div>
                        </div>
                    </div>
                    <div class="card-glass p-4">
                        <p class="stat-label mb-2">История переходов</p>
                        <div class="flex gap-2">${gameState.player.transferHistory.map(h => `<span class="bg-white/10 px-2 py-1 rounded text-[10px] font-bold uppercase italic border border-white/10">${h}</span>`).join('')}</div>
                    </div>
                </div>
            `;
            break;
    }
}

function train(type, price) {
    if(gameState.player.money < price) return alert("Недостаточно денег!");
    
    if(type === 'gym') {
        if(gameState.player.trainedToday) return alert("Вы уже тренировались сегодня!");
        if(gameState.player.energy < 20) return alert("Мало энергии!");
        
        gameState.player.money -= price;
        gameState.player.ovr += 0.08; // Замедленный рост
        gameState.player.energy -= 20;
        gameState.player.trainedToday = true;
    } else {
        // Отдых / Новый день
        gameState.player.energy = Math.min(100, gameState.player.energy + 50);
        gameState.player.trainedToday = false;
        gameState.date = new Date(gameState.date.getTime() + 24 * 60 * 60 * 1000);
    }
    saveAndRefresh();
    showScreen('home');
}

function simulateMatch(oppName) {
    if(gameState.player.energy < 25) return alert("Вы истощены. Сходите на отдых!");
    
    const main = document.getElementById('main-screen');
    let minute = 0; let pGoals = 0; let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col justify-between py-12 animate-in text-center">
            <div>
                <div id="m-time" class="text-7xl font-black italic mb-6">0'</div>
                <div class="flex justify-around items-center px-4">
                    <div class="w-1/3">
                        <img src="${DB.logos[gameState.player.club] || DB.logos.default}" class="w-14 h-14 mx-auto mb-2 object-contain">
                        <p class="text-[10px] font-black uppercase">${gameState.player.club}</p>
                    </div>
                    <div id="m-score" class="text-6xl font-black italic w-1/3">0 : 0</div>
                    <div class="w-1/3">
                        <img src="${DB.logos[oppName] || DB.logos.default}" class="w-14 h-14 mx-auto mb-2 object-contain opacity-40">
                        <p class="text-[10px] font-black uppercase opacity-40">${oppName}</p>
                    </div>
                </div>
            </div>
            <div id="m-log" class="text-[10px] font-black text-slate-500 uppercase italic">Начало матча...</div>
        </div>
    `;

    window.matchInterval = setInterval(() => {
        minute += 2;
        document.getElementById('m-time').innerText = minute + "'";
        
        let rand = Math.random();
        if(rand > 0.96) { // Шанс игрока забить (снижен для реализма)
            pGoals++; score[0]++;
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
            document.getElementById('m-log').innerHTML = `<span class="text-green-500">⚽ ГОООЛ! ${gameState.player.name.toUpperCase()}!</span>`;
        } else if(rand < 0.035) { // Шанс соперника
            score[1]++;
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
            document.getElementById('m-log').innerHTML = `<span class="opacity-50">Гол забивает ${oppName}...</span>`;
        }

        if(minute >= 90) {
            clearInterval(window.matchInterval);
            finishMatch(pGoals, score, oppName);
        }
    }, 40);
}

function finishMatch(goals, res, oppName) {
    const salary = 1500 + (goals * 1000) + (res[0] > res[1] ? 1500 : 0);
    
    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.money += salary;
    gameState.player.energy = Math.max(0, gameState.player.energy - 35);
    gameState.player.ovr += (goals * 0.04) + (res[0] > res[1] ? 0.02 : 0);
    gameState.player.trainedToday = false; // После матча можно тренироваться

    const myC = gameState.leagueTable.find(c => c.name === gameState.player.club);
    const opC = gameState.leagueTable.find(c => c.name === oppName);
    if(res[0] > res[1]) myC.pts += 3; else if(res[0] === res[1]) { myC.pts += 1; opC.pts += 1; } else opC.pts += 3;

    gameState.date = new Date(gameState.date.getTime() + 7 * 24 * 60 * 60 * 1000);
    saveAndRefresh();
    alert(`Финальный свисток! Вы заработали €${salary}`);
    showScreen('home');
}

function saveAndRefresh() {
    localStorage.setItem('fc26_pro_v3', JSON.stringify(gameState));
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
    document.getElementById('energy-bar').style.width = gameState.player.energy + '%';
    const logo = document.getElementById('player-club-logo');
    logo.src = DB.logos[gameState.player.club] || DB.logos.default;
    logo.classList.remove('hidden');
}

function initGameUI() {
    updateHeader();
    showScreen('home');
}

function resetGame() { if(confirm("Сбросить карьеру?")) { localStorage.clear(); location.reload(); } }
