'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: LunaEscena — luna 3D flotante con halos y luz propia.
//        Hereda de ObjetoEscena. Se muestra sin suelo en el visor.
// ================================================================
export class LunaEscena extends ObjetoEscena {
    constructor() {
        super(0, 0);
    }

    _poblar(grupo) {
        const Y = 3.5;

        // Disco lunar — esfera principal con material semi-emisivo
        const disco = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, 32, 32),
            new THREE.MeshStandardMaterial({
                color:             0xf0eedf,
                emissive:          0xc8c0a0,
                emissiveIntensity: 0.7,
                roughness:         0.85,
                metalness:         0.0,
            })
        );
        disco.position.y = Y;
        grupo.add(disco);

        // Luz puntual irradiada — ilumina el entorno con tono frío lunar
        const luzLuna = new THREE.PointLight(0xc8d8f0, 4.0, 60);
        luzLuna.position.y = Y;
        grupo.add(luzLuna);
    }
}
