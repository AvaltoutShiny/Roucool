/**
 * GameScene
 * Core gameplay: birds fly, player throws rocks, scoring & difficulty scaling.
 */
import BirdFactory from '../utils/BirdFactory.js';
import ScoreManager from '../utils/ScoreManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._W = W;
    this._H = H;

    // ── State ──────────────────────────────────────────────────────────
    this._scoreManager = new ScoreManager(this.registry);
    this._difficultyLevel = 0;
    this._gameTime = 0;
    this._gameActive = true;
    this._gameDuration = 60; // seconds
    this._timeLeft = this._gameDuration;
    this._rocks = [];
    this._hitEffects = [];

    // ── Scenery ─────────────────────────────────────────────────────────
    this._buildScenery(W, H);

    // ── Bird group ───────────────────────────────────────────────────────
    this._birds = this.physics.add.group();

    // ── Input ────────────────────────────────────────────────────────────
    this.input.on('pointerdown', this._onPointerDown, this);

    // ── Spawn timer ──────────────────────────────────────────────────────
    this._spawnBirds();
    this._spawnTimer = this.time.addEvent({
      delay: this._getSpawnDelay(),
      callback: this._spawnBirds,
      callbackScope: this,
      loop: true
    });

    // ── Difficulty timer (every 30s) ──────────────────────────────────────
    this._diffTimer = this.time.addEvent({
      delay: 30000,
      callback: this._increaseDifficulty,
      callbackScope: this,
      loop: true
    });

    // ── Game countdown ────────────────────────────────────────────────────
    this._countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this._onTick,
      callbackScope: this,
      loop: true
    });

    // ── Crosshair cursor ─────────────────────────────────────────────────
    this._crosshair = this._makeCrosshair();
    this.input.on('pointermove', (ptr) => {
      this._crosshair.setPosition(ptr.x, ptr.y);
    });

    // ── Start UI overlay scene ────────────────────────────────────────────
    this.scene.launch('UIScene', { gameScene: this });

    // ── Mute button (M key) ───────────────────────────────────────────────
    this.input.keyboard.on('keydown-M', () => {
      const am = this.game._audioManager;
      if (am) {
        am._musicRunning ? am.stopMusic() : am.startMusic();
      }
    });

    // ── ESC = pause / back ────────────────────────────────────────────────
    this.input.keyboard.on('keydown-ESC', () => this._endGame());
  }

  update(time, delta) {
    if (!this._gameActive) return;

    this._gameTime += delta;

    // ── Update birds ──────────────────────────────────────────────────────
    const W = this._W, H = this._H;
    this._birds.getChildren().forEach(bird => {
      if (!bird.active) return;

      BirdFactory.updateAnimation(bird, delta);
      BirdFactory.updateSineWave(bird, time);

      // Remove if off screen
      if (bird.x < -100 || bird.x > W + 100) {
        bird.destroy();
      }
    });

    // ── Update rocks ───────────────────────────────────────────────────────
    this._rocks = this._rocks.filter(r => {
      if (!r.active) return false;

      // Check collision with each bird
      let hit = false;
      this._birds.getChildren().forEach(bird => {
        if (!bird.active || !bird.alive) return;
        const dx = r.x - bird.x;
        const dy = r.y - bird.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const hitRadius = 30 * bird.scale;

        if (dist < hitRadius) {
          hit = true;
          this._onBirdHit(bird, r.x, r.y);
          r.destroy();
        }
      });

      if (hit) return false;

      // Remove rock if off screen
      if (r.x < 0 || r.x > W || r.y < 0 || r.y > H) {
        r.destroy();
        return false;
      }
      return true;
    });

    // ── Update hit effects ──────────────────────────────────────────────────
    this._hitEffects = this._hitEffects.filter(e => e.active);
  }

  // ── Spawn ────────────────────────────────────────────────────────────────

  _spawnBirds() {
    if (!this._gameActive) return;
    const count = 1 + Math.floor(this._difficultyLevel * 0.5);
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this._gameActive) {
          BirdFactory.spawn(this, this._birds, this._difficultyLevel);
        }
      });
    }
  }

  _getSpawnDelay() {
    return Math.max(800, 2200 - this._difficultyLevel * 200);
  }

  _increaseDifficulty() {
    this._difficultyLevel++;
    // Update spawn timer
    this._spawnTimer.delay = this._getSpawnDelay();

    // Visual flash
    const txt = this.add.text(this._W/2, this._H/2 - 40, '⚡ FASTER!', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '36px',
      color: '#FF4444',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: txt,
      y: this._H/2 - 100,
      alpha: 0,
      scaleX: 1.5, scaleY: 1.5,
      duration: 1200,
      onComplete: () => txt.destroy()
    });
  }

  // ── Input ────────────────────────────────────────────────────────────────

  _onPointerDown(pointer) {
    if (!this._gameActive) return;

    const am = this.game._audioManager;
    if (am) am.playThrow();

    // Vibrate on mobile (throw)
    if (navigator.vibrate) navigator.vibrate(15);

    this._throwRock(pointer.x, pointer.y);
  }

  _throwRock(targetX, targetY) {
    // Rock starts from bottom-center (player position)
    const startX = this._W / 2 + Phaser.Math.Between(-30, 30);
    const startY = this._H - 50;

    const rock = this.add.image(startX, startY, 'rock').setDepth(30).setScale(1.2);

    // Calculate velocity toward target
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const speed = 700;
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    // Add slight rotation
    let angle = 0;
    let missChecked = false;

    // Use update via manual tracking
    rock.vx = vx; rock.vy = vy;

    // Check if it will miss (no bird near target)
    const nearBird = this._birds.getChildren().some(b => {
      if (!b.active || !b.alive) return false;
      const dx2 = targetX - b.x, dy2 = targetY - b.y;
      return Math.sqrt(dx2*dx2 + dy2*dy2) < 50 * b.scale;
    });

    if (!nearBird) {
      // Delayed miss feedback
      this.time.delayedCall(300, () => {
        const sm = this._scoreManager;
        sm.miss();
        if (this.game._audioManager) this.game._audioManager.playMiss();
        this._showMissEffect(targetX, targetY);
      });
    }

    this._rocks.push(rock);

    // Animate rock movement
    this.tweens.add({
      targets: rock,
      x: targetX + (dx / dist) * (dist + 100),
      y: targetY + (dy / dist) * (dist + 100),
      angle: 360,
      duration: (dist / speed) * 1000 + 200,
      ease: 'Linear',
      onComplete: () => {
        if (rock.active) rock.destroy();
      }
    });

    // Throw animation: click ripple
    this._showThrowEffect(startX, startY);
  }

  // ── Hit / Miss effects ────────────────────────────────────────────────────

  _onBirdHit(bird, hitX, hitY) {
    if (!bird.alive) return;
    bird.alive = false;

    const isGolden = bird.birdType.key === 'golden';
    const points = this._scoreManager.hit(bird.birdType.points);

    // Audio
    const am = this.game._audioManager;
    if (am) am.playHit(isGolden);

    // Vibration
    if (navigator.vibrate) navigator.vibrate(isGolden ? [30, 20, 30] : 25);

    // Screen shake
    this.cameras.main.shake(120, 0.008);

    // Show score popup
    this._showScorePopup(hitX, hitY, points, isGolden);

    // Particle explosion
    this._showHitParticles(hitX, hitY, isGolden);

    // Show hit animation
    this._showHitAnimation(bird, hitX, hitY, isGolden);

    // Update UI
    this.events.emit('scoreUpdated', {
      score: this._scoreManager.score,
      combo: this._scoreManager.combo,
      multiplier: this._scoreManager.multiplier
    });

    // Combo audio
    const combo = this._scoreManager.combo;
    if (combo >= 3 && am) {
      const tier = combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1;
      am.playCombo(tier);
    }

    bird.destroy();
  }

  _showHitAnimation(bird, x, y, isGolden) {
    const hitKey = isGolden ? 'bird_hit_golden' : 'bird_hit';
    let frame = 0;
    const img = this.add.image(x, y, hitKey + '_f0').setDepth(50).setScale(bird.scale * 1.2);
    this._hitEffects.push(img);

    const timer = this.time.addEvent({
      delay: 80,
      repeat: 4,
      callback: () => {
        frame++;
        const fk = hitKey + '_f' + frame;
        if (this.textures.exists(fk)) img.setTexture(fk);
        if (frame >= 4) {
          this.tweens.add({
            targets: img, alpha: 0, y: img.y + 40, duration: 300,
            onComplete: () => img.destroy()
          });
        }
      }
    });
  }

  _showScorePopup(x, y, points, isGolden) {
    const prefix = isGolden ? '✨ ' : this._scoreManager.multiplier > 1 ? `x${this._scoreManager.multiplier} ` : '';
    const txt = this.add.text(x, y - 20, `${prefix}+${points}`, {
      fontFamily: 'Impact, sans-serif',
      fontSize: isGolden ? '32px' : '26px',
      color: isGolden ? '#FFD700' : (this._scoreManager.multiplier > 1 ? '#FF8C00' : '#FFFFFF'),
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: txt,
      y: y - 80,
      alpha: 0,
      scaleX: 1.3, scaleY: 1.3,
      duration: 900,
      ease: 'Power2',
      onComplete: () => txt.destroy()
    });
  }

  _showHitParticles(x, y, isGolden) {
    const colors = isGolden
      ? [0xFFD700, 0xFFF59D, 0xFF8C00]
      : [0xF5DEB3, 0x8B5E3C, 0xFFFFFF];

    for (let i = 0; i < (isGolden ? 16 : 10); i++) {
      const g = this.add.graphics().setDepth(60);
      const color = colors[i % colors.length];
      g.fillStyle(color, 1);
      g.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      g.setPosition(x, y);

      const angle = (i / (isGolden ? 16 : 10)) * Math.PI * 2;
      const speed = Phaser.Math.Between(80, 200);

      this.tweens.add({
        targets: g,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + Phaser.Math.Between(20, 60),
        alpha: 0,
        scaleX: 0.2, scaleY: 0.2,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Power2',
        onComplete: () => g.destroy()
      });
    }

    // Feather burst
    if (this.textures.exists('particle')) {
      for (let i = 0; i < 5; i++) {
        const p = this.add.image(x, y, 'particle').setDepth(59).setScale(0.8).setTint(isGolden ? 0xFFD700 : 0xF5DEB3);
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const dist = Phaser.Math.Between(50, 130);
        this.tweens.add({
          targets: p,
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist + 30,
          angle: Phaser.Math.Between(-180, 180),
          alpha: 0,
          duration: 700,
          ease: 'Power1',
          onComplete: () => p.destroy()
        });
      }
    }
  }

  _showMissEffect(x, y) {
    // "Miss" text briefly
    const txt = this.add.text(x, y, 'MISS', {
      fontFamily: 'Impact, sans-serif',
      fontSize: '22px',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 3,
      alpha: 0.8
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => txt.destroy()
    });

    // Dust puff
    const dust = this.add.graphics().setDepth(50).setPosition(x, y);
    dust.fillStyle(0xCCCCCC, 0.5);
    dust.fillCircle(0, 0, 15);
    this.tweens.add({
      targets: dust,
      scaleX: 3, scaleY: 3,
      alpha: 0,
      duration: 400,
      onComplete: () => dust.destroy()
    });
  }

  _showThrowEffect(x, y) {
    const ring = this.add.graphics().setDepth(25).setPosition(x, y);
    ring.lineStyle(2, 0xffffff, 0.7);
    ring.strokeCircle(0, 0, 8);
    this.tweens.add({
      targets: ring,
      scaleX: 4, scaleY: 4,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy()
    });
  }

  // ── Timer / end ──────────────────────────────────────────────────────────

  _onTick() {
    if (!this._gameActive) return;
    this._timeLeft--;
    this.events.emit('timeUpdated', this._timeLeft);

    if (this._timeLeft <= 0) {
      this._endGame();
    }
  }

  _endGame() {
    if (!this._gameActive) return;
    this._gameActive = false;

    this._spawnTimer.remove();
    this._diffTimer.remove();
    this._countdownTimer.remove();

    // Save score
    this._scoreManager.saveScore('Player');

    // Transition to game over
    this.time.delayedCall(800, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', {
        score: this._scoreManager.score,
        combo: this._scoreManager.maxCombo,
        accuracy: this._scoreManager.accuracy,
        hits: this._scoreManager.hits,
        misses: this._scoreManager.misses
      });
    });
  }

  // ── Scenery ──────────────────────────────────────────────────────────────

  _buildScenery(W, H) {
    // Sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x29b6f6, 0x29b6f6, 0xe1f5fe, 0xe1f5fe, 1);
    sky.fillRect(0, 0, W, H);

    // Sun
    const sun = this.add.graphics();
    sun.fillStyle(0xFFF9C4, 0.85);
    sun.fillCircle(W - 80, 55, 38);
    sun.fillStyle(0xFFEE58, 0.3);
    sun.fillCircle(W - 80, 55, 52);

    // Clouds (slow parallax)
    this._clouds = [];
    const cloudPositions = [
      [70, 55, 0.9], [190, 40, 0.75], [420, 65, 1.05],
      [580, 38, 0.85], [700, 60, 0.7]
    ];
    cloudPositions.forEach(([cx, cy, s]) => {
      if (this.textures.exists('cloud')) {
        const c = this.add.image(cx, cy, 'cloud').setScale(s).setAlpha(0.85).setDepth(2);
        this._clouds.push({ img: c, speed: s * 10 });
      }
    });

    // Ground
    if (this.textures.exists('ground')) {
      this.add.image(W/2, H - 15, 'ground').setDisplaySize(W, 80).setDepth(8);
    }

    // Trees
    if (this.textures.exists('tree')) {
      [40, 110, W - 50, W - 130, W/2 - 20, W/2 + 70].forEach(x => {
        const s = Phaser.Math.FloatBetween(0.75, 1.2);
        this.add.image(x, H - 55, 'tree').setScale(s).setOrigin(0.5, 1).setDepth(7);
      });
    }
  }

  _makeCrosshair() {
    const g = this.add.graphics().setDepth(200);
    g.lineStyle(2, 0xffffff, 0.85);
    g.strokeCircle(0, 0, 14);
    g.strokeCircle(0, 0, 4);
    g.lineBetween(-20, 0, -8, 0);
    g.lineBetween(8, 0, 20, 0);
    g.lineBetween(0, -20, 0, -8);
    g.lineBetween(0, 8, 0, 20);
    this.input.setDefaultCursor('none');
    return g;
  }
}
