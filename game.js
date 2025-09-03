/* ======================================================
   game.js — логика игры, аккаунты, настройки, джойстики
   ====================================================== */

/* ------------------ Инициализация аккаунтов ------------------ */
// Telegram WebApp (если открыт через Telegram)
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();
let tgUser = tg?.initDataUnsafe?.user || null;

// ZLAccount (localStorage)
let zlUser = localStorage.getItem('ZLAccount') ? JSON.parse(localStorage.getItem('ZLAccount')) : null;

// Google
let googleUser = null;

/* ------------------ Настройки (localStorage) ------------------ */
const defaultSettings = {
  lang: 'ru',
  keyMap: { up: 'w', down: 's', left: 'a', right: 'd', fire: 'Mouse' }, // 'Mouse' special
  enableShootJoystick: false,
  movableJoysticks: true,
  joystickMovePos: { left: 24, bottom: 80 },
  joystickShootPos: { right: 24, bottom: 80 }
};
let settings = JSON.parse(localStorage.getItem('ZL_settings') || 'null') || defaultSettings;

/* ------------------ Скоды и утилиты ------------------ */
function saveSettingsToStorage() {
  localStorage.setItem('ZL_settings', JSON.stringify(settings));
}

function keyDisplay(key) {
  if (!key) return '';
  return key.length === 1 ? key.toUpperCase() : key;
}

/* ------------------ UI элементы ------------------ */
const screens = {
  menu: document.getElementById('menu'),
  game: document.getElementById('game'),
  accounts: document.getElementById('accounts'),
  zlAuth: document.getElementById('zlAuth'),
  skins: document.getElementById('skins'),
  settings: document.getElementById('settings')
};
const accountStatus = document.getElementById('accountStatus');
const langSelect = document.getElementById('langSelect');
const keyMapList = document.getElementById('keyMapList');
const skinListContainer = document.getElementById('skinList');
const enableShootJoystickCheckbox = document.getElementById('enableShootJoystick');
const movableJoysticksCheckbox = document.getElementById('movableJoysticks');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusDom = document.getElementById('status');
const xpStatusDom = document.getElementById('xpStatus');
const joystickMove = document.getElementById('joystickMove');
const joystickShoot = document.getElementById('joystickShoot');

/* ------------------ Скины ------------------ */
const availableSkins = [
  {name: 'Default', color: 'lime'},
  {name: 'Red', color: 'red'},
  {name: 'Blue', color: 'deepskyblue'},
  {name: 'Gold', color: '#ffd700'}
];
let playerSkin = JSON.parse(localStorage.getItem('playerSkin')) || availableSkins[0];

/* ------------------ Игровые сущности ------------------ */
let player = null;
let bullets = [];
let enemies = [];
let gameActive = false;
let xp = 0, level = 1;

/* ------------------ Джойстики состояние ------------------ */
let movePointer = {active:false, id:null, startX:0, startY:0, dx:0, dy:0};
let shootPointer = {active:false, id:null, startX:0, startY:0, dx:0, dy:0};

/* ------------------ Инициализация UI по настройкам ------------------ */
function applySettingsToUI() {
  langSelect.value = settings.lang;
  enableShootJoystickCheckbox.checked = !!settings.enableShootJoystick;
  movableJoysticksCheckbox.checked = !!settings.movableJoysticks;
  renderKeyMapUI();
  renderSkins();
  updateAccountStatus();
  // позиция джойстиков
  if (settings.joystickMovePos) {
    joystickMove.style.left = settings.joystickMovePos.left ? settings.joystickMovePos.left + 'px' : '24px';
    joystickMove.style.bottom = settings.joystickMovePos.bottom ? settings.joystickMovePos.bottom + 'px' : '80px';
  }
  if (settings.joystickShootPos) {
    joystickShoot.style.right = settings.joystickShootPos.right ? settings.joystickShootPos.right + 'px' : '24px';
    joystickShoot.style.bottom = settings.joystickShootPos.bottom ? settings.joystickShootPos.bottom + 'px' : '80px';
  }
  // visibility for right joystick
  joystickShoot.classList.toggle('hidden', !settings.enableShootJoystick);
}
applySettingsToUI();

