/**
 * Sakura Petal Particle System
 * Cherry blossom petals falling with wind drift and rotation
 */

(function () {
    'use strict';

    const canvas = document.getElementById('sakura-canvas');
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let petals = [];
    let trailPetals = [];
    let mouseX = 0;
    let mouseInfluence = 0;
    let lastMouseX = -1;
    let lastMouseY = -1;

    // Configuration
    const CONFIG = {
        petalCount: 90,
        minSize: 8,
        maxSize: 20,
        minSpeed: 0.5,
        maxSpeed: 1.8,
        minSway: 0.5,
        maxSway: 2.0,
        minOpacity: 0.5,
        maxOpacity: 0.9,
        windStrength: 1.5,
        colors: [
            'rgba(255, 182, 193, ',
            'rgba(255, 174, 201, ',
            'rgba(255, 192, 203, ',
            'rgba(255, 153, 180, ',
            'rgba(255, 210, 220, ',
            'rgba(255, 160, 190, '
        ]
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function pickColor() {
        return CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
    }

    // Petal class
    class Petal {
        constructor() {
            this.reset(true);
        }

        reset(initial) {
            this.x = random(-50, width + 50);
            this.y = initial ? random(-height, height) : random(-80, -20);
            this.size = random(CONFIG.minSize, CONFIG.maxSize);
            this.speed = random(CONFIG.minSpeed, CONFIG.maxSpeed);
            this.swayAmount = random(CONFIG.minSway, CONFIG.maxSway);
            this.swayOffset = random(0, Math.PI * 2);
            this.swaySpeed = random(0.01, 0.03);
            this.rotation = random(0, Math.PI * 2);
            this.rotationSpeed = random(-0.03, 0.03);
            this.opacity = random(CONFIG.minOpacity, CONFIG.maxOpacity);
            this.color = pickColor();
            // Depth layer: smaller petals are "further away"
            this.depth = this.size / CONFIG.maxSize;
        }

        update(time) {
            // Falling
            this.y += this.speed * (0.5 + this.depth);

            // Swaying (horizontal sine wave)
            const sway = Math.sin(time * this.swaySpeed + this.swayOffset) * this.swayAmount;
            this.x += sway + CONFIG.windStrength * this.depth;

            // Mouse influence
            if (mouseInfluence > 0) {
                this.x += mouseX * 0.5 * this.depth;
            }

            // Rotation
            this.rotation += this.rotationSpeed;

            // Wrap around
            if (this.y > height + 30) {
                this.reset(false);
            }
            if (this.x > width + 50) {
                this.x = -40;
            }
            if (this.x < -50) {
                this.x = width + 40;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity * (0.6 + this.depth * 0.4);

            // Draw sakura petal shape
            const s = this.size;
            ctx.beginPath();
            // Petal shape: rounded base, pointed tip with slight notch
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(s * 0.5, -s * 0.2, s * 0.45, -s * 0.6, s * 0.08, -s);
            ctx.quadraticCurveTo(0, -s * 0.85, -s * 0.08, -s);
            ctx.bezierCurveTo(-s * 0.45, -s * 0.6, -s * 0.5, -s * 0.2, 0, 0);
            ctx.closePath();

            // Gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, -s);
            gradient.addColorStop(0, this.color + (this.opacity * 0.5) + ')');
            gradient.addColorStop(0.5, this.color + (this.opacity * 0.8) + ')');
            gradient.addColorStop(1, this.color + this.opacity + ')');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Subtle highlight
            ctx.globalAlpha = this.opacity * 0.3;
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.5, s * 0.12, s * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();

            ctx.restore();
        }
    }

    // Trail petal — spawned at mouse position, drifts and fades
    class TrailPetal {
        constructor(x, y) {
            this.x = x + random(-12, 12);
            this.y = y + random(-12, 12);
            this.size = random(6, 16);
            this.vx = random(-0.8, 0.8);
            this.vy = random(-1.5, -0.3);
            this.gravity = random(0.01, 0.03);
            this.swayAmount = random(0.3, 1.2);
            this.swayOffset = random(0, Math.PI * 2);
            this.swaySpeed = random(0.02, 0.05);
            this.rotation = random(0, Math.PI * 2);
            this.rotationSpeed = random(-0.04, 0.04);
            this.opacity = random(0.7, 1.0);
            this.fadeSpeed = random(0.004, 0.008);
            this.color = pickColor();
            this.life = 1;
        }

        update(time) {
            this.x += this.vx + Math.sin(time * this.swaySpeed + this.swayOffset) * this.swayAmount;
            this.y += this.vy;
            this.vy += this.gravity;
            this.rotation += this.rotationSpeed;
            this.life -= this.fadeSpeed;
            this.opacity = Math.max(0, this.life);
        }

        draw(ctx) {
            if (this.opacity <= 0) return;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.globalAlpha = this.opacity;

            const s = this.size;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(s * 0.5, -s * 0.2, s * 0.45, -s * 0.6, s * 0.08, -s);
            ctx.quadraticCurveTo(0, -s * 0.85, -s * 0.08, -s);
            ctx.bezierCurveTo(-s * 0.45, -s * 0.6, -s * 0.5, -s * 0.2, 0, 0);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, 0, 0, -s);
            gradient.addColorStop(0, this.color + (this.opacity * 0.5) + ')');
            gradient.addColorStop(0.5, this.color + (this.opacity * 0.8) + ')');
            gradient.addColorStop(1, this.color + this.opacity + ')');
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.globalAlpha = this.opacity * 0.3;
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.5, s * 0.12, s * 0.3, 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();

            ctx.restore();
        }

        isDead() {
            return this.opacity <= 0 || this.y > height + 30;
        }
    }

    function initPetals() {
        resize();
        petals = [];
        for (let i = 0; i < CONFIG.petalCount; i++) {
            petals.push(new Petal());
        }
    }

    let lastTime = 0;
    function animate(timestamp) {
        const time = timestamp * 0.01;
        ctx.clearRect(0, 0, width, height);

        // Fade mouse influence
        if (mouseInfluence > 0) {
            mouseInfluence *= 0.95;
        }

        for (const petal of petals) {
            petal.update(time);
            petal.draw(ctx);
        }

        // Update & draw trail petals
        for (let i = trailPetals.length - 1; i >= 0; i--) {
            const tp = trailPetals[i];
            tp.update(time);
            tp.draw(ctx);
            if (tp.isDead()) {
                trailPetals.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    // Mouse tracking — wind effect + trail spawning
    window.addEventListener('mousemove', function (e) {
        const centerX = width / 2;
        mouseX = (e.clientX - centerX) / centerX;
        mouseInfluence = 1;

        // Spawn trail petals along mouse movement path
        var cx = e.clientX;
        var cy = e.clientY;
        if (lastMouseX >= 0) {
            var dx = cx - lastMouseX;
            var dy = cy - lastMouseY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            // Spawn 1 petal per ~8px of movement, cap at 5 per event
            var count = Math.min(5, Math.floor(dist / 8));
            for (var i = 0; i < count; i++) {
                var t = i / Math.max(1, count);
                trailPetals.push(new TrailPetal(
                    lastMouseX + dx * t,
                    lastMouseY + dy * t
                ));
            }
        }
        lastMouseX = cx;
        lastMouseY = cy;
    });

    window.addEventListener('resize', function () {
        resize();
    });

    // Start
    initPetals();
    requestAnimationFrame(animate);
})();
