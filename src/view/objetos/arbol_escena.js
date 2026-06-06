'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: ArbolEscena — pino low-poly de 3 capas superpuestas
// ================================================================
export class ArbolEscena extends ObjetoEscena {
    #escala;

    constructor(x, z, escala = 1) {
        super(x, z);
        this.#escala = escala;
    }

    _poblar(grupo) {
        const s = this.#escala;

        // Tronco cónico
        const tronco = new THREE.Mesh(
            new THREE.CylinderGeometry(0.10 * s, 0.26 * s, 1.5 * s, 7),
            new THREE.MeshStandardMaterial({ color: 0x5a3020, roughness: 0.95 })
        );
        tronco.position.y = 0.75 * s;
        tronco.castShadow = true;
        grupo.add(tronco);

        // 3 capas de copa — cada una más pequeña y más alta,
        // ligeramente rotadas entre sí para dar volumen
        const capas = [
            { r: 1.15 * s, h: 1.9 * s, y: 1.7 * s,  color: 0x1a5c1a, rot: 0              },
            { r: 0.88 * s, h: 1.65 * s, y: 2.45 * s, color: 0x237023, rot: Math.PI / 4    },
            { r: 0.55 * s, h: 1.35 * s, y: 3.1 * s,  color: 0x2e8b2e, rot: Math.PI / 2   },
        ];

        capas.forEach(({ r, h, y, color, rot }) => {
            const cono = new THREE.Mesh(
                new THREE.ConeGeometry(r, h, 7),
                new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
            );
            cono.position.y = y;
            cono.rotation.y = rot;
            cono.castShadow = true;
            grupo.add(cono);
        });
    }
}
