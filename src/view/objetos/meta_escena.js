'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: MetaEscena — arco de meta con bandera a cuadros
// ================================================================
export class MetaEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        const matMetal  = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5 });
        const matNegro  = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const matBlanco = new THREE.MeshStandardMaterial({ color: 0xfafafa });

        // Postes laterales
        const geoPoste = new THREE.CylinderGeometry(0.09, 0.11, 4.0, 8);
        const posteIzq = new THREE.Mesh(geoPoste, matMetal);
        posteIzq.position.set(-2.2, 2.0, 0);
        posteIzq.castShadow = true;
        const posteDer = new THREE.Mesh(geoPoste, matMetal);
        posteDer.position.set(2.2, 2.0, 0);
        posteDer.castShadow = true;

        // Barra horizontal superior
        const geoBarra = new THREE.CylinderGeometry(0.07, 0.07, 4.6, 8);
        const barra = new THREE.Mesh(geoBarra, matMetal);
        barra.rotation.z = Math.PI / 2;
        barra.position.set(0, 4.0, 0);

        // Bandera a cuadros ajedrezados (4 columnas × 2 filas)
        const cols = 8, filas = 2;
        const ancho = 4.2, alto = 0.7;
        const wC = ancho / cols, hC = alto / filas;
        const geoCuadro = new THREE.BoxGeometry(wC - 0.01, hC - 0.01, 0.05);
        for (let f = 0; f < filas; f++) {
            for (let c = 0; c < cols; c++) {
                const cuadro = new THREE.Mesh(geoCuadro, (f + c) % 2 === 0 ? matNegro : matBlanco);
                cuadro.position.set(
                    -ancho / 2 + wC / 2 + c * wC,
                    4.0 - hC / 2 - f * hC,
                    0.06
                );
                grupo.add(cuadro);
            }
        }

        grupo.add(posteIzq, posteDer, barra);
    }
}
