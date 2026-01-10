// Константы данных
const DB = {
    leagues: {
        epl: { name: "Premier League", clubs: ["Man City", "Liverpool", "Arsenal", "Man Utd", "Chelsea"] },
        laliga: { name: "La Liga", clubs: ["Real Madrid", "Barcelona", "Atletico", "Girona"] }
    },
    news: [
        "Скауты в восторге от вашей игры!",
        "Тренер требует больше самоотдачи на тренировках.",
        "Ваш агент обсуждает новый рекламный контракт."
    ]
};

let gameState = null;

// Инициализация
window.onload = () => {
    try {
        const saved = localStorage.getItem('fc26_save');
        if (saved) {
            gameState = JSON.parse(saved);
            // Восстановление объекта даты из строки
            gameState.date = new Date(gameState.date);
            initGameUI();
        } else {
            renderSetupScreen();
        }
    } catch (e) {
        console.error("Ошибка загрузки:", e);
        renderSetupScreen(); 
    }
};

function renderSetupScreen() {
    const main = document.getElementById('main-screen');
    main.innerHTML = `
        <div class="flex flex-col gap-6 py-6 h-full justify-center">
            <div class="text-center">
                <h1 class="text-4xl font-black italic text-blue-500 uppercase tracking-tighter">FC 26 CAREER</h1>
                <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Создайте свою историю</p>
            </div>
            
            <div class="bg-slate-800/50 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                <div class="space-y-4">
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase ml-2">Ваше Имя</label>
                        <input id="s-name" type="text" placeholder="Напр. Messi" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl outline-none focus:border-blue-500 transition">
                    </div>
                    
                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase ml-2">Позиция</label>
                        <select id="s-pos" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl outline-none">
                            <option value="ST">Нападающий (ST)</option>
                            <option value="CAM">Полузащитник (CAM)</option>
                            <option value="CB">Защитник (CB)</option>
                        </select>
                    </div>

                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase ml-2">Лига</label>
                        <select id="s-league" onchange="updateSetupClubs()" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl outline-none">
                            <option value="epl">Premier League (ENG)</option>
                            <option value="laliga">La Liga (ESP)</option>
                        </select>
                    </div>

                    <div>
                        <label class="text-[10px] font-bold text-slate-500 uppercase ml-2">Клуб</label>
                        <select id="s-club" class="w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl outline-none"></select>
                    </div>
                </div>

                <button onclick="createCareer()" class="w-full bg-blue-600 mt-8 py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition">
                    Подписать контракт
                </button>
            </div>
        </div>
    `;
    updateSetupClubs();
}

function updateSetupClubs() {
    const league = document.getElementById('s-league').value;
    const clubSelect = document.getElementById('s-club');
    clubSelect.innerHTML = DB.leagues[league].clubs.map(c => `<option value="${c}">${c}</option>`).join('');
}

function createCareer() {
    const name = document.getElementById('s-name').value;
    if (!name) return alert("Введите имя игрока!");

    gameState = {
        player: {
            name: name,
            ovr: 68,
            pos: document.getElementById('s-pos').value,
            club: document.getElementById('s-club').value,
            goals: 0,
            matches: 0,
            energy: 100
        },
        date: new Date(2026, 7, 10),
        history: ["Контракт подписан. Добро пожаловать!"],
        leagueTable: DB.leagues[document.getElementById('s-league').value].clubs.map(c => ({ name: c, pts: Math.floor(Math.random()*3), g: 0 }))
    };
    
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('fc26_save', JSON.stringify(gameState));
    initGameUI();
}

function initGameUI() {
    document.getElementById('top-bar').style.opacity = "1";
    document.getElementById('bottom-nav').style.opacity = "1";
    updateHeader();
    showScreen('home');
}

