'use strict';

// ================================================================
// MODEL — ConstantesFisica: los números que definen cómo se maneja un carro.
//   Las velocidades van en unidades por paso de referencia (1/60 s).
//   Los valores por defecto son los del carro básico de referencia.
//   Cada tipo de carro crea su propia instancia (PRD 007).
// ================================================================
export class ConstantesFisica {
    #velMaxAdelante;
    #velMaxReversa;
    #aceleracion;
    #freno;
    #rodadura;
    #aire;
    #direccion;
    #velGiroPleno;
    #subviraje;
    #masa;
    #agarre;

    constructor({
        velMaxAdelante = 0.74,
        velMaxReversa  = 0.28,
        aceleracion    = 0.0068,
        freno          = 0.026,
        rodadura       = 0.0035,
        aire           = 0.011,
        direccion      = 0.0105,
        velGiroPleno   = 0.15,
        subviraje      = 0.2,
        masa           = 1,
        agarre         = 1,
    } = {}) {
        this.#velMaxAdelante = velMaxAdelante;
        this.#velMaxReversa  = velMaxReversa;
        this.#aceleracion    = aceleracion;
        this.#freno          = freno;
        this.#rodadura       = rodadura;
        this.#aire           = aire;
        this.#direccion      = direccion;
        this.#velGiroPleno   = velGiroPleno;
        this.#subviraje      = subviraje;
        this.#masa           = masa > 0 ? masa : 1;
        this.#agarre         = agarre > 0 ? agarre : 1;
    }

    get velMaxAdelante() { return this.#velMaxAdelante; }
    get velMaxReversa()  { return this.#velMaxReversa; }
    get aceleracion()    { return this.#aceleracion; }
    get freno()          { return this.#freno; }
    get rodadura()       { return this.#rodadura; }
    get aire()           { return this.#aire; }
    get direccion()      { return this.#direccion; }
    get velGiroPleno()   { return this.#velGiroPleno; }
    get subviraje()      { return this.#subviraje; }
    get masa()           { return this.#masa; }
    get agarre()         { return this.#agarre; }
    // Fuerza del motor por unidad de masa: cuánto empuja de verdad
    get empuje()         { return this.#aceleracion / this.#masa; }
}
