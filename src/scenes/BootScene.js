/**
 * BootScene
 * First scene to run. Sets up any global config and moves to PreloadScene.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Load minimal assets needed for the loading screen
    // (nothing needed — PreloadScene handles all assets)
  }

  create() {
    // Set up global game registry defaults
    this.registry.set('score', 0);
    this.registry.set('combo', 0);
    this.registry.set('comboMultiplier', 1);
    this.registry.set('musicVolume', 0.4);
    this.registry.set('sfxVolume', 0.7);
    this.registry.set('highScores', JSON.parse(localStorage.getItem('pidgeyHuntScores') || '[]'));

    this.scene.start('PreloadScene');
  }
}