/* ------------------ Account status ------------------ */
function updateAccountStatus(){
  const parts = [];
  if (tgUser) parts.push(`Telegram: @${tgUser.username || tgUser.first_name}`);
  if (zlUser) {
    const pref = getZLPrefix(zlUser.login);
    parts.push(`ZLAccount: ${pref ? `[${pref}] ${zlUser.login}` : zlUser.login}`);
  }
  if (googleUser) parts.push(`Google: ${googleUser.name}`);
  accountStatus.innerText = parts.length ? parts.join(' | ') : (settings.lang === 'ru' ? 'Нет аккаунтов' : 'No accounts');
}

/* ------------------ Префиксы ------------------ */
function getZLPrefix(login) {
  if (!login) return '';
  if (login === 'ZymBa1') return 'Creator';
  if (login === 'Legend') return 'Tester';
  return '';
}

/* ------------------ Навигация экранов ------------------ */
function showScreen(id) {
  for (const k in screens) screens[k].classList.remove('active');
  screens[id].classList.add('active');
}
function openMenu(){ showScreen('menu'); }
function startSingle(){ showScreen('game'); initGame(); }
function startOnline(){ alert(settings.lang === 'ru' ? 'Онлайн режим в разработке!' : 'Online mode in development!'); }
function openAccounts(){ showScreen('accounts'); }
function openZLAuth(){ showScreen('zlAuth'); }
function openSkins(){ showScreen('skins'); renderSkins(); }
function openSettings(){ showScreen('settings'); }
document.getElementById('settingsBtn').onclick = openSettings;
function goHome(){ gameActive = false; showScreen('menu'); updateAccountStatus(); }

/* ------------------ ZLAccount ------------------ */
function zlRegister(){
  const login = document.getElementById('zlLogin').value.trim();
  const pass = document.getElementById('zlPass').value.trim();
  const msg = document.getElementById('zlMsg');
  if (!login || !pass) { msg.innerText = settings.lang === 'ru' ? 'Введите логин и пароль!' : 'Enter login and password!'; return; }
  zlUser = { login, pass };
  localStorage.setItem('ZLAccount', JSON.stringify(zlUser));
  msg.innerText = settings.lang === 'ru' ? 'Регистрация успешна!' : 'Registration successful!';
  updateAccountStatus();
}
function zlLoginFunc(){
  const login = document.getElementById('zlLogin').value.trim();
  const pass = document.getElementById('zlPass').value.trim();
  const msg = document.getElementById('zlMsg');
  const stored = localStorage.getItem('ZLAccount');
  if (!stored) { msg.innerText = settings.lang === 'ru' ? 'Нет зарегистрированных аккаунтов!' : 'No registered accounts!'; return; }
  const user = JSON.parse(stored);
  if (user.login === login && user.pass === pass) { zlUser = user; msg.innerText = settings.lang === 'ru' ? 'Вход успешен!' : 'Login successful!'; updateAccountStatus(); }
  else { msg.innerText = settings.lang === 'ru' ? 'Неверный логин или пароль!' : 'Wrong login or password!'; }
}

/* ------------------ Google OAuth ------------------ */
/* decode JWT */
function decodeJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}
function handleGoogleResponse(response) {
  const data = decodeJwt(response.credential);
  googleUser = { id: data.sub, name: data.name, email: data.email, picture: data.picture };
  alert((settings.lang === 'ru' ? 'Вход через Google: ' : 'Signed in with Google: ') + googleUser.name);
  updateAccountStatus();
}

