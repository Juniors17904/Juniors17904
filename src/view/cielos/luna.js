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
        const r = W * 0.0066;

        // Disco lunar — color sólido sin halo para máxima nitidez
        const disco = ctx.createRadialGradient(x - r * 0.18, y - r * 0.18, 0, x, y, r);
        disco.addColorStop(0,    '#f0eedf');
        disco.addColorStop(0.6,  '#dddac8');
        disco.addColorStop(0.92, '#c8c4b0');
        disco.addColorStop(1,    '#b8b4a0');
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
