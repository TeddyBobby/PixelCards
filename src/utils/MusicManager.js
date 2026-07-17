export class MusicManager {
    static _muted = false;
    static _playing = false;
    static _ctx = null;
    static _interval = null;

    static _getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    static isMuted() { return this._muted; }

    static toggle() {
        this._muted = !this._muted;
        if (this._muted) {
            this.stop();
        } else {
            this._playing = false;
        }
        return !this._muted;
    }

    static _playNote(freq, duration, volume = 0.02) {
        if (this._muted) return;
        const ctx = this._getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    static _getMenuMelody() {
        // Simple 8-bar melody
        const C4 = 262, D4 = 294, E4 = 330, F4 = 349, G4 = 392, A4 = 440, B4 = 494;
        return [
            [E4, 0.3], [G4, 0.3], [A4, 0.3], [G4, 0.3],
            [E4, 0.3], [D4, 0.3], [C4, 0.4], [D4, 0.2],
            [E4, 0.3], [C4, 0.3], [D4, 0.3], [E4, 0.3],
            [G4, 0.3], [E4, 0.3], [D4, 0.4], [C4, 0.6],
        ];
    }

    static _getBattleMelody() {
        const C4 = 262, D4 = 294, Eb4 = 311, F4 = 349, G4 = 392, Ab4 = 415;
        return [
            [C4, 0.2], [Eb4, 0.2], [G4, 0.2], [F4, 0.2],
            [Eb4, 0.2], [C4, 0.2], [D4, 0.3], [Eb4, 0.1],
            [C4, 0.2], [Eb4, 0.2], [G4, 0.2], [Ab4, 0.2],
            [G4, 0.2], [F4, 0.2], [Eb4, 0.4], [C4, 0.3],
        ];
    }

    static _playMelody(melody) {
        if (this._muted) return;
        let time = 0;
        melody.forEach(([freq, dur]) => {
            setTimeout(() => this._playNote(freq, dur * 0.8), time * 1000);
            time += dur;
        });
        return time * 1000;
    }

    static playMenuMusic() {
        if (this._muted || this._playing) return;
        this._playing = true;
        const loop = () => {
            if (!this._playing || this._muted) return;
            const duration = this._playMelody(this._getMenuMelody());
            this._interval = setTimeout(loop, duration + 2000);
        };
        loop();
    }

    static playBattleMusic() {
        this.stop();
        if (this._muted) return;
        this._playing = true;
        const loop = () => {
            if (!this._playing || this._muted) return;
            const duration = this._playMelody(this._getBattleMelody());
            this._interval = setTimeout(loop, duration + 1000);
        };
        loop();
    }

    static stop() {
        this._playing = false;
        if (this._interval) { clearTimeout(this._interval); this._interval = null; }
    }
}
