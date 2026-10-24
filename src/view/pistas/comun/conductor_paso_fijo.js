'use strict';

import { BuclePasoFijo } from './bucle_paso_fijo.js';

// ================================================================
// VIEW — ConductorPasoFijo: avanza un Carro con pasos fijos de 60 Hz
// (PRD 006, D5). Lo comparten los 5 visores 3D.
//   - Por cada paso copia las entradas al carro y llama a actualizar(dt).
//   - alPaso(carro, pxAntes, pzAntes) (opcional) corre después de cada paso,
//     por ejemplo para que el visor aplique lo que calcula el modelo
//     (choques, avance por la ruta).
// ================================================================
export class ConductorPasoFijo {
    static #MS_POR_PASO = 1000 / 60;

    #bucle = new BuclePasoFijo();
    #carro = null;
    #alPaso;
    #pasosUltimoCuadro = 0;

    constructor(alPaso = null) {
        this.#alPaso = typeof alPaso === 'function' ? alPaso : null;
    }

    get carro()             { return this.#carro; }
    get pasosUltimoCuadro() { return this.#pasosUltimoCuadro; }

    // Un carro nuevo empieza sin tiempo acumulado
    set carro(carro) {
        this.#carro = carro ?? null;
        this.#bucle.reiniciar();
    }

    reiniciar() { this.#bucle.reiniciar(); }
    vaciar()    { this.#bucle.vaciar(); }

    // Avanza un cuadro y devuelve cuántos pasos fijos se dieron
    avanzar(marca, entradaAcel, entradaDireccion, activo = true) {
        const carro = this.#carro;
        this.#pasosUltimoCuadro = this.#bucle.avanzar(marca, activo && !!carro, () => {
            const pxAntes = carro.px, pzAntes = carro.pz;
            carro.entradaAcel      = entradaAcel;
            carro.entradaDireccion = entradaDireccion;
            carro.actualizar(ConductorPasoFijo.#MS_POR_PASO);
            this.#alPaso?.(carro, pxAntes, pzAntes);
        });
        return this.#pasosUltimoCuadro;
    }
}
