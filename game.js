const STORAGE_KEYS={score:'fiveLaneScore',best:'fiveLaneBest',coins:'fiveLaneCoins',skins:'fiveLaneOwnedSkins',active:'fiveLaneActiveSkin'};
const skinDefs=[{id:'classic',name:'Classic',price:0,body:'#36c'},{id:'sunset',name:'Sunset',price:15,body:'#ff7a3d'},{id:'mint',name:'Mint',price:30,body:'#34c98f'}];
const enemyTypes=[{id:'sedan',body:'#e34',speed:1,h:72},{id:'truck',body:'#f6b122',speed:.82,h:86},{id:'sport',body:'#9f4dff',speed:1.2,h:66}];
const app={};
['gameCanvas','score','best','coins','message','startBtn','skinSelect','fxLabel'].forEach(id=>app[id]=document.getElementById(id));
const ctx=app.gameCanvas.getContext('2d');
const state={LANES:5,W:0,H:0,roadX:0,roadW:0,laneW:0,running:false,gameOver:false,lastTime:0,touchStartX:null,score:0,coins:0,best:0,speed:260,spawnTimer:0,spawnInterval:760,coinTimer:0,player:null,enemies:[],coinItems:[],particles:[],owned:new Set(['classic']),activeSkin:'classic',fxTimer:0};
function loadSave(){state.best=+localStorage.getItem(STORAGE_KEYS.best)||0;state.score=+localStorage.getItem(STORAGE_KEYS.score)||0;state.coins=+localStorage.getItem(STORAGE_KEYS.coins)||0;try{const v=JSON.parse(localStorage.getItem(STORAGE_KEYS.skins)||'["classic"]');state.owned=new Set(v);}catch{}state.activeSkin=localStorage.getItem(STORAGE_KEYS.active)||'classic';if(!state.owned.has(state.activeSkin))state.activeSkin='classic';}
function save(){localStorage.setItem(STORAGE_KEYS.best,state.best);localStorage.setItem(STORAGE_KEYS.score,state.score);localStorage.setItem(STORAGE_KEYS.coins,state.coins);localStorage.setItem(STORAGE_KEYS.skins,JSON.stringify([...state.owned]));localStorage.setItem(STORAGE_KEYS.active,state.activeSkin);}
function buildSkinUI(){app.skinSelect.innerHTML='';for(const s of skinDefs){const o=document.createElement('option');const owned=state.owned.has(s.id);o.value=s.id;o.textContent=owned?`${s.name} (Owned)`:`${s.name} (${s.price} coins)`;app.skinSelect.appendChild(o);}app.skinSelect.value=state.activeSkin;}
function resize(){const w=Math.min(innerWidth,520),h=Math.min(innerHeight,940),dpr=Math.max(1,Math.min(devicePixelRatio||1,2));app.gameCanvas.style.width=`${w}px`;app.gameCanvas.style.height=`${h}px`;app.gameCanvas.width=Math.floor(w*dpr);app.gameCanvas.height=Math.floor(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);state.W=w;state.H=h;state.roadW=w*.9;state.roadX=(w-state.roadW)/2;state.laneW=state.roadW/state.LANES;}
const laneCenter=i=>state.roadX+state.laneW*i+state.laneW/2;
function resetGame(){state.player={lane:2,x:laneCenter(2),targetX:laneCenter(2),y:state.H-140,w:Math.min(state.laneW*.58,54),h:76};state.enemies=[];state.coinItems=[];state.particles=[];state.score=0;state.speed=260;state.spawnTimer=0;state.coinTimer=0;state.spawnInterval=760;state.gameOver=false;state.running=true;state.lastTime=performance.now();app.message.classList.add('hidden');updateUI();}
function updateUI(){app.score.textContent=`SCORE ${Math.floor(state.score)}`;app.best.textContent=`BEST ${state.best}`;app.coins.textContent=`COIN ${state.coins}`;}
function moveLane(d){if(!state.running||state.gameOver)return;state.player.lane=Math.max(0,Math.min(state.LANES-1,state.player.lane+d));state.player.targetX=laneCenter(state.player.lane)}
function spawnEnemy(){const type=enemyTypes[(Math.random()*enemyTypes.length)|0],lane=(Math.random()*state.LANES)|0,w=Math.min(state.laneW*.58,56);state.enemies.push({lane,x:laneCenter(lane),y:-90,w,h:type.h,passed:false,type});}
function spawnCoin(){const lane=(Math.random()*state.LANES)|0;state.coinItems.push({x:laneCenter(lane),lane,y:-40,r:12,hit:false});}
const overlap=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2-7&&Math.abs(a.y-b.y)<(a.h+b.h)/2-7;
function addParticles(x,y,color,count=12){for(let i=0;i<count;i++)state.particles.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,life:.5+Math.random()*.35,color});}
function showFx(t,bg='#1f8d4f'){app.fxLabel.textContent=t;app.fxLabel.style.background=bg;app.fxLabel.classList.remove('hidden');state.fxTimer=700;}
function tick(ts){const dt=Math.min(.033,(ts-state.lastTime)/1000||0);state.lastTime=ts;if(state.running&&!state.gameOver){state.player.x+=(state.player.targetX-state.player.x)*Math.min(1,dt*14);state.speed+=dt*4;state.score+=dt*12;state.spawnInterval=Math.max(360,state.spawnInterval-dt*4);state.spawnTimer+=dt*1000;state.coinTimer+=dt*1000;if(state.spawnTimer>state.spawnInterval){state.spawnTimer=0;spawnEnemy();showFx('SPEED UP','#165e96');}if(state.coinTimer>1100){state.coinTimer=0;if(Math.random()<.65)spawnCoin();}
for(const e of state.enemies){e.y+=state.speed*e.type.speed*dt;if(overlap(state.player,e)){state.gameOver=true;state.running=false;addParticles(e.x,e.y,'#ff4f4f',26);}if(!e.passed&&e.y>state.player.y){e.passed=true;state.score+=20;}}
for(const c of state.coinItems){c.y+=state.speed*.95*dt;if(!c.hit&&Math.abs(state.player.x-c.x)<state.player.w*.34&&Math.abs(state.player.y-c.y)<state.player.h*.45){c.hit=true;state.coins+=1;addParticles(c.x,c.y,'#ffdb4d',14);showFx('+1 COIN');}}
for(const p of state.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
state.enemies=state.enemies.filter(v=>v.y<state.H+140);state.coinItems=state.coinItems.filter(v=>v.y<state.H+60&&!v.hit);state.particles=state.particles.filter(v=>v.life>0);
if(state.fxTimer>0){state.fxTimer-=dt*1000;if(state.fxTimer<=0)app.fxLabel.classList.add('hidden');}
if(state.score>state.best)state.best=Math.floor(state.score);save();updateUI();if(state.gameOver){app.message.classList.remove('hidden');app.message.querySelector('h1').textContent='GAME OVER';}}
render();requestAnimationFrame(tick);}
function pixelCar(x,y,w,h,color,enemyType='supercar',enemy=false){
const gx=Math.max(2,Math.floor(w/14)),gy=Math.max(2,Math.floor(h/18));
const bodyTop=enemy?'#141a2a':'#1a2136';
const glass=enemy?'#bed3ff':'#e8f6ff';
const frontLamp=enemy?'#fff0a1':'#fff6c9';
const rearLamp=enemy?'#ff6464':'#ff3a58';
const stripe=enemy?'#6d799f':'#8fa4d8';
const wheelDark='#12161f',wheelRim='#3b4563';
ctx.save();
ctx.translate(Math.round(x-w/2),Math.round(y-h/2));
ctx.imageSmoothingEnabled=false;
const drawWheelSet=(fw=4,rw=4,offset=0)=>{const fwH=gy*fw,rwH=gy*rw;ctx.fillStyle=wheelDark;ctx.fillRect(0,gy*(3+offset),gx*2,fwH);ctx.fillRect(w-gx*2,gy*(3+offset),gx*2,fwH);ctx.fillRect(0,h-gy*(3+offset)-rwH,gx*2,rwH);ctx.fillRect(w-gx*2,h-gy*(3+offset)-rwH,gx*2,rwH);ctx.fillStyle=wheelRim;ctx.fillRect(1,gy*(3+offset)+1,1,fwH-2);ctx.fillRect(w-2,gy*(3+offset)+1,1,fwH-2);ctx.fillRect(1,h-gy*(3+offset)-rwH+1,1,rwH-2);ctx.fillRect(w-2,h-gy*(3+offset)-rwH+1,1,rwH-2);};
const drawLights=(fx,fy,tx,ty)=>{ctx.fillStyle=frontLamp;ctx.fillRect(gx+1,gy*fy,fx,gy*2);ctx.fillRect(w-gx-fx-1,gy*fy,fx,gy*2);ctx.fillStyle=rearLamp;ctx.fillRect(gx+1,h-gy*ty,tx,gy*2);ctx.fillRect(w-gx-tx-1,h-gy*ty,tx,gy*2);};
ctx.fillStyle=bodyTop;ctx.fillRect(gx,gy,w-gx*2,h-gy*2);
if(enemyType==='truck'){
ctx.fillStyle=color;ctx.fillRect(gx*2,gy*2,w-gx*4,h-gy*4);ctx.fillStyle='#2b3145';ctx.fillRect(gx*3,gy*8,w-gx*6,gy*7);
ctx.fillStyle=glass;ctx.fillRect(gx*3,gy*3,w-gx*6,gy*4);ctx.fillStyle='#f4b54b';ctx.fillRect(gx*2,gy*11,w-gx*4,gy*2);
ctx.fillStyle='#20283c';ctx.fillRect(gx*4,gy*12,w-gx*8,gy);drawLights(gx*2,2,gx*2,3);drawWheelSet(5,5,0);
}else if(enemyType==='sedan'){
ctx.fillStyle=color;ctx.fillRect(gx*2,gy*2,w-gx*4,h-gy*4);ctx.fillRect(gx*3,gy,w-gx*6,gy*2);ctx.fillRect(gx*3,h-gy*3,w-gx*6,gy*2);
ctx.fillStyle=glass;ctx.fillRect(gx*3,gy*4,w-gx*6,gy*6);ctx.fillStyle='#7d8eb7';ctx.fillRect(gx*3,gy*7,w-gx*6,gy*2);
ctx.fillStyle=stripe;ctx.fillRect(gx*2,gy*10,w-gx*4,gy);ctx.fillStyle='#dce5ff88';ctx.fillRect(gx*4,gy*4,w-gx*8,1);
drawLights(gx*2,2,gx*2,3);drawWheelSet(4,4,0);
}else{
ctx.fillStyle=color;ctx.fillRect(gx*2,gy*2,w-gx*4,h-gy*4);ctx.fillRect(gx*3,gy,w-gx*6,gy*2);ctx.fillRect(gx*4,h-gy*3,w-gx*8,gy*2);
ctx.fillStyle='#ffffff22';ctx.fillRect(gx*4,gy*2,w-gx*8,gy);
ctx.fillStyle=glass;ctx.fillRect(gx*3,gy*4,w-gx*6,gy*7);ctx.fillStyle='#97ace4';ctx.fillRect(gx*3,gy*8,w-gx*6,gy*2);
ctx.fillStyle=stripe;ctx.fillRect(gx*2,gy*11,w-gx*4,gy);ctx.fillStyle='#0e1322';ctx.fillRect(gx*5,gy*12,w-gx*10,gy);
ctx.fillStyle='#4ce2ff';ctx.fillRect(gx*5,gy*6,w-gx*10,gy);drawLights(gx*2,2,gx*2,3);drawWheelSet(4,5,0);
}
ctx.fillStyle='#00000044';ctx.fillRect(gx*3,h-gy*4,w-gx*6,gy*2);
ctx.restore();}

function render(){ctx.clearRect(0,0,state.W,state.H);ctx.fillStyle='#2a313d';ctx.fillRect(state.roadX,0,state.roadW,state.H);ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=3;ctx.strokeRect(state.roadX,0,state.roadW,state.H);ctx.lineWidth=2;ctx.setLineDash([18,14]);for(let i=1;i<state.LANES;i++){const x=state.roadX+state.laneW*i;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.H);ctx.stroke();}ctx.setLineDash([]);
for(const c of state.coinItems){ctx.fillStyle='#ffdb4d';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a16f00';ctx.fillRect(c.x-2,c.y-7,4,14);}for(const e of state.enemies)pixelCar(e.x,e.y,e.w,e.h,e.type.body,e.type.id,true);if(state.player){const sk=skinDefs.find(s=>s.id===state.activeSkin)||skinDefs[0];pixelCar(state.player.x,state.player.y,state.player.w,state.player.h,sk.body,'supercar',false);}for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life/.8);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1;}}
app.startBtn.addEventListener('click',resetGame);app.startBtn.addEventListener('touchend',e=>{e.preventDefault();resetGame();},{passive:false});addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.key==='ArrowLeft')moveLane(-1);if(e.key==='ArrowRight')moveLane(1)});
app.gameCanvas.addEventListener('touchstart',e=>state.touchStartX=e.touches[0].clientX,{passive:true});
app.gameCanvas.addEventListener('touchend',e=>{if(state.touchStartX==null)return;const dx=e.changedTouches[0].clientX-state.touchStartX;if(Math.abs(dx)>18)moveLane(dx>0?1:-1);state.touchStartX=null;});
app.skinSelect.addEventListener('change',()=>{const selected=skinDefs.find(s=>s.id===app.skinSelect.value);if(!selected)return;if(!state.owned.has(selected.id)){if(state.coins>=selected.price){state.coins-=selected.price;state.owned.add(selected.id);showFx(`UNLOCK ${selected.name}`,'#7446ff');}else{showFx('NOT ENOUGH COINS','#7f2424');app.skinSelect.value=state.activeSkin;return;}}state.activeSkin=selected.id;buildSkinUI();save();updateUI();});
loadSave();resize();buildSkinUI();updateUI();requestAnimationFrame(tick);
