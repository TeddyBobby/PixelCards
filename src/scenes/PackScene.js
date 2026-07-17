import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';
import { SFX } from '../utils/SFX.js';
import { RaritySystem } from '../systems/RaritySystem.js';
import { CardGenerator } from '../systems/CardGenerator.js';

export class PackScene extends Phaser.Scene {
    constructor() { super('PackScene'); }

    create() {
        const W = 390, H = window.GAME_H || 844;
        this.W = W; this.H = H;
        this.save = new SaveManager();
        this.currency = new CurrencySystem(this.save);

        this._drawBg(W, H);

        const pending = this.registry.get('pendingCards');
        if (pending && pending.length > 0) {
            this.registry.set('pendingCards', null);
            this.cards = pending;
            this._animateReveal();
        } else {
            this._showPackSelect();
        }
    }

    _drawBg(W, H) {
        const bg = this.add.graphics();
        bg.fillStyle(0x080814); bg.fillRect(0, 0, W, H);
        bg.fillStyle(0x0c0c20, 0.5); bg.fillRect(0, H * 0.3, W, H * 0.4);
        for (let i = 0; i < 50; i++) {
            bg.fillStyle(0xffffff, Math.random() * 0.15 + 0.03);
            bg.fillRect(Math.random() * W, Math.random() * H, 1, 1);
        }
    }

    _showPackSelect() {
        const W = this.W, H = this.H;
        const coins = this.currency.get();

        this.add.text(W / 2, 60, '卡包商店', {
            fontSize: '24px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(W / 2, 95, `金币: ${coins}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44',
        }).setOrigin(0.5);

        const canSingle = coins >= CardGenerator.PACK_COST;
        this._packBtn(W / 2, 200, '单抽', `${CardGenerator.PACK_COST} 金币 \u00b7 3张`, canSingle ? 0x3366cc : 0x333344, canSingle, () => {
            this._doPull(false);
        });

        const canTen = coins >= CardGenerator.PACK_COST_10;
        this._packBtn(W / 2, 320, '十连抽', `${CardGenerator.PACK_COST_10} 金币 \u00b7 10张 \u00b7 高罕概率翻倍`, canTen ? 0xaa4488 : 0x333344, canTen, () => {
            this._doPull(true);
        });

        this.add.text(W / 2, 430, '十连抽时 SR/SSR/UR 概率翻倍！', {
            fontSize: '9px', fontFamily: 'monospace', color: '#886688', fontStyle: 'italic',
        }).setOrigin(0.5);

        this._simpleBtn(W / 2, H - 50, '返回', 0x334455, () => this.scene.start('MainScene'));
    }

    _doPull(isTenPull) {
        SFX.play('pack_open');
        const cards = CardGenerator.openPack(this.currency, isTenPull);
        if (!cards) return;
        cards.forEach(c => this.save.addCard(c));
        this.registry.set('pendingCards', cards);
        this.scene.restart();
    }

