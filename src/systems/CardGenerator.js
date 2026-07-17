import { PixelArt } from '../utils/PixelArt.js';
import { RaritySystem } from './RaritySystem.js';

export class CardGenerator {
    static PACK_COST = 10;
    static CARDS_PER_PACK = 3;
    static PACK_COST_10 = 90;
    static CARDS_PER_PACK_10 = 10;

    static generate(seed, rarity) {
        const rng = PixelArt.mulberry32(seed);
        const types = Object.keys(PixelArt.TEMPLATES);
        const creatureType = PixelArt.pick(rng, types);
        const palette = PixelArt.pick(rng, PixelArt.COLOR_PALETTES[rarity]);
        const expression = PixelArt.pick(rng, PixelArt.EXPRESSIONS);
        const accessories = PixelArt.getAccessoriesForRarity(rarity);
        const accessory = PixelArt.pick(rng, accessories);
        const lore = PixelArt.pick(rng, PixelArt.LORE[creatureType]);
        const skill = PixelArt.SKILLS[creatureType][rarity];

        return {
            seed, rarity, creatureType, expression, accessory,
            bodyColor: palette[0], darkColor: palette[1], shadowColor: palette[2],
            name: this._generateName(rng, creatureType, rarity),
            typeName: PixelArt.CREATURES[creatureType],
            accessoryName: PixelArt.ACCESSORIES[accessory].name,
            lore,
            skillName: skill.name,
            skillDesc: skill.desc,
        };
    }

    static _generateName(rng, type, rarity) {
        const prefixes = {
            C: ['小', '呆', '萌', '乖'], R: ['蓝', '粉', '翠', '闪'],
            SR: ['星', '月', '雷', '风', '霜'], SSR: ['圣', '暗', '炎', '冰', '岚'],
            UR: ['神', '龙', '凰', '天', '虹'],
        };
        const suffixes = {
            cat: '喵', rabbit: '兔', bear: '熊', dog: '汪',
            bird: '鸟', dragon: '龙', unicorn: '马', ghost: '灵',
        };
        return PixelArt.pick(rng, prefixes[rarity]) + suffixes[type];
    }

    static openPack(currency, isTenPull = false) {
        const cost = isTenPull ? this.PACK_COST_10 : this.PACK_COST;
        const count = isTenPull ? this.CARDS_PER_PACK_10 : this.CARDS_PER_PACK;
        if (!currency.spend(cost)) return null;
        const cards = [];
        for (let i = 0; i < count; i++) {
            const rarity = RaritySystem.roll(isTenPull);
            const seed = Date.now() * 1000 + Math.floor(Math.random() * 1000) + i;
            cards.push(this.generate(seed, rarity));
        }
        return cards;
    }

    static getCardSize(scale) {
        return { w: 100 * scale, h: 145 * scale };
    }

    static renderCard(scene, card, x, y, scale = 1) {
        const { w: cw, h: ch } = this.getCardSize(scale);
        const container = scene.add.container(x, y);
        const rd = RaritySystem.get(card.rarity);
        const bc = RaritySystem.getBorderColors(card.rarity);
        const tpl = PixelArt.TEMPLATES[card.creatureType];

        const pByW = Math.floor((cw * 0.6) / 16);
        const pByH = Math.floor((ch * 0.55) / tpl.length);
        const P = Math.min(pByW, pByH);

        this._drawBg(scene, container, card.rarity, cw, ch, bc, scale);

        const pad = 6 * scale;
        const gap1 = 3 * scale;
        const bannerH = 16 * scale;
        const gap2 = 2 * scale;
        const rarityH = 10 * scale;
        const nameH = 12 * scale;

        const bottomH = bannerH + gap2 + rarityH + gap2 + nameH + pad;
        const creatureAreaH = ch - pad - gap1 - bottomH;
        const creatureAreaTop = -ch / 2 + pad;
        const creatureCenterY = creatureAreaTop + creatureAreaH / 2;
        this._drawCreature(scene, container, card, tpl, P, creatureCenterY);
        this._drawAccessory(scene, container, card, P, creatureCenterY, tpl.length);

        const bannerY = creatureAreaTop + creatureAreaH + gap1;
        this._drawBanner(scene, container, card, rd, cw, bannerY, bc, scale);

        const nameY = ch / 2 - pad - nameH / 2;
        container.add(scene.add.text(0, nameY, card.name, {
            fontSize: `$\u007b${11 * scale}\u007dpx`, fontFamily: 'monospace', color: '#dddddd', fontStyle: 'bold',
        }).setOrigin(0.5));

        return container;
    }

