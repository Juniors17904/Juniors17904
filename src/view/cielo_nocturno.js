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

        // Gradiente azul oscuro → púrpura, igual que la imagen de referencia
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#050310');
        grad.addColorStop(0.35, '#0d0b2e');
        grad.addColorStop(0.70, '#1e1060');
        grad.addColorStop(1,    '#2d1457');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        const rng = this.#rng(98765);

        // 500 estrellas de fondo — puntitos r=0.3-0.8px
        for (let i = 0; i < 500; i++) {
            const x  = rng() * W;
            const y  = rng() * H * 0.65;
            const r  = rng() * 0.5 + 0.3;
            const al = (rng() * 0.5 + 0.5).toFixed(2);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(210,220,255,${al})`;
            ctx.fill();
        }

        // 35 estrellas medianas con glow azul-blanco r=1-2px
        for (let i = 0; i < 35; i++) {
            const x = rng() * W;
            const y = rng() * H * 0.58;
            const r = rng() * 1 + 1;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
            g.addColorStop(0,   'rgba(230,235,255,1.0)');
            g.addColorStop(0.3, 'rgba(180,200,255,0.5)');
            g.addColorStop(1,   'rgba(140,170,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 7 estrellas brillantes con efecto cruz/sparkle
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 7; i++) {
            const x  = rng() * W;
            const y  = rng() * H * 0.52;
            const tam = rng() * 4 + 3;     // longitud del brazo horizontal
            const tamV = tam * 0.55;       // brazo vertical más corto
            const gr  = rng() * 0.3 + 0.5; // grosor del trazo

            // Brazo horizontal
            const gH = ctx.createLinearGradient(x - tam, y, x + tam, y);
            gH.addColorStop(0,   'rgba(255,255,255,0)');
            gH.addColorStop(0.5, 'rgba(255,255,255,0.95)');
            gH.addColorStop(1,   'rgba(255,255,255,0)');
            ctx.strokeStyle = gH;
            ctx.lineWidth   = gr;
            ctx.beginPath(); ctx.moveTo(x - tam, y); ctx.lineTo(x + tam, y); ctx.stroke();

            // Brazo vertical
            const gV = ctx.createLinearGradient(x, y - tamV, x, y + tamV);
            gV.addColorStop(0,   'rgba(255,255,255,0)');
            gV.addColorStop(0.5, 'rgba(255,255,255,0.95)');
            gV.addColorStop(1,   'rgba(255,255,255,0)');
            ctx.strokeStyle = gV;
            ctx.lineWidth   = gr * 0.6;
            ctx.beginPath(); ctx.moveTo(x, y - tamV); ctx.lineTo(x, y + tamV); ctx.stroke();

            // Núcleo brillante
            const gC = ctx.createRadialGradient(x, y, 0, x, y, gr * 3);
            gC.addColorStop(0,   'rgba(255,255,255,1.0)');
            gC.addColorStop(0.5, 'rgba(200,215,255,0.6)');
            gC.addColorStop(1,   'rgba(150,180,255,0)');
            ctx.fillStyle = gC;
            ctx.beginPath(); ctx.arc(x, y, gr * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

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