/* ------------------ Logout functions ------------------ */
function logoutTelegram(){ tgUser = null; updateAccountStatus(); }
function logoutGoogle(){ googleUser = null; updateAccountStatus(); }
function logoutZL(){ zlUser = null; localStorage.removeItem('ZLAccount'); updateAccountStatus(); }
function logoutAll(){ tgUser = null; googleUser = null; zlUser = null; localStorage.removeItem('ZLAccount'); updateAccountStatus(); alert(settings.lang === 'ru' ? 'Вышли из всех аккаунтов' : 'Logged out of all accounts'); }

/* ------------------ Скины UI ------------------ */
function renderSkins() {
  skinListContainer.innerHTML = '';
  availableSkins.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'skinBtn';
    btn.innerText = s.name;
    btn.style.backgroundColor = s.color;
    btn.onclick = () => {
      playerSkin = s;
      localStorage.setItem('playerSkin', JSON.stringify(playerSkin));
      alert((settings.lang === 'ru' ? 'Выбран скин: ' : 'Skin selected: ') + s.name);
    };
    skinListContainer.appendChild(btn);
  });
}

/* ------------------ Клавиши (переназначение) UI ------------------ */
function renderKeyMapUI(){
  keyMapList.innerHTML = '';
  const map = settings.keyMap;
  const rows = [
    {k:'up', name: settings.lang === 'ru' ? 'Вверх' : 'Up'},
    {k:'down', name: settings.lang === 'ru' ? 'Вниз' : 'Down'},
    {k:'left', name: settings.lang === 'ru' ? 'Влево' : 'Left'},
    {k:'right', name: settings.lang === 'ru' ? 'Вправо' : 'Right'},
    {k:'fire', name: settings.lang === 'ru' ? 'Стрельба' : 'Fire'}
  ];
  rows.forEach(r=>{
    const row = document.createElement('div');
    row.style.margin = '6px 0';
    const label = document.createElement('span');
    label.innerText = r.name + ': ' + keyDisplay(map[r.k]);
    label.style.marginRight = '10px';
    const btn = document.createElement('button');
    btn.innerText = (settings.lang === 'ru' ? 'Изменить' : 'Change');
    btn.onclick = () => listenForKey(r.k, label);
    row.appendChild(label); row.appendChild(btn);
    keyMapList.appendChild(row);
  });
}

function listenForKey(keyName, labelElement) {
  labelElement.innerText = (settings.lang === 'ru' ? 'Нажмите клавишу...' : 'Press a key...');
  function handler(e) {
    e.preventDefault();
    let code = e.key;
    // treat mouse as special via click on button - here we accept 'Mouse' if user presses Escape? We'll map click separately
    settings.keyMap[keyName] = code === ' ' ? 'Space' : code;
    saveSettingsToStorage();
    renderKeyMapUI();
    window.removeEventListener('keydown', handler);
  }
  window.addEventListener('keydown', handler);
}

/* ------------------ Сохранение настроек (кнопки) ------------------ */
document.getElementById('langSelect').addEventListener('change', (e) => {
  settings.lang = e.target.value;
  saveSettingsToStorage();
  renderKeyMapUI();
  updateAccountStatus();
});
document.getElementById('enableShootJoystick').addEventListener('change', (e) => {
  settings.enableShootJoystick = e.target.checked;
  joystickShoot.classList.toggle('hidden', !settings.enableShootJoystick);
  saveSettingsToStorage();
});
document.getElementById('movableJoysticks').addEventListener('change', (e) => {
  settings.movableJoysticks = e.target.checked;
  saveSettingsToStorage();
});

/* Save settings button */
function saveSettings() {
  settings.lang = langSelect.value;
  saveSettingsToStorage();
  alert(settings.lang === 'ru' ? 'Настройки сохранены' : 'Settings saved');
}

