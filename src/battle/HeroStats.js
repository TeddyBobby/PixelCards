import { PixelArt } from '../utils/PixelArt.js';

export class HeroStats {
    constructor(card) {
        const base = PixelArt.HERO_STATS;
        const skillData = PixelArt.SKILLS[card.creatureType]?.[card.rarity] || { type: 'melee_arc', hits: 1 };

        this.maxHp = base.hp;
        this.hp = base.hp;
        this.atk = base.atk;
        this.spd = base.spd;
        this.atkSpd = base.atkSpd;
        this.skillCD = base.skillCD;
        this.skillDmg = base.skillDmg;
        this.skill = skillData;
        this.skillRangeMult = 1;

        // Perks from upgrades
        this.extraBullets = 0;
        this.pierce = 0;
        this.lifeSteal = 0;
        this.bulletScale = 1;
        this.kills = 0;

        this._exp = 0;
        this._level = 1;
        this._expNeeded = 50;
    }

    get level() { return this._level; }
    get exp() { return this._exp; }
    get expNeeded() { return this._expNeeded; }

    addExp(amount) {
        this._exp += amount;
        if (this._exp >= this._expNeeded) {
            this._level++;
            this._exp -= this._expNeeded;
            this._expNeeded = Math.floor(this._expNeeded * 1.5);
            return true; // leveled up
        }
        return false;
    }

    takeDamage(dmg) {
        this.hp -= dmg;
        return this.hp <= 0;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
}
