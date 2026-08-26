// Web Audio API procedural ambient sound generator for Forest App atmosphere
// Zero external files required: Synthesizes gentle rain, birdsong, forest breeze, campfire

class ForestSoundGenerator {
  private ctx: AudioContext | null = null;
  private currentMode: 'off' | 'birds' | 'rain' | 'breeze' | 'fire' = 'off';
  private gainNode: GainNode | null = null;
  private timer: number | null = null;
  private isPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSoundMode(mode: 'off' | 'birds' | 'rain' | 'breeze' | 'fire', volume: number = 0.3) {
    this.stop();
    if (mode === 'off') return;

    this.initContext();
    if (!this.ctx) return;

    this.currentMode = mode;
    this.isPlaying = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);

    if (mode === 'rain') {
      this.startRain(this.gainNode);
    } else if (mode === 'breeze') {
      this.startBreeze(this.gainNode);
    } else if (mode === 'fire') {
      this.startFire(this.gainNode);
    } else if (mode === 'birds') {
      this.startBirdsong(this.gainNode);
    }
  }

  // Pink noise helper for Rain & Breeze
  private createNoiseNode(): AudioNode | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.start(0);
    return noise;
  }

  // 1. Gentle Forest Rain
  private startRain(masterGain: GainNode) {
    if (!this.ctx) return;
    const noise = this.createNoiseNode();
    if (!noise) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(masterGain);
  }

  // 2. Gentle Forest Breeze
  private startBreeze(masterGain: GainNode) {
    if (!this.ctx) return;
    const noise = this.createNoiseNode();
    if (!noise) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Modulate filter for breathing wind effect
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noise.connect(filter);
    filter.connect(masterGain);
  }

  // 3. Campfire Crackle
  private startFire(masterGain: GainNode) {
    if (!this.ctx) return;
    const noise = this.createNoiseNode();
    if (!noise) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(masterGain);

    // Random crackle chirps
    const triggerCrackle = () => {
      if (!this.isPlaying || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const crackleGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000 + Math.random() * 3000, this.ctx.currentTime);
        crackleGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        osc.connect(crackleGain);
        crackleGain.connect(masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      } catch (e) {}

      this.timer = window.setTimeout(triggerCrackle, 100 + Math.random() * 500);
    };

    triggerCrackle();
  }

  // 4. Forest Birdsong (Melodic gentle chimes/chirps)
  private startBirdsong(masterGain: GainNode) {
    if (!this.ctx) return;
    this.startBreeze(masterGain);

    const chirpNotes = [1800, 2200, 2600, 3100, 3500];

    const playBirdChirp = () => {
      if (!this.isPlaying || !this.ctx) return;
      try {
        const startFreq = chirpNotes[Math.floor(Math.random() * chirpNotes.length)];
        const osc = this.ctx.createOscillator();
        const chirpGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.3, this.ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.9, this.ctx.currentTime + 0.16);

        chirpGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        chirpGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.04);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(chirpGain);
        chirpGain.connect(masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
      } catch (e) {}

      this.timer = window.setTimeout(playBirdChirp, 1500 + Math.random() * 3500);
    };

    playBirdChirp();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
      this.ctx = null;
    }
    this.gainNode = null;
    this.currentMode = 'off';
  }

  public getMode() {
    return this.currentMode;
  }
}

export const forestAudio = new ForestSoundGenerator();
