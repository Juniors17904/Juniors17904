'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: SalidaEscena — gantry F1 con 5 luces rojas encendidas
// ================================================================
export class SalidaEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        const matMetal   = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
        const matCarcasa = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const matRojo    = new THREE.MeshStandardMaterial({
            color: 0xff1111, emissive: 0xcc0000, emissiveIntensity: 0.9
        });

        // Dos postes verticales
        const geoPoste = new THREE.CylinderGeometry(0.12, 0.15, 5.0, 8);
        [-4.5, 4.5].forEach(x => {
            const poste = new THREE.Mesh(geoPoste, matMetal);
            poste.position.set(x, 2.5, 0);
            poste.castShadow = true;
            grupo.add(poste);
        });

        // Viga horizontal (gantry)
        const viga = new THREE.Mesh(
            new THREE.BoxGeometry(9.2, 0.28, 0.28),
            matMetal
        );
        viga.position.set(0, 5.0, 0);
        grupo.add(viga);

        // 5 pods de luz colgando de la viga
        const posX = [-3.6, -1.8, 0, 1.8, 3.6];
        const geoPod  = new THREE.BoxGeometry(0.55, 0.55, 0.45);
        const geoLuz  = new THREE.SphereGeometry(0.18, 12, 8);

        posX.forEach(x => {
            const pod = new THREE.Mesh(geoPod, matCarcasa);
            pod.position.set(x, 4.58, 0);
            const luz = new THREE.Mesh(geoLuz, matRojo);
            luz.position.set(x, 4.58, 0.28);
            grupo.add(pod, luz);
        });
    }
}
