'use strict';

import * as THREE            from 'three';
import { PerpendicularRuta } from './perpendicular_ruta.js';

// ================================================================
// VIEW — ConstructorCircuitoCarreraSolo: arma la superficie de la pista de
// Jugar Solo (pasto, asfalto, pianos, línea central y línea de meta).
//   - Caras hacia +Y (iluminadas y visibles desde la cámara de seguimiento).
//   - Polilínea por longitud de arco (getPointAt), igual que
//     VisorCarreraSolo.muestrasRuta(), para que el asfalto dibujado coincida
//     con el que usa CarreraVueltas.
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
        this.#agregarCinta(puntos, perpendiculares, -M, M, 0, 0, DIV, matAsfalto);

        // Pianos rojo/blanco
        const A = ConstructorCircuitoCarreraSolo.#ANCHO_PIANO;
        const matRojo   = new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.4, emissive: 0xaa0000, emissiveIntensity: 0.25 });
        const matBlanco = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.2 });
        this.#registrar(matRojo, matBlanco);
        this.#agregarPianos(puntos, perpendiculares, -M - A, -M, matRojo, matBlanco);
        this.#agregarPianos(puntos, perpendiculares,  M,  M + A, matRojo, matBlanco);

        // Línea central discontinua amarilla
        const matLinea = new THREE.MeshBasicMaterial({ color: 0xffee44 });
        this.#registrar(matLinea);
        const TRAZO      = ConstructorCircuitoCarreraSolo.#TRAZO_LINEA;
        const PASO_LINEA = TRAZO + ConstructorCircuitoCarreraSolo.#HUECO_LINEA;
        for (let i = 0; i < DIV; i += PASO_LINEA) {
            this.#agregarCinta(puntos, perpendiculares, -0.22, 0.22, 0.03,
                i, Math.min(i + TRAZO, DIV), matLinea, false);
        }

        // Línea de meta blanca
        const matMeta = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.#agregarCinta(puntos, perpendiculares, -M, M, 0.02, 0, 5, matMeta);
    }

    liberar() {
        for (const recurso of this.#recursos) recurso.dispose?.();
        this.#recursos = [];
    }

    // Cinta con caras hacia +Y (índices a,b,c, b,d,c)
    #agregarCinta(puntos, perp, izq, der, y, i0, i1, material, registrarMaterial = true) {
        const n = puntos.length;
        const pos = [], nor = [], uv = [], idx = [];
        for (let i = i0; i <= i1; i++) {
            const q = puntos[i % n];
            const { px, pz } = perp[i % n];
            const u = (i - i0) / (i1 - i0 || 1);
            pos.push(q.x + px * izq, y, q.z + pz * izq,
                     q.x + px * der, y, q.z + pz * der);
            nor.push(0, 1, 0, 0, 1, 0);
            uv.push(0, u, 1, u);
        }
        for (let i = 0; i < i1 - i0; i++) {
            const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
            idx.push(a, b, c, b, d, c);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
        geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        this.#registrar(geo);
        if (registrarMaterial) this.#registrar(material);
        this.#escena.add(new THREE.Mesh(geo, material));
    }

    // Pianos por bandas alternas rojo/blanco, caras hacia +Y. Cada color junta
    // sus vértices en arreglos locales y termina en una sola malla.
    #agregarPianos(puntos, perp, izq, der, matRojo, matBlanco) {
        const n    = puntos.length;
        const DIV  = ConstructorCircuitoCarreraSolo.#DIVISIONES;
        const BAND = ConstructorCircuitoCarreraSolo.#BANDA_PIANO;
        const posRojo   = [], norRojo   = [], idxRojo   = [];
        const posBlanco = [], norBlanco = [], idxBlanco = [];
        for (let banda = 0; banda * BAND < DIV; banda++) {
            const i0 = banda * BAND, i1 = Math.min((banda + 1) * BAND, DIV);
            const esRojo = banda % 2 === 0;
            const pos = esRojo ? posRojo : posBlanco;
            const nor = esRojo ? norRojo : norBlanco;
            const idx = esRojo ? idxRojo : idxBlanco;
            const v0  = pos.length / 3;
            for (let i = i0; i <= i1; i++) {
                const q = puntos[i % n];
                const { px, pz } = perp[i % n];
                pos.push(q.x + px * izq, 0.04, q.z + pz * izq,
                         q.x + px * der, 0.04, q.z + pz * der);
                nor.push(0, 1, 0, 0, 1, 0);
            }
            for (let j = 0; j < i1 - i0; j++) {
                const a = v0 + j * 2, b = a + 1, c = a + 2, d = a + 3;
                idx.push(a, b, c, b, d, c);
            }
        }
        this.#agregarMalla(posRojo,   norRojo,   idxRojo,   matRojo);
        this.#agregarMalla(posBlanco, norBlanco, idxBlanco, matBlanco);
    }

    #agregarMalla(pos, nor, idx, material) {
        if (!pos.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
        geo.setIndex(idx);
        this.#registrar(geo);
        this.#escena.add(new THREE.Mesh(geo, material));
    }

    #registrar(...recursos) {
        for (const r of recursos) if (r && !this.#recursos.includes(r)) this.#recursos.push(r);
    }
}
