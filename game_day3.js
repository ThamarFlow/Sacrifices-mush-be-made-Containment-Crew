// Day3 game  (Levels 0..4)

// ====== LevelManager: holds playersAlive, courage, mask logic, persistence ======
const LevelManager = {
  storageKey: 'day3_playersAlive_v1',
  playersAlive: [], // { name, icon, alive, courage }
  currentLevel: 0,
  killMode: 'random',

  init() {
    // Load from localStorage or set default party
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.playersAlive = JSON.parse(raw);
      } catch (e) {
        this._setDefaults();
      }
    } else {
      this._setDefaults();
    }
    this._renderHUD();
    debugLog('LevelManager init', this.playersAlive);
  },
  _setDefaults() {
    // add a courage stat (1-10). Lower = more likely to be sacrificed automatically in shortage.
    this.playersAlive = [
      { name: 'Asha', icon: '🧑‍🎓', alive: true, courage: 8 },
      { name: 'Ravi', icon: '🧑‍🔧', alive: true, courage: 5 },
      { name: 'Mira', icon: '🧑‍🌾', alive: true, courage: 6 }
    ];
    this.save();
  },
  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.playersAlive));
    this._renderHUD();
  },
  loadState() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.playersAlive = JSON.parse(raw);
        this._renderHUD();
      } catch (e) { /* ignore */ }
    }
  },
  _renderHUD() {
    // Update the party HUD on top-right and preview in intro
    const hud = document.getElementById('partyHUD');
    const preview = document.getElementById('introPartyPreview');
    if (!hud) return;
    hud.innerHTML = '';
    if (preview) preview.innerHTML = '';
    this.playersAlive.forEach(p => {
      const el = document.createElement('div');
      el.className = 'party-member' + (p.alive ? '' : ' dead');
      el.setAttribute('data-name', p.name);
      el.innerHTML = `<div style="text-align:center">
                        <div style="font-size:20px">${p.icon}</div>
                        <div style="font-size:10px;margin-top:4px">${p.name}</div>
                      </div>`;
      hud.appendChild(el);
      if (preview) preview.appendChild(el.cloneNode(true));
    });
    const dbg = document.getElementById('debug');
    if (dbg) dbg.innerText = 'playersAlive: ' + JSON.stringify(this.playersAlive);
  },
  startLevel(n) {
    this.currentLevel = n;
    SceneManager.showScene(n);
    debugLog('startLevel', n);
    if (n === 1) Level1.start();
    if (n === 2) Level2.start();
    if (n === 3) Level3.start();
    if (n === 4) Level4.start();
  },

  // Fork outcome (from Day2)
  applyForkChoice(choice) {
    if (choice === 'Beautiful') {
      const alive = this.getAlivePlayers();
      if (alive.length === 0) return debugLog('No alive players to kill');
      let toKill;
      if (this.killMode === 'last') {
        toKill = alive[alive.length - 1];
      } else { // random
        toKill = alive[Math.floor(Math.random() * alive.length)];
      }
      this.playersAlive = this.playersAlive.map(p => p.name === toKill.name ? { ...p, alive: false } : p);
      this.save();
      animateDeathInHUD(toKill.name);
      return toKill;
    } else {
      return null;
    }
  },

  // Utility getters / killers
  getAlivePlayers() {
    return this.playersAlive.filter(p => p.alive);
  },
  killRandomPlayer() {
    const alive = this.getAlivePlayers();
    if (alive.length === 0) return null;
    const victim = alive[Math.floor(Math.random() * alive.length)];
    this.playersAlive = this.playersAlive.map(p => p.name === victim.name ? { ...p, alive: false } : p);
    this.save();
    animateDeathInHUD(victim.name);
    return victim;
  },
  killPlayerByName(name) {
    const target = this.playersAlive.find(p => p.name === name);
    if (!target || !target.alive) return null;
    this.playersAlive = this.playersAlive.map(p => p.name === name ? { ...p, alive: false } : p);
    this.save();
    animateDeathInHUD(name);
    return target;
  },

  // MASKS: compute masks based on alive players (as per Day3 rules)
  computeMasks() {
    // masksCount = number of alive players (per spec)
    const masksCount = this.getAlivePlayers().length;
    const masksForParty = Math.max(0, masksCount - 1); // old man consumes one
    return { masksCount, masksForParty };
  },

  // Given an array of assignedNames (players who get masks), mark the unassigned alive players as dead
  applyMaskAllocation(assignedNames = []) {
    const alive = this.getAlivePlayers().map(p => p.name);
    // assigned names are guaranteed to be subset of alive
    const toDie = alive.filter(n => !assignedNames.includes(n));
    const died = [];
    toDie.forEach(n => {
      const killed = this.killPlayerByName(n);
      if (killed) died.push(killed);
    });
    this.save();
    return died;
  },

  // automatic sacrifice rule: choose lowest courage players to die
  autoSacrifice(numberToSacrifice = 1) {
    const alive = this.getAlivePlayers();
    if (alive.length === 0) return [];
    // sort asc by courage
    const sorted = alive.slice().sort((a,b) => (a.courage - b.courage) || Math.random() - 0.5);
    const toKill = sorted.slice(0, numberToSacrifice);
    const died = [];
    toKill.forEach(p => {
      const k = this.killPlayerByName(p.name);
      if (k) died.push(k);
    });
    this.save();
    return died;
  }
};

