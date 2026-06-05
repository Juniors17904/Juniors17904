'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: ArbolEscena — árbol decorativo (tronco + copa cónica)
// ================================================================
export class ArbolEscena extends ObjetoEscena {
    #escala;

    constructor(x, z, escala = 1) {
        super(x, z);
        this.#escala = escala;
    }

    _poblar(grupo) {
        const s = this.#escala;

        const tronco = new THREE.Mesh(
            new THREE.CylinderGeometry(0.15, 0.22, 1.2 * s, 7),
            new THREE.MeshStandardMaterial({ color: 0x6b3a2a, roughness: 0.9 })
        );
        tronco.position.y = 0.6 * s;
        tronco.castShadow = true;

        const copa = new THREE.Mesh(
            new THREE.ConeGeometry(0.85 * s, 1.9 * s, 7),
            new THREE.MeshStandardMaterial({ color: 0x2d6b2d, roughness: 0.85 })
        );
        copa.position.y = 1.2 * s + 0.95 * s;
        copa.castShadow = true;

        grupo.add(tronco, copa);
    }
}