    _animateReveal() {
        const W = this.W, H = this.H;
        const cards = this.cards;
        const isTen = cards.length > 3;

        this.cameras.main.flash(300, 200, 220, 255);

        const cols = isTen ? 5 : 3;
        const rows = Math.ceil(cards.length / cols);
        const cardScale = isTen ? 0.55 : 0.85;
        const colW = isTen ? 72 : 120;
        const rowH = isTen ? 120 : 180;
        const startX = W / 2 - (cols - 1) * colW / 2;
        const startY = isTen ? 100 : 120;

        cards.forEach((card, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = startX + col * colW;
            const cy = startY + row * rowH;

            this.time.delayedCall(i * 150, () => {
                SFX.play('card_flip');
                if (['SR', 'SSR', 'UR'].includes(card.rarity)) {
                    this.time.delayedCall(100, () => SFX.play('rare_pull'));
                }
                const cc = CardGenerator.renderCard(this, card, cx, cy, cardScale);
                cc.setScale(0, 1);
                this.tweens.add({ targets: cc, scaleX: 1, duration: 200 });
                this._rarityFx(card.rarity, cx, cy);

                const rd = RaritySystem.get(card.rarity);
                const rc = '#' + rd.color.toString(16).padStart(6, '0');
                this.add.text(cx, cy + (isTen ? 48 : 78), card.name, {
                    fontSize: isTen ? '7px' : '9px', fontFamily: 'monospace', color: rc,
                }).setOrigin(0.5);
            });
        });

        const totalRevealTime = cards.length * 150 + 400;
        this.time.delayedCall(totalRevealTime, () => {
            cards.forEach((card, i) => {
                const col = i % cols, row = Math.floor(i / cols);
                const cx = startX + col * colW;
                const cy = startY + row * rowH;
                const hitW = isTen ? 65 : 100, hitH = isTen ? 100 : 145;
                this.add.zone(cx, cy, hitW, hitH).setDepth(20)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => this._showCardDetail(card));
            });

            const btnY = isTen ? startY + rows * rowH + 20 : 480;
            const rarityCount = {};
            cards.forEach(c => { rarityCount[c.rarity] = (rarityCount[c.rarity] || 0) + 1; });
            const summary = Object.entries(rarityCount).map(([r, n]) => `${r}\u00d7${n}`).join('  ');
            this.add.text(W / 2, btnY - 10, summary, {
                fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc',
            }).setOrigin(0.5);

            const wasTenPull = cards.length > 3;
            const cost = wasTenPull ? CardGenerator.PACK_COST_10 : CardGenerator.PACK_COST;
            const canAgain = this.currency.canAfford(cost);

            this._simpleBtn(W / 2, btnY + 25, `再来一次 (${cost}金币)`, canAgain ? 0x3366cc : 0x333344, () => {
                if (!canAgain) return;
                this._doPull(wasTenPull);
            });
            this._simpleBtn(W / 2, btnY + 65, '返回主页', 0x334455, () => this.scene.start('MainScene'));
            this.add.text(W / 2, btnY + 95, `金币: ${this.currency.get()}`, {
                fontSize: '12px', fontFamily: 'monospace', color: '#ffdd44',
            }).setOrigin(0.5);
        });
    }

    _showCardDetail(card) {
        const W = this.W, H = this.H;
        const grp = this.add.container(0, 0).setDepth(50);

        const ov = this.add.graphics();
        ov.fillStyle(0x000000, 0.92); ov.fillRect(0, 0, W, H);
        ov.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        grp.add(ov);

        grp.add(CardGenerator.renderCard(this, card, W / 2, 230, 2.2));

        const rd = RaritySystem.get(card.rarity);
        const rc = '#' + rd.color.toString(16).padStart(6, '0');
        let py = 410;

        grp.add(this.add.text(W / 2, py, card.name, {
            fontSize: '20px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5));

        const stars = { C: 1, R: 2, SR: 3, SSR: 4, UR: 5 }[card.rarity];
        grp.add(this.add.text(W / 2, py + 24, `[${card.rarity}] ${rd.name}  ${'\u2605'.repeat(stars)}`, {
            fontSize: '12px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, py + 50, `"${card.lore}"`, {
            fontSize: '9px', fontFamily: 'monospace', color: '#8899aa', fontStyle: 'italic',
            wordWrap: { width: 320 }, align: 'center',
        }).setOrigin(0.5));

        const skillBg = this.add.graphics();
        skillBg.fillStyle(0x1a1a30, 0.9); skillBg.fillRoundedRect(25, py + 68, W - 50, 55, 5);
        skillBg.lineStyle(1, rd.color, 0.3); skillBg.strokeRoundedRect(25, py + 68, W - 50, 55, 5);
        grp.add(skillBg);

        grp.add(this.add.text(40, py + 76, `技能: ${card.skillName}`, {
            fontSize: '11px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
        }));
        grp.add(this.add.text(40, py + 94, card.skillDesc, {
            fontSize: '9px', fontFamily: 'monospace', color: '#999', wordWrap: { width: 290 },
        }));

        const cg = this.add.graphics();
        cg.fillStyle(0x334455); cg.fillRoundedRect(W / 2 - 80, py + 135, 160, 34, 6);
        grp.add(cg);
        grp.add(this.add.text(W / 2, py + 152, '关闭', {
            fontSize: '13px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5));
        const z = this.add.zone(W / 2, py + 152, 160, 34).setDepth(51).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => grp.destroy());
        grp.add(z);
    }

    _packBtn(x, y, title, subtitle, color, enabled, cb) {
        const w = 300, h = 90;
        const g = this.add.graphics();
        g.fillStyle(color, enabled ? 1 : 0.4); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        g.lineStyle(2, 0xffffff, enabled ? 0.2 : 0.05); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);

        const icon = this.add.graphics();
        icon.fillStyle(enabled ? 0xffffff : 0x555555, 0.15);
        icon.fillRoundedRect(x - w / 2 + 12, y - 25, 50, 50, 6);
        icon.fillStyle(enabled ? 0xffcc44 : 0x555555, 0.4);
        icon.fillRect(x - w / 2 + 24, y - 12, 26, 4);
        icon.fillRect(x - w / 2 + 24, y + 8, 26, 4);

        this.add.text(x + 15, y - 15, title, {
            fontSize: '18px', fontFamily: 'monospace', color: enabled ? '#fff' : '#666', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add.text(x + 15, y + 12, subtitle, {
            fontSize: '9px', fontFamily: 'monospace', color: enabled ? '#aabbcc' : '#555',
        }).setOrigin(0.5);

        if (enabled) {
            this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', cb);
        }
    }

    _rarityFx(rarity, x, y) {
        if (rarity === 'C' || rarity === 'R') return;
        if (rarity === 'SR') {
            for (let i = 0; i < 5; i++) {
                const s = this.add.graphics(); s.fillStyle(0xcc66ff); s.fillRect(0, 0, 2, 2); s.setPosition(x, y);
                this.tweens.add({ targets: s, x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 60, alpha: 0, duration: 600, delay: i * 30 });
            }
        } else if (rarity === 'SSR') {
            this.cameras.main.shake(100, 0.005);
            for (let i = 0; i < 8; i++) {
                const p = this.add.graphics(); p.fillStyle(0xffaa00); p.fillRect(0, 0, 3, 3); p.setPosition(x, y);
                const a = (i / 8) * Math.PI * 2;
                this.tweens.add({ targets: p, x: x + Math.cos(a) * 40, y: y + Math.sin(a) * 40, alpha: 0, duration: 700, delay: i * 20 });
            }
        } else if (rarity === 'UR') {
            this.cameras.main.shake(300, 0.015);
            this.cameras.main.flash(200, 255, 150, 150);
            const cols = [0xff4488, 0xffaa00, 0x44ff88, 0x4488ff, 0xaa44ff];
            for (let i = 0; i < 14; i++) {
                const p = this.add.graphics(); p.fillStyle(cols[i % 5]); p.fillRect(0, 0, 4, 4); p.setPosition(x, y);
                const a = (i / 14) * Math.PI * 2;
                this.tweens.add({ targets: p, x: x + Math.cos(a) * 60, y: y + Math.sin(a) * 60, alpha: 0, duration: 900, delay: i * 15 });
            }
        }
    }

    _simpleBtn(x, y, text, color, cb) {
        const w = 200, h = 36;
        this.add.graphics().fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        this.add.text(x, y, text, { fontSize: '13px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', () => { SFX.play('button'); cb(); });
    }
}
