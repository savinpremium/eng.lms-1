
class AudioService {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playSuccess() {
    this.playTone(880, 'sine', 0.2);
    setTimeout(() => this.playTone(1046.5, 'sine', 0.3), 100);
  }

  playError() {
    this.playTone(110, 'sawtooth', 0.5, 0.2);
  }

  playWarning() {
    this.playTone(440, 'triangle', 0.3, 0.15);
    setTimeout(() => this.playTone(440, 'triangle', 0.3, 0.15), 400);
  }

  playCash() {
    this.playTone(1500, 'triangle', 0.1);
    setTimeout(() => this.playTone(1200, 'sine', 0.15), 50);
  }

  speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

export const audioService = new AudioService();
