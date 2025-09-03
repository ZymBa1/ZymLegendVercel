// ================== Аккаунты ==================
const tg = window.Telegram?.WebApp; if(tg) tg.expand(); let tgUser=tg?.initDataUnsafe?.user||null;
let zlUser=localStorage.getItem("ZLAccount")?JSON.parse(localStorage.getItem("ZLAccount")):null;
let googleUser=null;

// ================== Google OAuth ==================
function decodeJwt(token){
  const base64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  const json = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  return JSON.parse(json);
}
function handleGoogleResponse(response){
  const data = decodeJwt(response.credential);
  googleUser = { id: data.sub, name: data.name, email: data.email, picture: data.picture };
  alert(`✅ Вход через Google: ${googleUser.name}`);
  updateAccountStatus();
}

// ================== Префиксы и скины ==================
function getZLPrefix(login){if(!login) return ""; if(login==="ZymBa1") return "Creator"; if(login==="Legend") return "Tester"; return "";}
let availableSkins = [{name:"Default",color:"lime"},{name:"Red",color:"red"},{name:"Blue",color:"blue"},{name:"Gold",color:"#ffd700"}];
let playerSkin = JSON.parse(localStorage.getItem("playerSkin")) || availableSkins[0];
function getPlayerColor(){ return playerSkin.color; }

// ================== DOM ==================
const menu=document.getElementById("menu"), gameDiv=document.getElementById("game"), accountsDiv=document.getElementById("accounts"),
      profileDiv=document.getElementById("profile"), zlAuthDiv=document.getElementById("zlAuth"), loadingDiv=document.getElementById("loading"),
      skinsDiv=document.getElementById("skins"), canvas=document.getElementById("gameCanvas"), ctx=canvas.getContext("2d"),
      status=document.getElementById("status"), xpStatus=document.getElementById("xpStatus"), accountStatus=document.getElementById("accountStatus");

// ================== Статус аккаунтов ==================
function updateAccountStatus(){
  let parts = [];
  if(tgUser) parts.push(`Telegram: @${tgUser.username||tgUser.first_name}`);
  if(zlUser){const pref=getZLPrefix(zlUser.login); const label = pref?`[${pref}] ${zlUser.login}`:zlUser.login; parts.push(`ZLAccount: ${label}`);}
  if(googleUser) parts.push(`Google: ${googleUser.name}`);
  accountStatus.innerText = parts.length?parts.join(" | "):"Нет аккаунтов";
}

// ================== Навигация ==================
function startSingle(){menu.classList.remove("active"); gameDiv.classList.add("active"); initGame();}
function startOnline(){alert("Онлайн режим в разработке!");}
function openAccounts(){menu.classList.remove("active"); accountsDiv.classList.add("active");}
function openProfile(){accountsDiv.classList.remove("active"); profileDiv.classList.add("active"); if(tgUser){document.getElementById("profileInfo").innerHTML=`<b>ID:</b> ${tgUser.id}<br><b>Имя:</b> ${tgUser.first_name||""} ${tgUser.last_name||""}<br><b>Username:</b> @${tgUser.username||"нет"}`;} else {document.getElementById("profileInfo").innerText="Данные Telegram не получены ❌";}}
function openZLAuth(){accountsDiv.classList.remove("active"); zlAuthDiv.classList.add("active");}
function openSkins(){menu.classList.remove("active"); skinsDiv.classList.add("active"); renderSkins();}
function goHome(){gameActive=false; menu.classList.add("active"); gameDiv.classList.remove("active"); accountsDiv.classList.remove("active"); profileDiv.classList.remove("active"); zlAuthDiv.classList.remove("active"); loadingDiv.classList.remove("active"); skinsDiv.classList.remove("active"); updateAccountStatus();}

// ================== ZLAccount ==================
function zlRegister(){const login=document.getElementById("zlLogin").value.trim();const pass=document.getElementById("zlPass").value.trim();const msg=document.getElementById("zlMsg"); if(!login||!pass){msg.innerText="Введите логин и пароль!";return;} zlUser={login,pass}; localStorage.setItem("ZLAccount",JSON.stringify(zlUser)); msg.innerText="✅ Регистрация успешна!"; updateAccountStatus();}
function zlLoginFunc(){const login=document.getElementById("zlLogin").value.trim();const pass=document.getElementById("zlPass").value.trim(); const msg=document.getElementById("zlMsg"); const stored=localStorage.getItem("ZLAccount"); if(!stored){msg.innerText="Нет зарегистрированных аккаунтов!";return;} const user=JSON.parse(stored); if(user.login===login&&user.pass===pass){zlUser=user; msg.innerText="✅ Вход успешен!"; updateAccountStatus();}else{msg.innerText="❌ Неверный логин или пароль!";}}