/* ------------------ Игровая логика ------------------ */
let keysState = {};
document.addEventListener('keydown', e => {
  keysState[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
  keysState[e.key.toLowerCase()] = false;
});

/* mouse fire detection */
let mouseFireDown = false;
document.addEventListener('mousedown', e => { mouseFireDown = true; });
document.addEventListener('mouseup', e => { mouseFireDown = false; });

canvas.addEventListener('click', (e) => {
  if (!gameActive) return;
  if (settings.keyMap.fire === 'Mouse' && !settings.enableShootJoystick) {
    const r = canvas.getBoundingClientRect();
    const tx = e.clientX - r.left, ty = e.clientY - r.top;
    shoot(tx, ty);
  }
});

/* bullets, enemies, xp, respawn */
function initGame(){
  player = { x: canvas.width/2, y: canvas.height/2, size: 18, health: 100, speed: 3 };
  bullets = [];
  enemies = [];
  xp = 0; level = 1;
  spawnWave(5);
  gameActive = true;
  gameLoop();
  updateHUD();
}

function spawnWave(n){
  enemies = [];
  for (let i=0;i<n;i++){
    const typeRand = Math.random();
    const type = typeRand > 0.85 ? 'boss' : (typeRand > 0.5 ? 'blue' : 'red');
    enemies.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: type==='boss'?30:20, hp: type==='boss'?200: (type==='blue'?80:50), speed: type==='boss'?0.6:(type==='blue'?1.3:1.0), type});
  }
}

function updateHUD(){
  statusDom.innerText = `${settings.lang === 'ru' ? 'HP' : 'HP'}: ${Math.floor(player.health)} | ${settings.lang === 'ru' ? 'Врагов' : 'Enemies'}: ${enemies.length}`;
  xpStatusDom.innerText = `XP: ${xp} | Level: ${level}`;
}

/* shooting helper */
function shoot(tx, ty) {
  const dx = tx - player.x, dy = ty - player.y;
  const d = Math.hypot(dx,dy) || 1;
  bullets.push({ x: player.x, y: player.y, dx: (dx/d)*8, dy: (dy/d)*8, life: 200 });
}

