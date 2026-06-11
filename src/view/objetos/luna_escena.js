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
        const Y = 3.5; // altura de flotación sobre la escena

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

        // Halo interior — blanco cálido, semitransparente
        const haloInt = new THREE.Mesh(
            new THREE.SphereGeometry(2.3, 16, 16),
            new THREE.MeshBasicMaterial({
                color:       0xfff5d0,
                transparent: true,
                opacity:     0.07,
                side:        THREE.BackSide,
                depthWrite:  false,
            })
        );
        haloInt.position.y = Y;
        grupo.add(haloInt);

        // Halo exterior — azul frío, muy tenue
        const haloExt = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 16, 16),
            new THREE.MeshBasicMaterial({
                color:       0x4466bb,
                transparent: true,
                opacity:     0.04,
                side:        THREE.BackSide,
                depthWrite:  false,
            })
        );
        haloExt.position.y = Y;
        grupo.add(haloExt);

        // Luz puntual irradiada — ilumina el entorno con tono frío lunar
        const luzLuna = new THREE.PointLight(0xc8d8f0, 1.5, 18);
        luzLuna.position.y = Y;
        grupo.add(luzLuna);
    }
}
