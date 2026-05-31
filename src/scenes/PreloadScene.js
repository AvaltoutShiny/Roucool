/**
 * PreloadScene
 * Generates all game assets procedurally using Canvas API.
 * This allows the game to run without any external asset files.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show progress bar
    this._createProgressBar();

    // Generate all textures procedurally
    this.load.on('complete', () => this._generateTextures());
  }

  create() {
    this._generateTextures();
    this._generateAudio();
    this.scene.start('MenuScene');
  }

  _createProgressBar() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bar = this.add.graphics();
    const border = this.add.graphics();

    border.lineStyle(3, 0xffffff, 1);
    border.strokeRect(w / 2 - 160, h / 2 - 15, 320, 30);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x4fc3f7, 1);
      bar.fillRect(w / 2 - 157, h / 2 - 12, 314 * v, 24);
    });
  }

  _generateTextures() {
    if (this.textures.exists('bird_normal_0')) return; // already generated

    // ── Bird sprite sheet (5 frames × 4 animations) ──────────────────────
    // We draw each frame on a canvas and add it as a texture

    // Normal brown bird frames (flying L→R)
    this._drawBirdFrames('bird_normal', '#8B5E3C', '#F5DEB3', '#FF9999', false);
    // Normal bird flying R→L
    this._drawBirdFrames('bird_normal_r', '#8B5E3C', '#F5DEB3', '#FF9999', true);
    // Fast bird (slightly darker, more streamlined)
    this._drawBirdFrames('bird_fast', '#5C3A1E', '#D2B48C', '#FF7777', false);
    this._drawBirdFrames('bird_fast_r', '#5C3A1E', '#D2B48C', '#FF7777', true);
    // Golden bird
    this._drawBirdFrames('bird_golden', '#DAA520', '#FFD700', '#FF9999', false);
    this._drawBirdFrames('bird_golden_r', '#DAA520', '#FFD700', '#FF9999', true);

    // Hit/defeat frames
    this._drawHitFrames('bird_hit', '#8B5E3C', '#F5DEB3');
    this._drawHitFrames('bird_hit_golden', '#DAA520', '#FFD700');

    // ── Sky background ────────────────────────────────────────────────────
    this._drawBackground();

    // ── Cloud ─────────────────────────────────────────────────────────────
    this._drawCloud();

    // ── Tree ──────────────────────────────────────────────────────────────
    this._drawTree();

    // ── Ground ────────────────────────────────────────────────────────────
    this._drawGround();

    // ── Rock ──────────────────────────────────────────────────────────────
    this._drawRock();

    // ── Particle (spark/feather) ──────────────────────────────────────────
    this._drawParticle();

    // ── UI elements ───────────────────────────────────────────────────────
    this._drawButton();
    this._drawPanel();
  }

  // ── Drawing helpers ────────────────────────────────────────────────────

  _drawBirdFrames(key, bodyColor, bellyColor, beakColor, flip) {
    const frameW = 64, frameH = 64, frames = 5;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d');

    const wingAngles = [-0.4, -0.1, 0.2, 0.5, 0.3]; // wing flap cycle

    for (let i = 0; i < frames; i++) {
      const cx = i * frameW + frameW / 2;
      const cy = frameH / 2 + 4;
      ctx.save();
      ctx.translate(cx, cy);
      if (flip) ctx.scale(-1, 1);

      const wa = wingAngles[i];

      // Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Belly
      ctx.fillStyle = bellyColor;
      ctx.beginPath();
      ctx.ellipse(3, 4, 12, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Wing (back)
      ctx.save();
      ctx.rotate(wa - 0.3);
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(-4, -6, 14, 7, -0.5, 0, Math.PI * 2);
      ctx.fill();
      // Wing feather tips
      ctx.fillStyle = bellyColor;
      for (let f = 0; f < 3; f++) {
        ctx.beginPath();
        ctx.ellipse(-8 + f * 4, -11, 3, 6, -0.3 + f * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Wing (front)
      ctx.save();
      ctx.rotate(wa + 0.1);
      ctx.fillStyle = Phaser.Display ? bodyColor : bodyColor;
      ctx.fillStyle = this._lighten(bodyColor, 20);
      ctx.beginPath();
      ctx.ellipse(2, -5, 12, 6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Head
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(-8, -8, 11, 0, Math.PI * 2);
      ctx.fill();

      // Cheek patch (black mask like Pidgey)
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(-6, -8, 7, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-10, -10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(-9.5, -10, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Eye shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-8.8, -10.5, 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Crest feathers (top of head)
      ctx.fillStyle = this._lighten(bodyColor, 30);
      for (let c = 0; c < 3; c++) {
        ctx.save();
        ctx.translate(-12 + c * 3, -17);
        ctx.rotate(-0.3 + c * 0.2);
        ctx.beginPath();
        ctx.ellipse(0, 0, 2, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Beak
      ctx.fillStyle = beakColor;
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.lineTo(-24, -6);
      ctx.lineTo(-18, -4);
      ctx.closePath();
      ctx.fill();

      // Feet
      ctx.fillStyle = beakColor;
      ctx.lineWidth = 2;
      ctx.strokeStyle = beakColor;
      // Left foot
      ctx.beginPath(); ctx.moveTo(-2, 10); ctx.lineTo(-2, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, 16); ctx.lineTo(-6, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-2, 16); ctx.lineTo(2, 20); ctx.stroke();
      // Right foot
      ctx.beginPath(); ctx.moveTo(6, 10); ctx.lineTo(6, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, 16); ctx.lineTo(2, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, 16); ctx.lineTo(10, 20); ctx.stroke();

      // Golden shimmer overlay
      if (key.includes('golden')) {
        ctx.fillStyle = 'rgba(255,255,150,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, -4, 20, 16, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Add to Phaser texture manager
    this.textures.addCanvas(key, canvas);

    // Create animation frames config
    const frameConfig = [];
    for (let i = 0; i < frames; i++) {
      frameConfig.push({ key, frame: { x: i * frameW, y: 0, width: frameW, height: frameH } });
    }

    // Register individual frames for animation
    for (let i = 0; i < frames; i++) {
      const fc = key + '_f' + i;
      if (!this.textures.exists(fc)) {
        const fc_canvas = document.createElement('canvas');
        fc_canvas.width = frameW; fc_canvas.height = frameH;
        const fc_ctx = fc_canvas.getContext('2d');
        fc_ctx.drawImage(canvas, i * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
        this.textures.addCanvas(fc, fc_canvas);
      }
    }
  }

  _drawHitFrames(key, bodyColor, bellyColor) {
    const frameW = 72, frameH = 72, frames = 5;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d');

    const rotations = [0, 0.5, 1.0, 1.5, 2.0];
    const yOffsets = [0, 4, 10, 16, 22];

    for (let i = 0; i < frames; i++) {
      const cx = i * frameW + frameW / 2;
      const cy = frameH / 2;
      ctx.save();
      ctx.translate(cx, cy + yOffsets[i] - 10);
      ctx.rotate(rotations[i]);
      ctx.globalAlpha = 1 - (i * 0.18);

      // Tumbling body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bellyColor;
      ctx.beginPath();
      ctx.ellipse(2, 3, 10, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Scattered feathers (impact frame 0)
      if (i === 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = bellyColor;
        for (let f = 0; f < 5; f++) {
          const angle = (f / 5) * Math.PI * 2;
          const r = 20 + Math.random() * 10;
          ctx.save();
          ctx.translate(Math.cos(angle) * r, Math.sin(angle) * r);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();
    }

    this.textures.addCanvas(key, canvas);
    for (let i = 0; i < frames; i++) {
      const fc = key + '_f' + i;
      if (!this.textures.exists(fc)) {
        const fc_canvas = document.createElement('canvas');
        fc_canvas.width = frameW; fc_canvas.height = frameH;
        const fc_ctx = fc_canvas.getContext('2d');
        fc_ctx.drawImage(canvas, i * frameW, 0, frameW, frameH, 0, 0, frameW, frameH);
        this.textures.addCanvas(fc, fc_canvas);
      }
    }
  }

  _drawBackground() {
    const w = 800, h = 450;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    sky.addColorStop(0, '#4fc3f7');
    sky.addColorStop(0.5, '#81d4fa');
    sky.addColorStop(1, '#b3e5fc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.75);

    this.textures.addCanvas('background', canvas);
  }

  _drawCloud() {
    const canvas = document.createElement('canvas');
    canvas.width = 120; canvas.height = 60;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const puffs = [[60,40,32],[40,35,22],[80,35,22],[25,42,16],[95,42,16]];
    puffs.forEach(([x,y,r]) => {
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    this.textures.addCanvas('cloud', canvas);
  }

  _drawTree() {
    const canvas = document.createElement('canvas');
    canvas.width = 80; canvas.height = 120;
    const ctx = canvas.getContext('2d');
    // Trunk
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(32, 70, 16, 50);
    // Foliage layers
    const greens = ['#2E7D32','#388E3C','#43A047'];
    [[40,65,36],[40,48,30],[40,34,22]].forEach(([x,y,r],i) => {
      ctx.fillStyle = greens[i];
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });
    this.textures.addCanvas('tree', canvas);
  }

  _drawGround() {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 80;
    const ctx = canvas.getContext('2d');
    // Dirt
    const dirt = ctx.createLinearGradient(0,0,0,80);
    dirt.addColorStop(0,'#795548');
    dirt.addColorStop(1,'#5D4037');
    ctx.fillStyle = dirt;
    ctx.fillRect(0,20,800,60);
    // Grass strip
    const grass = ctx.createLinearGradient(0,0,0,25);
    grass.addColorStop(0,'#66BB6A');
    grass.addColorStop(1,'#388E3C');
    ctx.fillStyle = grass;
    ctx.fillRect(0,0,800,25);
    // Grass blades
    ctx.strokeStyle = '#81C784';
    ctx.lineWidth = 2;
    for (let x = 5; x < 800; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x-3, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x+2, 18);
      ctx.lineTo(x+5, -2);
      ctx.stroke();
    }
    this.textures.addCanvas('ground', canvas);
  }

  _drawRock() {
    const canvas = document.createElement('canvas');
    canvas.width = 20; canvas.height = 20;
    const ctx = canvas.getContext('2d');
    // Rock shape
    ctx.fillStyle = '#78909C';
    ctx.beginPath();
    ctx.moveTo(10,2); ctx.lineTo(18,6); ctx.lineTo(18,14);
    ctx.lineTo(10,18); ctx.lineTo(2,14); ctx.lineTo(2,6);
    ctx.closePath(); ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(7,7,4,3,-0.5,0,Math.PI*2);
    ctx.fill();
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(12,14,4,2,0.3,0,Math.PI*2);
    ctx.fill();
    this.textures.addCanvas('rock', canvas);
  }

  _drawParticle() {
    const canvas = document.createElement('canvas');
    canvas.width = 12; canvas.height = 12;
    const ctx = canvas.getContext('2d');
    // Star/spark shape
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 5 : 2.5;
      if (i === 0) ctx.moveTo(6 + Math.cos(a)*r, 6 + Math.sin(a)*r);
      else ctx.lineTo(6 + Math.cos(a)*r, 6 + Math.sin(a)*r);
    }
    ctx.closePath(); ctx.fill();
    this.textures.addCanvas('particle', canvas);
  }

  _drawButton() {
    const canvas = document.createElement('canvas');
    canvas.width = 200; canvas.height = 50;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,0,50);
    grad.addColorStop(0,'#42A5F5');
    grad.addColorStop(1,'#1565C0');
    ctx.fillStyle = grad;
    this._roundRect(ctx, 0, 0, 200, 50, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 1, 1, 198, 48, 12);
    ctx.stroke();
    this.textures.addCanvas('button', canvas);
  }

  _drawPanel() {
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(13,30,60,0.88)';
    this._roundRect(ctx, 0, 0, 400, 300, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,180,255,0.5)';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 1, 1, 398, 298, 20);
    ctx.stroke();
    this.textures.addCanvas('panel', canvas);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

  _generateAudio() {
    // We use Web Audio API to generate sounds procedurally
    // AudioManager handles playback — no files needed
  }

  _lighten(hex, amount) {
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
  }
}
