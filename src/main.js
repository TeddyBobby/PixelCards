import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene.js';
import { PackScene } from './scenes/PackScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { HeroSelectScene } from './scenes/HeroSelectScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { StageClearScene } from './scenes/StageClearScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const BASE_W = 390;
const ratio = window.innerHeight / window.innerWidth;
const BASE_H = Math.round(BASE_W * ratio);

const config = {
    type: Phaser.AUTO,
    width: BASE_W,
    height: BASE_H,
    parent: document.body,
    pixelArt: true,
    backgroundColor: '#0e0e1a',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false },
    },
    input: {
        activePointers: 2,
    },
    scene: [MainScene, PackScene, CollectionScene, HeroSelectScene, BattleScene, StageClearScene, GameOverScene],
};

const game = new Phaser.Game(config);

window.GAME_W = BASE_W;
window.GAME_H = BASE_H;
