'use strict';

import { CarreraConRivales } from '../../../model/carrera_con_rivales.js';
import { GrillaSalida }      from '../../../model/grilla_salida.js';
import { EscenaRivales }     from './escena_rivales.js';

// ================================================================
// VIEW — RivalesCarreraSolo: junta lo que VisorCarreraSolo necesita de
// los 4 rivales de la PC (PRD 013, D8).
//   - Crea la CarreraConRivales (modelo) con una semilla nueva por carrera
//     y los lugares de la GrillaSalida (el último es del jugador).
//   - Crea EscenaRivales (los carros 3D) y la avanza en cada cuadro solo
//     mientras está activa (desde ¡YA!; sigue aunque el jugador ya llegó, D5).
//   - reiniciar() devuelve a los 4 rivales a la grilla (Revancha).
// No decide reglas de carrera: todo lo calcula el modelo.
// ================================================================
export class RivalesCarreraSolo {
    static #CANTIDAD_PUESTOS = 5;
    static #INDICE_JUGADOR   = 4;
    static #MAX_SEMILLA      = 2147483647;

    #carrera;          // CarreraConRivales (modelo)
    #escena3D;         // EscenaRivales (vista)
    #puntos;           // PuntoSalida[] (los 4 primeros son de los rivales)
    #activo = false;
    #carga  = null;

    // muestras: MuestraRuta[] por longitud de arco de la misma ruta
    constructor(escena, ruta, decoraciones, muestras, medidas) {
        const semilla = Date.now() % RivalesCarreraSolo.#MAX_SEMILLA;
        this.#carrera = new CarreraConRivales(ruta, decoraciones ?? [], muestras, semilla);
        this.#puntos  = new GrillaSalida(medidas).puntos(ruta.inicio, RivalesCarreraSolo.#CANTIDAD_PUESTOS, muestras);
        this.#carrera.colocarEnGrilla(this.#puntos.slice(0, RivalesCarreraSolo.#INDICE_JUGADOR));
        this.#escena3D = new EscenaRivales(escena, this.#carrera, medidas);
    }

    get carrera()      { return this.#carrera; }
    get puntoJugador() { return this.#puntos[RivalesCarreraSolo.#INDICE_JUGADOR]; }
    get activo()       { return this.#activo; }

    set activo(valor) {
        const nuevo = !!valor;
        if (nuevo && !this.#activo) this.#escena3D.reiniciar();   // sin tiempo acumulado
        this.#activo = nuevo;
    }

    // Carga los modelos 3D una sola vez; nunca rechaza (EscenaRivales registra su error)
    cargar() {
        this.#carga ??= this.#escena3D.cargar();
        return this.#carga;
    }

    // Un cuadro: pasos de 60 Hz de los rivales (con choques contra el jugador)
    avanzar(marca, carroJugador, medidaJugador) {
        return this.#escena3D.avanzar(marca, this.#activo, carroJugador, medidaJugador);
    }

    reiniciar() {
        this.#activo = false;
        this.#carrera.reiniciar(this.#puntos.slice(0, RivalesCarreraSolo.#INDICE_JUGADOR));
        this.#escena3D.reiniciar();
    }

    destruir() {
        this.#activo = false;
        this.#escena3D.destruir();
    }
}
