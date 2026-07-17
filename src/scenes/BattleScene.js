import Phaser from 'phaser';
import { SFX } from '../utils/SFX.js';
import { MusicManager } from '../utils/MusicManager.js';
import { PixelArt } from '../utils/PixelArt.js';
import { HeroStats } from '../battle/HeroStats.js';
import { SkillPool } from '../battle/SkillPool.js';
import { EnemySpawner } from '../battle/EnemySpawner.js';
import { Joystick } from '../battle/Joystick.js';

export class BattleScene extends Phaser.Scene {
    constructor() { super('BattleScene'); }

    create() {
        this.SW = 390; this.SH = window.GAME_H || 844;
        this.MW = 800; this.MH = 1200;
        this.W = this.MW; this.H = this.MH;

        this.card = this.registry.get('battleCard');
        this.stage = this.registry.get('battleStage') || 1;
        this.heroStats = new HeroStats(this.card);
        this.skillPool = new SkillPool(this.card);
        this.paused = false;
        this.waveIndex = 0;
        this.waveEnemiesLeft = 0;
        this.wavePendingSpawns = 0;
        this.waveAllSpawned = false;
        this._waveAdvancing = false;
        this.totalKills = 0;
        this.invincibleUntil = 0;
        this.stealthUntil = 0;
        this.summons = [];

        this.physics.world.setBounds(0, 0, this.MW, this.MH);

        this._drawTerrain(this.MW, this.MH);

        this.obstacles = this.physics.add.staticGroup();
        this._placeObstacles();

        this._createTextures();

        this.hero = this.physics.add.sprite(this.MW / 2, this.MH / 2, 'hero_tex');
        this.hero.setCollideWorldBounds(true).setDepth(10);
        this.hero.body.setSize(16, 16);

        this.cameras.main.setBounds(0, 0, this.MW, this.MH);
        this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);

        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        this.physics.add.overlap(this.bullets, this.enemies, this._bulletHitEnemy, null, this);
        this.physics.add.overlap(this.hero, this.enemies, this._enemyHitHero, null, this);
        this.physics.add.overlap(this.hero, this.enemyBullets, this._eBulletHitHero, null, this);
        this.physics.add.collider(this.hero, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);

        this.lastShot = 0;
        this.lastSkill = -Infinity;
        this.lastEnemyDmg = 0;

        this.joystick = new Joystick(this, this.SW - 80, this.SH - 120, 50);
        this.joystick.base.setScrollFactor(0);
        this.joystick.thumb.setScrollFactor(0);
        this.joystick.hitArea.setScrollFactor(0);

