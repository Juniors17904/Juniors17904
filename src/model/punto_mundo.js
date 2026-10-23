'use strict';

// ================================================================
// CLASE: PuntoMundo — un punto del plano XZ del mundo 3D (por
// ejemplo una muestra de la ruta o un punto del recorrido del carro).
// Solo se lee (lección 3: nada de [x, z] ni { x, z } guardados).
// ================================================================
class PuntoMundo {
    #x = 0;
    #z = 0;

    constructor(x, z) {
        this.#x = x;
        this.#z = z;
    }

    get x() { return this.#x; }
    get z() { return this.#z; }
}
