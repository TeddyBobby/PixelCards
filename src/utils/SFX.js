export class SFX {
    static _ctx = null;

    static _getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    static _tone(freq, duration, type = 'square', volume = 0.08) {
        const ctx = this._getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    }

    static play(name) {
        switch (name) {
            case 'button':
                this._tone(880, 0.06, 'square', 0.05);
                break;
            case 'pack_open':
                this._tone(440, 0.08, 'square', 0.06);
                setTimeout(() => this._tone(660, 0.1, 'square', 0.06), 80);
                setTimeout(() => this._tone(880, 0.12, 'square', 0.06), 160);
                break;
            case 'card_flip':
                this._tone(1200, 0.05, 'triangle', 0.04);
                break;
            case 'rare_pull':
                this._tone(660, 0.08, 'square', 0.06);
                setTimeout(() => this._tone(880, 0.1, 'square', 0.06), 80);
                setTimeout(() => this._tone(1100, 0.1, 'square', 0.06), 160);
                setTimeout(() => this._tone(1320, 0.15, 'square', 0.06), 240);
                break;
            case 'shoot':
                this._tone(200, 0.05, 'square', 0.03);
                break;
            case 'kill':
                this._tone(600, 0.04, 'square', 0.05);
                setTimeout(() => this._tone(400, 0.06, 'square', 0.04), 40);
                break;
            case 'explosion':
                this._tone(80, 0.2, 'sawtooth', 0.08);
                break;
            case 'skill':
                this._tone(300, 0.1, 'sawtooth', 0.06);
                setTimeout(() => this._tone(600, 0.15, 'sawtooth', 0.05), 100);
                break;
            case 'damage':
                this._tone(150, 0.1, 'sawtooth', 0.07);
                break;
            case 'levelup':
                this._tone(440, 0.06, 'square', 0.06);
                setTimeout(() => this._tone(554, 0.06, 'square', 0.06), 60);
                setTimeout(() => this._tone(660, 0.06, 'square', 0.06), 120);
                setTimeout(() => this._tone(880, 0.12, 'square', 0.06), 180);
                break;
        }
    }
}
