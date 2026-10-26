'use strict';

// ================================================================
// MODEL — DificultadFacil: los rivales van más lentos y aflojan más para
// esperar al jugador (PRD 018, D4). Con menos de 4 rivales corren primero
// los más lentos: el Novato y el Prudente (D3).
// ================================================================
class DificultadFacil extends window.DificultadCarrera {
    static #RITMO_BASE     = 0.9;
    static #RITMO_MINIMO   = 0.75;
    static #RITMO_MAXIMO   = 1.0;
    static #FUERZA_ESPERAR = 1.6;

    get clave()         { return 'facil'; }
    get nombre()        { return 'Fácil'; }
    get ritmoBase()     { return DificultadFacil.#RITMO_BASE; }
    get ritmoMinimo()   { return DificultadFacil.#RITMO_MINIMO; }
    get ritmoMaximo()   { return DificultadFacil.#RITMO_MAXIMO; }
    get fuerzaEsperar() { return DificultadFacil.#FUERZA_ESPERAR; }

    // Los últimos de la lista (los más lentos), en el mismo orden de la grilla
    indicesPilotos(cantidad, total) {
        return super.indicesPilotos(cantidad, total).map(i => total - 1 - i).reverse();
    }
}

window.DificultadFacil = DificultadFacil;
