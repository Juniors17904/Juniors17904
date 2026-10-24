'use strict';

import { Carro }          from './carro.js';
import { CarroDeportivo } from './carro_deportivo.js';
import { CarroSUV }       from './carro_suv.js';
import { CarroMusculo }   from './carro_musculo.js';
import { CarroFormula }   from './carro_formula.js';
import { CarroPickup }    from './carro_pickup.js';
import { CarroClasico }   from './carro_clasico.js';

// ================================================================
// MODEL — RegistroCarros: decide qué física corresponde a cada modelo
// del garaje (PRD 007, D5). Si el modelo no está registrado usa el
// Carro básico y registra el error (RF-03).
// ================================================================
export class RegistroCarros {
    #clases = new Map([
        ['deportivo', CarroDeportivo],
        ['suv',       CarroSUV],
        ['muscle',    CarroMusculo],
        ['formula',   CarroFormula],
        ['pickup',    CarroPickup],
        ['clasico',   CarroClasico],
    ]);

    get tipos() { return [...this.#clases.keys()]; }

    // Sin tipo (antes de saber el modelo guardado) se usa el básico sin error
    crear(tipo, px = 0, pz = 0, rotY = 0) {
        const Clase = this.#clases.get(tipo);
        if (Clase) return new Clase(px, pz, rotY);
        if (tipo != null) {
            const mensaje = `[RegistroCarros] el modelo "${tipo}" no tiene física registrada: se usa el carro básico`;
            globalThis.__modelErrors = globalThis.__modelErrors || [];
            globalThis.__modelErrors.push(mensaje);
            console.error(mensaje);
        }
        return new Carro(px, pz, rotY);
    }

    constantesDe(tipo) {
        const Clase = this.#clases.get(tipo) ?? Carro;
        return new Clase().constantes;
    }
}

globalThis.RegistroCarros = RegistroCarros;
