'use strict';

import * as THREE from 'three';

// ================================================================
// VIEW — GeometriaCinta: arma las geometrías planas que siguen la ruta
// (asfalto, líneas y pianos rojo/blanco) a partir de sus puntos y de la
// perpendicular en cada punto (PerpendicularRuta). La comparten
// MallaPistaDiseno (Diseño General) y ConstructorCircuitoCarreraSolo
// (Jugar Solo). carasHaciaArriba elige el orden de los triángulos:
//   true  → a,b,c, b,d,c (caras hacia +Y, Jugar Solo)
//   false → a,c,b, b,c,d (Diseño General, material de doble cara)
// ================================================================
export class GeometriaCinta {
    static #ALTURA_PIANO = 0.04;

    #puntos;
    #perpendiculares;
    #carasHaciaArriba;

    constructor(puntos, perpendiculares, carasHaciaArriba) {
        this.#puntos           = puntos;
        this.#perpendiculares  = perpendiculares;
        this.#carasHaciaArriba = carasHaciaArriba;
    }

    // Cinta plana entre los desplazamientos izq y der, a la altura y, de i0 a i1
    cinta(izq, der, y, i0, i1) {
        const n = this.#puntos.length;
        const pos = [], nor = [], uv = [], idx = [];
        for (let i = i0; i <= i1; i++) {
            this.#agregarPar(pos, i % n, izq, der, y);
            nor.push(0, 1, 0, 0, 1, 0);
            const u = (i - i0) / (i1 - i0 || 1);
            uv.push(0, u, 1, u);
        }
        for (let i = 0; i < i1 - i0; i++) this.#agregarCuadro(idx, i * 2);
        const geo = this.#geometria(pos, nor, idx);
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        return geo;
    }

    // Pianos de un color: bandas de "banda" puntos alternadas (las pares son
    // rojas). Devuelve una sola geometría con todas las bandas, o null.
    piano(izq, der, divisiones, banda, rojo) {
        const n = this.#puntos.length;
        const pos = [], nor = [], idx = [];
        for (let b = 0; b * banda < divisiones; b++) {
            if ((b % 2 === 0) !== rojo) continue;
            const i0 = b * banda, i1 = Math.min((b + 1) * banda, divisiones);
            const v0 = pos.length / 3;
            for (let i = i0; i <= i1; i++) {
                this.#agregarPar(pos, i % n, izq, der, GeometriaCinta.#ALTURA_PIANO);
                nor.push(0, 1, 0, 0, 1, 0);
            }
            for (let j = 0; j < i1 - i0; j++) this.#agregarCuadro(idx, v0 + j * 2);
        }
        return pos.length ? this.#geometria(pos, nor, idx) : null;
    }

    // Los dos vértices (izquierda y derecha) del punto k
    #agregarPar(pos, k, izq, der, y) {
        const q = this.#puntos[k];
        const p = this.#perpendiculares[k];
        pos.push(q.x + p.px * izq, y, q.z + p.pz * izq,
                 q.x + p.px * der, y, q.z + p.pz * der);
    }

    // Dos triángulos del cuadro que empieza en el vértice a
    #agregarCuadro(idx, a) {
        const b = a + 1, c = a + 2, d = a + 3;
        if (this.#carasHaciaArriba) idx.push(a, b, c, b, d, c);
        else                        idx.push(a, c, b, b, c, d);
    }

    #geometria(pos, nor, idx) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
        geo.setIndex(idx);
        return geo;
    }
}
