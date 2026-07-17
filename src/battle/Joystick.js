export class Joystick {
    constructor(scene, x, y, radius) {
        this.scene = scene;
        this.radius = radius;
        this.baseX = x;
        this.baseY = y;
        this.vector = { x: 0, y: 0 };

        // Base circle
        this.base = scene.add.graphics().setDepth(100);
        this.base.fillStyle(0xffffff, 0.08);
        this.base.fillCircle(x, y, radius);
        this.base.lineStyle(2, 0xffffff, 0.15);
        this.base.strokeCircle(x, y, radius);

        // Thumb
        this.thumb = scene.add.graphics().setDepth(101);
        this.thumb.fillStyle(0xffffff, 0.2);
        this.thumb.fillCircle(x, y, radius * 0.4);

        // Hit area covers a wider zone for mobile
        this.hitArea = scene.add.zone(x, y, radius * 4, radius * 4)
            .setDepth(99)
            .setInteractive();

        this.active = false;
        this.pointerId = null;

        scene.input.on('pointerdown', (pointer) => {
            const dx = pointer.x - x, dy = pointer.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < radius * 2) {
                this.active = true;
                this.pointerId = pointer.id;
            }
        });

        scene.input.on('pointermove', (pointer) => {
            if (pointer.id !== this.pointerId) return;
            this._update(pointer.x, pointer.y);
        });

        scene.input.on('pointerup', (pointer) => {
            if (pointer.id === this.pointerId) this._reset();
        });
    }

    _update(px, py) {
        let dx = px - this.baseX, dy = py - this.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.radius) {
            dx = (dx / dist) * this.radius;
            dy = (dy / dist) * this.radius;
        }
        this.thumb.setPosition(this.baseX + dx, this.baseY + dy);
        this.vector = { x: dx / this.radius, y: dy / this.radius };
    }

    _reset() {
        this.active = false;
        this.pointerId = null;
        this.thumb.setPosition(this.baseX, this.baseY);
        this.vector = { x: 0, y: 0 };
    }
}