/* main update loop */
function gameLoop(){
  if (!gameActive) return;
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function update(){
  // movement via keyMap
  const km = settings.keyMap;
  if (keysState[km.up]) player.y -= player.speed;
  if (keysState[km.down]) player.y += player.speed;
  if (keysState[km.left]) player.x -= player.speed;
  if (keysState[km.right]) player.x += player.speed;

  // movement via joystick (touch)
  const moveVec = getMoveVectorFromJoystick();
  if (moveVec) {
    player.x += moveVec.x * player.speed * 1.2;
    player.y += moveVec.y * player.speed * 1.2;
  }

  // shooting via shoot joystick if enabled
  if (settings.enableShootJoystick) {
    const shootVec = getShootVectorFromJoystick();
    if (shootVec && (Math.hypot(shootVec.x, shootVec.y) > 0.2)) {
      // continuous shooting while joystick tilted
      const tx = player.x + shootVec.x * 200;
      const ty = player.y + shootVec.y * 200;
      // rate limiting: push bullets occasionally
      if (!this._shootCooldown || Date.now() - this._shootCooldown > 200) {
        shoot(tx, ty);
        this._shootCooldown = Date.now();
      }
    }
  } else {
    // shooting from touch tap using special mapping - handled in canvas click
    // keyboard fire
    if (km.fire && km.fire !== 'Mouse') {
      if (keysState[km.fire]) {
        // shoot in mouse direction? keyboard fire will shoot forward
        const tx = player.x + 100;
        const ty = player.y;
        if (!this._shootCooldown || Date.now() - this._shootCooldown > 200) {
          shoot(tx, ty);
          this._shootCooldown = Date.now();
        }
      }
    }
  }

  // update bullets
  bullets.forEach(b => { b.x += b.dx; b.y += b.dy; b.life--; b.dead = (b.life<=0); });

  // update enemies
  enemies.forEach(e => {
    const dx = player.x - e.x, dy = player.y - e.y;
    const dist = Math.hypot(dx,dy) || 1;
    e.x += (dx/dist) * e.speed;
    e.y += (dy/dist) * e.speed;
    if (dist < 25) player.health -= 0.25;
  });

  // collisions bullet -> enemy
  bullets.forEach(b => {
    enemies.forEach(e => {
      if (b.x > e.x - e.size && b.x < e.x + e.size && b.y > e.y - e.size && b.y < e.y + e.size) {
        e.hp -= 20;
        b.dead = true;
        // visual effect could be added
      }
    });
  });

  // cleanup
  bullets = bullets.filter(b => !b.dead && !b.remove && b.x >= -50 && b.x <= canvas.width+50 && b.y >= -50 && b.y <= canvas.height+50);
  const prevCount = enemies.length;
  enemies = enemies.filter(e => e.hp > 0);
  const killed = prevCount - enemies.length;
  if (killed > 0) {
    xp += killed * 10;
    if (xp >= level * 50) { level++; player.health = Math.min(player.health + 20, 200); }
  }

  updateHUD();

  if (player.health <= 0) {
    alert(settings.lang === 'ru' ? 'Ты проиграл!' : 'You lost!');
    goHome();
  }

  // respawn wave when all dead
  if (enemies.length === 0 && gameActive) {
    setTimeout(()=>{ spawnWave(5); }, 3000);
  }

  // clamp player inside canvas
  player.x = Math.max(10, Math.min(canvas.width - 10, player.x));
  player.y = Math.max(10, Math.min(canvas.height - 10, player.y));
}

/* ------------------ Draw ------------------ */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // draw player
  ctx.fillStyle = playerSkin.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI*2);
  ctx.fill();

  // draw player label (ZL > Google > Telegram)
  let label = '';
  if (zlUser) {
    const pref = getZLPrefix(zlUser.login);
    label = pref ? `[${pref}] ${zlUser.login}` : zlUser.login;
  } else if (googleUser) {
    label = googleUser.name;
  } else if (tgUser) {
    label = tgUser.username ? `@${tgUser.username}` : tgUser.first_name || '';
  }
  if (label) {
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, player.x, player.y - player.size - 8);
  }

  // draw enemies
  enemies.forEach(e => {
    ctx.fillStyle = (e.type === 'red') ? 'red' : (e.type === 'blue' ? 'dodgerblue' : '#d4af37');
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(e.type === 'red' ? 'T' : e.type === 'blue' ? 'S' : 'Boss', e.x, e.y + 4);
  });

  // draw bullets
  ctx.fillStyle = 'yellow';
  bullets.forEach(b => ctx.fillRect(b.x-2, b.y-2, 5, 5));
}

/* ------------------ Joystick touch controls ------------------ */
function getMoveVectorFromJoystick(){
  if (!movePointer.active) return null;
  const dx = movePointer.dx, dy = movePointer.dy;
  const len = Math.hypot(dx, dy);
  if (len < 8) return {x:0,y:0};
  return { x: dx / 50, y: dy / 50 }; // normalized-ish
}
function getShootVectorFromJoystick(){
  if (!shootPointer.active) return null;
  const dx = shootPointer.dx, dy = shootPointer.dy;
  const len = Math.hypot(dx, dy);
  if (len < 8) return {x:0,y:0};
  return { x: dx / 50, y: dy / 50 };
}

