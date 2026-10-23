'use strict';

// ================================================================
// CLASE: ParMapasConduccion — superclase de los dos mapas de una
// pantalla de juego: el minimapa y el recorrido (subclases de
// MapaConduccion). Interfaz común: mostrar() y dibujar(visor).
// ================================================================
class ParMapasConduccion {
    #minimapa  = null;
    #recorrido = null;

    constructor(minimapa, recorrido) {
        this.#minimapa  = minimapa;
        this.#recorrido = recorrido;
    }

    get minimapa()  { return this.#minimapa; }
    get recorrido() { return this.#recorrido; }

    mostrar() {
        this.#minimapa.mostrar();
        this.#recorrido.mostrar();
    }

    dibujar(visor) {
        this.#minimapa.dibujar(visor);
        this.#recorrido.dibujar(visor);
    }
}