        this._createHUD();
        MusicManager.playBattleMusic();
        this._showStageTitle(() => this._startWave());
    }

    _placeObstacles() {
        const rng = PixelArt.mulberry32(this.stage * 3571);
        const theme = ((this.stage - 1) % 10);
        const count = 8 + Math.floor(rng() * 6);
        const colors = [
            0x3a5030, 0x6a6040, 0x8899aa, 0x553322, 0x2a4418,
            0x4444aa, 0x555560, 0x667788, 0x663322, 0x333355,
        ];
        const obsColor = colors[theme];

        for (let i = 0; i < count; i++) {
            let ox, oy;
            do {
                ox = 40 + rng() * (this.MW - 80);
                oy = 40 + rng() * (this.MH - 80);
            } while (Math.abs(ox - this.MW / 2) < 80 && Math.abs(oy - this.MH / 2) < 80);

            const w = 16 + Math.floor(rng() * 16);
            const h = 16 + Math.floor(rng() * 12);

            const g = this.add.graphics().setDepth(3);
            g.fillStyle(obsColor, 0.7);
            g.fillRoundedRect(ox - w / 2, oy - h / 2, w, h, 3);
            g.fillStyle(0xffffff, 0.08);
            g.fillRoundedRect(ox - w / 2 + 1, oy - h / 2 + 1, w - 2, h / 3, 2);
            g.lineStyle(1, 0x000000, 0.15);
            g.strokeRoundedRect(ox - w / 2, oy - h / 2, w, h, 3);

            const obs = this.add.zone(ox, oy, w, h);
            this.physics.add.existing(obs, true);
            this.obstacles.add(obs);
        }

        const border = this.add.graphics().setDepth(1);
        border.lineStyle(3, 0xffffff, 0.08);
        border.strokeRect(2, 2, this.MW - 4, this.MH - 4);
    }

    _drawTerrain(W, H) {
        const bg = this.add.graphics();
        const theme = ((this.stage - 1) % 10);
        const rng = PixelArt.mulberry32(this.stage * 7919);

        const themes = [
            { name:'\u8349\u539f', base:0x2a3a1e, light:0x344828, dark:0x1e2c14, accent:0x4a6830 },
            { name:'\u6c99\u6f20', base:0x3a3420, light:0x443e28, dark:0x2c2616, accent:0x504830 },
            { name:'\u96ea\u5730', base:0x2a3040, light:0x343a4a, dark:0x202834, accent:0x4a5568 },
            { name:'\u7194\u5ca9', base:0x221010, light:0x2e1614, dark:0x180a0a, accent:0x3a1c18 },
            { name:'\u68ee\u6797', base:0x1a2a14, light:0x22341c, dark:0x121e0e, accent:0x2e4020 },
            { name:'\u6d1e\u7a74', base:0x16162a, light:0x1e1e36, dark:0x101020, accent:0x2a2a44 },
            { name:'\u5893\u5730', base:0x181820, light:0x202028, dark:0x101016, accent:0x28282e },
            { name:'\u5929\u7a7a', base:0x162040, light:0x1e2a4e, dark:0x0e1830, accent:0x283660 },
            { name:'\u5730\u72f1', base:0x2a0e0e, light:0x361414, dark:0x1e0808, accent:0x441a18 },
            { name:'\u865a\u7a7a', base:0x0e0e1e, light:0x141428, dark:0x0a0a14, accent:0x1c1c36 },
        ];
        const t = themes[theme];

        bg.fillStyle(t.base); bg.fillRect(0, 0, W, H);

        for (let i = 0; i < 35; i++) {
            const px = rng() * W, py = rng() * H;
            const r = 15 + rng() * 30;
            bg.fillStyle(rng() > 0.5 ? t.light : t.dark, 0.3 + rng() * 0.2);
            bg.fillCircle(px, py, r);
        }

        for (let i = 0; i < 60; i++) {
            bg.fillStyle(t.accent, 0.15 + rng() * 0.1);
            bg.fillCircle(rng() * W, rng() * H, 3 + rng() * 8);
        }

        // Theme decorations
        if (theme === 0) {
            for (let i = 0; i < 40; i++) {
                const x = rng() * W, y = rng() * H;
                bg.fillStyle(0x4a7838, 0.5);
                bg.fillRect(x, y, 1, 3); bg.fillRect(x + 2, y - 1, 1, 4); bg.fillRect(x - 1, y + 1, 1, 2);
            }
            const fc = [0xff8888, 0xffaa66, 0xffff88, 0x88aaff, 0xff88cc];
            for (let i = 0; i < 15; i++) {
                const x = rng() * W, y = rng() * H;
                bg.fillStyle(fc[Math.floor(rng() * 5)], 0.4); bg.fillCircle(x, y, 2);
                bg.fillStyle(0xffff88, 0.5); bg.fillRect(x, y, 1, 1);
            }
        } else if (theme === 1) {
            for (let i = 0; i < 8; i++) { const x = rng()*W, y = rng()*H; bg.fillStyle(0x504830, 0.2); bg.fillEllipse(x, y, 40+rng()*30, 10+rng()*8); }
        } else if (theme === 2) {
            for (let i = 0; i < 12; i++) { bg.fillStyle(0xddeeff, 0.06); bg.fillEllipse(rng()*W, rng()*H, 30+rng()*20, 8+rng()*6); }
            for (let i = 0; i < 50; i++) { bg.fillStyle(0xffffff, 0.04+rng()*0.04); bg.fillCircle(rng()*W, rng()*H, 1); }
        } else if (theme === 3) {
            for (let i=0; i<6; i++) { bg.fillStyle(0xff4400, 0.08); bg.fillCircle(rng()*W, rng()*H, 8+rng()*15); }
        } else if (theme === 4) {
            for (let i=0; i<10; i++) { const x=rng()*W, y=rng()*H; bg.fillStyle(0x443322, 0.35); bg.fillRect(x-2,y,4,8); bg.fillStyle(0x2a5520,0.3); bg.fillCircle(x,y-2,7); }
        } else if (theme === 7) {
            for (let i=0; i<12; i++) { const x=rng()*W, y=rng()*H; bg.fillStyle(0xffffff, 0.04); bg.fillCircle(x,y,12); bg.fillCircle(x+8,y-2,9); }
        } else if (theme === 9) {
            const vc = [0x8844ff, 0x4488ff, 0xff44aa, 0x44ffaa];
            for (let i=0; i<20; i++) { bg.fillStyle(vc[Math.floor(rng()*4)], 0.04); bg.fillCircle(rng()*W,rng()*H,2+rng()*5); }
            bg.fillStyle(0x000000,0.12); bg.fillCircle(W/2,H/2,50);
        }

        this.add.text(W - 5, H - 5, themes[theme].name, {
            fontSize: '7px', fontFamily: 'monospace', color: '#ffffff',
        }).setOrigin(1, 1).setAlpha(0.15);
    }

    _createTextures() {
        ['hero_tex', 'bullet_hero', 'bullet_enemy', 'enemy_normal', 'enemy_fast', 'enemy_tank', 'enemy_ranged', 'enemy_boss'].forEach(k => {
            if (this.textures.exists(k)) this.textures.remove(k);
        });

        const tpl = PixelArt.TEMPLATES[this.card.creatureType];
        const P = 2;
        const hg = this.make.graphics({ add: false });
        for (let r = 0; r < tpl.length; r++) {
            for (let c = 0; c < 16; c++) {
                const cell = tpl[r][c];
                if (!cell) continue;
                let color;
                if (cell === 2) color = 0x111122;
                else if (cell === 3) color = 0xff6688;
                else if (cell === 4) color = this.card.darkColor;
                else if (cell === 5) color = 0xff9999;
                else color = r > tpl.length * 0.6 ? this.card.shadowColor : r > tpl.length * 0.3 ? this.card.darkColor : this.card.bodyColor;
                hg.fillStyle(color);
                hg.fillRect(c * P, r * P, P, P);
            }
        }
        hg.generateTexture('hero_tex', 16 * P, tpl.length * P);
        hg.destroy();

        const bg = this.make.graphics({ add: false });
        bg.fillStyle(0xffff88); bg.fillCircle(4, 4, 3);
        bg.generateTexture('bullet_hero', 8, 8); bg.destroy();

        const ebg = this.make.graphics({ add: false });
        ebg.fillStyle(0xff4444); ebg.fillCircle(3, 3, 3);
        ebg.generateTexture('bullet_enemy', 6, 6); ebg.destroy();

        this._makeEnemyTex('enemy_normal', 12, 0x44cc44, 'normal');
        this._makeEnemyTex('enemy_fast', 10, 0xcccc44, 'fast');
        this._makeEnemyTex('enemy_tank', 16, 0xaa44cc, 'tank');
        this._makeEnemyTex('enemy_ranged', 12, 0xcc4444, 'ranged');
        this._makeEnemyTex('enemy_boss', 28, 0xff8800, 'boss');
    }

    _makeEnemyTex(key, size, color, type) {
        const g = this.make.graphics({ add: false });
        const s = size;
        const dark = Phaser.Display.Color.IntegerToColor(color).darken(30).color;

        if (type === 'normal') {
            g.fillStyle(color);
            g.fillRect(2, s - 6, s - 4, 4);
            g.fillRect(1, s - 8, s - 2, 2);
            g.fillRect(1, s - 10, s - 2, 2);
            g.fillRect(2, s - 12, s - 4, 2);
            g.fillRect(3, s - 14, s - 6, 2);
            g.fillStyle(dark); g.fillRect(2, s - 4, s - 4, 2);
            g.fillStyle(0xffffff); g.fillRect(3, s - 11, 2, 2); g.fillRect(s - 5, s - 11, 2, 2);
            g.fillStyle(0x111111); g.fillRect(4, s - 10, 1, 1); g.fillRect(s - 4, s - 10, 1, 1);
        } else if (type === 'fast') {
            g.fillStyle(color); g.fillRect(3, 2, s - 6, s - 4); g.fillRect(0, 3, 3, 3); g.fillRect(s - 3, 3, 3, 3);
            g.fillStyle(0xffffff); g.fillRect(3, 3, 2, 2); g.fillRect(s - 5, 3, 2, 2);
            g.fillStyle(0x111111); g.fillRect(4, 4, 1, 1); g.fillRect(s - 4, 4, 1, 1);
        } else if (type === 'tank') {
            g.fillStyle(dark); g.fillRect(2, 4, s - 4, s - 4);
            g.fillStyle(color); g.fillRect(3, 2, s - 6, s - 4); g.fillRect(1, 6, 2, 4); g.fillRect(s - 3, 6, 2, 4);
            g.fillStyle(0xff4444); g.fillRect(5, 5, 2, 2); g.fillRect(s - 7, 5, 2, 2);
            g.fillStyle(dark); g.fillRect(5, s - 4, s - 10, 2);
        } else if (type === 'ranged') {
            g.fillStyle(color); g.fillRect(2, 2, s - 4, s - 4); g.fillRect(1, 3, 1, s - 6); g.fillRect(s - 2, 3, 1, s - 6);
            g.fillStyle(0xffffff); g.fillCircle(s / 2, s / 2, 3);
            g.fillStyle(0x111111); g.fillCircle(s / 2, s / 2, 1.5);
        } else if (type === 'boss') {
            g.fillStyle(dark); g.fillRect(4, 6, s - 8, s - 8);
            g.fillStyle(color); g.fillRect(5, 4, s - 10, s - 6);
            g.fillRect(5, 0, 3, 5); g.fillRect(s - 8, 0, 3, 5);
            g.fillRect(1, 10, 4, 6); g.fillRect(s - 5, 10, 4, 6);
            g.fillStyle(0xff0000); g.fillRect(9, 9, 3, 3); g.fillRect(s - 12, 9, 3, 3);
            g.fillStyle(0xffffff); g.fillRect(10, 10, 1, 1); g.fillRect(s - 11, 10, 1, 1);
            g.fillStyle(0x440000); g.fillRect(10, 16, s - 20, 3);
            g.fillStyle(0xffffff); g.fillRect(11, 16, 2, 2); g.fillRect(s - 13, 16, 2, 2);
        }
        g.generateTexture(key, size, size);
        g.destroy();
    }

    update(time, delta) {
        if (this.paused) return;
        const dt = delta / 1000;
        const hs = this.heroStats;

        this.hero.setVelocity(this.joystick.vector.x * hs.spd, this.joystick.vector.y * hs.spd);
        this.hero.alpha = time < this.stealthUntil ? 0.3 : 1;

        if (time - this.lastShot > 1000 / hs.atkSpd) {
            this._autoShoot(time);
            this.lastShot = time;
        }

        if (time - this.lastSkill > hs.skillCD * 1000) {
            this._castSkill(time);
            this.lastSkill = time;
        }

        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            const now = time;
            if (e.getData('bleedUntil') > now && now - (e.getData('lastDot') || 0) > 1000) {
                const dot = Math.floor(hs.atk * 0.3);
                e.setData('hp', e.getData('hp') - dot); e.setData('lastDot', now);
                this._floatText(e.x, e.y - 8, '-' + dot, '#ff6666');
                if (e.getData('hp') <= 0) { this._killEnemy(e); return; }
            }
            if (e.getData('burnUntil') > now && now - (e.getData('lastBurn') || 0) > 1000) {
                const dot = Math.floor(hs.skillDmg * 0.2);
                e.setData('hp', e.getData('hp') - dot); e.setData('lastBurn', now);
                this._floatText(e.x, e.y - 8, '-' + dot, '#ff8844');
                if (e.getData('hp') <= 0) { this._killEnemy(e); return; }
            }
            if (e.getData('stunUntil') > now) { e.setVelocity(0, 0); return; }

            const dx = this.hero.x - e.x, dy = this.hero.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const slow = (e.getData('slowUntil') > now) ? 0.5 : 1;
            const spd = e.getData('spd') * slow;
            e.setVelocity((dx / dist) * spd, (dy / dist) * spd);

            if (e.getData('type') === 'ranged' && now - (e.getData('lastShot') || 0) > 2000) this._enemyShoot(e, now);
            if (e.getData('type') === 'boss') {
                if (now - (e.getData('lastBossShot') || 0) > 3000) this._bossShoot(e, now);
                if (now - (e.getData('lastBossSpawn') || 0) > 8000) { this._spawnEnemy('normal'); this._spawnEnemy('normal'); e.setData('lastBossSpawn', now); }
            }
            this._drawEnemyHpBar(e);
        });

        this.summons = this.summons.filter(s => {
            if (time > s.expiry) {
                const poof = this.add.graphics().setDepth(14);
                poof.fillStyle(0xffcc44, 0.3); poof.fillCircle(s.sprite.x, s.sprite.y, 8);
                this.tweens.add({ targets: poof, alpha: 0, scaleX: 2, scaleY: 2, duration: 200, onComplete: () => poof.destroy() });
                s.sprite.destroy();
                return false;
            }
            s.orbitAngle += s.orbitSpeed * dt;
            s.sprite.setPosition(this.hero.x + Math.cos(s.orbitAngle) * s.orbitRadius, this.hero.y + Math.sin(s.orbitAngle) * s.orbitRadius);
            if (time - s.lastShot > 350) { this._summonShoot(s); s.lastShot = time; }
            return true;
        });

        this.bullets.children.iterate(b => {
            if (b && b.active && (b.x < -10 || b.x > this.W + 10 || b.y < -10 || b.y > this.H + 10)) this._killBullet(b);
        });

        if (this.waveAllSpawned && this.waveEnemiesLeft <= 0 && !this._waveAdvancing) {
            this._waveAdvancing = true;
            this.time.delayedCall(800, () => { this._waveAdvancing = false; this._nextWave(); });
        }

        this._updateHUD(time);
    }

    _autoShoot(time) {
        let nearest = null, minDist = Infinity;
        let boss = null, bossDist = Infinity;
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, e.x, e.y);
            if (e.getData('type') === 'boss' && d < bossDist) { boss = e; bossDist = d; }
            if (d < minDist) { minDist = d; nearest = e; }
        });
        if (boss && bossDist < 400) { nearest = boss; minDist = bossDist; }
        if (!nearest || minDist > 300) return;
        SFX.play('shoot');

        const dmgMult = time < this.stealthUntil ? (this.heroStats.skill.dmgMult || 1) : 1;
        const baseDmg = Math.floor(this.heroStats.atk * dmgMult);
        this._fireBullet(this.hero.x, this.hero.y, nearest.x, nearest.y, baseDmg);

        for (let i = 0; i < this.heroStats.extraBullets; i++) {
            const angle = Phaser.Math.Angle.Between(this.hero.x, this.hero.y, nearest.x, nearest.y);
            const off = (i + 1) * 0.26;
            this._fireBullet(this.hero.x, this.hero.y, this.hero.x + Math.cos(angle + off) * 200, this.hero.y + Math.sin(angle + off) * 200, baseDmg);
            this._fireBullet(this.hero.x, this.hero.y, this.hero.x + Math.cos(angle - off) * 200, this.hero.y + Math.sin(angle - off) * 200, baseDmg);
        }
    }

    _fireBullet(fx, fy, tx, ty, dmg) {
        const b = this.physics.add.sprite(fx, fy, 'bullet_hero').setDepth(8);
        b.setScale(this.heroStats.bulletScale);
        b.setData('dmg', dmg);
        b.setData('pierce', this.heroStats.pierce);
        this.bullets.add(b);
        const angle = Phaser.Math.Angle.Between(fx, fy, tx, ty);
        b.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280);
        this.time.delayedCall(1500, () => this._killBullet(b));
    }

    _killBullet(b) { if (b && b.active) b.destroy(); }

    _spawnEnemy(type) {
        const stats = EnemySpawner.getEnemyStats(type, this.stage);
        const cam = this.cameras.main;
        const margin = 30;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = cam.scrollX + Math.random() * cam.width; y = cam.scrollY - margin; }
        else if (side === 1) { x = cam.scrollX + Math.random() * cam.width; y = cam.scrollY + cam.height + margin; }
        else if (side === 2) { x = cam.scrollX - margin; y = cam.scrollY + Math.random() * cam.height; }
        else { x = cam.scrollX + cam.width + margin; y = cam.scrollY + Math.random() * cam.height; }
        x = Phaser.Math.Clamp(x, 10, this.MW - 10);
        y = Phaser.Math.Clamp(y, 10, this.MH - 10);

        const e = this.physics.add.sprite(x, y, 'enemy_' + type).setDepth(5);
        e.body.setSize(stats.size, stats.size);
        e.setData('type', type); e.setData('hp', stats.hp); e.setData('maxHp', stats.hp);
        e.setData('spd', stats.spd); e.setData('dmg', stats.dmg); e.setData('exp', stats.exp);
        e.setData('slowUntil', 0); e.setData('stunUntil', 0); e.setData('bleedUntil', 0); e.setData('burnUntil', 0);
        e.setData('hpBar', this.add.graphics().setDepth(6));
        this.enemies.add(e);
        this.waveEnemiesLeft++;
    }

    _enemyShoot(e, time) {
        e.setData('lastShot', time);
        const b = this.physics.add.sprite(e.x, e.y, 'bullet_enemy').setDepth(4);
        b.setData('dmg', e.getData('dmg'));
        this.enemyBullets.add(b);
        const angle = Phaser.Math.Angle.Between(e.x, e.y, this.hero.x, this.hero.y);
        b.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
        this.time.delayedCall(3000, () => { if (b.active) b.destroy(); });
    }

    _bossShoot(e, time) {
        e.setData('lastBossShot', time);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const b = this.physics.add.sprite(e.x, e.y, 'bullet_enemy').setDepth(4);
            b.setData('dmg', e.getData('dmg'));
            this.enemyBullets.add(b);
            b.setVelocity(Math.cos(angle) * 80, Math.sin(angle) * 80);
            this.time.delayedCall(4000, () => { if (b.active) b.destroy(); });
        }
    }

    _killEnemy(e) {
        SFX.play('kill');
        const hpBar = e.getData('hpBar');
        if (hpBar) hpBar.destroy();
        const exp = e.getData('exp');
        e.destroy();
        this.waveEnemiesLeft--;
        this.totalKills++;
        this.heroStats.kills++;

        if (this.heroStats.lifeSteal > 0) {
            const heal = Math.floor(this.heroStats.maxHp * this.heroStats.lifeSteal);
            this.heroStats.heal(heal);
            this._floatText(this.hero.x, this.hero.y - 15, '+' + heal, '#44ff44');
        }

        const leveled = this.heroStats.addExp(exp);
        if (leveled) {
            SFX.play('levelup');
            this.time.delayedCall(100, () => this._showSkillSelect());
        }
    }

    _drawEnemyHpBar(e) {
        const bar = e.getData('hpBar');
        if (!bar) return;
        bar.clear();
        const w = e.getData('type') === 'boss' ? 30 : 16;
        const pct = e.getData('hp') / e.getData('maxHp');
        bar.fillStyle(0x333333); bar.fillRect(e.x - w / 2, e.y - e.height / 2 - 5, w, 3);
        const c = pct > 0.5 ? 0x44ff44 : pct > 0.2 ? 0xffaa00 : 0xff4444;
        bar.fillStyle(c); bar.fillRect(e.x - w / 2, e.y - e.height / 2 - 5, w * pct, 3);
    }

    _bulletHitEnemy(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;
        const dmg = bullet.getData('dmg');
        enemy.setData('hp', enemy.getData('hp') - dmg);
        this._floatText(enemy.x, enemy.y - 12, '-' + dmg, '#ffff44');

        let pierce = bullet.getData('pierce');
        if (pierce > 0) bullet.setData('pierce', pierce - 1);
        else this._killBullet(bullet);

        if (enemy.getData('hp') <= 0) this._killEnemy(enemy);
        else { enemy.setTint(0xffffff); this.time.delayedCall(60, () => { if (enemy.active) enemy.clearTint(); }); }
    }

    _enemyHitHero(hero, enemy) {
        if (!enemy.active) return;
        const now = this.time.now;
        if (now - this.lastEnemyDmg < 500 || now < this.invincibleUntil) return;
        this.lastEnemyDmg = now;
        this._takeDamage(enemy.getData('dmg'));
    }

    _eBulletHitHero(hero, bullet) {
        if (!bullet.active) return;
        if (this.time.now < this.invincibleUntil) { bullet.destroy(); return; }
        const dmg = bullet.getData('dmg');
        bullet.destroy();
        this._takeDamage(dmg);
    }

    _takeDamage(dmg) {
        SFX.play('damage');
        const dead = this.heroStats.takeDamage(dmg);
        this._floatText(this.hero.x, this.hero.y - 20, '-' + dmg, '#ff4444');
        this.cameras.main.shake(100, 0.008);
        this.hero.setTint(0xff4444);
        this.time.delayedCall(100, () => { if (this.hero.active) this.hero.clearTint(); });
        if (dead) this._gameOver();
    }

    _showStageTitle(cb) {
        const t = this.add.text(this.SW / 2, this.SH / 2, '\u7b2c ' + this.stage + ' \u5173', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        this.tweens.add({ targets: t, alpha: 0, y: this.SH / 2 - 40, duration: 1500, onComplete: () => { t.destroy(); cb(); } });
    }

    _startWave() {
        if (this.paused) return;
        const waves = EnemySpawner.getWaves(this.stage);
        if (this.waveIndex >= waves.length) { this._stageClear(); return; }

        const wave = waves[this.waveIndex];
        this.waveAllSpawned = false;
        this.wavePendingSpawns = 0;
        this.waveEnemiesLeft = 0;

        const label = wave.isBoss ? '- BOSS -' : '\u7b2c ' + (this.waveIndex + 1) + ' \u6ce2';
        const color = wave.isBoss ? '#ff4444' : '#aaaacc';
        const wt = this.add.text(this.SW / 2, this.SH / 2, label, {
            fontSize: wave.isBoss ? '24px' : '18px', fontFamily: 'monospace', color, fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
        if (wave.isBoss) this.cameras.main.shake(400, 0.015);
        this.tweens.add({ targets: wt, alpha: 0, duration: 1200, onComplete: () => wt.destroy() });

        let totalSpawns = 0;
        for (const group of wave.enemies) totalSpawns += group.count;
        this.wavePendingSpawns = totalSpawns;

        let delay = 300;
        let spawnIdx = 0;
        for (const group of wave.enemies) {
            for (let i = 0; i < group.count; i++) {
                const isLast = (++spawnIdx === totalSpawns);
                this.time.delayedCall(delay + i * 250, () => {
                    this._spawnEnemy(group.type);
                    this.wavePendingSpawns--;
                    if (this.wavePendingSpawns <= 0) this.waveAllSpawned = true;
                });
            }
            delay += group.count * 250 + 300;
        }
    }

    _nextWave() {
        this.waveIndex++;
        if (this.waveIndex >= EnemySpawner.getWaves(this.stage).length) this._stageClear();
        else this.time.delayedCall(2000, () => this._startWave());
    }

    _stageClear() {
        this.paused = true;
        const coins = this.totalKills + this.stage * 15;
        this.registry.set('battleKills', this.totalKills);
        this.registry.set('battleStage', this.stage + 1);
        this.registry.set('battleCoins', coins);
        this.scene.start('StageClearScene');
    }

    _gameOver() {
        this.paused = true;
        this.registry.set('battleKills', this.totalKills);
        this.registry.set('battleStage', this.stage);
        this.registry.set('battleCoins', this.totalKills + (this.stage - 1) * 15);
        this.scene.start('GameOverScene');
    }

    _castSkill(time) {
        const skill = this.heroStats.skill;
        const dmg = this.heroStats.skillDmg;
        const rm = this.heroStats.skillRangeMult;
        this.cameras.main.flash(50, 100, 150, 255);

        switch (skill.type) {
            case 'melee_arc': this._skillMeleeArc(skill, dmg, rm, time); break;
            case 'blink_bomb': this._skillBlinkBomb(skill, dmg, rm, time); break;
            case 'aoe_ring': this._skillAoeRing(skill, dmg, rm, time); break;
            case 'summon': this._skillSummon(skill, time); break;
            case 'screen_dive': this._skillScreenDive(skill, dmg, rm, time); break;
            case 'cone_fire': this._skillConeFire(skill, dmg, rm, time); break;
            case 'heal_shield': this._skillHealShield(skill, time); break;
            case 'stealth': this._skillStealth(skill, time); break;
        }
    }

    _skillMeleeArc(skill, dmg, rm, time) {
        const range = skill.range * rm;
        const hx = this.hero.x, hy = this.hero.y;
        const target = this._findTarget();
        const aimAngle = target ? Phaser.Math.Angle.Between(hx, hy, target.x, target.y) : -Math.PI / 2;
        const halfA = Phaser.Math.DegToRad(skill.angle / 2);

        SFX.play('skill');
        const g = this.add.graphics().setDepth(15);
        for (let i = 0; i < 3; i++) {
            g.fillStyle(0xff4444, 0.35 - i * 0.1);
            g.slice(hx, hy, range - i * 6, aimAngle - halfA, aimAngle + halfA, false); g.fillPath();
        }
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.1, scaleY: 1.1, duration: 350, onComplete: () => g.destroy() });
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            const dist = Phaser.Math.Distance.Between(hx, hy, e.x, e.y);
            const a = Phaser.Math.Angle.Between(hx, hy, e.x, e.y);
            if (dist < range && Math.abs(Phaser.Math.Angle.Wrap(a - aimAngle)) < halfA)
                this._damageEnemy(e, dmg * skill.hits, skill.effect, time);
        });
    }

    _skillBlinkBomb(skill, dmg, rm, time) {
        SFX.play('explosion');
        const ox = this.hero.x, oy = this.hero.y;
        this.hero.setPosition(
            Phaser.Math.Clamp(ox + (Math.random() - 0.5) * 200, 30, this.MW - 30),
            Phaser.Math.Clamp(oy + (Math.random() - 0.5) * 200, 30, this.MH - 30));
        const range = skill.range * rm;
        const g = this.add.graphics().setDepth(15);
        g.fillStyle(0xff8844, 0.45); g.fillCircle(ox, oy, range * 0.3);
        g.fillStyle(0xff6622, 0.25); g.fillCircle(ox, oy, range * 0.6);
        g.fillStyle(0xff4400, 0.12); g.fillCircle(ox, oy, range);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 450, onComplete: () => g.destroy() });
        this._damageAt(ox, oy, range, dmg * skill.hits, skill.effect, time);
    }

    _skillAoeRing(skill, dmg, rm, time) {
        SFX.play('explosion');
        const range = skill.range * rm;
        const hx = this.hero.x, hy = this.hero.y;
        for (let i = 0; i < 3; i++) {
            const ring = this.add.graphics().setDepth(15);
            ring.fillStyle(0xaa44ff, 0.2 - i * 0.05); ring.fillCircle(hx, hy, range * 0.3);
            this.tweens.add({ targets: ring, scaleX: 3 + i, scaleY: 3 + i, alpha: 0, duration: 400 + i * 80, onComplete: () => ring.destroy() });
        }
        this.cameras.main.shake(150, 0.008);
        this._damageInRange(range, dmg * skill.hits, skill.effect, time);
    }

    _skillSummon(skill, time) {
        SFX.play('skill');
        const count = skill.hits;
        const flash = this.add.graphics().setDepth(14);
        flash.fillStyle(0xffff88, 0.3); flash.fillCircle(this.hero.x, this.hero.y, 25);
        this.tweens.add({ targets: flash, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300, onComplete: () => flash.destroy() });
        this._floatText(this.hero.x, this.hero.y - 20, '\u53ec\u5524\u00d7' + count + '!', '#ffcc44');

        for (let i = 0; i < count; i++) {
            const angleOffset = (i / count) * Math.PI * 2;
            const g = this.add.graphics().setDepth(9);
            g.fillStyle(this.card.bodyColor); g.fillRect(-4, -4, 8, 8);
            g.fillStyle(this.card.darkColor); g.fillRect(-4, 2, 8, 3); g.fillRect(-5, -3, 2, 3); g.fillRect(3, -3, 2, 3);
            g.fillStyle(0x111122); g.fillRect(-2, -1, 2, 2); g.fillRect(1, -1, 2, 2);
            g.fillStyle(0xffffff); g.fillRect(-2, -1, 1, 1); g.fillRect(1, -1, 1, 1);
            g.fillStyle(0xff6688); g.fillRect(-0.5, 1, 1, 1);

            this.summons.push({
                sprite: g, expiry: time + (skill.duration || 3) * 1000, lastShot: time,
                orbitAngle: angleOffset, orbitRadius: 35, orbitSpeed: 2.5,
            });
        }
    }

    _skillScreenDive(skill, dmg, rm, time) {
        SFX.play('explosion');
        this.cameras.main.flash(250, 180, 220, 255);
        this.cameras.main.shake(200, 0.01);
        const hx = this.hero.x, hy = this.hero.y;
        for (let i = 0; i < 3; i++) {
            const ring = this.add.graphics().setDepth(15);
            ring.lineStyle(2 - i * 0.5, 0x88ccff, 0.4 - i * 0.1); ring.strokeCircle(hx, hy, 20);
            this.tweens.add({ targets: ring, scaleX: 6 + i * 2, scaleY: 6 + i * 2, alpha: 0, duration: 500 + i * 100, onComplete: () => ring.destroy() });
        }
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            if (Phaser.Math.Distance.Between(hx, hy, e.x, e.y) < skill.range * rm)
                this._damageEnemy(e, dmg * skill.hits, skill.effect, time);
        });
    }

    _skillConeFire(skill, dmg, rm, time) {
        SFX.play('skill');
        const range = skill.range * rm;
        const hx = this.hero.x, hy = this.hero.y;
        let heroAngle = 0;
        const target = this._findTarget();
        if (target) heroAngle = Phaser.Math.Angle.Between(hx, hy, target.x, target.y);
        const halfA = Phaser.Math.DegToRad(skill.angle / 2);
        const g = this.add.graphics().setDepth(15);
        const flameColors = [0xff6600, 0xff8800, 0xffaa00, 0xffcc44];
        for (let i = 0; i < 4; i++) {
            g.fillStyle(flameColors[i], 0.3 - i * 0.06);
            g.slice(hx, hy, range - i * 8, heroAngle - halfA, heroAngle + halfA, false); g.fillPath();
        }
        this.tweens.add({ targets: g, alpha: 0, duration: 450, onComplete: () => g.destroy() });
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            const dist = Phaser.Math.Distance.Between(hx, hy, e.x, e.y);
            const a = Phaser.Math.Angle.Between(hx, hy, e.x, e.y);
            if (dist < range && Math.abs(Phaser.Math.Angle.Wrap(a - heroAngle)) < halfA)
                this._damageEnemy(e, dmg * skill.hits, skill.effect || 'burn', time);
        });
    }

    _skillHealShield(skill, time) {
        SFX.play('levelup');
        const heal = Math.floor(this.heroStats.maxHp * (skill.healPct || 0.2));
        this.heroStats.heal(heal);
        this._floatText(this.hero.x, this.hero.y - 20, '+' + heal, '#44ff88');
        const hx = this.hero.x, hy = this.hero.y;
        const g = this.add.graphics().setDepth(15);
        g.fillStyle(0x44ff88, 0.2); g.fillCircle(hx, hy, 22);
        g.fillStyle(0x88ffaa, 0.1); g.fillCircle(hx, hy, 30);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 1.6, scaleY: 1.6, duration: 600, onComplete: () => g.destroy() });
        if (skill.invincible) {
            this.invincibleUntil = time + skill.invincible * 1000;
            const shield = this.add.graphics().setDepth(15);
            shield.fillStyle(0xffff44, 0.15); shield.fillCircle(hx, hy, 20);
            shield.fillStyle(0xffffaa, 0.08); shield.fillCircle(hx, hy, 26);
            this.tweens.add({ targets: shield, alpha: 0, duration: skill.invincible * 1000, onComplete: () => shield.destroy() });
        }
    }

    _skillStealth(skill, time) {
        SFX.play('skill');
        this.stealthUntil = time + (skill.duration || 2) * 1000;
        const g = this.add.graphics().setDepth(15);
        g.fillStyle(0x8844ff, 0.3); g.fillCircle(this.hero.x, this.hero.y, 20);
        this.tweens.add({ targets: g, alpha: 0, scaleX: 2, scaleY: 2, duration: 400, onComplete: () => g.destroy() });
        this._floatText(this.hero.x, this.hero.y - 20, '\u9690\u8eab!', '#aa88ff');
    }

    _summonShoot(s) {
        let nearest = null, minD = Infinity;
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            const d = Phaser.Math.Distance.Between(s.sprite.x, s.sprite.y, e.x, e.y);
            if (d < minD) { minD = d; nearest = e; }
        });
        if (!nearest || minD > 180) return;
        this._fireBullet(s.sprite.x, s.sprite.y, nearest.x, nearest.y, Math.floor(this.heroStats.atk * 0.5));
    }

    _damageInRange(range, dmg, effect, time) {
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            if (Phaser.Math.Distance.Between(this.hero.x, this.hero.y, e.x, e.y) < range)
                this._damageEnemy(e, dmg, effect, time);
        });
    }

    _damageAt(x, y, range, dmg, effect, time) {
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            if (Phaser.Math.Distance.Between(x, y, e.x, e.y) < range)
                this._damageEnemy(e, dmg, effect, time);
        });
    }

    _damageEnemy(e, dmg, effect, time) {
        e.setData('hp', e.getData('hp') - dmg);
        this._floatText(e.x, e.y - 12, '-' + dmg, '#ffaa44');
        if (effect === 'slow') e.setData('slowUntil', time + 2000);
        if (effect === 'stun') e.setData('stunUntil', time + 500);
        if (effect === 'bleed') e.setData('bleedUntil', time + 3000);
        if (effect === 'burn') e.setData('burnUntil', time + 3000);
        if (e.getData('hp') <= 0) this._killEnemy(e);
        else { e.setTint(0xffffff); this.time.delayedCall(60, () => { if (e.active) e.clearTint(); }); }
    }

    _showSkillSelect() {
        this.paused = true;
        this.physics.pause();
        const W = this.SW, H = this.SH;
        const choices = this.skillPool.roll3(this.heroStats);
        const grp = this.add.container(0, 0).setDepth(60).setScrollFactor(0);

        const overlay = this.add.graphics().setScrollFactor(0);
        overlay.fillStyle(0x000000, 0.88); overlay.fillRect(0, 0, W, H);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        grp.add(overlay);

        grp.add(this.add.text(W / 2, 180, '\u5347\u7ea7\uff01', {
            fontSize: '24px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0));
        grp.add(this.add.text(W / 2, 210, 'Lv.' + this.heroStats.level + '  \u9009\u62e9\u4e00\u9879\u5f3a\u5316', {
            fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc',
        }).setOrigin(0.5).setScrollFactor(0));

        choices.forEach((sk, i) => {
            const y = 270 + i * 120;
            const bg = this.add.graphics().setScrollFactor(0);
            bg.fillStyle(0x1a1a33); bg.fillRoundedRect(30, y - 40, W - 60, 100, 8);
            bg.lineStyle(2, 0x4466aa, 0.6); bg.strokeRoundedRect(30, y - 40, W - 60, 100, 8);
            grp.add(bg);

            grp.add(this.add.text(88, y - 14, sk.name, {
                fontSize: '14px', fontFamily: 'monospace', color: '#ffffff', fontStyle: 'bold',
            }).setScrollFactor(0));
            grp.add(this.add.text(88, y + 6, sk.desc, {
                fontSize: '10px', fontFamily: 'monospace', color: '#999999', wordWrap: { width: 230 },
            }).setScrollFactor(0));

            const zone = this.add.zone(W / 2, y, W - 60, 100).setScrollFactor(0).setInteractive({ useHandCursor: true });
            grp.add(zone);
            zone.on('pointerdown', () => {
                this.skillPool.pick(sk, this.heroStats);
                this._floatText(this.hero.x, this.hero.y - 25, sk.name + '!', '#ffcc44');
                grp.destroy();
                this.paused = false;
                this.physics.resume();
            });
        });
    }

    _createHUD() {
        const S = this.SW;
        const hpBg = this.add.graphics().fillStyle(0x333333).fillRect(10, 10, 140, 10).setDepth(40).setScrollFactor(0);
        this.hpBar = this.add.graphics().setDepth(40).setScrollFactor(0);
        this.hpText = this.add.text(80, 15, '', { fontSize: '8px', fontFamily: 'monospace', color: '#fff' }).setOrigin(0.5).setDepth(40).setScrollFactor(0);

        const expBg = this.add.graphics().fillStyle(0x222233).fillRect(10, 22, 140, 5).setDepth(40).setScrollFactor(0);
        this.expBar = this.add.graphics().setDepth(40).setScrollFactor(0);

        this.lvText = this.add.text(10, 30, '', { fontSize: '8px', fontFamily: 'monospace', color: '#aac' }).setDepth(40).setScrollFactor(0);
        this.stageText = this.add.text(S - 10, 10, '', { fontSize: '12px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold' }).setOrigin(1, 0).setDepth(40).setScrollFactor(0);
        this.waveText = this.add.text(S - 10, 26, '', { fontSize: '9px', fontFamily: 'monospace', color: '#888' }).setOrigin(1, 0).setDepth(40).setScrollFactor(0);
        this.killText = this.add.text(S - 10, 38, '', { fontSize: '8px', fontFamily: 'monospace', color: '#aaa' }).setOrigin(1, 0).setDepth(40).setScrollFactor(0);
        this.cdText = this.add.text(S / 2, this.SH - 50, '', { fontSize: '10px', fontFamily: 'monospace', color: '#88aaff' }).setOrigin(0.5).setDepth(40).setScrollFactor(0);
        this.skillNameText = this.add.text(S / 2, this.SH - 38, this.heroStats.skill.name, { fontSize: '8px', fontFamily: 'monospace', color: '#666' }).setOrigin(0.5).setDepth(40).setScrollFactor(0);

        const pauseBtn = this.add.graphics().setDepth(41).setScrollFactor(0);
        pauseBtn.fillStyle(0x000000, 0.4); pauseBtn.fillRoundedRect(10, this.SH - 30, 50, 22, 4);
        this.add.text(35, this.SH - 19, '\u6682\u505c', { fontSize: '9px', fontFamily: 'monospace', color: '#aaa' }).setOrigin(0.5).setDepth(41).setScrollFactor(0);
        this.add.zone(35, this.SH - 19, 50, 22).setDepth(42).setScrollFactor(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this._showPauseMenu());
    }

    _showPauseMenu() {
        if (this.paused) return;
        this.paused = true;
        this.physics.pause();
        const W = this.SW, H = this.SH;
        const grp = this.add.container(0, 0).setDepth(70).setScrollFactor(0);
        const ov = this.add.graphics().setScrollFactor(0);
        ov.fillStyle(0x000000, 0.85); ov.fillRect(0, 0, W, H);
        ov.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        grp.add(ov);

        grp.add(this.add.text(W / 2, H / 2 - 80, '\u6682\u505c', {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffcc44', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0));

        this._pauseBtn(grp, W / 2, H / 2 + 10, '\u7ee7\u7eed\u6218\u6597', 0x3366cc, () => {
            grp.destroy(); this.paused = false; this.physics.resume();
        });
        this._pauseBtn(grp, W / 2, H / 2 + 60, '\u9000\u51fa\u6218\u6597', 0x883333, () => {
            grp.destroy(); MusicManager.playMenuMusic(); this.scene.start('MainScene');
        });
    }

    _pauseBtn(parent, x, y, text, color, cb) {
        const w = 200, h = 38;
        const g = this.add.graphics().setScrollFactor(0);
        g.fillStyle(color); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        parent.add(g);
        parent.add(this.add.text(x, y, text, { fontSize: '14px', fontFamily: 'monospace', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0));
        const z = this.add.zone(x, y, w, h).setScrollFactor(0).setDepth(71).setInteractive({ useHandCursor: true });
        z.on('pointerdown', cb); parent.add(z);
    }

    _updateHUD(time) {
        const hs = this.heroStats;
        this.hpBar.clear();
        const hpPct = hs.hp / hs.maxHp;
        this.hpBar.fillStyle(hpPct > 0.5 ? 0x44ff44 : hpPct > 0.2 ? 0xffaa00 : 0xff4444);
        this.hpBar.fillRect(10, 10, 140 * hpPct, 10);
        this.hpText.setText(hs.hp + '/' + hs.maxHp);

        this.expBar.clear();
        this.expBar.fillStyle(0x4488ff);
        this.expBar.fillRect(10, 22, 140 * (hs.exp / hs.expNeeded), 5);

        this.lvText.setText('Lv.' + hs.level);
        this.stageText.setText('\u7b2c' + this.stage + '\u5173');
        this.waveText.setText('\u6ce2\u6b21 ' + Math.min(this.waveIndex + 1, 9) + '/9');
        this.killText.setText('\u51fb\u6740 ' + this.totalKills);

        const cdLeft = Math.max(0, (this.lastSkill + hs.skillCD * 1000 - time) / 1000);
        this.cdText.setText(cdLeft > 0.1 ? cdLeft.toFixed(1) + 's' : '\u6280\u80fd\u5c31\u7eea');
        this.cdText.setColor(cdLeft > 0.1 ? '#666688' : '#88aaff');
    }

    _findTarget() {
        let nearest = null, minDist = Infinity;
        let boss = null, bossDist = Infinity;
        this.enemies.children.iterate(e => {
            if (!e || !e.active) return;
            const d = Phaser.Math.Distance.Between(this.hero.x, this.hero.y, e.x, e.y);
            if (e.getData('type') === 'boss' && d < bossDist) { boss = e; bossDist = d; }
            if (d < minDist) { minDist = d; nearest = e; }
        });
        return (boss && bossDist < 400) ? boss : nearest;
    }

    _floatText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
            fontSize: '11px', fontFamily: 'monospace', color, fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: t, y: y - 25, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }
}
