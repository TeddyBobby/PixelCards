import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';
import { MusicManager } from '../utils/MusicManager.js';
import { SFX } from '../utils/SFX.js';
import { RaritySystem } from '../systems/RaritySystem.js';
import { CardGenerator } from '../systems/CardGenerator.js';

export class MainScene extends Phaser.Scene {
    constructor() { super('MainScene'); }

    create() {
        const W = 390, H = window.GAME_H || 844;
        this.save = new SaveManager();
        this.currency = new CurrencySystem(this.save);

        this.input.once('pointerdown', () => { MusicManager.playMenuMusic(); });
        if (!MusicManager._playing) MusicManager.playMenuMusic();

        const muteLabel = this.add.text(W - 15, 15, MusicManager.isMuted() ? '\ud83d\udd07' : '\ud83d\udd0a', {
            fontSize: '16px',
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            const on = MusicManager.toggle();
            muteLabel.setText(on ? '\ud83d\udd0a' : '\ud83d\udd07');
            if (on) MusicManager.playMenuMusic();
        });

        const bg = this.add.graphics();
        const skyColors = [0x0a0a1e, 0x0e1028, 0x121430, 0x161838, 0x0e1028];
        skyColors.forEach((c, i) => {
            bg.fillStyle(c); bg.fillRect(0, i * H / 5, W, H / 5 + 1);
        });
        bg.fillStyle(0x0c0c1a);
        bg.beginPath(); bg.moveTo(0, H * 0.7);
        for (let x = 0; x <= W; x += 30) bg.lineTo(x, H * 0.7 - Math.sin(x * 0.02) * 40 - Math.sin(x * 0.05) * 15);
        bg.lineTo(W, H); bg.lineTo(0, H); bg.closePath(); bg.fillPath();
        bg.fillStyle(0x080816);
        bg.beginPath(); bg.moveTo(0, H * 0.8);
        for (let x = 0; x <= W; x += 20) bg.lineTo(x, H * 0.8 - Math.sin(x * 0.03 + 1) * 25 - Math.sin(x * 0.07) * 10);
        bg.lineTo(W, H); bg.lineTo(0, H); bg.closePath(); bg.fillPath();
        for (let i = 0; i < 80; i++) {
            const sy = Math.random() * H * 0.6;
            const sz = Math.random() > 0.92 ? 2 : 1;
            bg.fillStyle(0xffffff, Math.random() * 0.4 + 0.1);
            bg.fillRect(Math.random() * W, sy, sz, sz);
        }
        bg.fillStyle(0xffffcc, 0.12); bg.fillCircle(320, 80, 25);
        bg.fillStyle(0xffffee, 0.06); bg.fillCircle(320, 80, 35);

        this.add.text(W / 2, 50, '像素卡牌', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add.text(W / 2, 78, '收集它们吧！', {
            fontSize: '12px', fontFamily: 'monospace', color: '#887744',
        }).setOrigin(0.5);

        const cg = this.add.graphics();
        cg.fillStyle(0x222244, 0.8); cg.fillRoundedRect(W / 2 - 70, 96, 140, 28, 6);
        cg.fillStyle(0xffdd00); cg.fillCircle(W / 2 - 48, 110, 7);
        cg.fillStyle(0xddaa00); cg.fillCircle(W / 2 - 48, 110, 4);
        this.coinText = this.add.text(W / 2 - 35, 110, '', {
            fontSize: '15px', fontFamily: 'monospace', color: '#ffdd44', fontStyle: 'bold',
        }).setOrigin(0, 0.5);
        this._updateCoin(this.currency.get());
        this.currency.onChange(c => this._updateCoin(c));

        const BW = 240, BH = 42;
        let btnY = 150;
        this._btn(W / 2, btnY, BW, BH, '开 卡 包', 0x3366cc, () => this.scene.start('PackScene'));
        btnY += 52;
        this._btn(W / 2, btnY, BW, BH, '我的收藏', 0x337744, () => this.scene.start('CollectionScene'));
        btnY += 52;

        const currentStage = this.save.get('currentStage', 1);
        this.registry.set('battleStage', currentStage);
        const battleLabel = currentStage > 1 ? `继续战斗 (第${currentStage}关)` : '开始战斗';
        this._btn(W / 2, btnY, BW, BH, battleLabel, 0xaa3333, () => {
            if (this.save.getCollection().length === 0) {
                const m = this.add.text(W / 2, btnY - 25, '先抽一张英雄！', {
                    fontSize: '12px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
                }).setOrigin(0.5);
                this.tweens.add({ targets: m, alpha: 0, y: btnY - 35, duration: 1000, onComplete: () => m.destroy() });
                return;
            }
            this.scene.start('HeroSelectScene');
        });
        btnY += 36;

        if (currentStage > 1) {
            btnY += 8;
            this._btn(W / 2, btnY, BW, 28, '重新开始', 0x333355, () => {
                this.save.set('currentStage', 1);
                this.registry.set('battleStage', 1);
                this.scene.restart();
            });
            btnY += 22;
        }

        const bestStage = this.save.get('bestStage', 0);
        if (bestStage > 0) {
            btnY += 8;
            this.add.text(W / 2, btnY, `最高纪录: 第${bestStage}关`, {
                fontSize: '9px', fontFamily: 'monospace', color: '#886644',
            }).setOrigin(0.5);
            btnY += 14;
        }

        const stats = this.save.getStats();
        btnY += 10;
        this.add.text(W / 2, btnY, `已收集: ${stats.total} 张`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#888899',
        }).setOrigin(0.5);
        btnY += 20;

        ['C', 'R', 'SR', 'SSR', 'UR'].forEach((r, i) => {
            const bx = 55 + i * 72;
            const d = RaritySystem.get(r);
            const col = '#' + d.color.toString(16).padStart(6, '0');
            this.add.text(bx, btnY, r, { fontSize: '11px', fontFamily: 'monospace', color: col, fontStyle: 'bold' }).setOrigin(0.5);
            this.add.text(bx, btnY + 16, `${stats.byRarity[r] || 0}`, { fontSize: '13px', fontFamily: 'monospace', color: '#aaa' }).setOrigin(0.5);
        });
        btnY += 40;

        const coll = this.save.getCollection();
        if (coll.length > 0) {
            this.add.text(W / 2, btnY, '最近获得', {
                fontSize: '10px', fontFamily: 'monospace', color: '#555566',
            }).setOrigin(0.5);
            const card = coll[coll.length - 1];
            const cardY = btnY + 120;
            CardGenerator.renderCard(this, card, W / 2, cardY, 1.2);

            const rd = RaritySystem.get(card.rarity);
            const rc = '#' + rd.color.toString(16).padStart(6, '0');
            this.add.text(W / 2, cardY + 100, `"${card.lore}"`, {
                fontSize: '9px', fontFamily: 'monospace', color: '#777799', fontStyle: 'italic',
                wordWrap: { width: 300 }, align: 'center',
            }).setOrigin(0.5);
            this.add.text(W / 2, cardY + 120, `技能: ${card.skillName}`, {
                fontSize: '11px', fontFamily: 'monospace', color: rc, fontStyle: 'bold',
            }).setOrigin(0.5);
            this.add.text(W / 2, cardY + 136, card.skillDesc, {
                fontSize: '9px', fontFamily: 'monospace', color: '#999999',
                wordWrap: { width: 300 }, align: 'center',
            }).setOrigin(0.5);
        } else {
            this.add.text(W / 2, 460, '开个卡包\n开始你的收藏吧！', {
                fontSize: '14px', fontFamily: 'monospace', color: '#444466', align: 'center',
            }).setOrigin(0.5);
        }
    }

    _updateCoin(c) { this.coinText.setText(`${c}`); }

    _btn(x, y, w, h, text, color, cb) {
        const g = this.add.graphics();
        g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        g.lineStyle(1.5, 0xffffff, 0.2); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        this.add.text(x, y - 2, text, {
            fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5);
        const z = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
        z.on('pointerdown', () => { SFX.play('button'); cb(); });
        z.on('pointerover', () => g.alpha = 0.8);
        z.on('pointerout', () => g.alpha = 1);
    }
}
