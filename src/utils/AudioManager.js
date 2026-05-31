/**
 * AudioManager
 * Generates all sounds procedurally via Web Audio API.
 * No audio files required — works offline and on all platforms.
 */
export default class AudioManager {
  constructor(registry) {
    this.registry = registry;
    this._ctx = null;
    this._musicGain = null;
    this._sfxGain = null;
    this._musicOscillators = [];
    this._musicRunning = false;
    this._muted = false;
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._musicGain = this._ctx.createGain();
      this._sfxGain = this._ctx.createGain();
      this._musicGain.connect(this._ctx.destination);
      this._sfxGain.connect(this._ctx.destination);
      this._updateVolumes();
    }
    return this._ctx;
  }

  _updateVolumes() {
    if (!this._ctx) return;
    const mv = this.registry.get('musicVolume') ?? 0.4;
    const sv = this.registry.get('sfxVolume') ?? 0.7;
    this._musicGain.gain.setTargetAtTime(mv, this._ctx.currentTime, 0.1);
    this._sfxGain.gain.setTargetAtTime(sv, this._ctx.currentTime, 0.1);
  }

  setMusicVolume(v) {
    this.registry.set('musicVolume', v);
    this._updateVolumes();
  }

  setSfxVolume(v) {
    this.registry.set('sfxVolume', v);
    this._updateVolumes();
  }

  // ── Sound effects ──────────────────────────────────────────────────────

  playThrow() {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(this._sfxGain);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.18);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.18);
  }

  playHit(isGolden = false) {
    const ctx = this._getCtx();
    const t = ctx.currentTime;

    // Thud
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = isGolden ? 800 : 300;
    f.Q.value = 0.5;
    src.connect(f); f.connect(this._sfxGain);
    src.start(t);

    // Ping for golden
    if (isGolden) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(this._sfxGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.1);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t); osc.stop(t + 0.4);
    }
  }

  playMiss() {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(this._sfxGain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.2);
  }

  playCombo(level) {
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const freqs = [523, 659, 784, 1047]; // C E G C
    const f = freqs[Math.min(level - 1, 3)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(this._sfxGain);
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
  }

  // ── Background music (simple chiptune loop) ────────────────────────────

  startMusic() {
    if (this._musicRunning) return;
    this._musicRunning = true;
    this._playMusicLoop();
  }

  stopMusic() {
    this._musicRunning = false;
    this._musicOscillators.forEach(o => { try { o.stop(); } catch(e){} });
    this._musicOscillators = [];
  }

  _playMusicLoop() {
    if (!this._musicRunning) return;
    const ctx = this._getCtx();
    const t = ctx.currentTime;
    const bpm = 120;
    const beat = 60 / bpm;

    // Simple upbeat melody — C major pentatonic
    const melody = [
      [523,1],[659,0.5],[784,0.5],[659,1],[523,0.5],[392,1.5],
      [523,1],[659,0.5],[784,0.5],[880,1],[784,0.5],[659,1.5],
      [784,1],[659,0.5],[523,0.5],[659,1],[523,0.5],[392,1.5],
      [523,0.5],[392,0.5],[330,0.5],[392,0.5],[523,2]
    ];

    // Bass line
    const bass = [131,0,131,0, 165,0,165,0, 147,0,147,0, 131,0,196,0];

    let elapsed = 0;
    melody.forEach(([freq, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(this._musicGain);
      osc.type = 'square';
      osc.frequency.value = freq;
      const st = t + elapsed * beat;
      const len = dur * beat * 0.85;
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.12, st + 0.02);
      gain.gain.setValueAtTime(0.12, st + len - 0.02);
      gain.gain.linearRampToValueAtTime(0, st + len);
      osc.start(st); osc.stop(st + len);
      this._musicOscillators.push(osc);
      elapsed += dur;
    });

    // Schedule next loop
    const totalBeats = melody.reduce((s, [,d]) => s + d, 0);
    const loopDuration = totalBeats * beat * 1000;
    this._loopTimer = setTimeout(() => this._playMusicLoop(), loopDuration - 100);
  }
}