// ====== SceneManager: show/hide scenes (updated)
const SceneManager = {
  scenes: {
    0: document.getElementById('scene-intro'),
    1: document.getElementById('scene-level1'),
    2: document.getElementById('scene-level2'),
    3: document.getElementById('scene-level3'),
    4: document.getElementById('scene-level4'),
  },
  showScene(n) {
    Object.values(this.scenes).forEach(s => s && s.classList.add('hidden'));
    if (this.scenes[n]) this.scenes[n].classList.remove('hidden');
  }
};

// ====== Utility debug logger ======
function debugLog(...args) {
  console.log('[Day3]', ...args);
  const dbg = document.getElementById('debug');
  if (dbg) dbg.innerText = 'Debug: ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' | ');
}

// ====== Helpers ======
function animateDeathInHUD(name) {
  const hud = document.getElementById('partyHUD');
  const el = hud && hud.querySelector(`[data-name="${name}"]`);
  const resultDiv = document.getElementById('maskResult') || document.getElementById('forkResult');
  if (el) {
    el.classList.add('fadeout');
    if (resultDiv) resultDiv.innerText = `${name} has died...`;
    setTimeout(() => {
      el.remove();
    }, 900);
  } else {
    if (resultDiv) resultDiv.innerText = `${name} has died...`;
  }
}

// ====== Level 0: Intro (narration + Start)
(function IntroSetup(){
  const startBtn = document.getElementById('startBtn');
  const narrationText = document.getElementById('narrationText');
  const narration = `They started as three — friends who'd known laughter and hardship. A river came, and then a fork. Trust would be asked.`;
  if (narrationText) narrationText.innerText = narration;

  function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    const s = new SpeechSynthesisUtterance(text);
    s.rate = 0.9;
    s.pitch = 1;
    const voices = speechSynthesis.getVoices();
    if (voices.length) {
      s.voice = voices.find(v => v.name.toLowerCase().includes('google') || v.lang.startsWith('en')) || voices[0];
    }
    speechSynthesis.cancel();
    speechSynthesis.speak(s);
  }
  setTimeout(()=>speakText(narration), 450);

  startBtn && startBtn.addEventListener('click', ()=> {
    LevelManager.startLevel(1);
  });
})();

