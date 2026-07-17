import { SaveManager } from '../utils/SaveManager.js';

export class CurrencySystem {
    constructor(save) {
        this.save = save || new SaveManager();
        this.coins = this.save.get('coins', 0);
        this.listeners = [];
    }

    get() { return this.coins; }

    canAfford(amount) { return this.coins >= amount; }

    spend(amount) {
        if (!this.canAfford(amount)) return false;
        this.coins -= amount;
        this.save.set('coins', this.coins);
        this._notify();
        return true;
    }

    add(amount) {
        this.coins += amount;
        this.save.set('coins', this.coins);
        this.save.set('stats', {
            ...this.save.get('stats', {}),
            totalCoinsEarned: (this.save.get('stats', {}).totalCoinsEarned || 0) + amount,
        });
        this._notify();
    }

    onChange(fn) { this.listeners.push(fn); }

    _notify() { this.listeners.forEach(fn => fn(this.coins)); }
}