function updateHeader() {
    document.getElementById('player-name-display').innerText = gameState.player.name;
    document.getElementById('player-club-display').innerText = gameState.player.club;
    document.getElementById('player-ovr-display').innerText = Math.floor(gameState.player.ovr);
    document.getElementById('game-date').innerText = gameState.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function showScreen(screen) {
    const main = document.getElementById('main-screen');
    // Обновление активной кнопки
    document.querySelectorAll('.nav-item').forEach(el => el.classList.replace('text-blue-400', 'text-slate-400'));
    
    switch(screen) {
        case 'home':
            main.innerHTML = `
                <div class="space-y-4 animate-in">
                    <div class="bg-gradient-to-br from-blue-600 to-indigo-900 p-6 rounded-3xl shadow-xl">
                        <p class="text-[10px] font-bold opacity-60 uppercase tracking-widest">Следующий матч</p>
                        <div class="flex justify-between items-center mt-4">
                            <span class="text-xl font-black">${gameState.player.club}</span>
                            <span class="text-2xl font-black italic opacity-20">VS</span>
                            <span class="text-xl font-black opacity-60 uppercase">Opponent</span>
                        </div>
                        <p class="text-center text-[10px] mt-2 font-bold text-blue-300 tracking-tighter">СУББОТА, 19:00</p>
                        <button onclick="simulateMatch()" class="w-full mt-6 bg-white text-blue-900 py-4 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition">
                            Играть
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-slate-800 p-4 rounded-2xl border border-white/5">
                            <p class="text-[9px] font-bold text-slate-500 uppercase">Энергия</p>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="flex-grow bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-green-500 h-full" style="width: ${gameState.player.energy}%"></div>
                                </div>
                                <span class="text-[10px] font-bold">${gameState.player.energy}%</span>
                            </div>
                        </div>
                        <div class="bg-slate-800 p-4 rounded-2xl border border-white/5">
                            <p class="text-[9px] font-bold text-slate-500 uppercase">Голы</p>
                            <p class="text-xl font-black text-white mt-1">${gameState.player.goals}</p>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        case 'league':
            main.innerHTML = `
                <h2 class="text-xl font-black italic uppercase mb-4 tracking-tighter">Таблица лиги</h2>
                <div class="bg-slate-800 rounded-3xl overflow-hidden border border-white/5">
                    <table class="w-full text-left text-xs">
                        <tr class="bg-slate-700/50 text-slate-400 font-bold uppercase"><th class="p-4">Клуб</th><th class="p-4 text-center">Очки</th></tr>
                        ${gameState.leagueTable.sort((a,b) => b.pts - a.pts).map((c, i) => `
                            <tr class="border-t border-white/5 ${c.name === gameState.player.club ? 'bg-blue-500/10' : ''}">
                                <td class="p-4 font-bold flex items-center gap-2">
                                    <span class="text-[10px] text-slate-500">${i+1}</span> ${c.name}
                                </td>
                                <td class="p-4 text-center font-black">${c.pts}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `;
            break;

        case 'profile':
            main.innerHTML = `
                <div class="bg-slate-800 p-6 rounded-3xl border border-white/5">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl font-black italic shadow-lg shadow-blue-500/20">${gameState.player.name[0]}</div>
                        <div>
                            <h2 class="text-2xl font-black italic uppercase leading-none">${gameState.player.name}</h2>
                            <p class="text-blue-500 font-bold text-[10px] mt-1 uppercase tracking-widest">${gameState.player.pos} | OVR ${Math.floor(gameState.player.ovr)}</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-900/50 p-4 rounded-2xl">
                            <p class="text-[8px] font-bold text-slate-500 uppercase">Матчи</p>
                            <p class="text-lg font-black">${gameState.player.matches}</p>
                        </div>
                        <div class="bg-slate-900/50 p-4 rounded-2xl">
                            <p class="text-[8px] font-bold text-slate-500 uppercase">Голы</p>
                            <p class="text-lg font-black">${gameState.player.goals}</p>
                        </div>
                    </div>
                    <button onclick="resetGame()" class="w-full mt-6 py-3 text-[10px] font-bold text-red-500 uppercase tracking-widest opacity-50 hover:opacity-100">Удалить карьеру</button>
                </div>
            `;
            break;

        case 'media':
            main.innerHTML = `
                <div class="space-y-4">
                    <div class="bg-white text-black p-6 rounded-3xl shadow-xl">
                        <div class="flex justify-between items-start mb-4">
                            <span class="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 uppercase">Срочно</span>
                            <span class="text-[8px] font-bold opacity-40 uppercase">${gameState.date.toLocaleDateString()}</span>
                        </div>
                        <h3 class="text-xl font-black leading-tight mb-2 uppercase italic text-slate-900">Будущее ${gameState.player.name} под вопросом?</h3>
                        <p class="text-sm text-slate-600 leading-snug font-medium italic">"${DB.news[Math.floor(Math.random()*DB.news.length)]}" - сообщает наш инсайдер из ${gameState.player.club}.</p>
                    </div>
                </div>
            `;
            break;
            
        case 'calendar':
            main.innerHTML = `<div class="text-center py-20 opacity-20"><p class="text-5xl mb-4">📅</p><p class="font-black italic uppercase">Событий нет</p></div>`;
            break;
    }
}

// Новая симуляция матча
function simulateMatch() {
    if (gameState.player.energy < 20) return alert("❌ Слишком устал! Нужно отдохнуть.");

    const main = document.getElementById('main-screen');
    let minute = 0;
    let myGoals = 0;
    let score = [0, 0];
    
    main.innerHTML = `
        <div class="h-full flex flex-col justify-center animate-in">
            <div class="bg-slate-800 p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div id="match-timer" class="text-4xl font-black italic text-blue-500 mb-6 text-center">0'</div>
                <div class="flex justify-between items-center text-center">
                    <div class="w-1/3">
                        <p class="text-[10px] font-bold text-slate-500 mb-2 uppercase">Дома</p>
                        <p class="font-black text-sm uppercase">${gameState.player.club}</p>
                    </div>
                    <div id="m-score" class="text-5xl font-black italic w-1/3">0 : 0</div>
                    <div class="w-1/3">
                        <p class="text-[10px] font-bold text-slate-500 mb-2 uppercase">Выезд</p>
                        <p class="font-black text-sm uppercase opacity-40">AWAY TEAM</p>
                    </div>
                </div>
                <div id="m-events" class="mt-8 text-[10px] font-bold text-center text-slate-400 uppercase tracking-tighter space-y-2 h-12"></div>
            </div>
        </div>
    `;

    const interval = setInterval(() => {
        minute += 2;
        document.getElementById('match-timer').innerText = minute + "'";
        
        // Рандомные события
        if (Math.random() > 0.9) {
            const isMe = Math.random() > 0.6;
            const eventBox = document.getElementById('m-events');
            if (isMe) {
                myGoals++;
                score[0]++;
                eventBox.innerHTML = `<p class="text-green-500 animate-bounce">⚽ ГОЛ! ВЫ ЗАБИВАЕТЕ!</p>`;
            } else {
                score[1]++;
                eventBox.innerHTML = `<p class="text-red-500 opacity-50 uppercase tracking-widest italic">Гол соперника</p>`;
            }
            document.getElementById('m-score').innerText = `${score[0]} : ${score[1]}`;
        }

        if (minute >= 90) {
            clearInterval(interval);
            finishMatch(myGoals, score);
        }
    }, 100);
}

function finishMatch(goals, finalScore) {
    gameState.player.goals += goals;
    gameState.player.matches += 1;
    gameState.player.energy = Math.max(0, gameState.player.energy - 25);
    gameState.player.ovr += (goals * 0.1);
    
    // Результат в таблицу
    const myClub = gameState.leagueTable.find(c => c.name === gameState.player.club);
    if (finalScore[0] > finalScore[1]) myClub.pts += 3;
    else if (finalScore[0] === finalScore[1]) myClub.pts += 1;
    
    // Перемотка даты на неделю
    gameState.date = new Date(new Date(gameState.date).getTime() + 7 * 24 * 60 * 60 * 1000);
    
    setTimeout(() => {
        saveAndRefresh();
    }, 1500);
}

function resetGame() {
    if(confirm("Удалить карьеру?")) {
        localStorage.removeItem('fc26_save');
        location.reload();
    }
}
