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
            color:             0x6878a8,
            emissive:          0x1e2840,
            emissiveIntensity: 0.25,
            transparent:       true,
            opacity:           0.90,
            roughness:         1.0,
            metalness:         0.0,
        });

        // Blobs que forman el cuerpo — posición [dx, dy, rx, ry]
        const blobs = [
            [ 0.0,  0.0,  1.6, 0.75],  // cuerpo central
            [-1.3, -0.1,  1.1, 0.68],  // lado izquierdo
            [ 1.5, -0.1,  1.2, 0.65],  // lado derecho
            [ 0.3,  0.7,  1.0, 0.60],  // protuberancia superior centro
            [-0.6,  0.6,  0.9, 0.55],  // protuberancia superior izquierda
            [-0.2,  1.1,  0.8, 0.50],  // punta alta centro
            [ 0.9,  1.0,  0.7, 0.45],  // punta alta derecha
            [-1.0,  0.9,  0.6, 0.42],  // punta alta izquierda
        ];

        for (const [dx, dy, rx, ry] of blobs) {
            const geo = new THREE.SphereGeometry(1, 14, 10);
            geo.scale(rx, ry, rx * 0.95);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(dx, Y + dy, 0);
            grupo.add(mesh);
        }
    }
}
