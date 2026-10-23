'use strict';

// ================================================================
// CLASE: HistorialRecorrido — los puntos por donde pasó el carro.
// Solo guarda un punto nuevo si se alejó lo suficiente del último y
// descarta los más viejos al pasar del máximo.
// ================================================================
class HistorialRecorrido {
    #distanciaMinima2 = 0;   // distancia mínima al cuadrado
    #maximo           = 0;
    #puntos           = [];

    constructor(distanciaMinima2, maximo) {
        this.#distanciaMinima2 = distanciaMinima2;
        this.#maximo           = maximo;
    }

    registrar(x, z) {
        const ultimo = this.#puntos[this.#puntos.length - 1];
        const dx = ultimo ? x - ultimo.x : 999;
        const dz = ultimo ? z - ultimo.z : 999;
        if (dx * dx + dz * dz > this.#distanciaMinima2) this.#puntos.push(new PuntoMundo(x, z));
        if (this.#puntos.length > this.#maximo) this.#puntos.shift();
    }

    get puntos() { return this.#puntos; }
}
