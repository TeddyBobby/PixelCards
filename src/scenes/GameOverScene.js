import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager.js';
import { CurrencySystem } from '../systems/CurrencySystem.js';
import { SFX } from '../utils/SFX.js';
import { MusicManager } from '../utils/MusicManager.js';

export class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create() {
        const W = 390, H = window.GAME_H || 844;
        this.save = new SaveManager();
        this.currency = new CurrencySystem(this.save);
        MusicManager.playMenuMusic();

        const stage = this.registry.get('battleStage') || 1;
        const kills = this.registry.get('battleKills') || 0;
        const coins = this.registry.get('battleCoins') || 0;

        this.currency.add(coins);

        const best = this.save.get('bestStage', 0);
        if (stage > best) this.save.set('bestStage', stage);

        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a16); bg.fillRect(0, 0, W, H);
        bg.fillStyle(0x330000, 0.2); bg.fillRect(0, 0, W, H);
        bg.fillStyle(0x0a0a16, 0.6); bg.fillCircle(W / 2, H / 2, 250);
        bg.lineStyle(0.5, 0x331111, 0.3);
        for (let i = 0; i < 5; i++) {
            let x = W / 2, y = H * 0.3;
            bg.beginPath(); bg.moveTo(x, y);
            for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 80; y += 40 + Math.random() * 30; bg.lineTo(x, y); }
            bg.strokePath();
        }

        this.add.text(W / 2, 150, '战斗结束', {
            fontSize: '26px', fontFamily: 'monospace', color: '#ff4444', fontStyle: 'bold',
        }).setOrigin(0.5);

        this.add.text(W / 2, 220, `到达: 第 ${stage} 关`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#aaaacc',
        }).setOrigin(0.5);
        this.add.text(W / 2, 250, `击杀: ${kills}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#cccccc',
        }).setOrigin(0.5);
        this.add.text(W / 2, 280, `获得金币: +${coins}`, {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffdd44',
        }).setOrigin(0.5);

        this.add.text(W / 2, 320, `最高纪录: 第 ${Math.max(best, stage)} 关`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#888899',
        }).setOrigin(0.5);

        const g = this.add.graphics();
        const bw = 220, bh = 40, bx = W / 2, by = 420;
        g.fillStyle(0x334455); g.fillRoundedRect(bx - bw / 2, by - bh / 2, bw, bh, 8);
        this.add.text(bx, by, '返回主页', {
            fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add.zone(bx, by, bw, bh).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                SFX.play('button');
                this.save.set('currentStage', 1);
                this.registry.set('battleStage', 1);
                this.scene.start('MainScene');
            });
    }
}
