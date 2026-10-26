'use strict';

import { ConstantesFisica } from './constantes_fisica.js';

// ================================================================
// MODEL — TransferenciaPeso: cuánto peso pasa a las ruedas de adelante
// o de atrás según el pedal (PRD 019). Es la única dueña de sus números.
//   - Acelerar: el peso va atrás y el carro gira un poco menos (~5 %).
//   - Soltar:   el peso va adelante y gira más cerrado (~10 %).
//   - Frenar:   más peso adelante, gira aún más cerrado (~20 %) y el
//     carro de poco agarre derrapa un poco más.
//   - Reversa:  sin transferencia.
//   El cambio entra de a poco (soltar en ~0,3 s, freno en ~0,1 s) y es
//   igual a 30, 60 o 120 Hz porque se suaviza con el paso de tiempo k.
//   El carro más pesado lo nota menos y el de menos agarre, más (PRD 007).
//   Con intensidad 0 no transfiere nada: es la base, el giro de antes.
// ================================================================
export class TransferenciaPeso {
    static #CARGA_ACELERAR = -0.05;   // carga hacia atrás con el acelerador a fondo
    static #CARGA_SOLTAR   = 0.115;   // carga hacia adelante sin pedal
    static #CARGA_FRENAR   = 0.225;   // carga hacia adelante frenando
    static #PASOS_SOLTAR   = 18;      // ~0,3 s (pasos de 1/60 s) para casi llegar
    static #PASOS_FRENAR   = 6;       // ~0,1 s: una frenada es corta
    static #RESTO          = 0.05;    // "casi llegar" = queda un 5 %
    static #EXPONENTE_MASA   = 0.15;  // cuánto pesa la masa en la sensibilidad
    static #EXPONENTE_AGARRE = 0.1;   // cuánto pesa el agarre en la sensibilidad
    static #DERRAPE_FRENANDO = 1.5;   // derrape extra por la carga del freno
    static #VEL_FRENA        = 0.01;  // por encima de esto, -1 frena (como Carro)

    #carga = 0;          // carga actual, ya suavizada
    #sensibilidad;
    #agarre;
    #intensidad;

    constructor(constantes = new ConstantesFisica(), intensidad = 1) {
        const c = constantes instanceof ConstantesFisica ? constantes : new ConstantesFisica();
        const T = TransferenciaPeso;
        this.#agarre = c.agarre;
        this.#intensidad = Math.min(1, Math.max(0, Number(intensidad) || 0));
        this.#sensibilidad = Math.pow(1 / c.masa, T.#EXPONENTE_MASA) * Math.pow(1 / c.agarre, T.#EXPONENTE_AGARRE);
    }

    // Multiplica el giro del carro: >1 gira más cerrado, <1 más abierto
    get factorGiro() { return 1 + this.#carga * this.#sensibilidad; }

    // Multiplica el derrape: solo crece con la carga extra del freno, más
    // cuanto menos agarre tenga el carro
    get factorDerrape() {
        const extra = Math.max(0, this.#carga - TransferenciaPeso.#CARGA_SOLTAR * this.#intensidad);
        return 1 + extra * TransferenciaPeso.#DERRAPE_FRENANDO / this.#agarre;
    }

    // Avanza k pasos de referencia (1/60 s) con el pedal y la velocidad del carro
    actualizar(entradaAcel, velocidad, k = 1) {
        if (!(k > 0)) return;
        const T = TransferenciaPeso;
        const frena  = entradaAcel === -1 && velocidad > T.#VEL_FRENA;
        const meta   = this.#meta(entradaAcel, velocidad, frena) * this.#intensidad;
        const pasos  = frena && meta > this.#carga ? T.#PASOS_FRENAR : T.#PASOS_SOLTAR;
        const queda  = Math.pow(T.#RESTO, k / pasos);
        this.#carga  = meta + (this.#carga - meta) * queda;
    }

    #meta(entradaAcel, velocidad, frena) {
        const T = TransferenciaPeso;
        if (velocidad < 0) return 0;                 // reversa: sin transferencia
        if (frena) return T.#CARGA_FRENAR;
        if (entradaAcel === 1) return T.#CARGA_ACELERAR;
        if (entradaAcel === -1) return 0;            // -1 parado: arranca la reversa
        return T.#CARGA_SOLTAR;
    }
}
