'use strict';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — cielo nocturno con estrellas visibles.
//        Canvas 1024×512 para que las estrellas sobrevivan el
//        mapeo UV al domo esférico sin desaparecer por antialiasing.
// ================================================================
export class CieloNocturno extends Cielo {

    constructor(colorCielo) {
        super(colorCielo);
    }

    _generarTextura() {
        const W = 1024, H = 512;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        // Gradiente: negro puro arriba → color horizonte de la pista abajo
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#020308');
        grad.addColorStop(0.65, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── Estrellas pequeñas (300 puntos, r 1–2.5 px) ──────────
        const rng = this.#crearRng(98765);
        for (let i = 0; i < 300; i++) {
            const x    = rng() * W;
            const y    = rng() * H * 0.72;
            const r    = rng() * 1.5 + 1.0;
            const alfa = rng() * 0.35 + 0.65;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,215,${alfa.toFixed(2)})`;
            ctx.fill();
        }

        // ── Estrellas brillantes (18 puntos con halo) ─────────────
        const rng2 = this.#crearRng(44444);
        for (let i = 0; i < 18; i++) {
            const x = rng2() * W;
            const y = rng2() * H * 0.62;
            const r = rng2() * 2.0 + 2.5;
            // Halo difuso
            ctx.beginPath();
            ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,210,255,0.12)';
            ctx.fill();
            // Núcleo brillante
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,245,0.95)';
            ctx.fill();
        }

        return lienzo;
    }

    #crearRng(semilla) {
        let s = semilla;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
