'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: SalidaEscena — arco de salida (gantry F1) con 5 luces rojas:
//        mismos postes y altura libre que el arco de meta (PRD 011, D7).
//        Medidas de MedidasEscena.
// ================================================================
export class SalidaEscena extends ObjetoEscena {
    constructor(x, z, rotY = 0) { super(x, z, rotY); }

    _poblar(grupo) {
        const m = new window.MedidasEscena();
        const D = m.distanciaPostesArco, r = m.radioPosteArco, g = m.grosorTravesanoArco;
        const caja = m.ladoCajaLuzSalida;
        const yViga = m.alturaLibreArco + caja + g / 2;   // las luces cuelgan de la viga
        const altoPoste = yViga + g / 2;

        const matMetal   = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
        const matCarcasa = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
        const matRojo    = new THREE.MeshStandardMaterial({ color: 0xff1111, emissive: 0xcc0000, emissiveIntensity: 0.9 });

        // Dos postes verticales
        const geoPoste = new THREE.CylinderGeometry(r, r, altoPoste, 10);
        for (const x of [-D, D]) {
            const poste = new THREE.Mesh(geoPoste, matMetal);
            poste.position.set(x, altoPoste / 2, 0);
            poste.castShadow = true;
            grupo.add(poste);
        }

        // Viga horizontal
        const viga = new THREE.Mesh(new THREE.BoxGeometry(2 * D, g, g), matMetal);
        viga.position.set(0, yViga, 0);
        grupo.add(viga);

        // 5 cajas de luz colgando de la viga, repartidas sobre el asfalto
        const geoPod = new THREE.BoxGeometry(caja, caja, m.fondoCajaLuzSalida);
        const geoLuz = new THREE.SphereGeometry(caja / 3, 12, 8);
        const yCaja  = yViga - g / 2 - caja / 2;
        const medio  = m.medioAnchoAsfalto;
        for (let i = 0; i < 5; i++) {
            const x = -medio + (i + 0.5) * (2 * medio / 5);
            const pod = new THREE.Mesh(geoPod, matCarcasa);
            pod.position.set(x, yCaja, 0);
            const luz = new THREE.Mesh(geoLuz, matRojo);
            luz.position.set(x, yCaja, caja / 2);
            grupo.add(pod, luz);
        }
    }
}
