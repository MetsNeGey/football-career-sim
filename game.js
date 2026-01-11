const DB = {
    leagues: {
        epl: { name: "Premier League", clubs: ["Man City", "Arsenal", "Liverpool", "Man Utd", "Chelsea", "Tottenham"] },
        laliga: { name: "La Liga", clubs: ["Real Madrid", "Barcelona", "Atletico", "Girona", "Sevilla"] },
        rpl: { name: "РПЛ", clubs: ["Зенит", "Спартак", "Краснодар", "ЦСКА", "Локомотив"] }
    },
    items: [
        { id: 'boots', name: 'Бутсы Elite', price: 50000, bonus: 'Шанс гола +5%', icon: '👟' },
        { id: 'chef', name: 'Личный повар', price: 120000, bonus: 'Энергия -5% за матч', icon: '🥗' },
        { id: 'car', name: 'Спорткар', price: 500000, bonus: 'Хайп +20', icon: '🏎️' }
    ]
};

let gameState = null;

window.onload = () => {
    const saved = localStorage.getItem('fc26_linear_v1');
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
            <div class="text-center">
                <h1 class="text-4xl font-black italic text-blue-500 uppercase italic">FC 26 PRO</h1>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Симулятор карьеры</p>
            </div>
            <div class="card-glass p-6 space-y-4">
                <input id="s-name" type="text" placeholder="Ваше Имя" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl outline-none focus:border-blue-500 font-bold uppercase">
                <select id="s-league" onchange="updateSetupClubs()" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-bold uppercase tracking-tighter">
                    ${Object.keys(DB.leagues).map(k => `<option value="${k}">${DB.leagues[k].name}</option>`).join('')}
                </select>
                <select id="s-club" class="w-full bg-slate-950 border border-white/10 p-4 rounded-xl font-bold uppercase tracking-tighter"></select>
                <button onclick="startCareer()" class="w-full bg-blue-600 py-5 rounded-xl font-black uppercase tracking-widest active:scale-95 transition">Подписать контракт</button>
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
    const club = document.getElementById('s-club').value;
    const leagueKey = document.getElementById('s-league').value;

    gameState = {
        player: { 
            name, club, ovr: 64, goals: 0, matches: 0, 
            energy: 100, money: 5000, hype: 10, discipline: 50,
            inventory: []
        },
        leagueKey,
        date: new Date(2026, 7, 10),
        leagueTable: DB.leagues[leagueKey].clubs.map(c => ({ name: c, pts: 0, goals: 0 })),
        news: [{ date: "10 авг", title: "НОВАЯ НАДЕЖДА", text: `${name} подписал первый контракт с ${club}.` }],
        history: []
    };
    saveAndRefresh();
    initGameUI();
}

