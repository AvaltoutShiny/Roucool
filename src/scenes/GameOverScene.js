/**
 * GameOverScene
 * Displays final score, stats, and options to play again or return to menu.
 */
export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this._data = data;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const d = this._data;

    // Dim background
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);

    // Animate in
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 400 });

    // Panel
    const px = W/2 - 200, py = H/2 - 190;
    const panel = this.add.graphics();
    panel.fillStyle(0x0d1e3c, 0.95);
    panel.fillRoundedRect(px, py, 400, 380, 24);
    panel.lineStyle(3, 0x4fc3f7, 0.8);
    panel.strokeRoundedRect(px, py, 400, 380, 24);

    panel.setAlpha(0); panel.setScale(0.7);
    this.tweens.add({ targets: panel, alpha: 1, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.out' });

    // Title
    const title = this.add.text(W/2, py + 48, 'GAME OVER', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '44px',
      color: '#FF4444',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0);

    // Score
    const scoreTxt = this.add.text(W/2, py + 108, `${d.score.toLocaleString()}`, {
      fontFamily: 'Impact, sans-serif',
      fontSize: '52px',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 5
    }).setOrigin(0.5).setAlpha(0);

    const pts = this.add.text(W/2, py + 158, 'POINTS', {
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '18px',
      color: '#81d4fa'
    }).setOrigin(0.5).setAlpha(0);

    // Stats
    const stats = [
      [`🔥 Best Combo`, `×${d.combo}`],
      [`🎯 Accuracy`, `${d.accuracy}%`],
      [`✅ Hits`, `${d.hits}`],
      [`❌ Misses`, `${d.misses}`],
    ];

    const statTexts = stats.map(([label, val], i) => {
      const y = py + 198 + i * 36;
      const lt = this.add.text(px + 40, y, label, {
        fontFamily: '"Trebuchet MS", sans-serif',
        fontSize: '16px',
        color: '#b0bec5'
      }).setAlpha(0);
      const vt = this.add.text(px + 360, y, val, {
        fontFamily: 'Impact, sans-serif',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(1, 0).setAlpha(0);
      return [lt, vt];
    });

    // New high score indicator
    const scores = JSON.parse(localStorage.getItem('pidgeyHuntScores') || '[]');
    if (scores.length > 0 && scores[0].score === d.score) {
      const newHigh = this.add.text(W/2, py + 355, '🏆 NEW HIGH SCORE!', {
        fontFamily: 'Impact, sans-serif',
        fontSize: '20px',
        color: '#FFD700',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: newHigh, alpha: 1, delay: 600, duration: 400 });
      this.tweens.add({ targets: newHigh, scaleX: 1.1, scaleY: 1.1, yoyo: true, repeat: -1, duration: 600 });
    }

    // Animate elements in
    const allFade = [title, scoreTxt, pts, ...statTexts.flat()];
    allFade.forEach((t, i) => {
      this.tweens.add({ targets: t, alpha: 1, y: (t.y ?? 0) - 6, duration: 300, delay: 200 + i * 60, ease: 'Power2' });
    });

    // Buttons
    this.time.delayedCall(700, () => {
      this._makeButton(W/2 - 110, py + 418, 'PLAY AGAIN', 0x2e7d32, 0x43a047, () => {
        this.scene.start('GameScene');
      });
      this._makeButton(W/2 + 110, py + 418, 'MENU', 0x1565c0, 0x1976d2, () => {
        this.scene.start('MenuScene');
      });
    });

    // Particle celebration for good score
    if (d.score > 200) {
      this._fireworks(W, H);
    }
  }

  _makeButton(x, y, label, colorN, colorH, cb) {
    const w = 180, h = 46;
    const bg = this.add.graphics().setDepth(10).setAlpha(0);
    const txt = this.add.text(x, y, label, {
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '17px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(11).setAlpha(0);

    const draw = (c) => {
      bg.clear();
      bg.fillStyle(c, 1);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 12);
      bg.lineStyle(2, 0xffffff, 0.3);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 12);
    };
    draw(colorN);

    this.tweens.add({ targets: [bg, txt], alpha: 1, duration: 250 });

    const zone = this.add.zone(x, y, w, h).setInteractive({ cursor: 'pointer' }).setDepth(12);
    zone.on('pointerover', () => draw(colorH));
    zone.on('pointerout', () => draw(colorN));
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true });
      this.time.delayedCall(130, cb);
    });
  }

  _fireworks(W, H) {
    const colors = [0xFFD700, 0xFF4444, 0x4fc3f7, 0x66BB6A, 0xFF8C00];
    for (let burst = 0; burst < 5; burst++) {
      this.time.delayedCall(burst * 280, () => {
        const bx = Phaser.Math.Between(W * 0.2, W * 0.8);
        const by = Phaser.Math.Between(H * 0.1, H * 0.5);
        const color = colors[burst % colors.length];
        for (let p = 0; p < 14; p++) {
          const g = this.add.graphics().setDepth(200).setPosition(bx, by);
          g.fillStyle(color, 1);
          g.fillCircle(0, 0, Phaser.Math.Between(2, 5));
          const a = (p / 14) * Math.PI * 2;
          const sp = Phaser.Math.Between(60, 180);
          this.tweens.add({
            targets: g,
            x: bx + Math.cos(a) * sp,
            y: by + Math.sin(a) * sp + 40,
            alpha: 0, scaleX: 0.2, scaleY: 0.2,
            duration: 700, ease: 'Power2',
            onComplete: () => g.destroy()
          });
        }
      });
    }
  }
}
