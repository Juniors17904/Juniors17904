'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: Luna — satélite natural visible en el cielo nocturno.
//        Esfera luminosa con halo de glow que sigue la cámara
//        manteniéndose siempre en la misma dirección del horizonte.
// ================================================================
export class Luna extends ObjetoEscena {
    constructor() {
        super(0, 0); // posición se actualiza cada frame en actualizar()
    }

    _poblar(grupo) {
        const esfera = new THREE.Mesh(
            new THREE.SphereGeometry(5.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xfffde8, toneMapped: false }),
        );
        esfera.position.y = 80;

        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.#texGlow(128, [
                [0.00, 'rgba(255,253,220,0.90)'],
                [0.20, 'rgba(255,248,180,0.45)'],
                [0.55, 'rgba(180,210,255,0.14)'],
                [1.00, 'rgba(0,0,0,0)'],
            ]),
            transparent:  true,
            depthWrite:   false,
            toneMapped:   false,
            blending:     THREE.AdditiveBlending,
        }));
        glow.position.y = 80;
        glow.scale.set(58, 58, 1);

        grupo.add(esfera, glow);
    }

    actualizar(camara) {
        if (!this._grupo || !camara) return;
        this._grupo.position.set(
            camara.position.x + 45,
            0,
            camara.position.z - 130,
        );
    }

    #texGlow(size, paradas) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        for (const [t, color] of paradas) g.addColorStop(t, color);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }
}
