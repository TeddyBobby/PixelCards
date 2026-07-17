export class SaveManager {
    static KEY = 'pixelcards_save';

    constructor() {
        this.data = this._load();
        if (!this.data.collection) this.data.collection = [];
        if (!this.data.coins) this.data.coins = 0;
        if (!this.data.currentStage) this.data.currentStage = 1;
        if (!this.data.bestStage) this.data.bestStage = 0;
        if (!this.data.freePacks) this.data.freePacks = 0;
        if (!this.data.stats) this.data.stats = { totalPulls: 0, totalKills: 0, totalCoinsEarned: 0 };
    }

    _load() {
        try {
            const raw = localStorage.getItem(SaveManager.KEY);
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    }

    _save() {
        localStorage.setItem(SaveManager.KEY, JSON.stringify(this.data));
    }

    get(key, fallback) {
        return this.data[key] !== undefined ? this.data[key] : fallback;
    }

    set(key, value) {
        this.data[key] = value;
        this._save();
    }

    getCollection() { return this.data.collection; }

    addCard(card) {
        this.data.collection.push(card);
        this.data.stats.totalPulls = (this.data.stats.totalPulls || 0) + 1;
        this._save();
    }

    removeCard(index) {
        this.data.collection.splice(index, 1);
        this._save();
    }

    getStats() {
        const coll = this.data.collection;
        const byRarity = {};
        coll.forEach(c => { byRarity[c.rarity] = (byRarity[c.rarity] || 0) + 1; });
        return { total: coll.length, totalPulls: this.data.stats.totalPulls || 0, byRarity };
    }
}
