'use strict';
import * as THREE from 'three';

// ================================================================
// MODEL — Ruta: trazado CatmullRom para pistas 3D
//   - Los puntos de la vuelta los da TrazadoVuelta: la pista y, si es
//     abierta, su camino de vuelta (PRD 014).
//   - posicionEn(prog): prog es la fracción del trazado de la PISTA, como
//     en los datos de las decoraciones (0..1); el camino de vuelta tiene
//     prog de 1 en adelante. posicionVuelta(f) recorre la vuelta entera.
// ================================================================
export class Ruta {
    #curve         = null;
    #longitud      = 0;
    #anguloInicio  = 0;
    #puntosPista   = 0;
    #puntosVuelta  = 0;
    #flechasCierre = [];

    get longitud() { return this.#longitud; }
    get curve()    { return this.#curve; }
    get inicio() {
        const p = this.#curve.getPoint(0);
        return { x: p.x, z: p.z, angle: this.#anguloInicio };
    }

    construir(tramos, totalSegs) {
        try {
            const trazado = new globalThis.TrazadoVuelta(tramos, totalSegs);
            const pts = trazado.puntos.map(([x, z]) => new THREE.Vector3(x, 0, z));
            this.#anguloInicio  = trazado.anguloInicio;
            this.#puntosPista   = trazado.puntosPista;
            this.#puntosVuelta  = pts.length;
            this.#flechasCierre = trazado.flechasCierre;
            this.#curve = new THREE.CatmullRomCurve3(pts, true);
            // Más divisiones para que getPointAt avance parejo por metros en toda la vuelta
            this.#curve.arcLengthDivisions = Math.max(60000, pts.length * 200);
            this.#curve.updateArcLengths();
            this.#longitud = this.#curve.getLength();
        } catch (e) {
            globalThis.__modelErrors = globalThis.__modelErrors || [];
            globalThis.__modelErrors.push('[Ruta.construir] ' + e.message);
            console.error('[Ruta.construir]', e);
        }
    }

    // prog: fracción del trazado de la pista (el camino de vuelta va de 1 en adelante)
    posicionEn(prog) {
        return this.posicionVuelta(prog * this.#puntosPista / (this.#puntosVuelta || 1));
    }

    // fraccion: de 0 a 1, la vuelta entera
    posicionVuelta(fraccion) {
        try {
            const t = ((fraccion % 1) + 1) % 1;
            const p = this.#curve.getPoint(t);
            const d = this.#curve.getTangent(t);
            return { x: p.x, z: p.z, angle: Math.atan2(d.x, d.z) };
        } catch (e) {
            return { x: 0, z: 0, angle: 0 };
        }
    }

    // De la fracción de la vuelta entera a la fracción de la pista (pasa de 1 en el camino de vuelta)
    fraccionPista(fraccionVuelta) {
        return fraccionVuelta * this.#puntosVuelta / (this.#puntosPista || 1);
    }

    muestras(n) {
        return Array.from({ length: n }, (_, i) => this.posicionVuelta(i / n));
    }

    // Las decoraciones de la pista más las flechas del camino de vuelta
    decoracionesCon(decoraciones) {
        return [...(decoraciones ?? []), ...this.#flechasCierre];
    }
}
