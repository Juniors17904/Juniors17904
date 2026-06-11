'use strict';
import { ObjetoCielo } from './objeto_cielo.js';

// ================================================================
// CLASS: Nube — nube nocturna azul oscura dibujada como blobs
//        superpuestos sobre la textura del cielo.
//        posX / posY: posición normalizada (0..1). escala: tamaño.
// ================================================================
export class Nube extends ObjetoCielo {
    #posX;
    #posY;
    #escala;

    constructor(posX, posY, escala = 1) {
        super();
        this.#posX   = posX;
        this.#posY   = posY;
        this.#escala = escala;
    }

    dibujar(ctx, W, H, _rng) {
        const cx = this.#posX * W;
        const cy = this.#posY * H;
        const s  = this.#escala * W * 0.09;

        ctx.save();

        const _blob = (bx, by, rx, ry, opacidad = 1) => {
            const g = ctx.createRadialGradient(bx, by - ry * 0.3, 0, bx, by, Math.max(rx, ry));
            g.addColorStop(0,   `rgba(45,72,128,${0.88 * opacidad})`);
            g.addColorStop(0.4, `rgba(22,42,88,${0.72 * opacidad})`);
            g.addColorStop(1,   'rgba(6,14,38,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        // Sombra base difusa
        const gradBase = ctx.createRadialGradient(cx, cy + s * 0.1, 0, cx, cy, s * 2.0);
        gradBase.addColorStop(0,   'rgba(8,20,55,0.88)');
        gradBase.addColorStop(0.5, 'rgba(5,14,40,0.55)');
        gradBase.addColorStop(1,   'rgba(2,8,22,0)');
        ctx.fillStyle = gradBase;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 2.0, s * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cuerpo principal — blobs superpuestos para dar volumen
        _blob(cx,             cy,             s * 1.5, s * 0.55);
        _blob(cx - s * 0.65,  cy + s * 0.08,  s * 0.85, s * 0.50);
        _blob(cx + s * 0.75,  cy + s * 0.08,  s * 0.95, s * 0.48);
        _blob(cx + s * 0.18,  cy - s * 0.32,  s * 0.80, s * 0.42);
        _blob(cx - s * 0.32,  cy - s * 0.25,  s * 0.70, s * 0.38);

        // Protuberancias superiores — silueta irregular
        _blob(cx - s * 0.10,  cy - s * 0.55,  s * 0.55, s * 0.35);
        _blob(cx + s * 0.50,  cy - s * 0.48,  s * 0.45, s * 0.30);
        _blob(cx - s * 0.55,  cy - s * 0.40,  s * 0.40, s * 0.28);

        // Borde superior iluminado por la luna
        const luz = ctx.createRadialGradient(cx - s * 0.1, cy - s * 0.5, 0, cx - s * 0.1, cy - s * 0.2, s * 1.5);
        luz.addColorStop(0,   'rgba(160,190,240,0.20)');
        luz.addColorStop(0.4, 'rgba(110,145,205,0.09)');
        luz.addColorStop(1,   'rgba(60,90,160,0)');
        ctx.fillStyle = luz;
        ctx.beginPath();
        ctx.ellipse(cx, cy - s * 0.2, s * 1.8, s * 0.68, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
