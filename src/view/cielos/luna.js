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
        const r = W * 0.0046;

        // Halo exterior atmosférico — glow azulado amplio
        const haloExt = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 6.0);
        haloExt.addColorStop(0,   'rgba(200,220,255,0.10)');
        haloExt.addColorStop(0.3, 'rgba(170,200,255,0.06)');
        haloExt.addColorStop(0.6, 'rgba(140,175,240,0.02)');
        haloExt.addColorStop(1,   'rgba(100,140,220,0)');
        ctx.fillStyle = haloExt;
        ctx.beginPath();
        ctx.arc(x, y, r * 6.0, 0, Math.PI * 2);
        ctx.fill();

        // Corona interior — warm glow alrededor del disco
        const haloInt = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 2.4);
        haloInt.addColorStop(0,   'rgba(255,250,220,0.22)');
        haloInt.addColorStop(0.4, 'rgba(230,240,255,0.10)');
        haloInt.addColorStop(1,   'rgba(180,210,255,0)');
        ctx.fillStyle = haloInt;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();

        // Disco lunar
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
        sombra.addColorStop(1,   'rgba(20,35,60,0.22)');
        ctx.fillStyle = sombra;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}