    static _drawBg(scene, c, rarity, cw, ch, bc, scale) {
        const g = scene.add.graphics();

        if (rarity === 'SSR' || rarity === 'UR') {
            const gc = rarity === 'UR' ? 0xff4488 : 0xffaa00;
            g.fillStyle(gc, 0.12);
            g.fillRoundedRect(-cw / 2 - 4, -ch / 2 - 4, cw + 8, ch + 8, 8);
        }

        const bgc = { C: 0x1c1c30, R: 0x161630, SR: 0x1e1435, SSR: 0x241c14, UR: 0x24101c }[rarity];
        g.fillStyle(bgc);
        g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 6);

        const bw = { C: 1.5, R: 2, SR: 2.5, SSR: 3, UR: 3.5 }[rarity];
        g.lineStyle(bw, bc[0]);
        g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 6);

        if (['SR', 'SSR', 'UR'].includes(rarity)) {
            g.lineStyle(0.8, bc[1] || bc[0], 0.3);
            g.strokeRoundedRect(-cw / 2 + 3, -ch / 2 + 3, cw - 6, ch - 6, 4);
        }
        c.add(g);
    }

    static _drawCreature(scene, c, card, tpl, P, cy) {
        const g = scene.add.graphics();
        const rows = tpl.length;
        const ox = -(16 * P) / 2;
        const oy = cy - (rows * P) / 2;

        for (let r = 0; r < rows; r++) {
            for (let col = 0; col < 16; col++) {
                const cell = tpl[r][col];
                if (!cell) continue;
                let color;
                if (cell === 2) color = 0x111122;
                else if (cell === 3) color = 0xff6688;
                else if (cell === 4) color = card.darkColor;
                else if (cell === 5) color = 0xff9999;
                else color = r > rows * 0.7 ? card.shadowColor : r > rows * 0.4 ? card.darkColor : card.bodyColor;

                g.fillStyle(color);
                g.fillRect(ox + col * P, oy + r * P, P, P);
            }
        }
        for (let r = 0; r < rows; r++)
            for (let col = 0; col < 16; col++)
                if (tpl[r][col] === 2) {
                    g.fillStyle(0xffffff);
                    g.fillRect(ox + col * P + Math.floor(P * 0.15), oy + r * P + Math.floor(P * 0.1),
                        Math.max(1, Math.floor(P * 0.4)), Math.max(1, Math.floor(P * 0.4)));
                }
        c.add(g);
    }

    static _drawAccessory(scene, c, card, P, cy, rows) {
        const acc = card.accessory;
        if (acc === 'none') return;
        const g = scene.add.graphics();
        const ty = cy - (rows * P) / 2;

        switch (acc) {
            case 'hat':
                g.fillStyle(0xff4444);
                g.fillRect(-P * 3, ty - P * 1.5, P * 6, P * 1.5);
                g.fillRect(-P * 1.5, ty - P * 3, P * 3, P * 1.5);
                g.fillStyle(0xffffff); g.fillRect(-P * 3, ty - P * 0.5, P * 6, P * 0.5);
                break;
            case 'bow':
                g.fillStyle(0xff88cc);
                g.fillRect(-P * 3, ty - P, P * 2, P * 1.5);
                g.fillRect(P, ty - P, P * 2, P * 1.5);
                g.fillStyle(0xff66aa); g.fillRect(-P * 0.5, ty - P * 0.5, P, P);
                break;
            case 'glasses':
                g.fillStyle(0x222222);
                g.fillRect(-P * 4, ty + P * 4.5, P * 3, P * 1.5);
                g.fillRect(P, ty + P * 4.5, P * 3, P * 1.5);
                g.fillRect(-P, ty + P * 5, P * 2, P * 0.5);
                break;
            case 'crown':
                g.fillStyle(0xffdd00);
                g.fillRect(-P * 3, ty - P, P * 6, P * 1.5);
                g.fillRect(-P * 3, ty - P * 2.5, P * 1.5, P * 1.5);
                g.fillRect(-P * 0.75, ty - P * 2.5, P * 1.5, P * 1.5);
                g.fillRect(P * 1.5, ty - P * 2.5, P * 1.5, P * 1.5);
                g.fillStyle(0xff0000); g.fillRect(-P * 0.25, ty - P * 1.5, P * 0.5, P * 0.5);
                break;
            case 'scarf':
                g.fillStyle(0x44aaff);
                g.fillRect(-P * 4, ty + P * 10, P * 8, P * 1.5);
                g.fillRect(P * 3, ty + P * 11.5, P * 1.5, P * 3);
                g.fillStyle(0x2288dd); g.fillRect(-P * 4, ty + P * 10.5, P * 8, P * 0.5);
                break;
            case 'wings':
                g.fillStyle(0xffffff, 0.7);
                g.fillRect(-P * 9, ty + P * 7, P * 2, P * 3);
                g.fillRect(-P * 10, ty + P * 6, P * 2, P * 2);
                g.fillRect(P * 7, ty + P * 7, P * 2, P * 3);
                g.fillRect(P * 8, ty + P * 6, P * 2, P * 2);
                break;
            case 'halo':
                g.fillStyle(0xffff44, 0.9);
                g.fillRect(-P * 3, ty - P * 2, P * 6, P);
                g.fillRect(-P * 4, ty - P * 1.5, P, P);
                g.fillRect(P * 3, ty - P * 1.5, P, P);
                break;
            case 'flame':
                const fc = [0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0xffcc00];
                for (let i = 0; i < 7; i++) {
                    g.fillStyle(fc[i % 5], 0.8);
                    g.fillRect(-P * 3 + i * P, ty - P * (1.5 + (i % 2) * 1.5), P * 0.8, P * (1.5 + (i % 2) * 1.5));
                }
                break;
            case 'rainbow':
                [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff].forEach((col, i) => {
                    g.fillStyle(col, 0.7);
                    g.fillRect(-P * 4 + i * P * 1.3, ty - P * 4 + Math.abs(i - 2.5) * P * 0.8, P * 1.2, P * 1.2);
                });
                break;
        }
        c.add(g);
    }

    static _drawBanner(scene, c, card, rd, cw, by, bc, scale) {
        const bh = 18 * scale;
        const g = scene.add.graphics();
        const bgc = { C: 0x3a3a4a, R: 0x2244aa, SR: 0x6622aa, SSR: 0xaa7700, UR: 0xaa2255 }[card.rarity];
        g.fillStyle(bgc, 0.85);
        g.fillRoundedRect(-cw / 2 + 4, by, cw - 8, bh, 3);
        c.add(g);

        const stars = { C: 1, R: 2, SR: 3, SSR: 4, UR: 5 }[card.rarity];
        const sc = '#' + bc[0].toString(16).padStart(6, '0');
        c.add(scene.add.text(0, by + bh / 2, '\u2605'.repeat(stars), {
            fontSize: `$\u007b${9 * scale}\u007dpx`, fontFamily: 'monospace', color: sc,
        }).setOrigin(0.5));

        c.add(scene.add.text(0, by + bh + 3 * scale, `$\u007b${card.rarity}\u007d \u00b7 $\u007b${rd.name}\u007d`, {
            fontSize: `$\u007b${7 * scale}\u007dpx`, fontFamily: 'monospace', color: sc, fontStyle: 'bold',
        }).setOrigin(0.5));
    }
}
