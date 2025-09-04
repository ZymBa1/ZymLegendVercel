/* =================== Preloader =================== */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').style.display = 'none';
  }, 1000);
});

/* =================== Переменные =================== */
let gameActive = false;
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

let player = { x: 400, y: 250, size: 15, hp: 100 };
let playerSkin = { color: 'lime' };
let enemies = [];
let bases = [
  { x: 100, y: 100, owner: null },
  { x: 700, y: 400, owner: null }
];
let difficulty = 'normal';
let settings = { lang: 'ru', enableShootJoystick: true, movableJoysticks: true };
let zlUser = null;
let clans = [];

/* =================== Экран =================== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function openMenu() { showScreen('menu'); }
function goHome() { showScreen('menu'); }
function openSettings() { showScreen('settings'); }
function closeSettings() { showScreen('menu'); }

/* =================== Игра =================== */
function startSingle() {
  gameActive = true;
  player.x = 400; player.y = 250; player.hp = 100;
  enemies = [];
  updateBaseHUD();
  spawnWave(5);
  showScreen('game');
  requestAnimationFrame(gameLoop);
}

/* =================== Боты =================== */
function spawnWave(count) {
  for (let i = 0; i < count; i++) {
    let enemy = { x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 12, hp: 50, color: 'red' };
    enemies.push(enemy);
  }
}

/* =================== Обновление =================== */
function update() {
  if (!gameActive) return;

  // Движение ботов
  enemies.forEach(e => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);
    if (dist > 0) {
      e.x += (dx / dist) * 1.5;
      e.y += (dy / dist) * 1.5;
    }
    if (dist < player.size + e.size) {
      player.hp -= 0.5; // урон
    }
  });

  // Захват баз
  bases.forEach(b => {
    if (Math.hypot(player.x - b.x, player.y - b.y) < 30) {
      b.owner = 'player';
    }
  });

  updateBaseHUD();

  // Проверка смерти игрока
  if (player.hp <= 0) {
    gameActive = false;
    alert('Вы проиграли!');
    goHome();
  }
}

/* =================== Отрисовка =================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Игрок
  ctx.fillStyle = playerSkin.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  // Базы
  bases.forEach(b => {
    ctx.fillStyle = b.owner === 'player' ? 'lime' : 'red';
    ctx.fillRect(b.x - 15, b.y - 15, 30, 30);
  });

  // Враги
  enemies.forEach(e => {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // HUD
  document.getElementById('status').innerText = `HP: ${Math.round(player.hp)} | Врагов: ${enemies.length}`;
}

/* =================== HUD =================== */
function updateBaseHUD() {
  const owned = bases.filter(b => b.owner === 'player').length;
  document.getElementById('baseStatus').innerText = `Базы захвачены: ${owned}`;
}

/* =================== Игровой цикл =================== */
function gameLoop() {
  if (!gameActive) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

/* =================== Кланы =================== */
function openClans() { showScreen('clans'); renderClans(); }
function createClan() {
  const name = document.getElementById('clanName').value.trim();
  if (name) clans.push({ name, members: [zlUser?.login || 'Игрок'] });
  renderClans();
}
function renderClans() {
  const div = document.getElementById('clanList');
  div.innerHTML = '';
  clans.forEach(c => {
    const el = document.createElement('div');
    el.innerText = `${c.name} (${c.members.length} участника)`;
    div.appendChild(el);
  });
}

/* =================== Аккаунты =================== */
function connectTelegram() { alert('Telegram WebApp подключён!'); }
function connectFacebook() { alert('Facebook подключён!'); }
function openZLAuth() { showScreen('zlAuth'); }
function zlRegister() { alert('Регистрация ZLAccount!'); }
function zlLoginFunc() { alert('Вход ZLAccount!'); zlUser = { login: document.getElementById('zlLogin').value }; }
function logoutAll() { alert('Выход из всех аккаунтов!'); zlUser = null; }

/* =================== Настройки =================== */
document.getElementById('difficultySelect').addEventListener('change', e => difficulty = e.target.value);
document.getElementById('enableShootJoystick').addEventListener('change', e => settings.enableShootJoystick = e.target.checked);
document.getElementById('movableJoysticks').addEventListener('change', e => settings.movableJoysticks = e.target.checked);
document.getElementById('langSelect').addEventListener('change', e => settings.lang = e.target.value);
function saveSettings() { alert('Настройки сохранены!'); }
function logoutTelegram() { alert('Telegram отключён'); }
function logoutGoogle() { alert('Google отключён'); }
function logoutZL() { alert('ZLAccount отключён'); }
