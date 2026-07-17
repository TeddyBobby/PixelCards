import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';
import { SFX } from '../utils/SFX.js';
import { RaritySystem } from '../systems/RaritySystem.js';
import { CardGenerator } from '../systems/CardGenerator.js';

export class CollectionScene extends Phaser.Scene {
    constructor() { super('CollectionScene'); }

    create() {
        const W = 390, H = window.GAME_H || 844;
        this.W = W; this.H = H;
        this.save = new SaveManager();
        this.currency = new CurrencySystem(this.save);
        this.collection = this.save.getCollection();
        this.filter = this.registry.get('collFilter') || 'ALL';
        this.page = this.registry.get('collPage') || 0;
        this.perPage = 6;

        const bg = this.add.graphics();
        bg.fillStyle(0x0c0c1c); bg.fillRect(0, 0, W, H);
        for (let y = 130; y < H - 60; y += 200) {
            bg.fillStyle(0x1a1828); bg.fillRect(0, y - 2, W, 4);
            bg.fillStyle(0x151520); bg.fillRect(0, y + 2, W, 2);
        }
        bg.fillStyle(0x12121f, 0.5); bg.fillRect(0, 0, 8, H); bg.fillRect(W - 8, 0, 8, H);
        for (let i = 0; i < 20; i++) {
            bg.fillStyle(0xffffff, 0.02);
            bg.fillRect(Math.random() * W, Math.random() * H, 1, 1);
        }

        this._header();
        this._filters();
        this._cards();
        this._footer();
    }

    _header() {
        const W = this.W;
        this.add.text(W / 2, 30, '我的收藏', {
            fontSize: '22px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5);

        const g = this.add.graphics();
        g.fillStyle(0x222244, 0.6); g.fillRoundedRect(W - 100, 18, 82, 24, 5);
        g.fillStyle(0xffdd00); g.fillCircle(W - 84, 30, 5);
        this.add.text(W - 74, 30, `${this.currency.get()}`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffdd44',
        }).setOrigin(0, 0.5);

        this.add.text(W / 2, 52, `共 ${this.collection.length} 张`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#666688',
        }).setOrigin(0.5);
    }

    _filters() {
        const W = this.W;
        const fs = ['ALL', 'C', 'R', 'SR', 'SSR', 'UR'];
        const y = 76;
        const sw = 58;
        const sx = (W - fs.length * sw) / 2 + sw / 2;

        fs.forEach((f, i) => {
            const bx = sx + i * sw;
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
            const cnt = f === 'ALL' ? this.collection.length : this.collection.filter(c => c.rarity === f).length;

            this.add.text(bx, y - 2, f, { fontSize: '10px', fontFamily: 'monospace', color: cs, fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(bx, y + 9, `${cnt}`, { fontSize: '7px', fontFamily: 'monospace', color: active ? '#ccc' : '#556' }).setOrigin(0.5);

            this.add.zone(bx, y, 48, 28).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
                this.registry.set('collFilter', f); this.registry.set('collPage', 0); this.scene.restart();
            });
        });
    }

    _filtered() {
        return this.filter === 'ALL' ? this.collection : this.collection.filter(c => c.rarity === this.filter);
    }

