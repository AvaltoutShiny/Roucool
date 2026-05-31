/**
 * SettingsScene
 * Volume controls and score reset.
 */
import ScoreManager from '../utils/ScoreManager.js';

export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1e3c, 0x0d1e3c, 0x1a3a6e, 0x1a3a6e, 1);
    bg.fillRect(0, 0, W, H);

    // Title
    this.add.text(W/2, 45, '⚙ SETTINGS', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '36px',
      color: '#81d4fa',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.35);
    panel.fillRoundedRect(W/2 - 220, 90, 440, 280, 20);

    const am = this.game._audioManager;

    // ── Sliders ─────────────────────────────────────────────────────────
    const musicVol = this.registry.get('musicVolume') ?? 0.4;
    const sfxVol = this.registry.get('sfxVolume') ?? 0.7;

    this._makeSlider(W/2, 150, 'MUSIC VOLUME', musicVol, (v) => {
      this.registry.set('musicVolume', v);
      if (am) am.setMusicVolume(v);
    });

    this._makeSlider(W/2, 230, 'SFX VOLUME', sfxVol, (v) => {
      this.registry.set('sfxVolume', v);
      if (am) am.setSfxVolume(v);
      if (am) am.playHit(false); // preview
    });

    // ── Toggle music ─────────────────────────────────────────────────────
    let musicOn = am ? am._musicRunning : false;
    const toggleBtn = this._makeButton(W/2, 308, musicOn ? '🎵 MUSIC: ON' : '🔇 MUSIC: OFF',
      musicOn ? 0x2e7d32 : 0x555555, () => {
        if (!am) return;
        if (am._musicRunning) {
          am.stopMusic();
          musicOn = false;
          toggleBg.clear();
          toggleBg.fillStyle(0x555555, 1);
          toggleBg.fillRoundedRect(W/2 - 110, 308 - 21, 220, 42, 12);
          toggleTxt.setText('🔇 MUSIC: OFF');
        } else {
          am.startMusic();
          musicOn = true;
          toggleBg.clear();
          toggleBg.fillStyle(0x2e7d32, 1);
          toggleBg.fillRoundedRect(W/2 - 110, 308 - 21, 220, 42, 12);
          toggleTxt.setText('🎵 MUSIC: ON');
        }
      });
    const toggleBg = toggleBtn.bg;
    const toggleTxt = toggleBtn.txt;

    // ── Reset scores ──────────────────────────────────────────────────────
    this._makeButton(W/2, 368, '🗑 RESET HIGH SCORES', 0x8B0000, () => {
      ScoreManager.clearScores();
      this.registry.set('highScores', []);
      const flash = this.add.text(W/2, 420, 'Scores cleared!', {
        fontFamily: '"Trebuchet MS", sans-serif',
        fontSize: '16px',
        color: '#FF4444'
      }).setOrigin(0.5);
      this.tweens.add({ targets: flash, alpha: 0, y: 400, duration: 1500, onComplete: () => flash.destroy() });
    });

    // ── Back button ───────────────────────────────────────────────────────
    this._makeButton(W/2, H - 45, '← BACK TO MENU', 0x1565c0, () => {
      this.scene.start('MenuScene');
    });
  }

  _makeSlider(x, y, label, initialValue, onChange) {
    this.add.text(x, y - 26, label, {
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '14px',
      color: '#81d4fa'
    }).setOrigin(0.5);

    const trackW = 280, trackH = 8;
    const trackX = x - trackW / 2;

    // Track
    const track = this.add.graphics();
    track.fillStyle(0x37474f, 1);
    track.fillRoundedRect(trackX, y - trackH/2, trackW, trackH, 4);

    // Fill
    const fill = this.add.graphics();
    const drawFill = (v) => {
      fill.clear();
      fill.fillStyle(0x4fc3f7, 1);
      fill.fillRoundedRect(trackX, y - trackH/2, trackW * v, trackH, 4);
    };
    drawFill(initialValue);

    // Thumb
    const thumb = this.add.graphics();
    const drawThumb = (v) => {
      thumb.clear();
      thumb.fillStyle(0xffffff, 1);
      thumb.fillCircle(trackX + trackW * v, y, 11);
      thumb.fillStyle(0x4fc3f7, 1);
      thumb.fillCircle(trackX + trackW * v, y, 7);
    };
    drawThumb(initialValue);

    // Value text
    const valTxt = this.add.text(x + trackW/2 + 28, y, `${Math.round(initialValue * 100)}%`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    // Drag zone
    let dragging = false;
    const zone = this.add.zone(x, y, trackW + 22, 30).setInteractive({ cursor: 'pointer' });
    zone.on('pointerdown', (ptr) => {
      dragging = true;
      const v = Phaser.Math.Clamp((ptr.x - trackX) / trackW, 0, 1);
      drawFill(v); drawThumb(v);
      valTxt.setText(`${Math.round(v * 100)}%`);
      onChange(v);
    });
    this.input.on('pointermove', (ptr) => {
      if (!dragging) return;
      const v = Phaser.Math.Clamp((ptr.x - trackX) / trackW, 0, 1);
      drawFill(v); drawThumb(v);
      valTxt.setText(`${Math.round(v * 100)}%`);
      onChange(v);
    });
    this.input.on('pointerup', () => { dragging = false; });
  }

  _makeButton(x, y, label, colorN, cb) {
    const w = 220, h = 42;
    const bg = this.add.graphics().setDepth(10);
    const txt = this.add.text(x, y, label, {
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '15px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(11);

    bg.fillStyle(colorN, 1);
    bg.fillRoundedRect(x - w/2, y - h/2, w, h, 12);

    const zone = this.add.zone(x, y, w, h).setInteractive({ cursor: 'pointer' }).setDepth(12);
    zone.on('pointerdown', () => this.time.delayedCall(120, cb));
    return { bg, txt };
  }
}
