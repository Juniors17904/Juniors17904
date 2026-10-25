'use strict';

import { PuntoPiso } from './punto_piso.js';

// ================================================================
// VIEW — TrazadoPiso: el centro de la pista muestreado por distancia
// (PRD 012). Permite pedir el punto a cualquier distancia del inicio y
// las distancias de las muestras entre dos distancias, para cortar
// franjas, trazos y la meta con su largo real.
//   - cerrado: las pistas (el final se une con el inicio).
//   - abierto: la recta de Test Drive (el final no se une con el inicio).
// Las subclases solo eligen las muestras (curva o recta).
// ================================================================
export class TrazadoPiso {
    #x; #z; #tx; #tz;
    #s = [];          // distancia de cada muestra desde el inicio
    #largo = 0;
    #cerrado;

    // xs, zs: posiciones; txs, tzs: tangentes (no hace falta que midan 1)
    constructor(cerrado, xs, zs, txs, tzs) {
        this.#cerrado = !!cerrado;
        this.#x = xs; this.#z = zs; this.#tx = txs; this.#tz = tzs;
        let s = 0;
        for (let i = 0; i < xs.length; i++) {
            if (i > 0) s += Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]);
            this.#s.push(s);
        }
        const n = xs.length;
        this.#largo = this.#cerrado && n > 1
            ? s + Math.hypot(xs[0] - xs[n - 1], zs[0] - zs[n - 1])
            : s;
    }

    get largo()   { return this.#largo; }
    get cerrado() { return this.#cerrado; }

    // Punto a la distancia s del inicio (interpolado entre muestras)
    puntoEn(s) {
        const n = this.#x.length;
        let d = this.#cerrado ? ((s % this.#largo) + this.#largo) % this.#largo
                              : Math.min(this.#largo, Math.max(0, s));
        let k = this.#buscar(d);
        let k2 = k + 1;
        let s2 = this.#s[k2];
        if (k2 >= n) { k2 = this.#cerrado ? 0 : k; s2 = this.#cerrado ? this.#largo : this.#s[k]; }
        const tramo = s2 - this.#s[k];
        const f = tramo > 1e-12 ? (d - this.#s[k]) / tramo : 0;
        const x  = this.#x[k]  + (this.#x[k2]  - this.#x[k])  * f;
        const z  = this.#z[k]  + (this.#z[k2]  - this.#z[k])  * f;
        let tx = this.#tx[k] + (this.#tx[k2] - this.#tx[k]) * f;
        let tz = this.#tz[k] + (this.#tz[k2] - this.#tz[k]) * f;
        const lt = Math.hypot(tx, tz) || 1;
        tx /= lt; tz /= lt;
        return new PuntoPiso(x, z, tz, -tx);   // derecha = (tz, -tx)
    }

    // Distancias para recorrer de s0 a s1: s0, las muestras intermedias y s1
    distanciasEntre(s0, s1) {
        const lista = [s0];
        if (this.#cerrado) {
            const L = this.#largo;
            for (let m = Math.floor(s0 / L); m <= Math.floor(s1 / L); m++) {
                for (const sk of this.#s) {
                    const v = sk + m * L;
                    if (v > s0 + 1e-9 && v < s1 - 1e-9) lista.push(v);
                }
            }
        } else {
            for (const sk of this.#s) if (sk > s0 + 1e-9 && sk < s1 - 1e-9) lista.push(sk);
        }
        lista.push(s1);
        return lista;
    }

    // Última muestra con distancia <= d (búsqueda binaria)
    #buscar(d) {
        let a = 0, b = this.#s.length - 1;
        while (a < b) {
            const m = (a + b + 1) >> 1;
            if (this.#s[m] <= d) a = m; else b = m - 1;
        }
        return a;
    }
}
