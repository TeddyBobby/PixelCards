# PixelCards 🎴

> 像素卡牌收集战斗游戏 — 收集可爱的像素生物，在随机地形中战斗闯关！

**Pixel creature card collection & battle game** — Collect adorable pixel creatures and battle through procedurally generated terrain!

[![Play Now](https://img.shields.io/badge/🎮-Play_Now-ffcc44?style=for-the-badge)](https://teddybobby.github.io/PixelCards/)
[![Built with Phaser](https://img.shields.io/badge/Built_with-Phaser_3-4488ff)](https://phaser.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-888888)](LICENSE)

## ✨ Features

- 🎴 **Gacha Card Packs** — 单抽 / 十连抽，SR/SSR/UR 概率翻倍
- 🐱 **8 种像素生物** — 猫、兔、熊、狗、鸟、龙、独角兽、幽灵 — 每种都有 16x16 像素模板
- ⭐ **5 级稀有度** — C → R → SR → SSR → UR，每级不同配色+边框特效
- ⚔️ **实时战斗** — 虚拟摇杆走位，自动射击 + 8 种技能（扇形斩、闪现爆炸、召唤、隐身…）
- 🌍 **10 种地形** — 草原、沙漠、雪地、熔岩、森林、洞穴、墓地、天空、地狱、虚空
- 📈 **Roguelike 升级** — 击杀升级选buff：攻击、攻速、弹幕、穿透、吸血、技能范围…
- 🏆 **无尽闯关** — 每 5 关 BOSS 战，关卡 5/10 送免费抽卡
- 🎵 **8-bit 音效** — Web Audio API 程序化生成，按钮/射击/爆炸/升级全有反馈
- 📱 **移动优先** — 适配手机触屏，竖屏设计

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 How to Play

1. **开卡包** → 收集像素英雄
2. **我的收藏** → 查看卡片详情，分解低稀有度换金币
3. **开始战斗** → 选一个英雄出战
4. **虚拟摇杆** → 走位躲避敌人子弹
5. **自动攻击** → 瞄准最近敌人
6. **技能释放** → CD 到自动放，击杀升级选 buff！

## 🛠 Tech Stack

| 技术 | 用途 |
|------|------|
| [Phaser 3](https://phaser.io/) | 游戏引擎 — 渲染、物理、场景管理 |
| [Vite](https://vitejs.dev/) | 构建工具 — 热更新、生产构建 |
| ES Modules | 模块化代码组织 |
| Web Audio API | 8-bit 程序化音效 + 背景音乐 |
| Canvas API | 像素生物渲染（无外部图片素材） |
| LocalStorage | 存档系统 |

## 📁 Project Structure

```
src/
├── main.js                 # 入口 + Phaser 配置
├── scenes/
│   ├── MainScene.js        # 主菜单
│   ├── PackScene.js        # 卡包商店 + 抽卡动画
│   ├── CollectionScene.js  # 收藏管理 + 分解
│   ├── HeroSelectScene.js  # 英雄选择
│   ├── BattleScene.js      # 战斗核心（1280行）
│   ├── StageClearScene.js  # 通关结算
│   └── GameOverScene.js    # 战败结算
├── systems/
│   ├── RaritySystem.js     # 稀有度概率系统
│   ├── CardGenerator.js    # 卡片生成 + 渲染
│   └── CurrencySystem.js   # 金币经济
├── battle/
│   ├── HeroStats.js        # 英雄属性
│   ├── SkillPool.js        # 技能池 + 升级选项
│   ├── EnemySpawner.js     # 敌人属性 + 波次生成
│   └── Joystick.js         # 虚拟摇杆
├── utils/
│   ├── PixelArt.js         # 像素模板 + 配色 + 技能数据
│   ├── SaveManager.js      # LocalStorage 存档
│   ├── SFX.js              # Web Audio 音效
│   └── MusicManager.js     # 背景音乐
├── assets/                 # 图片素材（AI 生成）
│   └── icons/              # UI 图标
```

## 🎨 Credits

- 像素生物模板：手写 16x16 pixel art
- 音效：Web Audio API 程序化生成（方波/三角波/锯齿波）
- UI 图标：AI 生成像素图标
- 游戏框架：[Phaser 3](https://phaser.io/)

## 📄 License

MIT © [TeddyBobby](https://github.com/TeddyBobby)
