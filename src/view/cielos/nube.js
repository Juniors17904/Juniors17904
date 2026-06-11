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

        // Sombra difusa de fondo — más pronunciada para dar volumen
        const gradBase = ctx.createRadialGradient(cx, cy + s * 0.1, 0, cx, cy, s * 2.2);
        gradBase.addColorStop(0,   'rgba(20,45,90,0.92)');
        gradBase.addColorStop(0.5, 'rgba(14,32,68,0.60)');
        gradBase.addColorStop(1,   'rgba(6,16,38,0)');
        ctx.fillStyle = gradBase;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 2.2, s * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Blobs que forman el cuerpo de la nube — más claros y contrastantes
        const _blob = (bx, by, rx, ry) => {
            const g = ctx.createRadialGradient(bx, by - ry * 0.2, 0, bx, by, Math.max(rx, ry));
            g.addColorStop(0,   'rgba(35,68,125,0.88)');
            g.addColorStop(0.4, 'rgba(22,48,95,0.72)');
            g.addColorStop(1,   'rgba(8,20,48,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        _blob(cx,             cy,             s * 1.6, s * 0.60);
        _blob(cx - s * 0.70,  cy + s * 0.05,  s * 0.9, s * 0.55);
        _blob(cx + s * 0.80,  cy + s * 0.05,  s * 1.0, s * 0.50);
        _blob(cx + s * 0.20,  cy - s * 0.35,  s * 0.85, s * 0.45);
        _blob(cx - s * 0.35,  cy - s * 0.28,  s * 0.75, s * 0.40);

        ctx.restore();
    }
}
