'use strict';
import { ObjetoCielo } from './objeto_cielo.js';

// ================================================================
// CLASS: Montana — silueta 2D de montaña dibujada sobre el canvas
//        equirectangular del cielo nocturno.
//        posX: posición horizontal normalizada (0..1).
//        altura: altura del pico normalizada (0..1, mayor = más alto).
//        ancho: factor de anchura de la montaña.
// ================================================================
export class Montana extends ObjetoCielo {
    #posX;
    #altura;
    #ancho;

    constructor(posX, altura = 0.7, ancho = 0.20) {
        super();
        this.#posX   = posX;
        this.#altura = Math.max(0.1, Math.min(1, altura));
        this.#ancho  = ancho;
    }

    dibujar(ctx, W, H, rng, visible = true) {
        // Siempre consumir RNG para mantener semilla consistente
        const v1 = rng() * 0.06 - 0.03;
        const v2 = rng() * 0.06 - 0.03;

        if (!visible) return;

        const cx    = this.#posX * W;
        const hw    = this.#ancho * W * 0.14;
        const baseY = H * 0.514;
        const picY  = H * (0.502 - this.#altura * 0.085);

        // Interpola entre pico y base: t=0 → picY, t=1 → baseY
        const yAt = (t) => picY + (baseY - picY) * t;

        // Cordillera con 5 picos: 2 izq + principal (centro) + 2 der
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - hw,          baseY);
        ctx.lineTo(cx - hw * 0.85,   yAt(0.48 + v1));   // pie izq
        ctx.lineTo(cx - hw * 0.70,   yAt(0.18));         // sub-pico izq 1
        ctx.lineTo(cx - hw * 0.57,   yAt(0.34));         // col 1
        ctx.lineTo(cx - hw * 0.42,   yAt(0.11));         // sub-pico izq 2
        ctx.lineTo(cx - hw * 0.28,   yAt(0.26));         // col 2
        ctx.lineTo(cx - hw * 0.10,   yAt(0.04));         // hombro izq
        ctx.lineTo(cx,               picY);               // PICO PRINCIPAL
        ctx.lineTo(cx + hw * 0.10,   yAt(0.04));         // hombro der
        ctx.lineTo(cx + hw * 0.26,   yAt(0.20 + v2));    // col 3
        ctx.lineTo(cx + hw * 0.42,   yAt(0.09));         // sub-pico der 1
        ctx.lineTo(cx + hw * 0.56,   yAt(0.30));         // col 4
        ctx.lineTo(cx + hw * 0.72,   yAt(0.15));         // sub-pico der 2
        ctx.lineTo(cx + hw * 0.86,   yAt(0.44));         // pie der
        ctx.lineTo(cx + hw,          baseY);
        ctx.lineTo(cx + hw, H);
        ctx.lineTo(cx - hw, H);
        ctx.closePath();

        ctx.fillStyle = '#030c1e';
        ctx.fill();

        // Destello de luna sobre los picos
        ctx.clip();
        const luz = ctx.createLinearGradient(cx - hw * 0.35, picY, cx + hw * 0.6, picY + hw * 0.9);
        luz.addColorStop(0,   'rgba(160,185,230,0.13)');
        luz.addColorStop(0.5, 'rgba(100,140,200,0.06)');
        luz.addColorStop(1,   'rgba(60,100,180,0)');
        ctx.fillStyle = luz;
        ctx.fillRect(cx - hw, picY, hw * 2, baseY - picY + 5);
        ctx.restore();
    }
}
