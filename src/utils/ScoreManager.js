/**
 * ScoreManager
 * Handles score tracking, combo system, and local high scores.
 */
export default class ScoreManager {
  constructor(registry) {
    this.registry = registry;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hits = 0;
    this.misses = 0;
    this.multiplier = 1;
  }

  /** Call on a successful hit. Returns points awarded. */
  hit(basePoints) {
    this.combo++;
    this.hits++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Combo multiplier tiers
    if (this.combo >= 10) this.multiplier = 4;
    else if (this.combo >= 6) this.multiplier = 3;
    else if (this.combo >= 3) this.multiplier = 2;
    else this.multiplier = 1;

    const points = basePoints * this.multiplier;
    this.score += points;

    this.registry.set('score', this.score);
    this.registry.set('combo', this.combo);
    this.registry.set('comboMultiplier', this.multiplier);

    return points;
  }

  /** Call on a miss. Resets combo. */
  miss() {
    this.misses++;
    this.combo = 0;
    this.multiplier = 1;
    this.registry.set('combo', 0);
    this.registry.set('comboMultiplier', 1);
  }

  get accuracy() {
    const total = this.hits + this.misses;
    if (total === 0) return 100;
    return Math.round((this.hits / total) * 100);
  }

  /** Save score to localStorage and return rank (1-based, null if not in top 10) */
  saveScore(name = 'Player') {
    const entry = {
      name,
      score: this.score,
      combo: this.maxCombo,
      accuracy: this.accuracy,
      date: new Date().toLocaleDateString()
    };

    let scores = JSON.parse(localStorage.getItem('pidgeyHuntScores') || '[]');
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 10);
    localStorage.setItem('pidgeyHuntScores', JSON.stringify(scores));
    this.registry.set('highScores', scores);

    return scores.findIndex(s => s === entry) + 1;
  }

  static loadScores() {
    return JSON.parse(localStorage.getItem('pidgeyHuntScores') || '[]');
  }

  static clearScores() {
    localStorage.removeItem('pidgeyHuntScores');
  }
}
