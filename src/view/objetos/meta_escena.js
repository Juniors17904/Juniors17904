'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: MetaEscena — arco de meta que cubre los 8 u de pista
// ================================================================
export class MetaEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        const matMetal  = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
        const matNegro  = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const matBlanco = new THREE.MeshStandardMaterial({ color: 0xfafafa });

        // Postes laterales — separados 9 u para cubrir la pista de 8 u
        const geoPoste = new THREE.CylinderGeometry(0.12, 0.15, 5.0, 8);
        [-4.5, 4.5].forEach(x => {
            const poste = new THREE.Mesh(geoPoste, matMetal);
            poste.position.set(x, 2.5, 0);
            poste.castShadow = true;
            grupo.add(poste);
        });

        // Barra horizontal superior
        const barra = new THREE.Mesh(
            new THREE.CylinderGeometry(0.09, 0.09, 9.2, 8),
            matMetal
        );
        barra.rotation.z = Math.PI / 2;
        barra.position.set(0, 5.0, 0);
        grupo.add(barra);

        // Bandera a cuadros — 10 cols × 2 filas sobre la barra
        const cols = 10, filas = 2;
        const ancho = 8.8, alto = 0.8;
        const wC = ancho / cols, hC = alto / filas;
        const geoCuadro = new THREE.BoxGeometry(wC - 0.02, hC - 0.02, 0.06);
        for (let f = 0; f < filas; f++) {
            for (let c = 0; c < cols; c++) {
                const cuadro = new THREE.Mesh(geoCuadro,
                    (f + c) % 2 === 0 ? matNegro : matBlanco);
                cuadro.position.set(
                    -ancho / 2 + wC / 2 + c * wC,
                    5.0 - hC / 2 - f * hC,
                    0.07
                );
                grupo.add(cuadro);
            }
        }
    }
}
