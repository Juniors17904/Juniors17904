'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: NubeAtmosferica — sprite de nube azul-grisácea nocturna.
//        Sigue la cámara con un desplazamiento fijo respecto a la
//        luna, creando la sensación de nubes alrededor del satélite.
//        dx/dz: offset horizontal desde la posición de la luna.
//        dy: offset vertical sobre el nivel de la luna (y=80).
//        escala: tamaño relativo del sprite.
// ================================================================
export class NubeAtmosferica extends ObjetoEscena {
    #dx; #dz; #dy; #escala;

    constructor(dx = 0, dz = 0, dy = 0, escala = 1) {
        super(0, 0);
        this.#dx    = dx;
        this.#dz    = dz;
        this.#dy    = dy;
        this.#escala = escala;
    }

    _poblar(grupo) {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map:         this.#texNube(256, 128),
            transparent: true,
            depthWrite:  false,
            toneMapped:  false,
            opacity:     0.22,
        }));
        sprite.position.y = 80 + this.#dy;
        sprite.scale.set(100 * this.#escala, 40 * this.#escala, 1);
        grupo.add(sprite);
    }

    actualizar(camara) {
        if (!this._grupo || !camara) return;
        this._grupo.position.set(
            camara.position.x + 45 + this.#dx,
            0,
            camara.position.z - 130 + this.#dz,
        );
    }

    #texNube(W, H) {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        // tres elipses superpuestas para silueta de nube
        const manchas = [
            [W * 0.28, H * 0.55, W * 0.27, H * 0.38],
            [W * 0.50, H * 0.42, W * 0.34, H * 0.44],
            [W * 0.72, H * 0.55, H * 0.27, H * 0.36],
        ];
        for (const [cx, cy, rx, ry] of manchas) {
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
            g.addColorStop(0.0, 'rgba(90,110,155,0.55)');
            g.addColorStop(0.6, 'rgba(60,80,120,0.20)');
            g.addColorStop(1.0, 'rgba(0,0,0,0)');
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();
            ctx.restore();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
}
