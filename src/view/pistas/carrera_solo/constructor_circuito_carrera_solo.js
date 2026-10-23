'use strict';

import * as THREE            from 'three';
import { PerpendicularRuta } from '../perpendicular_ruta.js';
import { GeometriaCinta }    from '../geometria_cinta.js';

// ================================================================
// VIEW — ConstructorCircuitoCarreraSolo: arma la superficie de la pista de
// Jugar Solo (pasto, asfalto, pianos, línea central y línea de meta).
//   - Caras hacia +Y (iluminadas y visibles desde la cámara de seguimiento).
//   - Polilínea por longitud de arco (getPointAt), igual que
//     VisorCarreraSolo.muestrasRuta(), para que el asfalto dibujado coincida
//     con el que usa CarreraVueltas.
//   - Las geometrías de cinta y pianos las arma GeometriaCinta.
//   - Guarda sus geometrías y materiales y los libera en liberar().
// ================================================================
export class ConstructorCircuitoCarreraSolo {
    static #DIVISIONES  = 800;
    static #MEDIO_ANCHO = 4;
    static #ANCHO_PIANO = 0.7;
    static #BANDA_PIANO = 10;
    static #TRAZO_LINEA = 14;
    static #HUECO_LINEA = 10;

    #escena;
    #recursos = [];   // geometrías y materiales propios para liberar

    constructor(escena) {
        this.#escena = escena;
    }

    construir(curva) {
        const DIV = ConstructorCircuitoCarreraSolo.#DIVISIONES;
        const puntos = [], perpendiculares = [];
        for (let i = 0; i < DIV; i++) {
            const u = i / DIV;
            const p = curva.getPointAt(u);
            const t = curva.getTangentAt(u);
            const L = Math.hypot(t.x, t.z) || 1;
            puntos.push(p);
            perpendiculares.push(new PerpendicularRuta(-t.z / L, t.x / L));
        }
        const cinta = new GeometriaCinta(puntos, perpendiculares, true);

        // Pasto
        const geoPasto = new THREE.PlaneGeometry(3000, 3000);
        const matPasto = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        const pasto    = new THREE.Mesh(geoPasto, matPasto);
        pasto.rotation.x = -Math.PI / 2;
        pasto.position.y = -0.01;
        this.#registrar(geoPasto, matPasto);
        this.#escena.add(pasto);

        // Asfalto
        const M = ConstructorCircuitoCarreraSolo.#MEDIO_ANCHO;
        const matAsfalto = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.85 });
        this.#agregarCinta(cinta, -M, M, 0, 0, DIV, matAsfalto);

        // Pianos rojo/blanco
        const A = ConstructorCircuitoCarreraSolo.#ANCHO_PIANO;
        const matRojo   = new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.4, emissive: 0xaa0000, emissiveIntensity: 0.25 });
        const matBlanco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.2 });
        this.#registrar(matRojo, matBlanco);
        this.#agregarPianos(cinta, -M - A, -M, matRojo, matBlanco);
        this.#agregarPianos(cinta,  M,  M + A, matRojo, matBlanco);

        // Línea central discontinua amarilla
        const matLinea = new THREE.MeshBasicMaterial({ color: 0xffee44 });
        this.#registrar(matLinea);
        const TRAZO      = ConstructorCircuitoCarreraSolo.#TRAZO_LINEA;
        const PASO_LINEA = TRAZO + ConstructorCircuitoCarreraSolo.#HUECO_LINEA;
        for (let i = 0; i < DIV; i += PASO_LINEA) {
            this.#agregarCinta(cinta, -0.22, 0.22, 0.03,
                i, Math.min(i + TRAZO, DIV), matLinea, false);
        }

        // Línea de meta blanca
        const matMeta = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.#agregarCinta(cinta, -M, M, 0.02, 0, 5, matMeta);
    }

    liberar() {
        for (const recurso of this.#recursos) recurso.dispose?.();
        this.#recursos = [];
    }

    // Cinta con caras hacia +Y
    #agregarCinta(cinta, izq, der, y, i0, i1, material, registrarMaterial = true) {
        const geo = cinta.cinta(izq, der, y, i0, i1);
        this.#registrar(geo);
        if (registrarMaterial) this.#registrar(material);
        this.#escena.add(new THREE.Mesh(geo, material));
    }

    // Pianos por bandas alternas rojo/blanco, caras hacia +Y: una malla por color
    #agregarPianos(cinta, izq, der, matRojo, matBlanco) {
        const DIV  = ConstructorCircuitoCarreraSolo.#DIVISIONES;
        const BAND = ConstructorCircuitoCarreraSolo.#BANDA_PIANO;
        this.#agregarMalla(cinta.piano(izq, der, DIV, BAND, true),  matRojo);
        this.#agregarMalla(cinta.piano(izq, der, DIV, BAND, false), matBlanco);
    }

    #agregarMalla(geo, material) {
        if (!geo) return;
        this.#registrar(geo);
        this.#escena.add(new THREE.Mesh(geo, material));
    }

    #registrar(...recursos) {
        for (const r of recursos) if (r && !this.#recursos.includes(r)) this.#recursos.push(r);
    }
}
