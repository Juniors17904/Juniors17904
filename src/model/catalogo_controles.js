'use strict';

// ================================================================
// MODEL — CatalogoControles: las claves de los timones y de los estilos
// de pedales que se pueden elegir (PRD 021, D7), en el orden en que se
// muestran en sus galerías. El timón se dibuja por su lugar en la lista
// (RenderizadorTimon); aquí, y solo aquí, se traduce la clave a ese lugar.
// Si una clave no se conoce, queda el Clásico.
// ================================================================
class CatalogoControles {
    // Rally y Camión van al final para no mover los 4 de hoy (PRD 021, riesgos)
    #timones = ['clasico', 'deportivo', 'f1', 'vintage', 'rally', 'camion'];
    #pedales = ['clasicos', 'deportivos', 'f1', 'retro'];

    get timones() { return [...this.#timones]; }
    get pedales() { return [...this.#pedales]; }

    get timonPorOmision()   { return this.#timones[0]; }
    get pedalesPorOmision() { return this.#pedales[0]; }

    timonValido(clave)   { return this.#timones.includes(clave) ? clave : this.timonPorOmision; }
    pedalesValidos(clave) { return this.#pedales.includes(clave) ? clave : this.pedalesPorOmision; }

    // Lugar del timón en la lista (el que usa RenderizadorTimon para dibujarlo)
    indiceTimon(clave) { return this.#timones.indexOf(this.timonValido(clave)); }
    claveTimon(indice) { return this.#timones[indice] ?? this.timonPorOmision; }
}

window.CatalogoControles = CatalogoControles;
