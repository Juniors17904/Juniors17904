'use strict';

// ================================================================
// MODEL — MedidorAvance: cuánto avanzó un carro en la carrera, en vueltas
// (vueltas completas + progreso de la vuelta), a partir de su CarreraVueltas
// (PRD 013, concepto "Posición"). Sirve igual para el jugador y los rivales.
//   - Un carro que salió detrás de la meta y todavía no la cruzó cuenta como
//     vuelta 0: su avance es negativo y pequeño (progreso − 1).
//   - Un carro que terminó tiene avance igual al total de vueltas.
// No cambia CarreraVueltas: solo lee sus getters.
// ================================================================
export class MedidorAvance {
    static #MITAD = 0.5;

    avanceDe(carrera) {
        if (!carrera) return 0;
        if (carrera.terminada) return carrera.totalVueltas;
        const completas = carrera.vueltaActual - 1;
        const progreso  = carrera.progreso;
        // Sin el primer punto de control y en la segunda mitad: está antes de la meta
        if (carrera.puntoControlSiguiente === 1 && progreso > MedidorAvance.#MITAD) {
            return completas + progreso - 1;
        }
        return completas + progreso;
    }
}
