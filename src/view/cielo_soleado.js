'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloSoleado — cielo diurno con disco solar y halo.
//        Detecta si el cielo es cálido (atardecer) o frío (día)
//        para ajustar la posición y color del sol.
// ================================================================
export class CieloSoleado extends Cielo {
    constructor(colorCielo) { super(colorCielo); }

    get #esCalido() {
        return this._colorHorizonte.r > this._colorHorizonte.b + 0.1;
    }

    _generarTextura() {
        const W = 1024, H = 512;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#' + this._colorArriba.getHexString());
        grad.addColorStop(0.55, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const sy       = this.#esCalido ? 108 : 52;
        const solColor = this.#esCalido ? 'rgba(255,140,0,0.8)' : 'rgba(255,255,200,0.6)';

        const halo = ctx.createRadialGradient(380, sy, 0, 380, sy, 90);
        halo.addColorStop(0,   'rgba(255,220,100,0.35)');
        halo.addColorStop(0.5, 'rgba(255,200,60,0.12)');
        halo.addColorStop(1,   'rgba(255,180,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, W, H);

        const disco = ctx.createRadialGradient(380, sy, 0, 380, sy, 32);
        disco.addColorStop(0,   'rgba(255,255,255,1.0)');
        disco.addColorStop(0.3, this.#esCalido ? '#ffaa44' : '#fffff0');
        disco.addColorStop(0.7, solColor);
        disco.addColorStop(1,   'rgba(255,200,50,0)');
        ctx.beginPath();
        ctx.arc(380, sy, 32, 0, Math.PI * 2);
        ctx.fillStyle = disco;
        ctx.fill();

        return lienzo;
    }

    get posicionSol() {
        return this.#esCalido
            ? new THREE.Vector3(8, 4, 3)
            : new THREE.Vector3(6, 10, 4);
    }
}
