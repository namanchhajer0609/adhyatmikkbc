// Web Audio API Sound Synthesizer for Adhyatmik KBC
// Synthesizes studio sound effects directly without relying on external MP3 assets

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public play(type: string) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      switch (type) {
        case 'question-appear':
          this.playQuestionAppear();
          break;
        case 'option-select':
          this.playOptionSelect();
          break;
        case 'lock-answer':
          this.playLockAnswer();
          break;
        case 'correct':
          this.playCorrect();
          break;
        case 'wrong':
          this.playWrong();
          break;
        case 'crorepati':
          this.playCroreCelebration();
          break;
        case 'lifeline':
        case 'poll-start':
          this.playLifeline();
          break;
        case 'poll-end':
          this.playPollEnd();
          break;
        case 'timer':
          this.playTick();
          break;
        case 'winner':
        case 'fff-winner':
          this.playWinnerFanfare();
          break;
        case 'maharaj-cue':
          this.playSpiritualGong();
          break;
        case 'intro':
          this.playIntro();
          break;
        default:
          this.playTone(440, 'sine', 0.2);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, gainVal: number = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playQuestionAppear() {
    if (!this.ctx) return;
    const notes = [220, 277, 330, 440, 554];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.6, 0.15);
      }, idx * 90);
    });
  }

  private playOptionSelect() {
    this.playTone(600, 'sine', 0.12, 0.2);
  }

  private playLockAnswer() {
    if (!this.ctx) return;
    // Dramatic low suspense strike
    this.playTone(130, 'sawtooth', 0.8, 0.25);
    setTimeout(() => {
      this.playTone(98, 'sine', 1.2, 0.3);
    }, 150);
  }

  private playCorrect() {
    if (!this.ctx) return;
    const chords = [392, 493.88, 587.33, 783.99, 987.77];
    chords.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.8, 0.22);
      }, idx * 100);
    });
  }

  private playWrong() {
    if (!this.ctx) return;
    this.playTone(164.81, 'sawtooth', 0.6, 0.25);
    setTimeout(() => {
      this.playTone(138.59, 'sawtooth', 0.8, 0.3);
    }, 200);
  }

  private playLifeline() {
    if (!this.ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.4, 0.18), i * 80);
    });
  }

  private playPollEnd() {
    this.playTone(523.25, 'triangle', 0.3, 0.2);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.4, 0.2), 150);
  }

  private playTick() {
    this.playTone(880, 'sine', 0.05, 0.08);
  }

  private playWinnerFanfare() {
    if (!this.ctx) return;
    const fanfare = [392, 523.25, 659.25, 783.99];
    fanfare.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.7, 0.25), i * 140);
    });
  }

  private playSpiritualGong() {
    if (!this.ctx) return;
    // Deep temple bell resonance
    this.playTone(216, 'sine', 2.5, 0.35);
    this.playTone(432, 'triangle', 2.0, 0.2);
  }

  private playIntro() {
    if (!this.ctx) return;
    const arpeggio = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
    arpeggio.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.8, 0.2), idx * 110);
    });
  }

  private playCroreCelebration() {
    if (!this.ctx) return;
    const melody = [523.25, 587.33, 659.25, 783.99, 880, 987.77, 1046.5];
    melody.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 1.0, 0.25), i * 130);
    });
    setTimeout(() => {
      this.playSpiritualGong();
    }, 1000);
  }
}

export const soundEngine = new SoundEngine();
