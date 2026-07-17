export class SkillPool {
    constructor(card) {
        this.card = card;
    }

    static UPGRADES = [
        { name: '攻击力+5', desc: '基础攻击力提升5点', icon: '⚔', apply: (hs) => { hs.atk += 5; } },
        { name: '最大生命+40', desc: '生命上限增加40点', icon: '♥', apply: (hs) => { hs.maxHp += 40; hs.hp += 40; } },
        { name: '攻击速度+0.5', desc: '每秒攻击次数增加0.5', icon: '⚡', apply: (hs) => { hs.atkSpd += 0.5; } },
        { name: '技能冷却-1s', desc: '技能冷却时间减少1秒', icon: '🌀', apply: (hs) => { hs.skillCD = Math.max(1, hs.skillCD - 1); } },
        { name: '移速+15', desc: '移动速度提升15点', icon: '👟', apply: (hs) => { hs.spd += 15; } },
        { name: '技能伤害+15', desc: '技能伤害提升15点', icon: '💥', apply: (hs) => { hs.skillDmg += 15; } },
        { name: '弹幕+1', desc: '每次攻击额外射出1颗子弹', icon: '🎯', apply: (hs) => { hs.extraBullets = (hs.extraBullets || 0) + 1; } },
        { name: '穿透+1', desc: '子弹穿透敌人次数+1', icon: '🔱', apply: (hs) => { hs.pierce = (hs.pierce || 0) + 1; } },
        { name: '吸血+5%', desc: '击杀敌人时回复5%生命', icon: '🩸', apply: (hs) => { hs.lifeSteal = (hs.lifeSteal || 0) + 0.05; } },
        { name: '子弹变大', desc: '子弹尺寸增加20%', icon: '🔵', apply: (hs) => { hs.bulletScale = (hs.bulletScale || 1) + 0.2; } },
        { name: '技能范围+15%', desc: '技能有效范围扩大15%', icon: '🔶', apply: (hs) => { hs.skillRangeMult = (hs.skillRangeMult || 1) + 0.15; } },
        { name: '生命全回复', desc: '立即回复全部生命值', icon: '💚', apply: (hs) => { hs.hp = hs.maxHp; } },
    ];

    roll3(heroStats) {
        const pool = [...SkillPool.UPGRADES];
        const picked = [];
        for (let i = 0; i < 3; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            picked.push(...pool.splice(idx, 1));
        }
        return picked;
    }

    pick(upgrade, heroStats) {
        upgrade.apply(heroStats);
    }
}
