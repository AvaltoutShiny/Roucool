/**
 * UIScene
 * Overlay HUD: score, timer, combo, mute button.
 * Runs in parallel with GameScene.
 */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    this._gameScene = data.gameScene;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Top HUD bar ───────────────────────────────────────────────────────
    const hud = this.add.graphics();
    hud.fillStyle(0x000000, 0.45);
    hud.fillRect(0, 0, W, 52);

    // Score
    this._scoreTxt = this.add.text(12, 8, 'SCORE: 0', {
      fontFamily: 'Impact, "Arial Narrow", sans-serif',
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#000',
      strokeThickness: 3
    });

    // Combo
    this._comboTxt = this.add.text(W/2, 8, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '20px',
      color: '#FF8C00',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5, 0);

    // Timer
    this._timerTxt = this.add.text(W - 12, 8, '60', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '26px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(1, 0);

    // Multiplier badge
    this._multiBadge = this.add.text(W/2, 34, '', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '14px',
      color: '#FF4444',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5, 0).setAlpha(0);

    // ── Mute button ───────────────────────────────────────────────────────
    this._muteTxt = this.add.text(W - 14, H - 10, '🎵', {
      fontSize: '22px'
    }).setOrigin(1, 1).setInteractive({ cursor: 'pointer' });

    this._muteTxt.on('pointerdown', () => {
      const am = this.game._audioManager;
      if (!am) return;
      if (am._musicRunning) {
        am.stopMusic();
        this._muteTxt.setText('🔇');
      } else {
        am.startMusic();
        this._muteTxt.setText('🎵');
      }
    });

    // ── Pause / back button ───────────────────────────────────────────────
    const backBtn = this.add.text(14, H - 10, '✕ QUIT', {
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.7)',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0, 1).setInteractive({ cursor: 'pointer' });

    backBtn.on('pointerdown', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });

    // ── Listen to game events ─────────────────────────────────────────────
    const gs = this.scene.get('GameScene');
    gs.events.on('scoreUpdated', this._onScoreUpdated, this);
    gs.events.on('timeUpdated', this._onTimeUpdated, this);
  }

  _onScoreUpdated({ score, combo, multiplier }) {
    this._scoreTxt.setText(`SCORE: ${score.toLocaleString()}`);

    if (combo >= 2) {
      this._comboTxt.setText(`🔥 ${combo} COMBO!`);
      this._comboTxt.setAlpha(1);
      this.tweens.add({
        targets: this._comboTxt,
        scaleX: 1.2, scaleY: 1.2,
        duration: 80, yoyo: true
      });
    } else {
      this._comboTxt.setAlpha(0);
    }

    if (multiplier > 1) {
      this._multiBadge.setText(`×${multiplier} MULTIPLIER`);
      this._multiBadge.setAlpha(1);
    } else {
      this._multiBadge.setAlpha(0);
    }
  }

  _onTimeUpdated(timeLeft) {
    this._timerTxt.setText(String(timeLeft));

    if (timeLeft <= 10) {
      this._timerTxt.setColor('#FF4444');
      this.tweens.add({
        targets: this._timerTxt,
        scaleX: 1.3, scaleY: 1.3,
        duration: 100, yoyo: true
      });
    } else if (timeLeft <= 20) {
      this._timerTxt.setColor('#FF8C00');
    }
  }
}
