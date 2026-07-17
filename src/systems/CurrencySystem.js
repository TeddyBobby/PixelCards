import { SaveManager } from '../utils/SaveManager.js';

export class CurrencySystem {
    constructor(save) {
        this.save = save || new SaveManager();
        this.coins = this.save.get('coins', 0);
        // First-time player: give starter coins for one free pull
        if (this.coins === 0 && this.save.getCollection().length === 0 && !this.save.get('_gotStarterCoins')) {
            this.coins = 10;
            this.save.set('coins', 10);
            this.save.set('_gotStarterCoins', true);
        }
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
