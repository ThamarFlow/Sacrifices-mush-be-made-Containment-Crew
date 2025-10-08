// src/spriteLoader.js
export default class SpriteLoader {
  constructor(manifest) {
    this.manifest = manifest;
    this.images = {};
    this.frames = {};
    this.animations = {};
  }
  async loadAll() {
    const names = Object.keys(this.manifest);
    await Promise.all(names.map(n => this._loadSprite(n)));
    return true;
  }
  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = e => reject(new Error('Image load error ' + src));
      img.src = src;
    });
  }
  async _loadSprite(name) {
    const info = this.manifest[name];
    if (!info) throw new Error('No manifest entry for ' + name);
    const img = await this._loadImage(info.file);
    this.images[name] = img;
    const { frameW, frameH, cols, rows, padding = 0, animations = {} } = info;
    const totalFrames = cols * rows;
    this.frames[name] = new Array(totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      const sx = (i % cols) * (frameW + padding);
      const sy = Math.floor(i / cols) * (frameH + padding);
      const c = document.createElement('canvas');
      c.width = frameW; c.height = frameH;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, frameW, frameH);
      this.frames[name][i] = c;
    }
    this.animations[name] = {};
    for (const animName in animations) {
      this.animations[name][animName] = animations[animName].map(fi => this.frames[name][fi]);
    }
  }
  getAnimation(name, animName) { return (this.animations[name] && this.animations[name][animName]) ? this.animations[name][animName] : null; }
}
