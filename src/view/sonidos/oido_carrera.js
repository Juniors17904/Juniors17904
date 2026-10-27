'use strict';

// ================================================================
// VIEW — OidoCarrera: reconoce, con lo que ya se ve de la carrera, cuándo
// hay un choque o un derrape (PRD 022, D8). El modelo no cambia:
//   - Choque: la velocidad cambia de signo de golpe (un choque de frente
//     rebota hacia atrás) o cae más de lo que puede frenar el pedal en los
//     pasos de física de ese cuadro. Entre dos golpes pasa un ratito.
//   - Derrape: frenar a fondo o girar a fondo yendo rápido.
// reiniciar() olvida la velocidad anterior (cuenta y Revancha), así un
// carro que vuelve a la salida no suena como un choque.
// ================================================================
class OidoCarrera {
    static #MAX_CAIDA_PASO   = 0.055;   // lo más que baja la velocidad en un paso sin chocar
    static #MARGEN_CAIDA     = 0.08;
    static #PAUSA_GOLPES_MS  = 300;
    static #FRENO_RAPIDO     = 0.35;    // fracción de la velocidad máxima
    static #GIRO_RAPIDO      = 0.7;

    #velocidadAntes = null;
    #ultimoGolpe    = -Infinity;

    reiniciar() {
        this.#velocidadAntes = null;
        this.#ultimoGolpe = -Infinity;
    }

    // true una sola vez por choque. visor: velocidad y pasosUltimoFrame
    hayChoque(visor, ahoraMs) {
        const v = Number(visor?.velocidad) || 0, antes = this.#velocidadAntes;
        this.#velocidadAntes = v;
        if (antes === null) return false;
        const pasos = Math.max(1, Number(visor?.pasosUltimoFrame) || 1);
        const rebote = antes > 0.03 && v < -0.01;
        const caida  = Math.abs(antes) - Math.abs(v) > pasos * OidoCarrera.#MAX_CAIDA_PASO + OidoCarrera.#MARGEN_CAIDA;
        if (!(rebote || caida) || ahoraMs - this.#ultimoGolpe < OidoCarrera.#PAUSA_GOLPES_MS) return false;
        this.#ultimoGolpe = ahoraMs;
        return true;
    }

    // Frenar a fondo o girar a fondo yendo rápido
    hayDerrape(visor) {
        const base = Number(visor?.velocidadMaxBase) || 0;
        const fraccion = base > 0 ? Math.abs(Number(visor?.velocidad) || 0) / base : 0;
        const frenando = visor?.entradaAcel === -1 && fraccion > OidoCarrera.#FRENO_RAPIDO;
        const girando  = fraccion * Math.abs(Number(visor?.entradaDireccion) || 0) > OidoCarrera.#GIRO_RAPIDO;
        return frenando || girando;
    }
}

window.OidoCarrera = OidoCarrera;
