'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: ArbolEscena — árbol de hoja ancha, copa esférica irregular
// ================================================================
export class ArbolEscena extends ObjetoEscena {
    #escala;

    constructor(x, z, escala = 1) {
        super(x, z);
        this.#escala = escala;
    }

    _poblar(grupo) {
        const s = this.#escala;

        const matTronco = new THREE.MeshStandardMaterial({ color: 0x7a3b1e, roughness: 0.95 });
        const matRaiz   = new THREE.MeshStandardMaterial({ color: 0x5a2d0c, roughness: 0.95 });
        const matCopas  = [
            new THREE.MeshStandardMaterial({ color: 0x266b26, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ color: 0x317f31, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ color: 0x3e9c3e, roughness: 0.8 }),
        ];

        // Raíces abultadas en la base (3 esferas achatadas)
        [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].forEach(ang => {
            const raiz = new THREE.Mesh(new THREE.SphereGeometry(0.42 * s, 6, 5), matRaiz);
            raiz.scale.set(1, 0.45, 1);
            raiz.position.set(Math.cos(ang) * 0.48 * s, 0.18 * s, Math.sin(ang) * 0.48 * s);
            grupo.add(raiz);
        });

        // Tronco grueso y cónico
        const tronco = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22 * s, 0.52 * s, 2.4 * s, 7),
            matTronco
        );
        tronco.position.y = 1.2 * s;
        tronco.castShadow = true;
        grupo.add(tronco);

        // Copa: esfera central + 6 satélites de distintos tamaños y verdes
        const copas = [
            { r: 1.3,  x:  0.0, y: 3.3, z:  0.0, m: 1 },
            { r: 0.95, x:  1.1, y: 3.1, z:  0.2, m: 0 },
            { r: 0.90, x: -1.0, y: 3.2, z:  0.4, m: 2 },
            { r: 0.85, x:  0.4, y: 3.1, z:  1.1, m: 0 },
            { r: 0.80, x: -0.3, y: 3.2, z: -1.0, m: 2 },
            { r: 0.75, x:  0.7, y: 4.0, z:  0.5, m: 1 },
            { r: 0.70, x: -0.6, y: 3.9, z: -0.4, m: 2 },
        ];

        copas.forEach(({ r, x, y, z, m }) => {
            const esfera = new THREE.Mesh(
                new THREE.SphereGeometry(r * s, 7, 6),
                matCopas[m]
            );
            esfera.position.set(x * s, y * s, z * s);
            esfera.castShadow = true;
            grupo.add(esfera);
        });
    }
}
