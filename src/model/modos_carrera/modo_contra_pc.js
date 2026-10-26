'use strict';

// ================================================================
// MODEL — ModoContraPC: la carrera contra los rivales de la PC (PRD 013),
// con la cantidad y la dificultad elegidas (PRD 018, D2).
// ================================================================
class ModoContraPC extends window.ModoCarrera {
    get clave()      { return 'contra-pc'; }
    get nombre()     { return 'Contra la PC'; }
    get hayRivales() { return true; }
}

window.ModoContraPC = ModoContraPC;
