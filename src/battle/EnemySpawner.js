import { PixelArt } from '../utils/PixelArt.js';

export class EnemySpawner {
    static getEnemyStats(type, stage) {
        const baseHp = 30 + stage * 8;
        const baseDmg = 5 + Math.floor(stage * 0.8);
        const baseSpd = 40 + Math.floor(stage * 1.5);

        switch (type) {
            case 'normal':
                return { hp: baseHp, dmg: baseDmg, spd: baseSpd + 20, exp: 10 + stage, size: 12 };
            case 'fast':
                return { hp: Math.floor(baseHp * 0.6), dmg: Math.floor(baseDmg * 0.7), spd: baseSpd + 50, exp: 12 + stage, size: 10 };
            case 'tank':
                return { hp: baseHp * 3, dmg: baseDmg * 2, spd: baseSpd - 15, exp: 20 + stage * 2, size: 16 };
            case 'ranged':
                return { hp: Math.floor(baseHp * 0.8), dmg: Math.floor(baseDmg * 1.2), spd: baseSpd + 10, exp: 15 + stage, size: 12 };
            case 'boss':
                const mult = 1 + Math.floor((stage - 1) / 5) * 0.5;
                return { hp: Math.floor(baseHp * 10 * mult), dmg: Math.floor(baseDmg * 3 * mult), spd: baseSpd - 10, exp: 100 + stage * 20, size: 28 };
            default:
                return { hp: baseHp, dmg: baseDmg, spd: baseSpd, exp: 10, size: 12 };
        }
    }

    static getWaves(stage) {
        const rng = PixelArt.mulberry32(stage * 4099);
        const isBossStage = stage % 5 === 0;
        const waves = [];

        const waveCount = isBossStage ? 2 : 2 + Math.floor(stage / 4);
        for (let w = 0; w < (isBossStage ? waveCount - 1 : waveCount); w++) {
            const enemies = [];
            const total = 3 + Math.floor(rng() * 3) + Math.floor(stage / 3);

            // Mix of normal and other types
            let remaining = total;
            const add = (type, count) => {
                const actual = Math.min(count, remaining);
                if (actual > 0) enemies.push({ type, count: actual });
                remaining -= actual;
            };

            add('normal', Math.floor(total * 0.5));
            if (stage > 2) add('fast', Math.floor(total * 0.2));
            if (stage > 4) add('tank', Math.floor(total * 0.15));
            if (stage > 6) add('ranged', Math.floor(total * 0.15));

            if (remaining > 0) add('normal', remaining);
            waves.push({ enemies, isBoss: false });
        }

        if (isBossStage) {
            waves.push({ enemies: [{ type: 'boss', count: 1 }], isBoss: true });
        }

        return waves;
    }
}
