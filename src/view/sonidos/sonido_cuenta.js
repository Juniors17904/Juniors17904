'use strict';

// ================================================================
// VIEW — SonidoCuenta: los pitidos de la cuenta (PRD 022, RF-02): uno en
// "3", "2" y "1", y uno más agudo y largo en "¡YA!".
// ================================================================
class SonidoCuenta extends window.EfectoSonido {
    sonar(texto) {
        const ya = texto === '¡YA!';
        this._tono('square', ya ? 880 : 440, 0, ya ? 0.45 : 0.18, 0.35);
    }
}

window.SonidoCuenta = SonidoCuenta;