/* Touch/mouse handlers for movable joysticks */
function pointerStart(e, joystickType) {
  e.preventDefault();
  const isTouch = e.touches && e.touches.length;
  const p = isTouch ? e.touches[0] : e;
  const id = isTouch ? p.identifier : 'mouse' + Math.random();
  const rect = joystickType === 'move' ? joystickMove.getBoundingClientRect() : joystickShoot.getBoundingClientRect();
  const centerX = rect.left + rect.width/2;
  const centerY = rect.top + rect.height/2;
  if (joystickType === 'move') {
    movePointer.active = true; movePointer.id = id; movePointer.startX = centerX; movePointer.startY = centerY;
    movePointer.dx = 0; movePointer.dy = 0;
  } else {
    shootPointer.active = true; shootPointer.id = id; shootPointer.startX = centerX; shootPointer.startY = centerY;
    shootPointer.dx = 0; shootPointer.dy = 0;
  }
}
function pointerMove(e, joystickType) {
  e.preventDefault();
  const isTouch = e.touches && e.touches.length;
  const p = isTouch ? e.touches[0] : e;
  const clientX = p.clientX, clientY = p.clientY;
  if (joystickType === 'move' && movePointer.active) {
    movePointer.dx = clientX - movePointer.startX;
    movePointer.dy = clientY - movePointer.startY;
    joystickMove.querySelector('.stick').style.transform = `translate(${movePointer.dx/3}px, ${movePointer.dy/3}px)`;
  }
  if (joystickType === 'shoot' && shootPointer.active) {
    shootPointer.dx = clientX - shootPointer.startX;
    shootPointer.dy = clientY - shootPointer.startY;
    joystickShoot.querySelector('.stick').style.transform = `translate(${shootPointer.dx/3}px, ${shootPointer.dy/3}px)`;
  }
}
function pointerEnd(e, joystickType) {
  e.preventDefault();
  if (joystickType === 'move') {
    movePointer.active = false; movePointer.id = null; movePointer.dx = 0; movePointer.dy = 0;
    joystickMove.querySelector('.stick').style.transform = `translate(0px,0px)`;
  }
  if (joystickType === 'shoot') {
    shootPointer.active = false; shootPointer.id = null; shootPointer.dx = 0; shootPointer.dy = 0;
    joystickShoot.querySelector('.stick').style.transform = `translate(0px,0px)`;
  }
}

/* Attach pointer handlers and moving the joystick on screen (if movable allowed) */
function attachJoystickHandlers(){
  // move joystick
  joystickMove.addEventListener('touchstart', (e)=>pointerStart(e,'move'));
  joystickMove.addEventListener('touchmove', (e)=>pointerMove(e,'move'));
  joystickMove.addEventListener('touchend', (e)=>pointerEnd(e,'move'));
  joystickMove.addEventListener('mousedown', (e)=>pointerStart(e,'move'));
  window.addEventListener('mousemove', (e)=>pointerMove(e,'move'));
  window.addEventListener('mouseup', (e)=>pointerEnd(e,'move'));

  // shoot joystick
  joystickShoot.addEventListener('touchstart', (e)=>pointerStart(e,'shoot'));
  joystickShoot.addEventListener('touchmove', (e)=>pointerMove(e,'shoot'));
  joystickShoot.addEventListener('touchend', (e)=>pointerEnd(e,'shoot'));
  joystickShoot.addEventListener('mousedown', (e)=>pointerStart(e,'shoot'));
  window.addEventListener('mousemove', (e)=>pointerMove(e,'shoot'));
  window.addEventListener('mouseup', (e)=>pointerEnd(e,'shoot'));

  // draggable position (if movableJoysticks)
  let dragTarget = null, offsetX=0, offsetY=0;
  function startDrag(e, el) {
    if (!settings.movableJoysticks) return;
    e.preventDefault();
    dragTarget = el;
    const p = e.touches ? e.touches[0] : e;
    const rect = el.getBoundingClientRect();
    offsetX = p.clientX - rect.left; offsetY = p.clientY - rect.top;
  }
  function doDrag(e) {
    if (!dragTarget) return;
    const p = e.touches ? e.touches[0] : e;
    const left = Math.max(0, Math.min(window.innerWidth - dragTarget.offsetWidth, p.clientX - offsetX));
    const top = Math.max(0, Math.min(window.innerHeight - dragTarget.offsetHeight, p.clientY - offsetY));
    dragTarget.style.left = left + 'px';
    dragTarget.style.top = top + 'px';
  }
  function endDrag() {
    if (!dragTarget) return;
    // save position
    const rect = dragTarget.getBoundingClientRect();
    if (dragTarget === joystickMove) {
      settings.joystickMovePos = { left: Math.round(rect.left), bottom: Math.round(window.innerHeight - rect.bottom) };
    } else {
      settings.joystickShootPos = { right: Math.round(window.innerWidth - rect.right), bottom: Math.round(window.innerHeight - rect.bottom) };
    }
    saveSettingsToStorage();
    dragTarget = null;
  }

  // attach listeners
  joystickMove.addEventListener('dblclick', (e)=>startDrag(e, joystickMove));
  joystickMove.addEventListener('touchstart', (e)=>{ if (settings.movableJoysticks) startDrag(e, joystickMove); });
  joystickMove.addEventListener('touchmove', (e)=>{ if (dragTarget) doDrag(e); });
  joystickMove.addEventListener('touchend', endDrag);
  joystickMove.addEventListener('mousedown', (e)=>{ if (settings.movableJoysticks) startDrag(e, joystickMove); });
  window.addEventListener('mousemove', (e)=>{ if (dragTarget) doDrag(e); });
  window.addEventListener('mouseup', endDrag);

  joystickShoot.addEventListener('dblclick', (e)=>startDrag(e, joystickShoot));
  joystickShoot.addEventListener('touchstart', (e)=>{ if (settings.movableJoysticks) startDrag(e, joystickShoot); });
  joystickShoot.addEventListener('touchmove', (e)=>{ if (dragTarget) doDrag(e); });
  joystickShoot.addEventListener('touchend', endDrag);
  joystickShoot.addEventListener('mousedown', (e)=>{ if (settings.movableJoysticks) startDrag(e, joystickShoot); });
}