// ====== Level 1: River playable (unchanged) ======
const Level1 = (function(){
  const area = document.getElementById('riverArea');
  const boat = document.getElementById('boat');
  const isRowingText = document.getElementById('isRowing');
  const distanceText = document.getElementById('distance');

  let running = false;
  let isRowing = false;
  let boatX = 30;
  let targetFinishX;
  let speed = 0;
  let obstacles = [];
  let lastSpawn = 0;
  let spawnInterval = 1500;
  let lastTime = null;

  function reset() {
    obstacles.forEach(o => o.el.remove());
    obstacles = [];
    boatX = 30;
    speed = 0;
    isRowing = false;
    if (isRowingText) isRowingText.innerText = 'no';
    if (distanceText) distanceText.innerText = '0';
  }

  function start() {
    reset();
    running = true;
    targetFinishX = area.clientWidth - 120;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() { running = false; }

  function loop(now) {
    if (!running) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (isRowing) {
      speed += 400 * dt;
    } else {
      speed -= 300 * dt;
      if (speed < 0) speed = 0;
    }
    if (speed > 600) speed = 600;
    boatX += speed * dt;
    if (boatX > area.clientWidth - 60) boatX = area.clientWidth - 60;
    boat.style.left = boatX + 'px';
    boat.style.transform = `translateY(${isRowing ? -6 : 0}px)`;

    if (now - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = now;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= (150 + speed * 0.1) * dt;
      if (ob.x + ob.width < 0) {
        ob.el.remove();
        obstacles.splice(i,1);
      } else {
        ob.el.style.left = ob.x + 'px';
      }
    }

    const boatRect = boat.getBoundingClientRect();
    for (let ob of obstacles) {
      const obRect = ob.el.getBoundingClientRect();
      if (rectsIntersect(boatRect, obRect)) {
        boatX = Math.max(10, boatX - 60);
        speed = Math.max(0, speed - 200);
        ob.el.classList.add('hitFlash');
        setTimeout(()=>ob.el.classList.remove('hitFlash'), 120);
      }
    }

    if (isRowingText) isRowingText.innerText = isRowing ? 'yes' : 'no';
    if (distanceText) distanceText.innerText = Math.round((boatX / (targetFinishX || 1)) * 100) + '%';

    if (boatX >= (targetFinishX - 8)) {
      stop();
      setTimeout(()=> LevelManager.startLevel(2), 400);
      return;
    }

    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const el = document.createElement('div');
    el.className = 'obstacle';
    const h = 48;
    el.style.height = h + 'px';
    el.style.width = h + 'px';
    const top = 40 + Math.random() * (area.clientHeight - 120);
    el.style.top = top + 'px';
    const startX = area.clientWidth + 20;
    el.style.left = startX + 'px';
    el.innerText = '♆';
    area.appendChild(el);
    const ob = { el, x: startX, width: h };
    obstacles.push(ob);
  }

  function rectsIntersect(a, b) {
    return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
  }

  function setRowing(v) {
    isRowing = v;
    if (v) boat.style.transform = 'translateY(-6px)';
  }

  area && area.addEventListener('mousedown', ()=>setRowing(true));
  area && area.addEventListener('mouseup', ()=>setRowing(false));
  area && area.addEventListener('mouseleave', ()=>setRowing(false));
  area && area.addEventListener('touchstart', (e)=>{ e.preventDefault(); setRowing(true); }, {passive:false});
  area && area.addEventListener('touchend', ()=>setRowing(false));

  window.addEventListener('keydown', (e)=> {
    if (e.code === 'Space') { e.preventDefault(); setRowing(true); }
  });
  window.addEventListener('keyup', (e)=> {
    if (e.code === 'Space') { setRowing(false); }
  });

  return { start, stop };
})();

// ====== Level 2: Fork UI and logic (unchanged) ======
const Level2 = (function(){
  const btnNormal = document.getElementById('btnNormal');
  const btnBeautiful = document.getElementById('btnBeautiful');
  const timerVal = document.getElementById('timerVal');
  const timerDiv = document.getElementById('timer');
  let countdown = 10;
  let timerId = null;

  function start() {
    countdown = 10;
    if (timerVal) timerVal.innerText = countdown;
    if (timerDiv) timerDiv.style.display = 'block';
    timerId && clearInterval(timerId);
    timerId = setInterval(() => {
      countdown--;
      if (timerVal) timerVal.innerText = countdown;
      if (countdown <= 0) {
        clearInterval(timerId);
        onChoice('Normal');
      }
    }, 1000);

    btnNormal && (btnNormal.onclick = ()=>onChoice('Normal'));
    btnBeautiful && (btnBeautiful.onclick = ()=>onChoice('Beautiful'));
  }

  function onChoice(choice) {
    btnNormal && (btnNormal.disabled = true);
    btnBeautiful && (btnBeautiful.disabled = true);
    clearInterval(timerId);
    const resultDiv = document.getElementById('forkResult');
    if (resultDiv) resultDiv.innerText = 'You chose: ' + choice + ' ...';

    const killed = LevelManager.applyForkChoice(choice);
    if (killed) {
      if (resultDiv) resultDiv.innerText = `You chose Beautiful. ${killed.name} has died.`;
      setTimeout(()=> {
        if (resultDiv) resultDiv.innerText += ' Proceeding...';
      }, 700);
    } else {
      if (resultDiv) resultDiv.innerText = `You chose Normal. No one died. Proceeding...`;
    }

    setTimeout(()=> {
      if (resultDiv) resultDiv.innerText += ' (Moving to Level 3)';
      LevelManager.startLevel(3);
    }, 1300);
  }

  return { start };
})();

// ====== Level 3: Small puzzle (no sacrifice) ======
const Level3 = (function(){
  const startBtn = document.getElementById('level3StartBtn');
  const tilesContainer = document.getElementById('level3Tiles');
  const message = document.getElementById('level3Message');

  let sequence = [];
  let inputIndex = 0;
  let timeoutId = null;

  function buildTiles() {
    tilesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const t = document.createElement('div');
      t.className = 'tile';
      t.innerText = `Tile ${i+1}`;
      t.dataset.idx = i;
      t.addEventListener('click', () => onTileClick(i, t));
      tilesContainer.appendChild(t);
    }
  }

  function start() {
    buildTiles();
    sequence = [];
    for (let i=0;i<3;i++) sequence.push(Math.floor(Math.random()*3));
    inputIndex = 0;
    if (message) message.innerText = 'Watch the sequence then repeat it by clicking tiles.';
    flashSequence();
  }

  function flashSequence() {
    let i = 0;
    const tiles = Array.from(tilesContainer.querySelectorAll('.tile'));
    const flashPeriod = 700;
    const seq = sequence.slice();
    const flashOne = () => {
      if (i >= seq.length) {
        if (message) message.innerText = 'Now repeat the sequence.';
        return;
      }
      const idx = seq[i];
      const tile = tiles[idx];
      tile.classList.add('correct');
      setTimeout(()=> tile.classList.remove('correct'), flashPeriod - 150);
      i++;
      setTimeout(flashOne, flashPeriod);
    };
    flashOne();
    // give player 12s to complete
    clearTimeout(timeoutId);
    timeoutId = setTimeout(()=> {
      if (message) message.innerText = 'Time up! Proceeding to the next challenge...';
      setTimeout(()=> LevelManager.startLevel(4), 800);
    }, 12000);
  }

  function onTileClick(idx, el) {
    if (!sequence.length) return;
    if (sequence[inputIndex] === idx) {
      // correct step
      el.classList.add('inactive');
      setTimeout(()=> el.classList.remove('inactive'), 180);
      inputIndex++;
      if (inputIndex >= sequence.length) {
        clearTimeout(timeoutId);
        if (message) message.innerText = 'Success! Good teamwork. Moving on...';
        setTimeout(()=> LevelManager.startLevel(4), 700);
      }
    } else {
      clearTimeout(timeoutId);
      if (message) message.innerText = 'Wrong move. Still moving on...';
      setTimeout(()=> LevelManager.startLevel(4), 700);
    }
  }

  startBtn && startBtn.addEventListener('click', start);

  return { start };
})();


