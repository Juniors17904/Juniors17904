'use strict';

// ================================================================
// MODEL — DificultadDificil: los rivales corren a fondo y nunca aflojan
// para esperar al jugador (PRD 018, D4): su ritmo nunca baja de su ritmo
// base. Igual usan la física de su carro, sin pasar su tope (D4).
// ================================================================
class DificultadDificil extends window.DificultadCarrera {
    static #RITMO_BASE   = 1.15;
    static #RITMO_MAXIMO = 1.2;

    get clave()         { return 'dificil'; }
    get nombre()        { return 'Difícil'; }
    get ritmoBase()     { return DificultadDificil.#RITMO_BASE; }
    get ritmoMinimo()   { return DificultadDificil.#RITMO_BASE; }
    get ritmoMaximo()   { return DificultadDificil.#RITMO_MAXIMO; }
    get fuerzaEsperar() { return 0; }
}

window.DificultadDificil = DificultadDificil;