attachJoystickHandlers();

/* ------------------ Render initial UI and keymap ------------------ */
renderKeyMapUI();
renderSkins();
updateAccountStatus();

/* ------------------ Helpers: prefix color based on ZL nick ------------------ */
function getPlayerColor(){
  if (playerSkin) return playerSkin.color;
  if (zlUser) {
    const p = getZLPrefix(zlUser.login);
    if (p === 'Creator') return '#ffd700';
    if (p === 'Tester') return '#4da3ff';
  }
  return 'lime';
}

/* ------------------ Event: save settings from UI button ------------------ */
window.saveSettings = saveSettings; // expose for index.html button

/* ------------------ Misc helpers for connecting Telegram (demo) ------------------ */
function connectTelegram(){
  // If running inside Telegram WebApp, tg.initDataUnsafe.user already set
  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    tgUser = tg.initDataUnsafe.user;
    updateAccountStatus();
    alert((settings.lang==='ru'?'Telegram подключён':'Telegram connected') + ': ' + (tgUser.username || tgUser.first_name));
  } else {
    alert((settings.lang==='ru'?'Telegram WebApp недоступен':'Telegram WebApp not available'));
  }
}

/* ------------------ Expose several funcs for index.html buttons ------------------ */
window.startSingle = startSingle;
window.startOnline = startOnline;
window.openAccounts = openAccounts;
window.openSkins = openSkins;
window.openZLAuth = openZLAuth;
window.openMenu = openMenu;
window.goHome = goHome;
window.zlRegister = zlRegister;
window.zlLoginFunc = zlLoginFunc;
window.logoutAll = logoutAll;
window.logoutTelegram = logoutTelegram;
window.logoutGoogle = logoutGoogle;
window.logoutZL = logoutZL;
window.handleGoogleResponse = handleGoogleResponse;
window.saveSettings = saveSettings;
window.openMenu = openMenu;
window.openSettings = openSettings;

/* ------------------ End of file ------------------ */

