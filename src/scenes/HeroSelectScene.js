import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager.js';
import { SFX } from '../utils/SFX.js';
import { RaritySystem } from '../systems/RaritySystem.js';
import { CardGenerator } from '../systems/CardGenerator.js';
import { PixelArt } from '../utils/PixelArt.js';

export class HeroSelectScene extends Phaser.Scene {
    constructor() { super('HeroSelectScene'); }

    create() {
        const W = 390, H = window.GAME_H || 844;
        this.W = W; this.H = H;
        this.save = new SaveManager();
        this.collection = this.save.getCollection();
        this.filter = this.registry.get('heroFilter') || 'ALL';
        this.page = this.registry.get('heroPage') || 0;
        this.perPage = 6;

        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a16); bg.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += 12) {
            const offset = (Math.floor(y / 12) % 2) * 12;
            for (let x = offset; x < W; x += 24) {
                bg.fillStyle(0x111120, 0.4); bg.fillRect(x, y, 22, 10);
            }
        }
        bg.fillStyle(0x0a0a16, 0.5); bg.fillRect(0, 0, W, H);
        bg.fillStyle(0xffaa44, 0.03); bg.fillCircle(30, 100, 40);
        bg.fillStyle(0xffaa44, 0.03); bg.fillCircle(W - 30, 100, 40);

        const stage = this.registry.get('battleStage') || 1;
        this.add.text(W / 2, 35, '选择英雄出战', {
            fontSize: '22px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add.text(W / 2, 58, `即将进入第 ${stage} 关`, {
            fontSize: '11px', fontFamily: 'monospace', color: '#888899',
        }).setOrigin(0.5);

        if (this.collection.length === 0) {
            this.add.text(W / 2, 400, '还没有英雄！\n先去开卡包吧', {
                fontSize: '16px', fontFamily: 'monospace', color: '#555', align: 'center',
            }).setOrigin(0.5);
            this._navBtn(W / 2, 500, '返回', 0x334455, 80, () => this.scene.start('MainScene'));
            return;
        }

        this._drawFilters();
        this._drawCards();
        this._drawFooter();
    }

    _drawFilters() {
        const W = this.W;
        const filters = ['ALL', 'C', 'R', 'SR', 'SSR', 'UR'];
        const y = 84;
        const spacing = 58;
        const sx = (W - filters.length * spacing) / 2 + spacing / 2;

        filters.forEach((f, i) => {
            const bx = sx + i * spacing;
            const active = this.filter === f;
            const isR = f !== 'ALL';
            const color = isR ? RaritySystem.get(f).color : 0x888888;

            const g = this.add.graphics();
            if (active) {
                g.fillStyle(color, 0.35); g.fillRoundedRect(bx - 24, y - 13, 48, 28, 4);
                g.lineStyle(1.5, color, 0.7); g.strokeRoundedRect(bx - 24, y - 13, 48, 28, 4);
            } else {
                g.fillStyle(0x222244, 0.4); g.fillRoundedRect(bx - 24, y - 13, 48, 28, 4);
            }

            const cs = active ? '#fff' : (isR ? '#' + color.toString(16).padStart(6, '0') : '#888');
            const filtered = f === 'ALL' ? this.collection : this.collection.filter(c => c.rarity === f);

            this.add.text(bx, y - 2, f, { fontSize: '10px', fontFamily: 'monospace', color: cs, fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(bx, y + 9, `${filtered.length}`, { fontSize: '7px', fontFamily: 'monospace', color: active ? '#ccc' : '#556' }).setOrigin(0.5);
            this.add.zone(bx, y, 48, 28).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                this.registry.set('heroFilter', f); this.registry.set('heroPage', 0); this.scene.restart();
            });
        });
    }

    _getFiltered() {
        return this.filter === 'ALL' ? this.collection : this.collection.filter(c => c.rarity === this.filter);
    }

    _drawCards() {
        const W = this.W;
        const filtered = this._getFiltered();
        const start = this.page * this.perPage;
        const cards = filtered.slice(start, start + this.perPage);

        if (cards.length === 0) {
            this.add.text(W / 2, 380, '该分类暂无英雄', {
                fontSize: '14px', fontFamily: 'monospace', color: '#444466',
            }).setOrigin(0.5);
            return;
        }

        const cols = 3, colW = 120, rowH = 210;
        const sx = W / 2 - colW, sy = 190;

        cards.forEach((card, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = sx + col * colW, cy = sy + row * rowH;
            CardGenerator.renderCard(this, card, cx, cy, 0.85);

            this.add.text(cx, cy + 68, card.name, {
                fontSize: '9px', fontFamily: 'monospace', color: '#aaa',
            }).setOrigin(0.5);

            const rd = RaritySystem.get(card.rarity);
            const rc = '#' + rd.color.toString(16).padStart(6, '0');
            this.add.text(cx, cy + 80, card.skillName, {
                fontSize: '8px', fontFamily: 'monospace', color: rc,
            }).setOrigin(0.5);

            this.add.zone(cx, cy, 105, 160).setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this._showDetail(card));
        });
    }

    _showDetail(card) {
        const W = this.W, H = this.H;
        const ov = this.add.graphics();
        ov.fillStyle(0x000000, 0.9); ov.fillRect(0, 0, W, H);
        ov.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        const grp = this.add.container(0, 0).setDepth(50);
        grp.add(ov);

        grp.add(CardGenerator.renderCard(this, card, W / 2, 200, 2.0));

        const rd = RaritySystem.get(card.rarity);
        const rc = '#' + rd.color.toString(16).padStart(6, '0');
        const skill = PixelArt.SKILLS[card.creatureType][card.rarity];
        const base = PixelArt.HERO_STATS;
        let py = 370;

        grp.add(this.add.text(W / 2, py, card.name, {
            fontSize: '20px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5));

        const stars = { C: 1, R: 2, SR: 3, SSR: 4, UR: 5 }[card.rarity];
        grp.add(this.add.text(W / 2, py + 24, `[${card.rarity}] ${rd.name}  ${'\u2605'.repeat(stars)}`, {
            fontSize: '12px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, py + 48, `"${card.lore}"`, {
            fontSize: '9px', fontFamily: 'monospace', color: '#8899aa', fontStyle: 'italic',
            wordWrap: { width: 320 }, align: 'center',
        }).setOrigin(0.5));

        const panelY = py + 75;
        const panel = this.add.graphics();
        panel.fillStyle(0x151528, 0.9); panel.fillRoundedRect(25, panelY, W - 50, 60, 6);
        panel.lineStyle(1, 0x333355); panel.strokeRoundedRect(25, panelY, W - 50, 60, 6);
        grp.add(panel);

        grp.add(this.add.text(W / 2, panelY + 10, '基础属性', {
            fontSize: '9px', fontFamily: 'monospace', color: '#666688',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, panelY + 28, `HP:${base.hp}  ATK:${base.atk}  SPD:${base.spd}  攻速:${base.atkSpd}/s`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#aaaacc',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, panelY + 44, `技能CD:${base.skillCD}s  技能伤害:${base.skillDmg}`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#aaaacc',
        }).setOrigin(0.5));

        const skillY = panelY + 72;
        const skillPanel = this.add.graphics();
        skillPanel.fillStyle(0x1a1a30, 0.9); skillPanel.fillRoundedRect(25, skillY, W - 50, 75, 6);
        skillPanel.lineStyle(1.5, rd.color, 0.4); skillPanel.strokeRoundedRect(25, skillY, W - 50, 75, 6);
        grp.add(skillPanel);

        grp.add(this.add.text(40, skillY + 10, `技能: ${card.skillName}`, {
            fontSize: '12px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
        }));

        const typeNames = {
            melee_arc: '近战扇形', blink_bomb: '闪现爆炸', aoe_ring: '范围震地',
            summon: '召唤分身', screen_dive: '全屏俯冲', cone_fire: '锥形吐息',
            heal_shield: '治疗护盾', stealth: '隐身增伤',
        };
        grp.add(this.add.text(40, skillY + 28, `类型: ${typeNames[skill.type]}`, {
            fontSize: '9px', fontFamily: 'monospace', color: '#888899',
        }));

        const details = [];
        if (skill.range) details.push(`范围:${skill.range}`);
        if (skill.angle) details.push(`角度:${skill.angle}\u00b0`);
        if (skill.hits) details.push(`命中:${skill.hits}次`);
        if (skill.effect) {
            const effectNames = { bleed: '流血', slow: '减速', stun: '眩晕', burn: '燃烧' };
            details.push(`效果:${effectNames[skill.effect]}`);
        }
        if (skill.duration) details.push(`持续:${skill.duration}s`);
        if (skill.healPct) details.push(`回复:${Math.floor(skill.healPct * 100)}%HP`);
        if (skill.invincible) details.push(`无敌:${skill.invincible}s`);
        if (skill.dmgMult) details.push(`增伤:\u00d7${skill.dmgMult}`);

        grp.add(this.add.text(40, skillY + 44, details.join('  '), {
            fontSize: '9px', fontFamily: 'monospace', color: '#aaaaaa', wordWrap: { width: 300 },
        }));

        grp.add(this.add.text(40, skillY + 60, card.skillDesc, {
            fontSize: '8px', fontFamily: 'monospace', color: '#777799', wordWrap: { width: 300 },
        }));

        this._detailBtn(grp, W / 2, skillY + 100, '确认出战', 0xaa3333, () => {
            this.registry.set('battleCard', card);
            this.scene.start('BattleScene');
        });

        this._detailBtn(grp, W / 2, skillY + 145, '返回选择', 0x334455, () => grp.destroy());
    }

    _drawFooter() {
        const W = this.W, H = this.H;
        const filtered = this._getFiltered();
        const total = Math.max(1, Math.ceil(filtered.length / this.perPage));

        this._navBtn(60, H - 40, '返回', 0x334455, 60, () => this.scene.start('MainScene'));

        this.add.text(W / 2, H - 40, `${this.page + 1}/${total}`, {
            fontSize: '13px', fontFamily: 'monospace', color: '#888',
        }).setOrigin(0.5);

        if (this.page > 0) this._navBtn(W / 2 - 50, H - 40, '<', 0x335577, 30, () => {
            this.registry.set('heroPage', this.page - 1); this.registry.set('heroFilter', this.filter); this.scene.restart();
        });
        if ((this.page + 1) * this.perPage < filtered.length) this._navBtn(W / 2 + 50, H - 40, '>', 0x335577, 30, () => {
            this.registry.set('heroPage', this.page + 1); this.registry.set('heroFilter', this.filter); this.scene.restart();
        });
    }

    _detailBtn(parent, x, y, text, color, cb) {
        const w = 240, h = 38;
        const g = this.add.graphics();
        g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        g.lineStyle(1.5, 0xffffff, 0.15); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        parent.add(g);
        parent.add(this.add.text(x, y, text, { fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
        const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { SFX.play('button'); cb(); }); parent.add(z);
    }

    _navBtn(x, y, text, color, w, cb) {
        const h = 28;
        this.add.graphics().fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 5);
        this.add.text(x, y, text, { fontSize: '11px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', () => { SFX.play('button'); cb(); });
    }
}
