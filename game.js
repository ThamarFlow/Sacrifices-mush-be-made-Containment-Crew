const LevelManager = {
  storageKey: 'day4_playersAlive_v1',
  playersAlive: [],
  currentLevel: 0,
  oldManName: 'Old Man',

  init() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        this.playersAlive = JSON.parse(raw);
      } catch (e) { this._setDefaults(); }
    } else { this._setDefaults(); }
    this._renderHUD();
    debugLog('LevelManager init', this.playersAlive);
  },

  _setDefaults() {
    this.playersAlive = [
      { name: 'Asha', icon: '🧑‍🎓', alive: true, courage: 8 },
      { name: 'Ravi', icon: '🧑‍🔧', alive: true, courage: 5 },
      { name: 'Mira', icon: '🧑‍🌾', alive: true, courage: 6 },
      { name: this.oldManName, icon: '🧓', alive: true, courage: 9 }
    ];
    this.save();
  },

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.playersAlive));
    this._renderHUD();
  },

  _renderHUD() {
    const hud = document.getElementById('partyHUD');
    if (!hud) return;
    hud.innerHTML = '';
    this.playersAlive.forEach(p => {
      const el = document.createElement('div');
      el.className = 'party-member' + (p.alive ? '' : ' dead');
      el.innerHTML = `<div>${p.icon}</div><div>${p.name}</div>`;
      hud.appendChild(el);
    });
  },

  getAlivePlayers() {
    return this.playersAlive.filter(p => p.alive);
  },

  killPlayerByName(name) {
    const target = this.playersAlive.find(p => p.name === name);
    if (!target || !target.alive) return null;
    this.playersAlive = this.playersAlive.map(p => p.name===name?{...p, alive:false}:p);
    this.save();
    animateDeathInHUD(name);
    return target;
  },

  oldManSacrifice() {
    return this.killPlayerByName(this.oldManName);
  },

  startLevel(n) {
    this.currentLevel = n;
    SceneManager.showScene(n);
    if (n === 5) Level5.start();
    if (n === 6) Level6.start();
  }
};

// ====== SceneManager ======
const SceneManager = {
  scenes: {
    5: document.getElementById('scene-level5'),
    6: document.getElementById('scene-level6')
  },
  showScene(n) {
    Object.values(this.scenes).forEach(s => s && s.classList.add('hidden'));
    if (this.scenes[n]) this.scenes[n].classList.remove('hidden');
  }
};

// ====== Debug helper ======
function debugLog(...args) {
  console.log('[Day4]', ...args);
  const dbg = document.getElementById('debug');
  if (dbg) dbg.innerText = args.map(a => JSON.stringify(a)).join(' | ');
}

function animateDeathInHUD(name) {
  const hud = document.getElementById('partyHUD');
  const el = hud && hud.querySelector(`.party-member:contains('${name}')`);
  if (el) el.classList.add('fadeout');
}

// ====== Level 5: Zombies ======
const Level5 = (function(){
  const area = document.getElementById('zombieArea');
  const message = document.getElementById('zombieMessage');
  const startBtn = document.getElementById('startLevel5Btn');

  let zombies = [];
  let running = false;
  let oldManSacrificed = false;

  function start() {
    message && (message.innerText = 'Zombies incoming! Old man will protect you...');
    zombies = [];
    running = true;
    oldManSacrificed = false;
    spawnZombies();
  }

  function spawnZombies() {
    // simple 3 zombies moving towards the party
    for(let i=0;i<3;i++){
      const z = document.createElement('div');
      z.className='zombie';
      z.style.position='absolute';
      z.style.left='0px';
      z.style.top=(50+i*50)+'px';
      z.innerText='🧟';
      area.appendChild(z);
      zombies.push(z);
    }
    // move them slowly
    requestAnimationFrame(moveZombies);
  }

  function moveZombies() {
    if(!running) return;
    zombies.forEach(z=>{
      const x = parseInt(z.style.left);
      z.style.left = (x+1) + 'px';
      // if reach 150px, old man sacrifices
      if(x>=150 && !oldManSacrificed){
        oldManSacrificed = true;
        LevelManager.oldManSacrifice();
        message && (message.innerText = 'Old man sacrificed himself!');
      }
    });
    requestAnimationFrame(moveZombies);
  }

  startBtn && startBtn.addEventListener('click', start);

  return { start };
})();

// ====== Level 6: Final Uranium Chamber Puzzle ======
const Level6 = (function(){
  const area = document.getElementById('finalPuzzleArea');
  const msg = document.getElementById('puzzleMessage');
  const startBtn = document.getElementById('startFinalBtn');

  const correctSequence = [0,1,2]; // wire indices to cut
  let playerInput = [];

  function start() {
    msg && (msg.innerText='Cut the wires in correct order!');
    area.innerHTML = '';
    playerInput=[];
    for(let i=0;i<3;i++){
      const btn=document.createElement('button');
      btn.innerText=`Wire ${i+1}`;
      btn.onclick = ()=>onWireClick(i);
      area.appendChild(btn);
    }
  }

  function onWireClick(idx){
    playerInput.push(idx);
    if(playerInput.length===correctSequence.length){
      checkResult();
    }
  }

  function checkResult(){
    let success = playerInput.every((v,i)=>v===correctSequence[i]);
    if(success){
      msg && (msg.innerText='Success! Explosion stopped!');
    } else {
      msg && (msg.innerText='Fail! Explosion!');
    }
  }

  startBtn && startBtn.addEventListener('click', start);

  return { start };
})();

// ====== Boot sequence ======
(function boot(){
  LevelManager.init();
  SceneManager.showScene(5);
})();
