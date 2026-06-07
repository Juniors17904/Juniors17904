'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: FlechaCurvaEscena — indicadores de curva tipo chevron >>>
//        Paneles con flecha roja sobre fondo blanco en postes cortos
// ================================================================
export class FlechaCurvaEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        const matBlanco = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7 });
        const matRojo   = new THREE.MeshStandardMaterial({ color: 0xee1111, roughness: 0.7 });
        const matPoste  = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });

        const geoPoste = new THREE.CylinderGeometry(0.04, 0.05, 0.55, 6);

        for (let i = 0; i < 3; i++) {
            const ox = (i - 1) * 0.75;

            // Poste
            const poste = new THREE.Mesh(geoPoste, matPoste);
            poste.position.set(ox, 0.275, 0);
            poste.castShadow = true;
            grupo.add(poste);

            // Panel de fondo
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(0.58, 0.72, 0.05), matBlanco);
            panel.position.set(ox, 0.86, 0);
            panel.castShadow = true;
            grupo.add(panel);

            // Brazo superior de la flecha ">"
            const sup = new THREE.Mesh(
                new THREE.BoxGeometry(0.38, 0.09, 0.06), matRojo);
            sup.rotation.z = -Math.PI / 4;
            sup.position.set(ox - 0.04, 1.02, 0.01);
            grupo.add(sup);

            // Brazo inferior de la flecha ">"
            const inf = new THREE.Mesh(
                new THREE.BoxGeometry(0.38, 0.09, 0.06), matRojo);
            inf.rotation.z = Math.PI / 4;
            inf.position.set(ox - 0.04, 0.70, 0.01);
            grupo.add(inf);
        }
    }
}
