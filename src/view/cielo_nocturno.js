'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — cielo oscuro con estrellas visibles.
//        Usa gradientes radiales de 4-20 px para que las estrellas
//        sean visibles después del mapeo UV sobre la esfera.
// ================================================================
export class CieloNocturno extends Cielo {
    constructor(colorCielo) { super(colorCielo); }

    _generarTextura() {
        const W = 1024, H = 512;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#010205');
        grad.addColorStop(0.5,  '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const rng = this.#crearRng(98765);
        for (let i = 0; i < 180; i++) {
            const x  = rng() * W;
            const y  = rng() * H * 0.65;
            const r  = rng() * 3 + 4;
            const br = rng() * 0.4 + 0.6;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
            glow.addColorStop(0,   `rgba(255,255,220,${br.toFixed(2)})`);
            glow.addColorStop(0.3, `rgba(255,255,200,${(br * 0.6).toFixed(2)})`);
            glow.addColorStop(1,   'rgba(255,255,200,0)');
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
        }

        const rng2 = this.#crearRng(44444);
        for (let i = 0; i < 22; i++) {
            const x = rng2() * W;
            const y = rng2() * H * 0.55;
            const r = rng2() * 8 + 12;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
            glow.addColorStop(0,    'rgba(255,255,245,1.0)');
            glow.addColorStop(0.15, 'rgba(220,230,255,0.9)');
            glow.addColorStop(0.4,  'rgba(180,200,255,0.3)');
            glow.addColorStop(1,    'rgba(150,180,255,0)');
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = glow;
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
