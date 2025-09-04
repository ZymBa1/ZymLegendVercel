// Preloader
window.addEventListener('load', () => {
  setTimeout(()=>{ document.getElementById('preloader').style.display='none'; }, 1000);
});

// Переменные
let player = {x:400, y:250, size:20, hp:100};
let enemies = [];
let bases = [{x:100,y:100,owner:null},{x:700,y:400,owner:null}];
let clans = [];
let difficulty = 'normal';
let gameActive = false;
let playerSkin = {color:'lime'};
let settings = {enableShootJoystick:true, movableJoysticks:true, lang:'ru'};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Меню
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startSingle(){
  gameActive=true;
  showScreen('game');
  requestAnimationFrame(gameLoop);
}

// Игровой цикл
function gameLoop(){
  update();
  draw();
  if(gameActive) requestAnimationFrame(gameLoop);
}

// Обновления
function update(){
  // захват баз
  bases.forEach(b=>{
    if(Math.hypot(player.x-b.x,player.y-b.y)<30) b.owner='player';
  });
}

// Рисование
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // игрок
  ctx.fillStyle=playerSkin.color;
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.size,0,Math.PI*2);
  ctx.fill();
  // базы
  bases.forEach(b=>{
    ctx.fillStyle=b.owner==='player'?'lime':'red';
    ctx.fillRect(b.x-15,b.y-15,30,30);
  });
}

// Кланы
function openClans(){ showScreen('clans'); renderClans(); }
function createClan(){
  const name=document.getElementById('clanName').value.trim();
  if(name) clans.push({name,members:['player']});
  renderClans();
}
function renderClans(){
  const div=document.getElementById('clanList');
  div.innerHTML='';
  clans.forEach(c=>{ div.innerHTML+=`${c.name} (${c.members.length} участника)<br>`; });
}

// Настройки
const difficultySelect = document.getElementById('difficultySelect');
difficultySelect?.addEventListener('change',(e)=>{difficulty=e.target.value;});
function saveSettings(){
  settings.enableShootJoystick=document.getElementById('enableShootJoystick').checked;
  settings.movableJoysticks=document.getElementById('movableJoysticks').checked;
  alert('Настройки сохранены');
}

// Языки
function changeLanguage(lang){ settings.lang=lang; alert('Выбран язык: '+lang); }

// Аккаунты
function connectTelegram(){ alert('Telegram WebApp подключен!'); }
function openZLAuth(){ alert('ZLAccount окно открыто!'); }
function facebookLogin(){ alert('Ошибка: на данный момент сайт не может подключиться к серверам Meta.'); }
function handleGoogleResponse(response){ console.log('Google JWT:', response.credential); alert('Google аккаунт подключен!'); }
function logoutAll(){ alert('Все аккаунты отключены'); }

// Навигация
function openMenu(){ showScreen('menu'); }
function openAccounts(){ showScreen('accounts'); }
function openSettings(){ showScreen('settings'); }
function goHome(){ showScreen('menu'); }

