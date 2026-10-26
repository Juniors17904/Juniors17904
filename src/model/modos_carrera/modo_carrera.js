'use strict';

// ================================================================
// MODEL — ModoCarrera: contra quién se corre en Jugar Solo (PRD 018, D2).
// Superclase de ModoContraPC y ModoContrarreloj. No hereda de Modo (los
// modos de Inicio del PRD 002): este es el modo de una carrera.
//   - clave: cómo se guarda la elección; nombre: lo que lee el jugador.
//   - hayRivales: si en la pista corren los rivales de la PC.
// ================================================================
class ModoCarrera {
    get clave()      { return ''; }
    get nombre()     { return ''; }
    get hayRivales() { return false; }
}

window.ModoCarrera = ModoCarrera;
