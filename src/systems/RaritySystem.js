export class RaritySystem {
    static RARITIES = {
        C:   { name: 'Common',      prob: 0.50, color: 0x888888, label: 'C',   decompValue: 1   },
        R:   { name: 'Rare',        prob: 0.30, color: 0x4488ff, label: 'R',   decompValue: 3   },
        SR:  { name: 'Super Rare',  prob: 0.14, color: 0xaa44ff, label: 'SR',  decompValue: 10  },
        SSR: { name: 'Ultra Rare',  prob: 0.05, color: 0xffaa00, label: 'SSR', decompValue: 30  },
        UR:  { name: 'Legendary',   prob: 0.01, color: 0xff4488, label: 'UR',  decompValue: 100 },
    };

    static roll(boosted = false) {
        const r = Math.random();
        let cumulative = 0;
        const probs = {};
        for (const [key, rarity] of Object.entries(this.RARITIES)) {
            if (boosted && ['SR', 'SSR', 'UR'].includes(key)) {
                probs[key] = rarity.prob * 2;
            } else {
                probs[key] = rarity.prob;
            }
        }
        if (boosted) {
            const total = Object.values(probs).reduce((s, v) => s + v, 0);
            for (const k of Object.keys(probs)) probs[k] /= total;
        }
        for (const [key, prob] of Object.entries(probs)) {
            cumulative += prob;
            if (r < cumulative) return key;
        }
        return 'C';
    }

    static get(key) { return this.RARITIES[key]; }

    static getBorderColors(key) {
        const colors = {
            C:   [0x888888],
            R:   [0x4488ff, 0x66aaff],
            SR:  [0xaa44ff, 0xcc66ff],
            SSR: [0xffaa00, 0xffcc44],
            UR:  [0xff4488, 0xffaa00, 0x44ff88, 0x4488ff],
        };
        return colors[key] || colors.C;
    }
}