// ====== Level 4: Toxic Air & Masks (Day3 core) ======
const Level4 = (function(){
  const maskCountEl = document.getElementById('maskCount');
  const masksVisual = document.getElementById('masksVisual');
  const maskAllocationArea = document.getElementById('maskAllocationArea');
  const maxMasksEl = document.getElementById('maxMasks');
  const maskPlayersList = document.getElementById('maskPlayersList');
  const confirmAllocBtn = document.getElementById('confirmAllocationBtn');
  const autoSacBtn = document.getElementById('autoSacrificeBtn');
  const allocationTimer = document.getElementById('allocationCountdown');
  const maskResult = document.getElementById('maskResult');

  let allocationCountdown = 15;
  let allocationTimerId = null;
  let masksForParty = 0;
  let assignedSet = new Set();

  function start() {
    // compute masks based on LevelManager
    const { masksCount, masksForParty: mfp } = LevelManager.computeMasks();
    masksForParty = mfp;
    if (maskCountEl) maskCountEl.innerText = masksCount;
    renderMasks(masksCount);
    // Simulate old man consuming one mask (visual)
    setTimeout(()=> {
      consumeOldManMask();
    }, 600);

    // after old man takes one mask, evaluate shortage
    setTimeout(()=> {
      evaluateMaskSituation();
    }, 1200);
  }

  function renderMasks(n) {
    if (!masksVisual) return;
    masksVisual.innerHTML = '';
    for (let i=0;i<n;i++) {
      const mi = document.createElement('div');
      mi.className = 'mask-icon';
      mi.innerText = '😷';
      masksVisual.appendChild(mi);
    }
  }

  function consumeOldManMask() {
    // mark one mask as taken visually
    const first = masksVisual && masksVisual.querySelector('.mask-icon');
    if (first) {
      first.classList.add('taken');
      // small message
      if (maskResult) maskResult.innerText = 'Old man took one mask...';
    }
  }

  function evaluateMaskSituation() {
    const alivePlayers = LevelManager.getAlivePlayers();
    const totalMasks = LevelManager.getAlivePlayers().length; // as spec
    const masksLeftForParty = Math.max(0, totalMasks - 1);
    const playersToProtect = alivePlayers.length;
    // Set UI
    if (maxMasksEl) maxMasksEl.innerText = masksLeftForParty;
    // If there is enough masks (edge case)
    if (masksLeftForParty >= playersToProtect) {
      // everyone can be masked; show safe message
      if (maskResult) maskResult.innerText = 'Masks sufficient — no sacrifice needed.';
      // proceed after short delay or display allocation area (optional)
      setTimeout(()=> {
        if (maskResult) maskResult.innerText += ' Proceeding... (End of demo)';
      }, 1000);
      return;
    }

    // SHORTAGE: need to allocate masks or auto-sacrifice
    // Show allocation UI
    showAllocationUI(alivePlayers, masksLeftForParty);
  }

  function showAllocationUI(alivePlayers, maxMasks) {
    assignedSet = new Set();
    if (maskPlayersList) maskPlayersList.innerHTML = '';
    if (maskAllocationArea) maskAllocationArea.classList.remove('hidden');
    if (maskResult) maskResult.innerText = `Only ${maxMasks} mask(s) available for ${alivePlayers.length} players (old man already took one).`;

    alivePlayers.forEach(p => {
      const item = document.createElement('div');
      item.className = 'mask-player';
      item.innerHTML = `<div style="font-size:20px">${p.icon}</div>
                        <div style="font-size:12px">${p.name}</div>
                        <div style="font-size:11px;color:var(--muted)">courage: ${p.courage}</div>`;
      const btn = document.createElement('button');
      btn.className = 'assign-btn';
      btn.innerText = 'Give Mask';
      btn.onclick = () => toggleAssign(p.name, btn, maxMasks);
      item.appendChild(btn);
      maskPlayersList.appendChild(item);
    });

    // attach confirm & auto buttons
    confirmAllocBtn && (confirmAllocBtn.onclick = () => {
      doAllocationConfirm(maxMasks);
    });
    autoSacBtn && (autoSacBtn.onclick = () => {
      // perform auto sacrifice immediately
      performAutoSacrifice(maxMasks);
    });

    // start countdown for auto action
    allocationCountdown = 15;
    if (allocationTimer) allocationTimer.innerText = allocationCountdown;
    clearInterval(allocationTimerId);
    allocationTimerId = setInterval(()=> {
      allocationCountdown--;
      if (allocationTimer) allocationTimer.innerText = allocationCountdown;
      if (allocationCountdown <= 0) {
        clearInterval(allocationTimerId);
        performAutoSacrifice(maxMasks);
      }
    }, 1000);
  }

  function toggleAssign(name, buttonEl, maxMasks) {
    if (!buttonEl) return;
    if (assignedSet.has(name)) {
      assignedSet.delete(name);
      buttonEl.classList.remove('assigned');
      buttonEl.innerText = 'Give Mask';
    } else {
      if (assignedSet.size >= maxMasks) {
        // optional: quick feedback
        buttonEl.innerText = 'No masks left';
        setTimeout(()=> buttonEl.innerText = 'Give Mask', 700);
        return;
      }
      assignedSet.add(name);
      buttonEl.classList.add('assigned');
      buttonEl.innerText = 'Assigned';
    }
  }

  function doAllocationConfirm(maxMasks) {
    clearInterval(allocationTimerId);
    // assignedSet contains players who are safe
    const assigned = Array.from(assignedSet);
    // If assigned exceed maxMasks trim (sanity)
    if (assigned.length > maxMasks) assigned.splice(maxMasks);
    // players not in assigned and alive will die
    const died = LevelManager.applyMaskAllocation(assigned);
    if (maskResult) {
      if (died.length) {
        maskResult.innerText = `Sacrifice happened: ${died.map(d=>d.name).join(', ')} died.`;
      } else {
        maskResult.innerText = 'No one died — allocation successful.';
      }
    }
    // hide allocation UI
    if (maskAllocationArea) maskAllocationArea.classList.add('hidden');
    // proceed / end
    setTimeout(()=> {
      if (maskResult) maskResult.innerText += ' (End of demo)';
    }, 900);
  }

  function performAutoSacrifice(maxMasks) {
    clearInterval(allocationTimerId);
    // number to sacrifice = alivePlayers - maxMasks
    const alivePlayers = LevelManager.getAlivePlayers();
    const toSac = Math.max(0, alivePlayers.length - maxMasks);
    if (toSac <= 0) {
      if (maskResult) maskResult.innerText = 'No sacrifice needed.';
      return;
    }
    // use autoSacrifice rule (lowest courage)
    const died = LevelManager.autoSacrifice(toSac);
    if (maskResult) maskResult.innerText = `Automatic sacrifice: ${died.map(d=>d.name).join(', ')} died.`;
    if (maskAllocationArea) maskAllocationArea.classList.add('hidden');
    setTimeout(()=> {
      if (maskResult) maskResult.innerText += ' (End of demo)';
    }, 900);
  }

  return { start };
})();

// ====== Boot sequence ======
(function boot(){
  LevelManager.init();
  SceneManager.showScene(0);
})();
