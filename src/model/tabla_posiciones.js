'use strict';

import { FilaPosicion } from './fila_posicion.js';

// ================================================================
// MODEL — TablaPosiciones: ordena a los carros de la carrera (PRD 013, D5).
//   - Primero los que terminaron, del menor al mayor tiempo total.
//   - Después los que siguen en carrera, del que más avanzó al que menos
//     (un carro detrás de la meta tiene avance negativo: vuelta 0).
// Recibe objetos con nombre, esJugador, terminado, tiempoTotalMs y avance
// (Rival o ParticipanteCarrera).
// ================================================================
export class TablaPosiciones {
    ordenar(participantes) {
        const lista = [...(participantes ?? [])];
        lista.sort((a, b) => this.#comparar(a, b));
        return lista.map((p, i) => new FilaPosicion(i + 1, p.nombre, p.esJugador, p.terminado,
            p.terminado ? p.tiempoTotalMs : null));
    }

    // Puesto (1, 2, …) del jugador, o 0 si no está
    puestoJugador(filas) {
        return filas.find(f => f.esJugador)?.puesto ?? 0;
    }

    #comparar(a, b) {
        if (a.terminado !== b.terminado) return a.terminado ? -1 : 1;
        if (a.terminado) return a.tiempoTotalMs - b.tiempoTotalMs;
        return b.avance - a.avance;
    }
}