// ================== Скины ==================
function renderSkins(){const list=document.getElementById("skinList"); list.innerHTML=""; availableSkins.forEach(s=>{const btn=document.createElement("button"); btn.className="skin-btn"; btn.innerText=s.name; btn.style.backgroundColor=s.color; btn.onclick=()=>{playerSkin=s; localStorage.setItem("playerSkin",JSON.stringify(playerSkin)); alert(`Выбран скин: ${s.name}`); list.innerHTML=""; renderSkins(); }; list.appendChild(btn);});}

// ================== Игровой цикл ==================
let player, bullets=[], enemies=[], gameActive=false, xp=0, level=1;
let mouseX=0, mouseY=0; const keys={};
document.addEventListener("keydown", e=>keys[e.key]=true);
document.addEventListener("keyup", e=>keys[e.key]=false);
canvas.addEventListener("mousemove", e=>{const r=canvas.getBoundingClientRect(); mouseX=e.clientX-r.left; mouseY=e.clientY-r.top;});
document.addEventListener("click", e=>{if(!gameActive) return; const r=canvas.getBoundingClientRect(); const tx=e.clientX-r.left, ty=e.clientY-r.top; const dx=tx-player.x, dy=ty-player.y; const d=Math.hypot(dx,dy)||1; bullets.push({x:player.x, y:player.y, dx:(dx/d)*6, dy:(dy/d)*6});});

function initGame(){player={x:300,y:200,size:20,health:100,speed:3}; bullets=[]; enemies=[]; xp=0; level=1; spawnEnemies(5); gameActive=true; gameLoop(); updateXP();}
function spawnEnemies(n){enemies=[]; for(let i=0;i<n;i++){enemies.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, size:20, hp:50, speed:1+(Math.random()), type:i%3===0?"boss":i%3===1?"blue":"red"});}}
function updateXP(){xpStatus.innerText=`XP: ${xp} | Level: ${level}`;}
function gameLoop(){if(!gameActive) return; update(); draw(); requestAnimationFrame(gameLoop);}
function update(){
  if(keys["w"]) player.y-=player.speed; if(keys["s"]) player.y+=player.speed;
  if(keys["a"]) player.x-=player.speed; if(keys["d"]) player.x+=player.speed;
  
  bullets.forEach(b=>{b.x+=b.dx;b.y+=b.dy;});
  enemies.forEach(e=>{const dx=player.x-e.x, dy=player.y-e.y, d=Math.hypot(dx,dy)||1; e.x+=(dx/d)*e.speed; e.y+=(dy/d)*e.speed; if(d<25) player.health-=0.3;});
  bullets.forEach(b=>{enemies.forEach(e=>{if(b.x>e.x-e.size&&b.x<e.x+e.size&&b.y>e.y-e.size&&b.y<e.y+e.size){e.hp-=10;b.remove=true;if(e.hp<=0){xp+=10;if(xp>=level*50){level++;player.health+=20;}updateXP();}}});});
  enemies=enemies.filter(e=>e.hp>0); bullets=bullets.filter(b=>!b.remove);
  status.innerText=`HP: ${Math.floor(player.health)} | Врагов: ${enemies.length}`;
  if(player.health<=0){alert("Ты проиграл!");goHome();}
  if(enemies.length===0){setTimeout(()=>spawnEnemies(5),3000);}
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=getPlayerColor(); ctx.beginPath(); ctx.arc(player.x,player.y,player.size,0,Math.PI*2); ctx.fill();
  let label=""; if(zlUser){const pref=getZLPrefix(zlUser.login); label=pref?`[${pref}] ${zlUser.login}`:zlUser.login;} else if(googleUser){label=googleUser.name;} else if(tgUser){label=tgUser.username?`@${tgUser.username}`:tgUser.first_name;}
  if(label){ctx.font="14px Arial";ctx.textAlign="center";ctx.fillStyle="#fff"; ctx.fillText(label,player.x,player.y-player.size-6);}
  enemies.forEach(e=>{ctx.fillStyle=e.type==="red"?"red":e.type==="blue"?"blue":"gold"; ctx.beginPath(); ctx.arc(e.x,e.y,e.size,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#000"; ctx.font="12px Arial"; ctx.textAlign="center"; ctx.fillText(e.type==="red"?"T":e.type==="blue"?"B":"Boss",e.x,e.y+4);});
  ctx.fillStyle="yellow"; bullets.forEach(b=>ctx.fillRect(b.x,b.y,5,3));
}
