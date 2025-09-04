/* =================== Preloader =================== */
window.addEventListener('load', () => {
  setTimeout(()=>{ document.getElementById('preloader').style.display='none'; }, 1000);
});

/* ----------------- Серверы ----------------- */
let servers = ['RU','ENG'];
let customServers = [];
function openServerSelect(){ showScreen('servers'); renderServers(); }
function renderServers(){
  const container = document.getElementById('serverList');
  container.innerHTML = '';
  servers.concat(customServers).forEach(s=>{
    const btn = document.createElement('button');
    btn.innerText = s;
    btn.onclick = ()=>connectToServer(s);
    container.appendChild(btn);
  });
}
function connectToServer(name){
  alert((settings.lang==='ru'? 'Подключение к серверу: ':'Connecting to server: ') + name);
  // здесь можно добавить реальную логику онлайн
}
function addCustomServer(){
  const val = document.getElementById('customServer').value.trim();
  if(val && !customServers.includes(val)) customServers.push(val);
  renderServers();
}

/* ----------------- Сложность ----------------- */
const difficultySelect = document.getElementById('difficultySelect');
let difficulty = difficultySelect ? difficultySelect.value : 'normal';
difficultySelect?.addEventListener('change',(e)=>{ difficulty=e.target.value; });

/* ----------------- Базы ----------------- */
let bases = [{x:100,y:100,owner:null},{x:700,y:400,owner:null}];
function captureBase(base){
  if(player && Math.hypot(player.x-base.x,player.y-base.y)<30){
    base.owner='player';
    updateBaseHUD();
  }
}
function updateBaseHUD(){
  const owned = bases.filter(b=>b.owner==='player').length;
  document.getElementById('baseStatus').innerText = `Базы захвачены: ${owned}`;
}

/* ----------------- Кланы ----------------- */
let clans = [];
function openClans(){ showScreen('clans'); renderClans(); }
function createClan(){
  const name = document.getElementById('clanName').value.trim();
  if(name) clans.push({name,members:[zlUser?.login||'']});
  renderClans();
}
function renderClans(){
  const div = document.getElementById('clanList');
  div.innerHTML='';
  clans.forEach(c=>{
    const el = document.createElement('div');
    el.innerText=`${c.name} (${c.members.length} участника)`;
    div.appendChild(el);
  });
}

/* ----------------- Интеграция в игровой update() ----------------- */
function update(){
  if(!gameActive) return;
  // движение, джойстики, стрельба, пули, враги - как раньше
  // ...
  
  // захват баз
  bases.forEach(b=>captureBase(b));
  
  // respawn wave depending on difficulty
  if(enemies.length===0 && gameActive){
    let count = 5;
    if(difficulty==='easy') count=3;
    if(difficulty==='hard') count=7;
    setTimeout(()=>spawnWave(count),2000);
  }
  
  // clamp player
  player.x = Math.max(10, Math.min(canvas.width-10, player.x));
  player.y = Math.max(10, Math.min(canvas.height-10, player.y));
}

/* ----------------- Draw ----------------- */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // игрок
  ctx.fillStyle = playerSkin.color;
  ctx.beginPath();
  ctx.arc(player.x,player.y,player.size,0,Math.PI*2);
  ctx.fill();
  // базы
  bases.forEach(b=>{
    ctx.fillStyle=b.owner==='player'?'lime':'red';
    ctx.beginPath();
    ctx.rect(b.x-15,b.y-15,30,30);
    ctx.fill();
  });
  // враги, пули, имена - как раньше
}

/* =================== Конец обновлений =================== */
