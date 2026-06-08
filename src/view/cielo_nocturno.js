'use strict';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — cielo nocturno con estrellas.
//        Usa un generador determinístico para que las estrellas
//        sean siempre las mismas (no cambian cada vez que se carga).
// ================================================================
export class CieloNocturno extends Cielo {

    constructor(colorCielo) {
        super(colorCielo);
    }

    _generarTextura() {
        const W = 512, H = 256;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        // ── Gradiente oscuro ──────────────────────────────────────
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,   '#' + this._colorArriba.getHexString());
        grad.addColorStop(0.7, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,   '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── Estrellas (determinísticas) ───────────────────────────
        const rng = this.#crearRng();
        for (let i = 0; i < 220; i++) {
            const x    = rng() * W;
            const y    = rng() * H * 0.72;      // solo en la mitad superior
            const r    = rng() * 1.1 + 0.3;
            const alfa = rng() * 0.55 + 0.45;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 215, ${alfa.toFixed(2)})`;
            ctx.fill();
        }

        return lienzo;
    }

    // Generador lineal congruencial — mismas estrellas siempre
    #crearRng() {
        let s = 98765;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
