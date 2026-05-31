/**
 * BirdFactory
 * Creates bird game objects with the correct type, speed, and behavior.
 */

export const BIRD_TYPES = {
  NORMAL: {
    key: 'normal',
    points: 10,
    speedMin: 120,
    speedMax: 200,
    scale: 1.0,
    spawnWeight: 60, // probability weight
    label: 'Normal',
    color: 0xFFFFFF
  },
  FAST: {
    key: 'fast',
    points: 20,
    speedMin: 220,
    speedMax: 340,
    scale: 0.85,
    spawnWeight: 30,
    label: 'Fast',
    color: 0xFF8C00
  },
  GOLDEN: {
    key: 'golden',
    points: 50,
    speedMin: 160,
    speedMax: 260,
    scale: 1.1,
    spawnWeight: 10,
    label: 'Golden',
    color: 0xFFD700
  }
};

export default class BirdFactory {
  /**
   * @param {Phaser.Scene} scene
   * @param {Phaser.Physics.Arcade.Group} group
   * @param {number} difficultyLevel  0-based, increases every 30 seconds
   */
  static spawn(scene, group, difficultyLevel = 0) {
    const type = BirdFactory._pickType(difficultyLevel);
    const goRight = Phaser.Math.Between(0, 1) === 0;

    // Random vertical position in the flight zone (sky area)
    const y = Phaser.Math.Between(50, scene.scale.height * 0.62);

    const speedBonus = difficultyLevel * 18;
    const speed = Phaser.Math.Between(
      type.speedMin + speedBonus,
      type.speedMax + speedBonus
    );

    const textureKey = type.key === 'golden'
      ? (goRight ? 'bird_golden' : 'bird_golden_r')
      : type.key === 'fast'
        ? (goRight ? 'bird_fast' : 'bird_fast_r')
        : (goRight ? 'bird_normal' : 'bird_normal_r');

    const startX = goRight
      ? -60
      : scene.scale.width + 60;

    // Use frame 0 as the initial texture
    const frameKey = textureKey + '_f0';
    const bird = group.create(startX, y, frameKey);

    bird.setScale(type.scale);
    bird.setDepth(10);
    bird.birdType = type;
    bird.goRight = goRight;
    bird.textureKey = textureKey;
    bird.animFrame = 0;
    bird.animTimer = 0;
    bird.alive = true;

    // Physics velocity
    bird.setVelocityX(goRight ? speed : -speed);

    // Slight vertical sine wave movement
    bird.sineOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    bird.sineSpeed = Phaser.Math.FloatBetween(1.5, 3.0);
    bird.sineAmplitude = Phaser.Math.FloatBetween(15, 40);
    bird.baseY = y;

    // Flip if needed (mirrored textures handle this, but just in case)
    bird.setFlipX(false);

    return bird;
  }

  /** Weighted random type selection; adjusts for difficulty */
  static _pickType(difficultyLevel) {
    const types = Object.values(BIRD_TYPES);

    // Increase fast/golden spawn rates with difficulty
    const weights = types.map(t => {
      if (t.key === 'fast') return t.spawnWeight + difficultyLevel * 3;
      if (t.key === 'golden') return t.spawnWeight + difficultyLevel;
      return Math.max(10, t.spawnWeight - difficultyLevel * 2);
    });

    const total = weights.reduce((s, w) => s + w, 0);
    let r = Phaser.Math.Between(0, total - 1);

    for (let i = 0; i < types.length; i++) {
      r -= weights[i];
      if (r < 0) return types[i];
    }
    return types[0];
  }

  /** Advance animation frame for a bird */
  static updateAnimation(bird, delta) {
    bird.animTimer += delta;
    const frameInterval = bird.birdType.key === 'fast' ? 80 : 110;
    if (bird.animTimer >= frameInterval) {
      bird.animTimer = 0;
      bird.animFrame = (bird.animFrame + 1) % 5;
      const fk = bird.textureKey + '_f' + bird.animFrame;
      if (bird.scene.textures.exists(fk)) {
        bird.setTexture(fk);
      }
    }
  }

  /** Apply sine wave vertical movement */
  static updateSineWave(bird, time) {
    if (!bird.alive) return;
    bird.y = bird.baseY + Math.sin(time * 0.001 * bird.sineSpeed + bird.sineOffset) * bird.sineAmplitude;
  }
}
