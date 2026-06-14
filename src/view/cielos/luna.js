'use strict';
import { ObjetoCielo } from './objeto_cielo.js';

// ================================================================
// CLASS: Luna — disco lunar con halo y volumen sobre la textura
//        equirectangular del cielo nocturno.
//        posX / posY: posición normalizada (0..1) dentro del canvas.
// ================================================================
export class Luna extends ObjetoCielo {
    #posX;
    #posY;

    constructor(posX = 0.15, posY = 0.20) {
        super();
        this.#posX = posX;
        this.#posY = posY;
    }

    dibujar(ctx, W, H, _rng) {
        const x = this.#posX * W;
        const y = this.#posY * H;
        const r = W * 0.022;

        // Halo atmosférico azulado difuso
        const haloExt = ctx.createRadialGradient(x, y, r, x, y, r * 4.0);
        haloExt.addColorStop(0,   'rgba(180,205,255,0.22)');
        haloExt.addColorStop(0.3, 'rgba(150,180,240,0.10)');
        haloExt.addColorStop(1,   'rgba(100,140,220,0)');
        ctx.fillStyle = haloExt;
        ctx.beginPath();
        ctx.arc(x, y, r * 4.0, 0, Math.PI * 2);
        ctx.fill();

        // Disco lunar — muy blanco y brillante, sombra leve en borde derecho
        const disco = ctx.createRadialGradient(x - r * 0.18, y - r * 0.18, 0, x, y, r);
        disco.addColorStop(0,    '#ffffff');
        disco.addColorStop(0.55, '#f5f4ee');
        disco.addColorStop(0.88, '#e8e4d8');
        disco.addColorStop(1,    '#d8d2c0');
        ctx.fillStyle = disco;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Sombra esférica leve
        const sombra = ctx.createRadialGradient(x + r * 0.28, y + r * 0.18, r * 0.3, x, y, r);
        sombra.addColorStop(0,   'rgba(50,60,85,0)');
        sombra.addColorStop(0.7, 'rgba(35,48,72,0.06)');
        sombra.addColorStop(1,   'rgba(20,35,60,0.18)');
        ctx.fillStyle = sombra;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}
