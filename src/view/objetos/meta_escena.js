'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: MetaEscena — arco de meta sobre la pista: dos postes a la
//        distancia de los postes de alumbrado y una bandera a cuadros
//        cuyo borde de abajo deja la altura libre del arco (PRD 011, D7).
//        Girado con la pista (rotY). Medidas de MedidasEscena.
// ================================================================
export class MetaEscena extends ObjetoEscena {
    constructor(x, z, rotY = 0) { super(x, z, rotY); }

    _poblar(grupo) {
        const m = new window.MedidasEscena();
        const D = m.distanciaPostesArco, r = m.radioPosteArco, g = m.grosorTravesanoArco;
        const altoBandera = m.altoBanderaMeta;
        const yBarra = m.alturaLibreArco + altoBandera + g / 2;   // la bandera cuelga de la barra
        const altoPoste = yBarra + g / 2;

        const matMetal  = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
        const matNegro  = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const matBlanco = new THREE.MeshStandardMaterial({ color: 0xfafafa });

        // Postes laterales, uno a cada lado de la pista
        const geoPoste = new THREE.CylinderGeometry(r, r, altoPoste, 10);
        for (const x of [-D, D]) {
            const poste = new THREE.Mesh(geoPoste, matMetal);
            poste.position.set(x, altoPoste / 2, 0);
            poste.castShadow = true;
            grupo.add(poste);
        }

        // Barra horizontal superior
        const barra = new THREE.Mesh(new THREE.CylinderGeometry(g / 2, g / 2, 2 * D, 10), matMetal);
        barra.rotation.z = Math.PI / 2;
        barra.position.set(0, yBarra, 0);
        grupo.add(barra);

        // Bandera a cuadros de 2 filas, entre los postes
        const ancho = 2 * (D - r), filas = 2;
        const cols = Math.max(2, Math.round(ancho / altoBandera * filas));
        const wC = ancho / cols, hC = altoBandera / filas;
        const geoCuadro = new THREE.BoxGeometry(wC, hC, 0.06);
        const arriba = yBarra - g / 2;
        for (let f = 0; f < filas; f++) {
            for (let c = 0; c < cols; c++) {
                const cuadro = new THREE.Mesh(geoCuadro, (f + c) % 2 === 0 ? matNegro : matBlanco);
                cuadro.position.set(-ancho / 2 + wC / 2 + c * wC, arriba - hC / 2 - f * hC, 0);
                grupo.add(cuadro);
            }
        }
    }
}
