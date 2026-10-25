// ================================================================
// CLASE: PilotoFalso — piloto de pruebas con la interfaz de PilotoPC
// (PRD 013): en cada paso acelera derecho y cuenta sus decisiones.
// Lo usa prueba_carrera_rivales.js (RF-06) sin depender de los pilotos reales.
// ================================================================
class PilotoFalso {
    #tipo;
    #decisiones = 0;

    constructor(tipo) { this.#tipo = tipo; }

    get nombre()     { return 'Falso'; }
    get tipoAuto()   { return this.#tipo; }
    get decisiones() { return this.#decisiones; }

    decidir(carro) {
        this.#decisiones++;
        carro.entradaAcel = 1;
        carro.entradaDireccion = 0;
    }

    ubicar()    {}
    reiniciar() {}
}

module.exports = { PilotoFalso };