    _cards() {
        const W = this.W;
        const filtered = this._filtered();
        const start = this.page * this.perPage;
        const page = filtered.slice(start, start + this.perPage);

        if (!page.length) {
            this.add.text(W / 2, 400, this.collection.length ? '该分类暂无卡片' : '还没有卡片\n快去开包吧！', {
                fontSize: '13px', fontFamily: 'monospace', color: '#444466', align: 'center',
            }).setOrigin(0.5);
            return;
        }

        const cols = 3, colW = 120, rowH = 200;
        const startX = W / 2 - colW;
        const startY = 170;

        page.forEach((card, i) => {
            const col = i % cols, row = Math.floor(i / cols);
            const cx = startX + col * colW;
            const cy = startY + row * rowH;
            CardGenerator.renderCard(this, card, cx, cy, 0.9);

            this.add.text(cx, cy + 72, card.name, {
                fontSize: '9px', fontFamily: 'monospace', color: '#aaa',
            }).setOrigin(0.5);

            const idx = this.collection.indexOf(card);
            this.add.zone(cx, cy, 100, 150).setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this._detail(card, idx));
        });
    }

    _footer() {
        const W = this.W, H = this.H;
        const filtered = this._filtered();
        const total = Math.max(1, Math.ceil(filtered.length / this.perPage));

        this._fbtn(50, H - 40, '返回', 0x334455, 50, () => this.scene.start('MainScene'));
        this._fbtn(W - 60, H - 40, '批量分解', 0x883333, 80, () => this._batchDecompose());

        this.add.text(W / 2, H - 40, `${this.page + 1}/${total}`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#888',
        }).setOrigin(0.5);

        if (this.page > 0) this._fbtn(W / 2 - 45, H - 40, '<', 0x335577, 28, () => {
            this.registry.set('collPage', this.page - 1); this.registry.set('collFilter', this.filter); this.scene.restart();
        });
        if ((this.page + 1) * this.perPage < filtered.length) this._fbtn(W / 2 + 45, H - 40, '>', 0x335577, 28, () => {
            this.registry.set('collPage', this.page + 1); this.registry.set('collFilter', this.filter); this.scene.restart();
        });
    }

    _batchDecompose() {
        const W = this.W;
        const toDecomp = this.collection.filter(c => c.rarity === 'C' || c.rarity === 'R');
        if (toDecomp.length === 0) {
            const m = this.add.text(W / 2, this.H - 70, '没有可分解的卡片', {
                fontSize: '11px', fontFamily: 'monospace', color: '#ff6666',
            }).setOrigin(0.5);
            this.tweens.add({ targets: m, alpha: 0, duration: 1200, onComplete: () => m.destroy() });
            return;
        }

        let totalCoins = 0;
        const counts = {};
        toDecomp.forEach(c => {
            const rd = RaritySystem.get(c.rarity);
            totalCoins += rd.decompValue;
            counts[c.rarity] = (counts[c.rarity] || 0) + 1;
        });

        const grp = this.add.container(0, 0).setDepth(50);
        const ov = this.add.graphics();
        ov.fillStyle(0x000000, 0.88); ov.fillRect(0, 0, W, this.H);
        ov.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, this.H), Phaser.Geom.Rectangle.Contains);
        grp.add(ov);

        grp.add(this.add.text(W / 2, 320, '批量分解', {
            fontSize: '20px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5));

        const desc = Object.entries(counts).map(([r, n]) => `${r}\u00d7${n}`).join('  ');
        grp.add(this.add.text(W / 2, 355, `分解: ${desc}`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#cccccc',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, 380, `共 ${toDecomp.length} 张 \u2192 +${totalCoins} 金币`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44', fontStyle: 'bold',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, 405, 'SR以上的卡片不会被分解', {
            fontSize: '9px', fontFamily: 'monospace', color: '#888899',
        }).setOrigin(0.5));

        this._overlayBtn(grp, W / 2, 450, '确认分解', 0xaa3333, () => {
            const indices = toDecomp.map(c => this.collection.indexOf(c)).sort((a, b) => b - a);
            indices.forEach(idx => this.save.removeCard(idx));
            this.currency.add(totalCoins);
            grp.destroy();
            this.collection = this.save.getCollection();
            this.registry.set('collFilter', this.filter);
            this.registry.set('collPage', 0);
            this.scene.restart();
        });

        this._overlayBtn(grp, W / 2, 500, '取消', 0x334455, () => grp.destroy());
    }

    _overlayBtn(parent, x, y, text, color, cb) {
        const w = 200, h = 36;
        const g = this.add.graphics();
        g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        parent.add(g);
        parent.add(this.add.text(x, y, text, { fontSize: '13px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
        const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { SFX.play('button'); cb(); }); parent.add(z);
    }

    _detail(card, idx) {
        const W = this.W;
        const ov = this.add.graphics();
        ov.fillStyle(0x000000, 0.9); ov.fillRect(0, 0, W, this.H);
        ov.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, this.H), Phaser.Geom.Rectangle.Contains);
        const grp = this.add.container(0, 0);
        grp.add(ov);

        grp.add(CardGenerator.renderCard(this, card, W / 2, 240, 2.2));

        const rd = RaritySystem.get(card.rarity);
        const rc = '#' + rd.color.toString(16).padStart(6, '0');
        let py = 420;

        grp.add(this.add.text(W / 2, py, card.name, {
            fontSize: '20px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5));

        const stars = { C: 1, R: 2, SR: 3, SSR: 4, UR: 5 }[card.rarity];
        grp.add(this.add.text(W / 2, py + 24, `[${card.rarity}] ${rd.name}  ${'\u2605'.repeat(stars)}`, {
            fontSize: '12px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
        }).setOrigin(0.5));

        const info = [card.typeName, card.accessoryName, `#${(card.seed % 100000).toString().padStart(5, '0')}`].filter(Boolean).join(' \u00b7 ');
        grp.add(this.add.text(W / 2, py + 44, info, {
            fontSize: '9px', fontFamily: 'monospace', color: '#777799',
        }).setOrigin(0.5));

        grp.add(this.add.text(W / 2, py + 68, `"${card.lore}"`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#8899aa', fontStyle: 'italic',
            wordWrap: { width: 320 }, align: 'center',
        }).setOrigin(0.5));

        const skillBg = this.add.graphics();
        skillBg.fillStyle(0x1a1a30, 0.8); skillBg.fillRoundedRect(W / 2 - 155, py + 90, 310, 46, 5);
        skillBg.lineStyle(1, rd.color, 0.3); skillBg.strokeRoundedRect(W / 2 - 155, py + 90, 310, 46, 5);
        grp.add(skillBg);

        grp.add(this.add.text(W / 2 - 140, py + 98, `技能: ${card.skillName}`, {
            fontSize: '11px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
        }));
        grp.add(this.add.text(W / 2 - 140, py + 116, card.skillDesc, {
            fontSize: '9px', fontFamily: 'monospace', color: '#999',
            wordWrap: { width: 280 },
        }));

        const dv = rd.decompValue;
        this._detailBtn(grp, W / 2, py + 160, `分解 (+${dv}金币)`, 0x883333, () => {
            this.currency.add(dv);
            this.save.removeCard(idx);
            grp.destroy();
            this.collection = this.save.getCollection();
            this.registry.set('collFilter', this.filter);
            this.registry.set('collPage', this.page);
            this.scene.restart();
        });

        this._detailBtn(grp, W / 2, py + 200, '关闭', 0x334455, () => grp.destroy());
    }

    _detailBtn(p, x, y, text, color, cb) {
        const w = 220, h = 34;
        const g = this.add.graphics();
        g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5);
        g.lineStyle(1, 0xffffff, 0.12); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 5);
        p.add(g);
        p.add(this.add.text(x, y, text, { fontSize: '12px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
        const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { SFX.play('button'); cb(); }); p.add(z);
    }

    _fbtn(x, y, text, color, w, cb) {
        const h = 28;
        this.add.graphics().fillStyle(color).fillRoundedRect(x - w / 2, y - h / 2, w, h, 4);
        this.add.text(x, y, text, { fontSize: '11px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', () => { SFX.play('button'); cb(); });
    }
}
