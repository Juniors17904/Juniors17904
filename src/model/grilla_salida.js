'use strict';

import { PuntoSalida } from './punto_salida.js';

// ================================================================
// MODEL — GrillaSalida: los lugares de salida de Jugar Solo (PRD 013, RF-01).
//   - Filas de 2 detrás de la línea de salida, una a cada lado del centro
//     de la pista y dentro del asfalto (el ancho sale de MedidasEscena).
//   - Las filas están separadas lo justo para que ni el carro más largo
//     toque al de adelante.
//   - Con las muestras de la ruta (opcional) cada fila sigue la curva que
//     haya antes de la meta; sin ellas, la recta hacia atrás desde el inicio.
//   - El último lugar es el del jugador.
// ================================================================
export class GrillaSalida {
    static #PRIMERA_FILA     = 6;     // metros de la línea al centro de la primera fila
    static #ENTRE_FILAS      = 8;     // metros entre filas
    static #CARROS_POR_FILA  = 2;

    #medidas;

    constructor(medidas = new globalThis.MedidasEscena()) {
        this.#medidas = medidas;
    }

    // inicio: { x, z, angle } de ruta.inicio. muestras: MuestraRuta[] por
    // longitud de arco (la 0 en la línea de salida), para seguir la curva.
    puntos(inicio, cantidad = 5, muestras = null) {
        const lateral = this.#medidas.medioAnchoAsfalto / 2;
        const puntos  = [];
        for (let i = 0; i < cantidad; i++) {
            const fila  = Math.floor(i / GrillaSalida.#CARROS_POR_FILA);
            const lado  = i % GrillaSalida.#CARROS_POR_FILA === 0 ? 1 : -1;
            const atras = GrillaSalida.#PRIMERA_FILA + fila * GrillaSalida.#ENTRE_FILAS;
            const base  = this.#puntoAtras(inicio, atras, muestras);
            puntos.push(new PuntoSalida(
                base.x + Math.cos(base.angulo) * lateral * lado,
                base.z - Math.sin(base.angulo) * lateral * lado,
                base.angulo));
        }
        return puntos;
    }

    // El punto del centro de la pista que está `metros` antes de la línea
    #puntoAtras(inicio, metros, muestras) {
        if (!Array.isArray(muestras) || muestras.length < 2) {
            return new PuntoSalida(inicio.x - Math.sin(inicio.angle) * metros,
                inicio.z - Math.cos(inicio.angle) * metros, inicio.angle);
        }
        const n = muestras.length;
        let recorrido = 0;
        for (let k = 0; k < n; k++) {
            const a = muestras[(n - k) % n], b = muestras[(n - k - 1) % n];
            const tramo = Math.hypot(a.x - b.x, a.z - b.z);
            if (recorrido + tramo >= metros && tramo > 1e-9) {
                const t = (metros - recorrido) / tramo;
                const giro = Math.atan2(Math.sin(b.angulo - a.angulo), Math.cos(b.angulo - a.angulo));
                return new PuntoSalida(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, a.angulo + giro * t);
            }
            recorrido += tramo;
        }
        return new PuntoSalida(inicio.x, inicio.z, inicio.angle);
    }
}
