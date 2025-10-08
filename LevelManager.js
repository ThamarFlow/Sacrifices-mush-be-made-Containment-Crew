// src/LevelManager.js
export default class LevelManager {
  constructor({levelsPath='levels/'} = {}){
    this.currentLevel = 0;
    this.levelsPath = levelsPath;
    this.levelData = {};
    this.playersAlive = [
      {id:'p1', name:'A', alive:true},
      {id:'p2', name:'B', alive:true},
      {id:'p3', name:'C', alive:true},
      {id:'oldman', name:'Old Man', alive:true}
    ];
    this.masksCount = 0;
  }
  async loadLevelData(levelId){
    const path = `${this.levelsPath}level${levelId}.json`;
    const resp = await fetch(path);
    if(!resp.ok) throw new Error('Level load error ' + path);
    this.levelData[levelId] = await resp.json();
    return this.levelData[levelId];
  }
  async startLevel(levelId){ this.currentLevel = levelId; return await this.loadLevelData(levelId); }
  getAlivePlayers(){ return this.playersAlive.filter(p=>p.alive); }
  killRandomPlayer(except=['oldman']){
    const alive = this.getAlivePlayers().filter(p=>!except.includes(p.id));
    if(alive.length===0) return null;
    const victim = alive[Math.floor(Math.random()*alive.length)];
    victim.alive = false; return victim;
  }
  allocateMasks(){ const alive = this.getAlivePlayers(); let available = alive.length; if(alive.some(p=>p.id==='oldman')) available -=1; this.masksCount = available; return this.masksCount; }
  applyChoice(choice){ if(choice.type==='fork' && choice.choice==='beautiful') return this.killRandomPlayer(['oldman']); return null; }
  saveState(){ localStorage.setItem('gameState', JSON.stringify({currentLevel:this.currentLevel, playersAlive:this.playersAlive, masksCount:this.masksCount})); }
  loadState(){ const s = localStorage.getItem('gameState'); if(!s) return false; const obj = JSON.parse(s); this.currentLevel = obj.currentLevel; this.playersAlive = obj.playersAlive; this.masksCount = obj.masksCount; return true; }
}
