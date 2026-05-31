/**
 * MenuScene
 * Main menu with Play, High Scores, and Settings buttons.
 */
import AudioManager from '../utils/AudioManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Background sky ─────────────────────────────────────────────────
    this._drawScenery(W, H);

    // ── Animated demo birds ────────────────────────────────────────────
    this._spawnDemoBirds(W, H);

    // ── Title panel ────────────────────────────────────────────────────
    // Dark panel behind title
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x0d1e3c, 0.75);
    panelGfx.fillRoundedRect(W/2 - 200, 30, 400, 120, 20);
    panelGfx.lineStyle(2, 0x4fc3f7, 0.7);
    panelGfx.strokeRoundedRect(W/2 - 200, 30, 400, 120, 20);

    // Title text
    this.add.text(W/2, 70, '🐦 PIDGEY HUNT', {
      fontFamily: '"Trebuchet MS", Impact, sans-serif',
      fontSize: '42px',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    this.add.text(W/2, 120, 'Rock Toss Trainer', {
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '18px',
      color: '#81d4fa',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // ── Menu buttons ────────────────────────────────────────────────────
    const btns = [
      { label: '▶  PLAY', scene: 'GameScene', color: 0x2e7d32, hover: 0x43a047 },
      { label: '🏆  HIGH SCORES', scene: 'HighScoreScene', color: 0x1565c0, hover: 0x1976d2 },
      { label: '⚙  SETTINGS', scene: 'SettingsScene', color: 0x6a1b9a, hover: 0x7b1fa2 }
    ];

    btns.forEach((btn, i) => {
      const bx = W / 2;
      const by = H / 2 - 20 + i * 70;
      this._makeButton(bx, by, 220, 52, btn.label, btn.color, btn.hover, () => {
        this.scene.start(btn.scene);
      });
    });

    // ── High score display ──────────────────────────────────────────────
    const scores = JSON.parse(localStorage.getItem('pidgeyHuntScores') || '[]');
    if (scores.length > 0) {
      this.add.text(W/2, H - 55, `Best: ${scores[0].score.toLocaleString()} pts  (${scores[0].name})`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#FFD700',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // Version / credit
    this.add.text(W - 8, H - 8, 'v1.0', {
      fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)'
    }).setOrigin(1, 1);

    // ── Audio (initialise on first user interaction) ───────────────────
    if (!this.game._audioManager) {
      this.game._audioManager = new AudioManager(this.registry);
    }
    this.input.once('pointerdown', () => {
      this.game._audioManager.startMusic();
    });

    // ── Floating feather particles ─────────────────────────────────────
    this._spawnFeatherParticles(W, H);
  }

  update(time, delta) {
    // Animate demo birds
    if (this._demoBirds) {
      this._demoBirds.forEach(b => {
        b.x += b.vx * (delta / 1000);
        b.y = b.baseY + Math.sin(time * 0.001 * b.sv + b.so) * b.sa;
        b.img.setPosition(b.x, b.y);

        b.frameTimer += delta;
        if (b.frameTimer > 110) {
          b.frameTimer = 0;
          b.frame = (b.frame + 1) % 5;
          const fk = b.key + '_f' + b.frame;
          if (this.textures.exists(fk)) b.img.setTexture(fk);
        }

        // Wrap
        const W = this.scale.width;
        if (b.vx > 0 && b.x > W + 80) b.x = -80;
        if (b.vx < 0 && b.x < -80) b.x = W + 80;
      });
    }
  }

  _drawScenery(W, H) {
    // Sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x4fc3f7, 0x4fc3f7, 0xb3e5fc, 0xb3e5fc, 1);
    sky.fillRect(0, 0, W, H * 0.80);

    // Sun
    const sun = this.add.graphics();
    sun.fillStyle(0xFFF9C4, 0.9);
    sun.fillCircle(W - 100, 60, 40);
    sun.fillStyle(0xFFEE58, 0.4);
    sun.fillCircle(W - 100, 60, 55);

    // Clouds
    [
      [80, 60, 1.0], [220, 40, 0.8], [500, 70, 1.1],
      [650, 45, 0.9], [350, 55, 0.75]
    ].forEach(([x, y, s]) => {
      if (this.textures.exists('cloud')) {
        this.add.image(x, y, 'cloud').setScale(s).setAlpha(0.9);
      }
    });

    // Ground
    if (this.textures.exists('ground')) {
      this.add.image(W/2, H - 20, 'ground').setDisplaySize(W, 80);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x66BB6A);
      g.fillRect(0, H - 60, W, 60);
    }

    // Trees
    if (this.textures.exists('tree')) {
      [60, 140, W - 70, W - 160, W/2 - 30, W/2 + 80].forEach(x => {
        const scale = Phaser.Math.FloatBetween(0.8, 1.3);
        this.add.image(x, H - 60, 'tree').setScale(scale).setOrigin(0.5, 1);
      });
    }
  }

  _spawnDemoBirds(W, H) {
    this._demoBirds = [];
    const configs = [
      { key: 'bird_normal', vx: 80, y: 160, sa: 20 },
      { key: 'bird_normal_r', vx: -70, y: 200, sa: 15 },
      { key: 'bird_golden', vx: 60, y: 120, sa: 25 },
    ];
    configs.forEach((c, i) => {
      const fk = c.key + '_f0';
      if (!this.textures.exists(fk)) return;
      const x = Phaser.Math.Between(100, W - 100);
      const img = this.add.image(x, c.y, fk).setScale(0.9).setDepth(5);
      this._demoBirds.push({
        img, x, baseY: c.y, vx: c.vx, key: c.key,
        sv: Phaser.Math.FloatBetween(1.5, 2.5),
        so: Phaser.Math.FloatBetween(0, Math.PI * 2),
        sa: c.sa, frame: i, frameTimer: i * 40
      });
    });
  }

  _spawnFeatherParticles(W, H) {
    // Simple tween-based feathers
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(-20, H);
      const gfx = this.add.graphics().setDepth(1).setAlpha(0.5);
      gfx.fillStyle(0xf5deb3, 1);
      gfx.fillEllipse(0, 0, 8, 4);
      gfx.setPosition(x, y);

      this.tweens.add({
        targets: gfx,
        x: x + Phaser.Math.Between(-60, 60),
        y: y + H + 20,
        angle: Phaser.Math.Between(-180, 180),
        alpha: { from: 0.5, to: 0 },
        duration: Phaser.Math.Between(4000, 9000),
        delay: Phaser.Math.Between(0, 3000),
        repeat: -1,
        onRepeat: (tween) => {
          gfx.setPosition(Phaser.Math.Between(0, W), -20);
        }
      });
    }
  }

  _makeButton(x, y, w, h, label, colorNorm, colorHover, callback) {
    const bg = this.add.graphics().setDepth(20);
    const txt = this.add.text(x, y, label, {
      fontFamily: '"Trebuchet MS", Impact, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(21);

    const draw = (color) => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 14);
      bg.lineStyle(2, 0xffffff, 0.4);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 14);
      // Shine
      bg.fillStyle(0xffffff, 0.12);
      bg.fillRoundedRect(x - w/2 + 4, y - h/2 + 4, w - 8, h/2 - 4, 10);
    };

    draw(colorNorm);

    const zone = this.add.zone(x, y, w, h).setInteractive({ cursor: 'pointer' }).setDepth(22);
    zone.on('pointerover', () => { draw(colorHover); this.tweens.add({ targets: txt, scaleX: 1.05, scaleY: 1.05, duration: 80 }); });
    zone.on('pointerout', () => { draw(colorNorm); this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 80 }); });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
      this.time.delayedCall(120, callback);
    });

    return { bg, txt, zone };
  }
}
