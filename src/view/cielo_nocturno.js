'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — fondo de noche con estrellas dibujadas en canvas.
//        Usa scene.background con EquirectangularReflectionMapping para que
//        el panorama gire con la cámara: las estrellas se mueven al girar,
//        igual que un cielo real visto desde un auto.
// ================================================================
export class CieloNocturno extends Cielo {
    #textura = null;

    constructor(colorCielo) { super(colorCielo); }

    construir(scene) {
        this.#textura = new THREE.CanvasTexture(this._generarTextura());
        this.#textura.mapping = THREE.EquirectangularReflectionMapping;
        this.#textura.generateMipmaps = false;
        this.#textura.minFilter = THREE.LinearFilter;
        scene.background = this.#textura;
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    restaurar(scene) {
        if (this.#textura) scene.background = this.#textura;
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    actualizar(_camara) { /* el panorama equirectangular gira solo con la cámara, sin update manual */ }

    destruir(scene) {
        if (scene.background === this.#textura) scene.background = null;
        if (this.#textura) { this.#textura.dispose(); this.#textura = null; }
        scene.fog = null;
    }

    _generarTextura() {
        const W = 2048, H = 1024;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#010208');
        grad.addColorStop(0.60, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const rng = this.#rng(98765);

        // 300 estrellas pequeñas — círculos sólidos r=1-2.5px
        for (let i = 0; i < 300; i++) {
            const x  = rng() * W;
            const y  = rng() * H * 0.55;
            const r  = rng() * 1.5 + 1;
            const al = (rng() * 0.4 + 0.6).toFixed(2);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,240,${al})`;
            ctx.fill();
        }

        // 40 estrellas medianas con halo suave r=3-5px
        for (let i = 0; i < 40; i++) {
            const x = rng() * W;
            const y = rng() * H * 0.50;
            const r = rng() * 2 + 3;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0,   'rgba(255,255,255,1.0)');
            g.addColorStop(0.4, 'rgba(220,230,255,0.8)');
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
