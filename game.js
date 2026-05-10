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
const pw=Math.max(2,Math.floor(w/10)),ph=Math.max(2,Math.floor(h/14));
const bodyShade=enemy?'#10131d':'#0b0f19';
const canopy=enemy?'#c5d8ff':'#e4f4ff';
const lampFront=enemy?'#fff5b8':'#fff7d4';
const lampRear=enemy?'#ff5a5a':'#ff3f62';
ctx.save();
ctx.translate(Math.round(x-w/2),Math.round(y-h/2));
ctx.imageSmoothingEnabled=false;
ctx.fillStyle=bodyShade;ctx.fillRect(pw,ph,w-pw*2,h-ph*2);
const drawWheels=()=>{ctx.fillStyle='#161a24';ctx.fillRect(0,ph*3,pw,ph*3);ctx.fillRect(w-pw,ph*3,pw,ph*3);ctx.fillRect(0,h-ph*6,pw,ph*3);ctx.fillRect(w-pw,h-ph*6,pw,ph*3);ctx.fillStyle='#2f3649';ctx.fillRect(1,ph*3+1,1,ph*3-2);ctx.fillRect(w-2,ph*3+1,1,ph*3-2);ctx.fillRect(1,h-ph*6+1,1,ph*3-2);ctx.fillRect(w-2,h-ph*6+1,1,ph*3-2);};
if(enemyType==='truck'){
ctx.fillStyle=color;ctx.fillRect(pw,ph*2,w-pw*2,h-ph*4);ctx.fillStyle='#dfe8ff';ctx.fillRect(pw*2,ph*3,w-pw*4,ph*3);
ctx.fillStyle='#74809e';ctx.fillRect(pw*2,ph*7,w-pw*4,ph*2);ctx.fillStyle='#39445f';ctx.fillRect(pw*2,ph*9,w-pw*4,ph*2);
ctx.fillStyle=lampFront;ctx.fillRect(pw+1,ph*2,ph,ph*2);ctx.fillRect(w-pw-ph-1,ph*2,ph,ph*2);
ctx.fillStyle=lampRear;ctx.fillRect(pw+1,h-ph*4,ph,ph*2);ctx.fillRect(w-pw-ph-1,h-ph*4,ph,ph*2);
}else if(enemyType==='sedan'){
ctx.fillStyle=color;ctx.fillRect(pw,ph*2,w-pw*2,h-ph*4);ctx.fillRect(pw*2,ph,w-pw*4,ph*2);
ctx.fillStyle=canopy;ctx.fillRect(pw*2,ph*4,w-pw*4,ph*4);ctx.fillStyle='#7a86a7';ctx.fillRect(pw*2,ph*8,w-pw*4,ph*2);
ctx.fillStyle=lampFront;ctx.fillRect(pw+1,ph*2,ph,ph*2);ctx.fillRect(w-pw-ph-1,ph*2,ph,ph*2);
ctx.fillStyle=lampRear;ctx.fillRect(pw+1,h-ph*4,ph,ph*2);ctx.fillRect(w-pw-ph-1,h-ph*4,ph,ph*2);
}else{
ctx.fillStyle=color;ctx.fillRect(pw,ph*2,w-pw*2,h-ph*4);
ctx.fillRect(pw*2,ph,w-pw*4,ph*2);
ctx.fillRect(pw*3,h-ph*4,w-pw*6,ph*2);
ctx.fillStyle=canopy;ctx.fillRect(pw*2,ph*4,w-pw*4,ph*5);
ctx.fillStyle='#8392bb';ctx.fillRect(pw*2,ph*9,w-pw*4,ph*2);
ctx.fillStyle='#ffffff66';ctx.fillRect(pw*2+1,ph*4+1,w-pw*5,1);
ctx.fillStyle=lampFront;ctx.fillRect(pw+1,ph*2,ph,ph*2);ctx.fillRect(w-pw-ph-1,ph*2,ph,ph*2);
ctx.fillStyle=lampRear;ctx.fillRect(pw+1,h-ph*4,ph,ph*2);ctx.fillRect(w-pw-ph-1,h-ph*4,ph,ph*2);
}
drawWheels();
ctx.fillStyle='#00000044';ctx.fillRect(pw*2,ph*11,w-pw*4,ph*2);
ctx.restore();}
function render(){ctx.clearRect(0,0,state.W,state.H);ctx.fillStyle='#2a313d';ctx.fillRect(state.roadX,0,state.roadW,state.H);ctx.strokeStyle='rgba(255,255,255,.24)';ctx.lineWidth=3;ctx.strokeRect(state.roadX,0,state.roadW,state.H);ctx.lineWidth=2;ctx.setLineDash([18,14]);for(let i=1;i<state.LANES;i++){const x=state.roadX+state.laneW*i;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.H);ctx.stroke();}ctx.setLineDash([]);
for(const c of state.coinItems){ctx.fillStyle='#ffdb4d';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#a16f00';ctx.fillRect(c.x-2,c.y-7,4,14);}for(const e of state.enemies)pixelCar(e.x,e.y,e.w,e.h,e.type.body,e.type.id,true);if(state.player){const sk=skinDefs.find(s=>s.id===state.activeSkin)||skinDefs[0];pixelCar(state.player.x,state.player.y,state.player.w,state.player.h,sk.body,'supercar',false);}for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life/.8);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1;}}
app.startBtn.addEventListener('click',resetGame);app.startBtn.addEventListener('touchend',e=>{e.preventDefault();resetGame();},{passive:false});addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.key==='ArrowLeft')moveLane(-1);if(e.key==='ArrowRight')moveLane(1)});
app.gameCanvas.addEventListener('touchstart',e=>state.touchStartX=e.touches[0].clientX,{passive:true});
app.gameCanvas.addEventListener('touchend',e=>{if(state.touchStartX==null)return;const dx=e.changedTouches[0].clientX-state.touchStartX;if(Math.abs(dx)>18)moveLane(dx>0?1:-1);state.touchStartX=null;});
app.skinSelect.addEventListener('change',()=>{const selected=skinDefs.find(s=>s.id===app.skinSelect.value);if(!selected)return;if(!state.owned.has(selected.id)){if(state.coins>=selected.price){state.coins-=selected.price;state.owned.add(selected.id);showFx(`UNLOCK ${selected.name}`,'#7446ff');}else{showFx('NOT ENOUGH COINS','#7f2424');app.skinSelect.value=state.activeSkin;return;}}state.activeSkin=selected.id;buildSkinUI();save();updateUI();});
loadSave();resize();buildSkinUI();updateUI();requestAnimationFrame(tick);
