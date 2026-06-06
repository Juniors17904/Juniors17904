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

        // Raíces abultadas en la base
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

        // Copa: 128 esferas distribuidas en un elipsoide
        for (let i = 0; i < 128; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const r     = Math.cbrt(Math.random()) * 1.6 * s;
            const x     = r * Math.sin(phi) * Math.cos(theta);
            const y     = r * Math.cos(phi) * 0.75;
            const z     = r * Math.sin(phi) * Math.sin(theta);
            const radio = (0.18 + Math.random() * 0.28) * s;
            const esfera = new THREE.Mesh(
                new THREE.SphereGeometry(radio, 5, 4),
                matCopas[Math.floor(Math.random() * matCopas.length)]
            );
            esfera.position.set(x, y + 3.4 * s, z);
            esfera.castShadow = true;
            grupo.add(esfera);
        }
    }
}
