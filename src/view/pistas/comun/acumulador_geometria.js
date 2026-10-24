'use strict';

import * as THREE from 'three';

// ================================================================
// VIEW — AcumuladorGeometria: junta muchas tiras del piso en UNA sola
// geometría (una malla por material, PRD 012 RNF-05). Una tira sigue el
// trazado de s0 a s1 entre dos puntos del corte transversal: (d0, y0) y
// (d1, y1), con d = distancia al centro (positiva hacia la derecha).
// Cada cuadro lleva su normal, hacia arriba o, en las paredes, hacia afuera.
// ================================================================
export class AcumuladorGeometria {
    #pos = [];
    #nor = [];
    #idx = [];

    agregarTira(trazado, s0, s1, d0, y0, d1, y1) {
        if (!(s1 > s0)) return;
        const ds = trazado.distanciasEntre(s0, s1);
        let a = trazado.puntoEn(ds[0]);
        for (let i = 1; i < ds.length; i++) {
            const b = trazado.puntoEn(ds[i]);
            this.#agregarCuadro(a, b, d0, y0, d1, y1);
            a = b;
        }
    }

    get vacio() { return this.#idx.length === 0; }

    geometria() {
        if (this.vacio) return null;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(this.#pos, 3));
        geo.setAttribute('normal',   new THREE.Float32BufferAttribute(this.#nor, 3));
        geo.setIndex(this.#idx);
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        return geo;
    }

    // Cuadro entre los puntos a y b del trazado (4 vértices propios)
    #agregarCuadro(a, b, d0, y0, d1, y1) {
        const A0 = [a.x + a.px * d0, y0, a.z + a.pz * d0];
        const A1 = [a.x + a.px * d1, y1, a.z + a.pz * d1];
        const B0 = [b.x + b.px * d0, y0, b.z + b.pz * d0];
        const B1 = [b.x + b.px * d1, y1, b.z + b.pz * d1];
        const largo  = [B0[0] - A0[0], B0[1] - A0[1], B0[2] - A0[2]];
        const ancho  = [A1[0] - A0[0], A1[1] - A0[1], A1[2] - A0[2]];
        let n = [largo[1] * ancho[2] - largo[2] * ancho[1],
                 largo[2] * ancho[0] - largo[0] * ancho[2],
                 largo[0] * ancho[1] - largo[1] * ancho[0]];
        const ln = Math.hypot(n[0], n[1], n[2]);
        if (ln < 1e-12) return;
        n = [n[0] / ln, n[1] / ln, n[2] / ln];
        const lado = Math.sign(d0 + d1) || 1;
        const pared = Math.abs(n[1]) < 1e-6;
        const invertir = pared ? (n[0] * a.px + n[2] * a.pz) * lado < 0 : n[1] < 0;
        if (invertir) n = [-n[0], -n[1], -n[2]];
        const v = this.#pos.length / 3;
        this.#pos.push(...A0, ...A1, ...B0, ...B1);
        for (let i = 0; i < 4; i++) this.#nor.push(...n);
        // a=A0, b=A1, c=B0, d=B1: (A0,B0,A1) y (A1,B0,B1) miran hacia "largo × ancho"
        if (invertir) this.#idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
        else          this.#idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
    }
}
