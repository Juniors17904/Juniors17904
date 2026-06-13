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
        const r = W * 0.013;   // ~27px en canvas 2048

        // Halo exterior amplio — resplandor azulado frío
        const haloExt = ctx.createRadialGradient(x, y, r * 0.9, x, y, r * 5.0);
        haloExt.addColorStop(0,   'rgba(200,215,255,0.28)');
        haloExt.addColorStop(0.4, 'rgba(160,185,240,0.12)');
        haloExt.addColorStop(1,   'rgba(120,155,220,0)');
        ctx.fillStyle = haloExt;
        ctx.beginPath();
        ctx.arc(x, y, r * 5.0, 0, Math.PI * 2);
        ctx.fill();

        // Halo interior cálido-blanco
        const halo = ctx.createRadialGradient(x, y, r * 0.85, x, y, r * 2.5);
        halo.addColorStop(0,   'rgba(245,242,228,0.55)');
        halo.addColorStop(0.5, 'rgba(230,228,210,0.20)');
        halo.addColorStop(1,   'rgba(210,215,200,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Disco lunar — blanco frío, luz desde arriba-izquierda
        const disco = ctx.createRadialGradient(x - r * 0.22, y - r * 0.22, 0, x, y, r);
        disco.addColorStop(0,   '#f8f8f2');
        disco.addColorStop(0.45, '#edeae0');
        disco.addColorStop(0.85, '#d8d4c8');
        disco.addColorStop(1,   '#c8c2b0');
        ctx.fillStyle = disco;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Sombra en el lado derecho para dar volumen esférico
        const sombra = ctx.createRadialGradient(x + r * 0.3, y + r * 0.2, r * 0.4, x, y, r);
        sombra.addColorStop(0,   'rgba(60,70,90,0)');
        sombra.addColorStop(0.6, 'rgba(40,55,80,0.08)');
        sombra.addColorStop(1,   'rgba(25,40,65,0.22)');
        ctx.fillStyle = sombra;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}
