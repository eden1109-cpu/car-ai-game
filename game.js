(() => {
  const STORAGE_KEYS = {
    score: 'fiveLaneScore',
    best: 'fiveLaneBest',
    coins: 'fiveLaneCoins',
    skins: 'fiveLaneOwnedSkins',
    active: 'fiveLaneActiveSkin'
  };

  const skinDefs = [
    { id: 'classic', name: 'Classic', price: 0, body: '#3366cc' },
    { id: 'sunset', name: 'Sunset', price: 15, body: '#ff7a3d' },
    { id: 'mint', name: 'Mint', price: 30, body: '#34c98f' }
  ];

  const enemyTypes = [
    { id: 'sedan', body: '#ee3344', speed: 1.0, h: 72 },
    { id: 'truck', body: '#f6b122', speed: 0.82, h: 86 },
    { id: 'sport', body: '#9f4dff', speed: 1.2, h: 66 }
  ];

  const el = {
    canvas: document.getElementById('gameCanvas'),
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    coins: document.getElementById('coins'),
    message: document.getElementById('message'),
    startBtn: document.getElementById('startBtn'),
    leftBtn: document.getElementById('leftBtn'),
    rightBtn: document.getElementById('rightBtn'),
    skinSelect: document.getElementById('skinSelect'),
    fxLabel: document.getElementById('fxLabel'),
    title: document.querySelector('#message h1')
  };

  if (!el.canvas || !el.startBtn) return;

  const ctx = el.canvas.getContext('2d');
  const state = {
    LANES: 5,
    W: 0, H: 0, roadX: 0, roadW: 0, laneW: 0,
    running: false, gameOver: false,
    lastTime: 0, touchStartX: null,
    score: 0, coins: 0, best: 0,
    speed: 260, spawnTimer: 0, spawnInterval: 760, coinTimer: 0,
    player: null, enemies: [], coinItems: [], particles: [],
    owned: new Set(['classic']), activeSkin: 'classic', fxTimer: 0
  };

  function loadSave() {
    state.best = Number(localStorage.getItem(STORAGE_KEYS.best) || 0);
    state.score = Number(localStorage.getItem(STORAGE_KEYS.score) || 0);
    state.coins = Number(localStorage.getItem(STORAGE_KEYS.coins) || 0);
    try {
      const skins = JSON.parse(localStorage.getItem(STORAGE_KEYS.skins) || '["classic"]');
      state.owned = new Set(Array.isArray(skins) ? skins : ['classic']);
    } catch {
      state.owned = new Set(['classic']);
    }
    state.activeSkin = localStorage.getItem(STORAGE_KEYS.active) || 'classic';
    if (!state.owned.has(state.activeSkin)) state.activeSkin = 'classic';
  }

  function save() {
    localStorage.setItem(STORAGE_KEYS.best, String(state.best));
    localStorage.setItem(STORAGE_KEYS.score, String(Math.floor(state.score)));
    localStorage.setItem(STORAGE_KEYS.coins, String(state.coins));
    localStorage.setItem(STORAGE_KEYS.skins, JSON.stringify([...state.owned]));
    localStorage.setItem(STORAGE_KEYS.active, state.activeSkin);
  }

  function buildSkinUI() {
    el.skinSelect.innerHTML = '';
    skinDefs.forEach((s) => {
      const opt = document.createElement('option');
      const owned = state.owned.has(s.id);
      opt.value = s.id;
      opt.textContent = owned ? `${s.name} (Owned)` : `${s.name} (${s.price} coins)`;
      el.skinSelect.appendChild(opt);
    });
    el.skinSelect.value = state.activeSkin;
  }

  function resize() {
    const w = Math.min(window.innerWidth, 520);
    const h = Math.min(window.innerHeight, 940);
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    el.canvas.style.width = `${w}px`;
    el.canvas.style.height = `${h}px`;
    el.canvas.width = Math.floor(w * dpr);
    el.canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    state.W = w;
    state.H = h;
    state.roadW = w * 0.9;
    state.roadX = (w - state.roadW) / 2;
    state.laneW = state.roadW / state.LANES;
  }

  const laneCenter = (lane) => state.roadX + state.laneW * lane + state.laneW / 2;

  function updateUI() {
    el.score.textContent = `SCORE ${Math.floor(state.score)}`;
    el.best.textContent = `BEST ${state.best}`;
    el.coins.textContent = `COIN ${state.coins}`;
  }

  function resetGame() {
    el.title.textContent = '5 LANE DODGE';
    state.player = {
      lane: 2,
      x: laneCenter(2),
      targetX: laneCenter(2),
      y: state.H - 140,
      w: Math.min(state.laneW * 0.58, 54),
      h: 76
    };
    state.enemies = [];
    state.coinItems = [];
    state.particles = [];
    state.score = 0;
    state.speed = 260;
    state.spawnTimer = 0;
    state.coinTimer = 0;
    state.spawnInterval = 760;
    state.gameOver = false;
    state.running = true;
    state.lastTime = performance.now();
    el.message.classList.add('hidden');
    updateUI();
    save();
  }

  function moveLane(dir) {
    if (!state.running || state.gameOver) return;
    state.player.lane = Math.max(0, Math.min(state.LANES - 1, state.player.lane + dir));
    state.player.targetX = laneCenter(state.player.lane);
  }

  function spawnEnemy() {
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const lane = Math.floor(Math.random() * state.LANES);
    const w = Math.min(state.laneW * 0.58, 56);
    state.enemies.push({
      lane,
      x: laneCenter(lane),
      y: -90,
      w,
      h: type.h,
      passed: false,
      type
    });
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * state.LANES);
    state.coinItems.push({ x: laneCenter(lane), y: -40, r: 12, hit: false });
  }

  const overlap = (a, b) =>
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 7 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2 - 7;

  function addParticles(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 180,
        vy: (Math.random() - 0.5) * 180,
        life: 0.5 + Math.random() * 0.35,
        color
      });
    }
  }

  function showFx(text, bg = '#1f8d4f') {
    el.fxLabel.textContent = text;
    el.fxLabel.style.background = bg;
    el.fxLabel.classList.remove('hidden');
    state.fxTimer = 700;
  }

  function pixelCar(x, y, w, h, color, enemy = false) {
    const px = Math.max(2, Math.floor(w / 8));
    ctx.save();
    ctx.translate(x - w / 2, y - h / 2);
    ctx.fillStyle = color;
    ctx.fillRect(px, h * 0.1, w - px * 2, h * 0.8);
    ctx.fillStyle = enemy ? '#ffd8d8' : '#d7f0ff';
    ctx.fillRect(px * 2, h * 0.22, w - px * 4, h * 0.2);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, h * 0.18, px, h * 0.2);
    ctx.fillRect(w - px, h * 0.18, px, h * 0.2);
    ctx.fillRect(0, h * 0.62, px, h * 0.2);
    ctx.fillRect(w - px, h * 0.62, px, h * 0.2);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, state.W, state.H);
    ctx.fillStyle = '#2a313d';
    ctx.fillRect(state.roadX, 0, state.roadW, state.H);
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.lineWidth = 3;
    ctx.strokeRect(state.roadX, 0, state.roadW, state.H);

    ctx.lineWidth = 2;
    ctx.setLineDash([18, 14]);
    for (let i = 1; i < state.LANES; i += 1) {
      const x = state.roadX + state.laneW * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    state.coinItems.forEach((c) => {
      ctx.fillStyle = '#ffdb4d';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    state.enemies.forEach((e) => pixelCar(e.x, e.y, e.w, e.h, e.type.body, true));
    const sk = skinDefs.find((s) => s.id === state.activeSkin) || skinDefs[0];
    pixelCar(state.player.x, state.player.y, state.player.w, state.player.h, sk.body, false);

    state.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
      ctx.globalAlpha = 1;
    });
  }

  function tick(ts) {
    const dt = Math.min(0.033, (ts - state.lastTime) / 1000 || 0);
    state.lastTime = ts;

    if (state.running && !state.gameOver) {
      state.player.x += (state.player.targetX - state.player.x) * Math.min(1, dt * 14);
      state.speed += dt * 4;
      state.score += dt * 12;
      state.spawnInterval = Math.max(360, state.spawnInterval - dt * 4);
      state.spawnTimer += dt * 1000;
      state.coinTimer += dt * 1000;

      if (state.spawnTimer > state.spawnInterval) {
        state.spawnTimer = 0;
        spawnEnemy();
      }
      if (state.coinTimer > 1100) {
        state.coinTimer = 0;
        if (Math.random() < 0.65) spawnCoin();
      }

      state.enemies.forEach((e) => {
        e.y += state.speed * e.type.speed * dt;
        if (overlap(state.player, e)) {
          state.gameOver = true;
          state.running = false;
          addParticles(e.x, e.y, '#ff4f4f', 26);
          showFx('CRASH', '#7f2424');
        }
        if (!e.passed && e.y > state.player.y) {
          e.passed = true;
          state.score += 20;
        }
      });

      state.coinItems.forEach((c) => {
        c.y += state.speed * 0.95 * dt;
        if (!c.hit && Math.abs(state.player.x - c.x) < state.player.w * 0.34 && Math.abs(state.player.y - c.y) < state.player.h * 0.45) {
          c.hit = true;
          state.coins += 1;
          addParticles(c.x, c.y, '#ffdb4d', 14);
          showFx('+1 COIN');
        }
      });

      state.particles.forEach((p) => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      });

      state.enemies = state.enemies.filter((v) => v.y < state.H + 140);
      state.coinItems = state.coinItems.filter((v) => v.y < state.H + 60 && !v.hit);
      state.particles = state.particles.filter((v) => v.life > 0);

      if (state.fxTimer > 0) {
        state.fxTimer -= dt * 1000;
        if (state.fxTimer <= 0) el.fxLabel.classList.add('hidden');
      }

      if (state.score > state.best) state.best = Math.floor(state.score);
      save();
      updateUI();

      if (state.gameOver) {
        el.title.textContent = 'GAME OVER';
        el.message.classList.remove('hidden');
      }
    }

    if (!state.running && state.fxTimer > 0) {
      state.fxTimer -= dt * 1000;
      if (state.fxTimer <= 0) el.fxLabel.classList.add('hidden');
    }

    render();
    requestAnimationFrame(tick);
  }

  el.startBtn.addEventListener('click', resetGame);
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') moveLane(-1);
    if (e.key === 'ArrowRight') moveLane(1);
  });

  el.leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); moveLane(-1); }, { passive: false });
  el.rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); moveLane(1); }, { passive: false });

  el.canvas.addEventListener('touchstart', (e) => { state.touchStartX = e.touches[0].clientX; }, { passive: true });
  el.canvas.addEventListener('touchend', (e) => {
    if (state.touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - state.touchStartX;
    if (Math.abs(dx) > 18) moveLane(dx > 0 ? 1 : -1);
    state.touchStartX = null;
  });

  el.skinSelect.addEventListener('change', () => {
    const selected = skinDefs.find((s) => s.id === el.skinSelect.value);
    if (!selected) return;

    if (!state.owned.has(selected.id)) {
      if (state.coins >= selected.price) {
        state.coins -= selected.price;
        state.owned.add(selected.id);
        showFx(`UNLOCK ${selected.name}`, '#7446ff');
      } else {
        showFx('NOT ENOUGH COINS', '#7f2424');
        el.skinSelect.value = state.activeSkin;
        return;
      }
    }

    state.activeSkin = selected.id;
    buildSkinUI();
    save();
    updateUI();
  });

  loadSave();
  resize();
  buildSkinUI();
  updateUI();
  requestAnimationFrame(tick);
})();
