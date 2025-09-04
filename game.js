let currentScreen = 'menu';
let servers = [
  { name: "RuServer", address: "wss://your-server.onrender.com" },
  { name: "EngServer", address: "wss://your-server.onrender.com" }
];
let ws, canvas, ctx, player;
let currentUser = null;
let currentSkin = 'green';
let joystickEnabled = false;

// 🔹 Меню
function showScreen(screen){
  document.getElementById(currentScreen).classList.add('hidden');
  document.getElementById(screen).classList.remove('hidden');
  currentScreen = screen;
  if(screen==='servers') renderServerList();
}

// 🔹 Серверы
function renderServerList(){
  const list = document.getElementById('serverList');
  list.innerHTML = '';
  servers.forEach((srv,i)=>{
    const li=document.createElement('li');
    li.textContent = srv.name + " ";
    const playBtn=document.createElement('button');
    playBtn.textContent="▶ Подключиться";
    playBtn.onclick=()=>connectToServer(srv.address);
    const delBtn=document.createElement('button');
    delBtn.textContent="❌";
    delBtn.onclick=()=>{servers.splice(i,1); renderServerList();}
    li.appendChild(playBtn); li.appendChild(delBtn); list.appendChild(li);
  });
}
function addServer(){
  const name = prompt("Название сервера:");
  const address = prompt("Адрес (ws://... или wss://...):");
  if(name && address){servers.push({name,address}); renderServerList();}
}

// 🔹 Игровой режим
function connectToServer(address){ showScreen('game'); initGame(); connectWebSocket(address); }
function startOffline(){ showScreen('game'); initGame(); }
function exitGame(){ showScreen('menu'); if(ws) ws.close(); }

function initGame(){
  canvas=document.getElementById("gameCanvas");
  ctx=canvas.getContext("2d");
  player={x:400,y:300,hp:100};
  loadAccount();
  draw();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = currentSkin==='green'?'lime':'red';
  ctx.beginPath();
  ctx.arc(player.x,player.y,20,0,Math.PI*2);
  ctx.fill();
  if(currentUser){
    ctx.fillStyle="#fff";
    ctx.font="14px Arial";
    ctx.textAlign="center";
    ctx.fillText(currentUser.name, player.x, player.y-30);
  }
  requestAnimationFrame(draw);
}

// 🔹 Настройки
function changeBgColor(){ document.body.style.background = document.getElementById('bgColorSelect').value; }
function toggleJoystick(){ joystickEnabled=!joystickEnabled; alert("Джойстик: "+(joystickEnabled?"Вкл":"Выкл"));}
function editControls(){ alert("Здесь будет редактирование управления ПК/Телефон"); }
function changeSkin(color){ currentSkin=color; }

// 🔹 WebSocket
function connectWebSocket(address){
  ws=new WebSocket(address);
  ws.onopen=()=>console.log("Подключен к "+address);
  ws.onmessage=(msg)=>{ console.log("Сервер:", JSON.parse(msg.data)); };
  ws.onclose=()=>console.log("Отключен от сервера");
}

// 🔹 Аккаунты
function loginTelegram(){ currentUser={type:"Telegram",name:"@ZymUser"}; saveAccount(); updateAccountUI(); }
function loginGoogle(){
  google.accounts.id.initialize({
    client_id:"913407850801-0fm9mo59pmbsj6dln94fs6o7pt3l9fuh.apps.googleusercontent.com/",
    callback:handleGoogleResponse
  });
  google.accounts.id.prompt();
}
function handleGoogleResponse(response){
  const payload=JSON.parse(atob(response.credential.split('.')[1]));
  currentUser={type:"Google",name:payload.name};
  saveAccount(); updateAccountUI();
}
function loginFacebook(){ currentUser={type:"Facebook",name:"FB User"}; saveAccount(); updateAccountUI(); }
function loginZL(){ const name=prompt("Введите ник для ZLAccount:"); if(name){currentUser={type:"ZLAccount",name}; saveAccount(); updateAccountUI();} }
function saveAccount(){ localStorage.setItem("account",JSON.stringify(currentUser)); }
function loadAccount(){ const acc=localStorage.getItem("account"); if(acc) currentUser=JSON.parse(acc); updateAccountUI(); }
function updateAccountUI(){ const info=document.getElementById("accountInfo"); info.innerText=currentUser?`✅ Вошёл: ${currentUser.type} (${currentUser.name})`:"❌ Аккаунт не подключен"; }
function logoutAll(){ currentUser=null; localStorage.removeItem("account"); updateAccountUI(); }
