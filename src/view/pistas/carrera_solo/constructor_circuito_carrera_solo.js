'use strict';

import * as THREE               from 'three';
import { ConstructorPisoPista } from '../comun/constructor_piso_pista.js';
import { TrazadoPisoCurva }     from '../comun/trazado_piso_curva.js';
import { MetaEscena }           from '../../objetos/meta_escena.js';

// ================================================================
// VIEW — ConstructorCircuitoCarreraSolo: arma la superficie de la pista de
// Jugar Solo: el pasto (nivel 0) y el piso de la pista.
//   - El piso (asfalto 8 cm sobre el pasto, pianos con relieve, líneas y
//     meta a cuadros) lo dibuja ConstructorPisoPista, la pieza compartida
//     por las 5 pantallas (PRD 012, D9). La meta va en el inicio de la ruta.
//   - Recorre la curva por longitud de arco, igual que
//     VisorCarreraSolo.muestrasRuta(), para que el asfalto dibujado coincida
//     con el que usa CarreraVueltas.
//   - Pone el arco de meta sobre la línea de meta, girado con la pista
//     (PRD 011, D3). Es solo un adorno: las vueltas no cambian.
//   - Guarda sus geometrías y materiales y los libera en liberar().
// ================================================================
export class ConstructorCircuitoCarreraSolo {
    #escena;
    #piso     = null;   // ConstructorPisoPista
    #arcoMeta = null;   // MetaEscena
    #recursos = [];     // geometrías y materiales propios (pasto) para liberar

    constructor(escena) {
        this.#escena = escena;
    }

    construir(curva) {
        // Pasto, a nivel 0 (PRD 012, D4)
        const geoPasto = new THREE.PlaneGeometry(3000, 3000);
        const matPasto = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        const pasto    = new THREE.Mesh(geoPasto, matPasto);
        pasto.rotation.x = -Math.PI / 2;
        pasto.position.y = 0;
        this.#recursos.push(geoPasto, matPasto);
        this.#escena.add(pasto);

        // Piso de la pista, con la meta al inicio de la ruta
        this.#piso = new ConstructorPisoPista(new TrazadoPisoCurva(curva), 0);
        this.#escena.add(this.#piso.construir());

        // Arco de meta en el inicio de la ruta, girado con la pista
        const inicio = curva.getPointAt(0), rumbo = curva.getTangentAt(0);
        this.#arcoMeta = new MetaEscena(inicio.x, inicio.z, Math.atan2(rumbo.x, rumbo.z));
        this.#arcoMeta.construir(this.#escena);
    }

    liberar() {
        this.#arcoMeta?.destruir(this.#escena);
        this.#arcoMeta = null;
        this.#piso?.liberar();
        this.#piso = null;
        for (const recurso of this.#recursos) recurso.dispose?.();
        this.#recursos = [];
    }
}
