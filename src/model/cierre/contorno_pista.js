'use strict';
try {

// ================================================================
// MODEL — ContornoPista: el borde de afuera de una pista vista desde
// arriba (PRD 014, D3). Es el contorno convexo de sus puntos, con los
// vértices separados al menos "separacion" metros. recorrido() da las
// poses para rodear la pista por fuera, a "margen" metros, de un punto
// de la pista a otro, en un sentido (+1 o -1).
// ================================================================
class ContornoPista {
    #puntos;        // [x, z] de la pista
    #vertices = []; // índices de #puntos en el contorno, en sentido +1

    constructor(puntos, separacion, ...obligatorios) {
        this.#puntos = puntos;
        const casco = this.#casco();
        let ultimo = null;
        for (const i of casco) {
            const p = puntos[i];
            const lejos = !ultimo || Math.hypot(p[0] - ultimo[0], p[1] - ultimo[1]) >= separacion;
            if (lejos || obligatorios.includes(i)) { this.#vertices.push(i); ultimo = p; }
        }
    }

    // ¿El punto i de la pista está en el contorno?
    tiene(i) { return this.#vertices.includes(i); }

    // Poses a "margen" metros por fuera de los vértices que hay entre los
    // puntos "desde" y "hasta" de la pista (sin incluirlos), en ese sentido
    recorrido(desde, hasta, sentido, margen) {
        const v = this.#vertices, n = v.length;
        const iDesde = v.indexOf(desde), iHasta = v.indexOf(hasta);
        if (iDesde < 0 || iHasta < 0) return [];
        const poses = [];
        for (let k = (iDesde + sentido + n) % n; k !== iHasta; k = (k + sentido + n) % n) {
            poses.push(this.#poseAfuera(k, sentido, margen));
        }
        return poses;
    }

    #poseAfuera(k, sentido, margen) {
        const v = this.#vertices, n = v.length, P = this.#puntos;
        const antes = P[v[(k - sentido + n) % n]], aqui = P[v[k]], despues = P[v[(k + sentido + n) % n]];
        const [ax, az] = this.#unitario(aqui[0] - antes[0], aqui[1] - antes[1]);
        const [bx, bz] = this.#unitario(despues[0] - aqui[0], despues[1] - aqui[1]);
        // Afuera del contorno (en sentido +1 el casco va antihorario: afuera queda a la derecha)
        const [nx, nz] = this.#unitario(sentido * (az + bz), -sentido * (ax + bx));
        const [tx, tz] = this.#unitario(ax + bx, az + bz);
        return new window.PoseCierre(aqui[0] + nx * margen, aqui[1] + nz * margen, Math.atan2(tx, tz));
    }

    #unitario(x, z) {
        const l = Math.hypot(x, z) || 1;
        return [x / l, z / l];
    }

    // Casco convexo (cadena monótona), en sentido antihorario sobre (x, z)
    #casco() {
        const P = this.#puntos;
        const orden = P.map((_, i) => i).sort((a, b) => P[a][0] - P[b][0] || P[a][1] - P[b][1]);
        const cruz = (o, a, b) => (P[a][0] - P[o][0]) * (P[b][1] - P[o][1]) - (P[a][1] - P[o][1]) * (P[b][0] - P[o][0]);
        const abajo = [], arriba = [];
        for (const i of orden) {
            while (abajo.length >= 2 && cruz(abajo[abajo.length - 2], abajo[abajo.length - 1], i) <= 0) abajo.pop();
            abajo.push(i);
        }
        for (const i of [...orden].reverse()) {
            while (arriba.length >= 2 && cruz(arriba[arriba.length - 2], arriba[arriba.length - 1], i) <= 0) arriba.pop();
            arriba.push(i);
        }
        return abajo.slice(0, -1).concat(arriba.slice(0, -1));
    }
}

window.ContornoPista = ContornoPista;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[contorno_pista.js] ' + e.message);
    console.error('[contorno_pista.js]', e);
}
