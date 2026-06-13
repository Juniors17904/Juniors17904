'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: PosteEscena — poste de alumbrado urbano
// ================================================================
export class PosteEscena extends ObjetoEscena {
    constructor(x, z) {
        super(x, z);
    }

    _poblar(grupo) {
        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.07, 5.0, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
        );
        poste.position.y = 2.5;
        poste.castShadow = true;

        const brazo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 })
        );
        brazo.position.set(0.6, 5.0, 0);
        brazo.rotation.z = Math.PI / 2;

        const lampara = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0xfffbe0, emissive: 0xfffbe0, emissiveIntensity: 0.6 })
        );
        lampara.position.set(1.1, 5.0, 0);

        const luz = new THREE.PointLight(0xffe8a0, 150, 12);
        luz.position.set(1.1, 4.8, 0);

        grupo.add(poste, brazo, lampara, luz);
    }
}
