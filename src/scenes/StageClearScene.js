import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';
import { SFX } from '../utils/SFX.js';
import { MusicManager } from '../utils/MusicManager.js';

export class StageClearScene extends Phaser.Scene {
    constructor() { super('StageClearScene'); }

    create() {
        const W = 390, H = window.GAME_H || 844;
        this.save = new SaveManager();
        this.currency = new CurrencySystem(this.save);
        MusicManager.playMenuMusic();

        const stage = (this.registry.get('battleStage') || 2) - 1;
        const kills = this.registry.get('battleKills') || 0;
        const coins = this.registry.get('battleCoins') || 0;

        this.currency.add(coins);

        const nextStage = this.registry.get('battleStage');
        this.save.set('currentStage', nextStage);

        // Victory background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a16); bg.fillRect(0, 0, W, H);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            bg.fillStyle(0xffcc44, 0.02);
            bg.beginPath(); bg.moveTo(W / 2, 100);
            bg.lineTo(W / 2 + Math.cos(angle) * 400, 100 + Math.sin(angle) * 400);
            bg.lineTo(W / 2 + Math.cos(angle + 0.2) * 400, 100 + Math.sin(angle + 0.2) * 400);
            bg.closePath(); bg.fillPath();
        }
        for (let i = 0; i < 30; i++) {
            bg.fillStyle(0xffcc44, Math.random() * 0.08 + 0.02);
            bg.fillRect(Math.random() * W, Math.random() * H * 0.5, 1, 1);
        }

        this.add.text(W / 2, 100, '关卡通过！', {
            fontSize: '26px', fontFamily: 'monospace', color: '#44ff44', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(W / 2, 150, `第 ${stage} 关 完成`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#aaaacc',
        }).setOrigin(0.5);

        this.add.text(W / 2, 200, `击杀: ${kills}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#cccccc',
        }).setOrigin(0.5);
        this.add.text(W / 2, 225, `获得金币: +${coins}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44',
        }).setOrigin(0.5);

        if (stage === 5 || stage === 10) {
            const packs = stage === 10 ? 2 : 1;
            this.add.text(W / 2, 260, `奖励: ${packs}次免费抽卡！`, {
                fontSize: '13px', fontFamily: 'monospace', color: '#ff88aa', fontStyle: 'bold',
            }).setOrigin(0.5);
            const freePacks = this.save.get('freePacks', 0) + packs;
            this.save.set('freePacks', freePacks);
        }

        this._btn(W / 2, 340, '继续下一关', 0x3366cc, () => this.scene.start('HeroSelectScene'));
        this._btn(W / 2, 400, '开卡包', 0x337744, () => this.scene.start('PackScene'));
        this._btn(W / 2, 460, '返回主页', 0x334455, () => this.scene.start('MainScene'));

        this.add.text(W / 2, 520, `当前金币: ${this.currency.get()}`, {
            fontSize: '13px', fontFamily: 'monospace', color: '#ffdd44',
        }).setOrigin(0.5);
    }

    _btn(x, y, text, color, cb) {
        const w = 220, h = 40;
        const g = this.add.graphics();
        g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        g.lineStyle(1, 0xffffff, 0.15); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        this.add.text(x, y, text, { fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).on('pointerdown', () => { SFX.play('button'); cb(); });
    }
}