function showScreen(screen) {
    const main = document.getElementById('main-screen');
    if(window.matchInterval) clearInterval(window.matchInterval);
    
    // UI Navigation
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.replace('text-blue-500', 'text-slate-500'));
    const idx = { home:0, training:1, league:2, profile:3, media:4 }[screen];
    document.querySelectorAll('.nav-btn')[idx].classList.replace('text-slate-500', 'text-blue-500');

    switch(screen) {
        case 'home':
            const opp = DB.leagues[gameState.leagueKey].clubs.filter(c => c !== gameState.player.club).sort(() => Math.random() - 0.5)[0];
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="card-glass p-6 bg-gradient-to-br from-blue-600/20 to-transparent relative overflow-hidden">
                        <p class="text-[9px] font-black uppercase text-blue-400">Ближайшая игра</p>
                        <div class="flex justify-between items-center my-6">
                            <span class="text-lg font-black italic uppercase">${gameState.player.club}</span>
                            <span class="text-xs font-black opacity-20">VS</span>
                            <span class="text-lg font-black opacity-40 uppercase">${opp}</span>
                        </div>
                        <button onclick="simulateMatch('${opp}')" class="w-full bg-blue-600 py-4 rounded-xl font-black uppercase shadow-lg active:scale-95 transition">Начать матч</button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="card-glass p-4"><p class="text-[8px] text-slate-500 font-black uppercase">Хайп</p><p class="text-lg font-black text-purple-400">${gameState.player.hype}%</p></div>
                        <div class="card-glass p-4"><p class="text-[8px] text-slate-500 font-black uppercase">Дисциплина</p><p class="text-lg font-black text-orange-400">${gameState.player.discipline}%</p></div>
                    </div>
                </div>
            `;
            break;

        case 'training':
            main.innerHTML = `
                <div class="space-y-3 animate-in">
                    <h2 class="text-sm font-black uppercase text-slate-500 mb-4 tracking-widest">Центр подготовки</h2>
                    <div onclick="train('ovr')" class="card-glass p-5 flex justify-between items-center active:bg-white/5">
                        <div><p class="font-black italic uppercase text-sm">Тренировка базы</p><p class="text-[10px] text-slate-500 uppercase">-15 Энергии / +0.2 OVR</p></div>
                        <span class="text-2xl">🔥</span>
                    </div>
                    <div onclick="train('rest')" class="card-glass p-5 flex justify-between items-center active:bg-white/5">
                        <div><p class="font-black italic uppercase text-sm">Восстановление</p><p class="text-[10px] text-slate-500 uppercase">+1 День / +45 Энергии</p></div>
                        <span class="text-2xl">🔋</span>
                    </div>
                </div>
            `;
            break;

        case 'league':
            const sortedTable = [...gameState.leagueTable].sort((a,b) => b.pts - a.pts || b.goals - a.goals);
            main.innerHTML = `
                <div class="card-glass overflow-hidden animate-in">
                    <table class="w-full text-left text-[11px]">
                        <tr class="bg-white/5 text-slate-500 uppercase font-black"><th class="p-4">Клуб</th><th class="p-4 text-center">О</th></tr>
                        ${sortedTable.map((c, i) => `
                            <tr class="border-t border-white/5 ${c.name === gameState.player.club ? 'bg-blue-600/20' : ''}">
                                <td class="p-4 font-bold uppercase italic">${i+1}. ${c.name}</td>
                                <td class="p-4 text-center font-black text-blue-400">${c.pts}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
            break;

        case 'profile':
            main.innerHTML = `
                <div class="space-y-6 animate-in">
                    <div class="card-glass p-5">
                        <h3 class="text-[10px] font-black uppercase text-slate-500 mb-3">Магазин и Услуги</h3>
                        <div class="space-y-2">
                            ${DB.items.map(item => {
                                const bought = gameState.player.inventory.includes(item.id);
                                return `
                                    <div onclick="buyItem('${item.id}', ${item.price})" class="flex justify-between items-center p-3 bg-white/5 rounded-xl ${bought ? 'opacity-40 grayscale' : ''}">
                                        <div class="flex items-center gap-3">
                                            <span class="text-xl">${item.icon}</span>
                                            <div><p class="font-bold text-[12px] uppercase leading-none">${item.name}</p><p class="text-[9px] text-blue-400 font-bold">${item.bonus}</p></div>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-black text-green-400 italic">${bought ? 'КУПЛЕНО' : '€'+item.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    <button onclick="resetGame()" class="w-full text-[9px] font-black text-red-500/30 uppercase">Удалить сохранение</button>
                </div>
            `;
            break;

        case 'media':
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    ${gameState.news.slice().reverse().map(n => `
                        <div class="bg-white text-slate-900 p-5 rounded-2xl transform hover:scale-[1.02] transition">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-[9px] font-black text-blue-600 uppercase">FOOTBALL DAILY</span>
                                <span class="text-[9px] font-bold text-slate-400">${n.date}</span>
                            </div>
                            <h3 class="text-lg font-black italic uppercase leading-none mb-2">${n.title}</h3>
                            <p class="text-[11px] font-medium leading-snug">${n.text}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            break;
    }
}

function simulateMatch(oppName) {
    if(gameState.player.energy < 20) return alert("Недостаточно сил! Отдохните.");
    
    const main = document.getElementById('main-screen');
    let minute = 0; let pGoals = 0; let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col justify-between py-12 animate-in text-center">
            <div>
                <p class="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Прямой эфир</p>
                <div id="m-time" class="text-7xl font-black italic mb-6">0'</div>
                <div class="flex justify-around items-center px-4">
                    <div class="w-1/3 font-black italic uppercase truncate">${gameState.player.club}</div>
                    <div id="m-score" class="text-5xl font-black italic w-1/3">0 : 0</div>
                    <div class="w-1/3 font-black italic uppercase opacity-40 truncate">${oppName}</div>
                </div>
            </div>
            <div id="m-log" class="text-[11px] font-black text-slate-500 uppercase italic">Команды выходят на поле...</div>
        </div>
    `;

    window.matchInterval = setInterval(() => {
        minute += 2;
        document.getElementById('m-time').innerText = minute + "'";
        
        let goalChance = 0.93;
        if(gameState.player.inventory.includes('boots')) goalChance = 0.90; // Бутсы повышают шанс

        if(Math.random() > goalChance) {
            const isMe = Math.random() > 0.65;
            if(isMe) { 
                pGoals++; score[0]++; 
                document.getElementById('m-log').innerHTML = `<span class="text-green-500 animate-bounce">⚽ ГОООЛ! ${gameState.player.name.toUpperCase()}!</span>`;
            } else { 
                score[1]++; 
                document.getElementById('m-log').innerHTML = `<span class="opacity-50">Гол забивает ${oppName}...</span>`; 
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
    const salary = 1200 + (goals * 800) + (res[0] > res[1] ? 1000 : 0);
    const dateStr = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    // Статы
    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.money += salary;
    
    let energyLoss = 25;
    if(gameState.player.inventory.includes('chef')) energyLoss = 18;
    gameState.player.energy -= energyLoss;

    gameState.player.ovr += (goals * 0.1) + (res[0] > res[1] ? 0.05 : 0);

    // Таблица
    const myClub = gameState.leagueTable.find(c => c.name === gameState.player.club);
    const oppClub = gameState.leagueTable.find(c => c.name === oppName);
    if(res[0] > res[1]) myClub.pts += 3; else if(res[0] === res[1]) { myClub.pts += 1; oppClub.pts += 1; } else oppClub.pts += 3;

    // Симуляция лиги
    gameState.leagueTable.forEach(c => {
        if(c.name !== gameState.player.club && c.name !== oppName) {
            if(Math.random() > 0.6) c.pts += 3; else if(Math.random() > 0.4) c.pts += 1;
        }
    });

    // Линейное событие: Интервью
    setTimeout(() => {
        if(Math.random() > 0.6) {
            const choice = confirm("Журналист: 'Вы сегодня были лучшим! Это результат упорных тренировок?'\n\nOK - 'Да, дисциплина прежде всего' (+Дисциплина)\nОтмена - 'Я просто талантлив' (+Хайп)");
            if(choice) {
                gameState.player.discipline += 5;
                gameState.news.push({ date: dateStr, title: "ОБРАЗЕЦ ДЛЯ ПОДРАЖАНИЯ", text: `${gameState.player.name} хвалит систему тренировок клуба.` });
            } else {
                gameState.player.hype += 10;
                gameState.news.push({ date: dateStr, title: "ДЕРЗКИЙ ТАЛАНТ", text: `${gameState.player.name} заявил, что его успех — это чистый дар.` });
            }
        }

        // Проверка на трансфер (Хайп влияет)
        if(gameState.player.hype > 40 && Math.random() > 0.8) {
            alert("📩 Вами заинтересовался топ-клуб из другой лиги! Продолжайте в том же духе.");
        }

        gameState.date = new Date(gameState.date.getTime() + 7 * 24 * 60 * 60 * 1000);
        saveAndRefresh();
        showScreen('home');
        alert(`Матч окончен! Вы получили €${salary}`);
    }, 1000);
}

function buyItem(id, price) {
    if(gameState.player.money < price) return alert("Недостаточно средств!");
    if(gameState.player.inventory.includes(id)) return alert("Уже куплено!");
    
    gameState.player.money -= price;
    gameState.player.inventory.push(id);
    if(id === 'car') gameState.player.hype += 20;
    
    saveAndRefresh();
    showScreen('profile');
}

function train(type) {
    if(type === 'ovr') {
        if(gameState.player.energy < 15) return alert("Нет энергии!");
        gameState.player.ovr += 0.2; gameState.player.energy -= 15;
    } else {
        gameState.player.energy = Math.min(100, gameState.player.energy + 45);
        gameState.date = new Date(gameState.date.getTime() + 24 * 60 * 60 * 1000);
    }
    saveAndRefresh();
    showScreen(type === 'ovr' ? 'training' : 'home');
}

function saveAndRefresh() {
    localStorage.setItem('fc26_linear_v1', JSON.stringify(gameState));
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
}

function initGameUI() {
    updateHeader();
    showScreen('home');
}

function resetGame() { if(confirm("Сбросить карьеру?")) { localStorage.clear(); location.reload(); } }
