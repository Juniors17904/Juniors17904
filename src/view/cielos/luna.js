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
        const r = W * 0.018;   // radio proporcional al ancho del canvas

        // Halo exterior difuso
        const halo = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.8);
        halo.addColorStop(0,   'rgba(255,240,180,0.18)');
        halo.addColorStop(0.4, 'rgba(255,225,140,0.07)');
        halo.addColorStop(1,   'rgba(255,210,100,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Disco lunar con degradado radial (luz viene de arriba-izquierda)
        const disco = ctx.createRadialGradient(x - r * 0.28, y - r * 0.28, 0, x, y, r);
        disco.addColorStop(0,   '#fffde8');
        disco.addColorStop(0.5, '#f5e49a');
        disco.addColorStop(1,   '#d4b84a');
        ctx.fillStyle = disco;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Sombra sutil en el lado opuesto para dar volumen
        const sombra = ctx.createRadialGradient(x + r * 0.35, y + r * 0.25, r * 0.45, x, y, r);
        sombra.addColorStop(0,   'rgba(90,60,20,0)');
        sombra.addColorStop(0.65,'rgba(70,45,10,0.10)');
        sombra.addColorStop(1,   'rgba(50,30,5,0.28)');
        ctx.fillStyle = sombra;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
}
