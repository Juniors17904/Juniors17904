'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — cielo oscuro con estrellas en canvas.
//        Dibuja círculos sólidos de 8-28px sobre canvas 2048×1024
//        para garantizar visibilidad tras el mapeo UV sobre la esfera.
// ================================================================
export class CieloNocturno extends Cielo {
    constructor(colorCielo) { super(colorCielo); }

    _generarTextura() {
        const W = 2048, H = 1024;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        // Fondo: negro puro arriba → color de la pista en horizonte
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#010208');
        grad.addColorStop(0.60, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const rng = this.#rng(98765);

        // 200 estrellas medianas — círculos sólidos sin transparencia
        for (let i = 0; i < 200; i++) {
            const x  = rng() * W;
            const y  = rng() * H * 0.65;
            const r  = rng() * 6 + 8;
            const al = (rng() * 0.3 + 0.7).toFixed(2);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,240,${al})`;
            ctx.fill();
        }

        // 25 estrellas grandes con halo
        for (let i = 0; i < 25; i++) {
            const x = rng() * W;
            const y = rng() * H * 0.55;
            const r = rng() * 10 + 18;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0,   'rgba(255,255,255,1.0)');
            g.addColorStop(0.4, 'rgba(220,230,255,0.85)');
            g.addColorStop(1,   'rgba(180,200,255,0)');
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
        }

        return lienzo;
    }

    #rng(semilla) {
        let s = semilla;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
