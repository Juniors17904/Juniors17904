'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloSoleado — cielo diurno con sol, halo y nubes.
//        Detecta automáticamente si el horizonte es cálido (naranja/
//        atardecer) o frío (azul/día) para ajustar posición del sol.
// ================================================================
export class CieloSoleado extends Cielo {

    constructor(colorCielo) {
        super(colorCielo);
    }

    get #esCalido() {
        return this._colorHorizonte.r > this._colorHorizonte.b + 0.1;
    }

    _generarTextura() {
        const W = 512, H = 256;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        const calido = this.#esCalido;

        // ── Gradiente de fondo ────────────────────────────────────
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#' + this._colorArriba.getHexString());
        grad.addColorStop(0.55, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // ── Sol: posición según temperatura del cielo ─────────────
        const sx = 380;
        const sy = calido ? 108 : 52;
        const [sr, sg, sb] = calido ? [255, 140, 40] : [255, 240, 120];

        // Halos concéntricos
        const halos = [[60, 0.04], [44, 0.07], [30, 0.12], [18, 0.22]];
        for (const [r, a] of halos) {
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${a})`;
            ctx.fill();
        }
        // Disco solar
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fillStyle = calido ? '#ffe580' : '#fffde0';
        ctx.fill();
        // Núcleo blanco
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // ── Nubes ─────────────────────────────────────────────────
        const cr = calido ? 'rgba(255,215,170,' : 'rgba(255,255,255,';
        const nubes = [
            [ 70, 170, 105, 24],
            [220, 182,  80, 19],
            [385, 168,  96, 21],
            [145, 198,  58, 14],
            [315, 192,  68, 16],
            [468, 178,  82, 18],
        ];
        for (const [x, y, rx, ry] of nubes) {
            for (let r = 1; r >= 0.3; r -= 0.25) {
                ctx.beginPath();
                ctx.ellipse(x, y, rx * r, ry * r, 0, 0, Math.PI * 2);
                ctx.fillStyle = `${cr}${(0.13 * (2 - r)).toFixed(2)})`;
                ctx.fill();
            }
        }

        return lienzo;
    }

    get posicionSol() {
        return this.#esCalido
            ? new THREE.Vector3(8, 4, 3)   // sol bajo — atardecer
            : new THREE.Vector3(6, 10, 4);  // sol alto — día soleado
    }
}
