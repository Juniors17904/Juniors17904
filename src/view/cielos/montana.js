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

    dibujar(ctx, W, H, rng) {
        const cx    = this.#posX * W;
        const hw    = this.#ancho * W * 0.14;
        const baseY = H * 0.514;
        const picY  = H * (0.502 - this.#altura * 0.085);

        const v1 = rng() * 0.05 - 0.025;
        const v2 = rng() * 0.05 - 0.025;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - hw, baseY);
        ctx.quadraticCurveTo(cx - hw * 0.72, baseY + (picY - baseY) * (0.55 + v1), cx - hw * 0.20, picY + H * 0.007);
        ctx.quadraticCurveTo(cx - hw * 0.06, picY - H * 0.003, cx, picY);
        ctx.quadraticCurveTo(cx + hw * 0.06, picY - H * 0.003, cx + hw * 0.20, picY + H * 0.007);
        ctx.quadraticCurveTo(cx + hw * 0.72, baseY + (picY - baseY) * (0.55 + v2), cx + hw, baseY);
        ctx.lineTo(cx + hw, H); ctx.lineTo(cx - hw, H);
        ctx.closePath();

        // Silueta oscura azul-noche
        ctx.fillStyle = '#030c1e';
        ctx.fill();

        // Destello de luna en el pico — lado superior izquierdo
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
