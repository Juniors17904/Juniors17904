'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: NubeEscena — nube 3D flotante formada por esferas
//        semitransparentes superpuestas con borde iluminado.
// ================================================================
export class NubeEscena extends ObjetoEscena {
    constructor() {
        super(0, 0);
    }

    _poblar(grupo) {
        const Y = 3.5;

        const mat = new THREE.MeshStandardMaterial({
            color:             0x4a6090,
            emissive:          0x1a2840,
            emissiveIntensity: 0.4,
            transparent:       true,
            opacity:           0.82,
            roughness:         1.0,
            metalness:         0.0,
        });

        // Blobs que forman el cuerpo — posición [dx, dy, rx, ry]
        const blobs = [
            [ 0.0,  0.0,  1.5, 0.70],
            [-1.2,  0.1,  1.0, 0.65],
            [ 1.4,  0.1,  1.1, 0.60],
            [ 0.3, -0.6,  0.9, 0.55],
            [-0.5, -0.5,  0.8, 0.50],
            [-0.2, -1.0,  0.7, 0.45],
            [ 0.9, -0.9,  0.6, 0.40],
            [-0.9, -0.8,  0.5, 0.38],
        ];

        for (const [dx, dy, rx, ry] of blobs) {
            const geo = new THREE.SphereGeometry(1, 12, 8);
            geo.scale(rx, ry, rx * 0.9);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(dx, Y + dy, 0);
            grupo.add(mesh);
        }

        // Capa superior con tono iluminado — simula luz de luna en el borde
        const matLuz = new THREE.MeshBasicMaterial({
            color:       0x8aaad8,
            transparent: true,
            opacity:     0.14,
        });
        const luzMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), matLuz);
        luzMesh.scale.set(2.2, 0.45, 1.4);
        luzMesh.position.set(-0.1, Y + 0.2, 0);
        grupo.add(luzMesh);
    }
}
