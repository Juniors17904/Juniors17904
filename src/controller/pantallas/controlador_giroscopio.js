'use strict';

// ================================================================
// CLASE: ControladorGiroscopio — pantalla de prueba del giroscopio
// (PRD 004 D6). Arranca el ProbadorGiroscopio al entrar y lo
// detiene con el botón volver.
// ================================================================
class ControladorGiroscopio extends ControladorPantalla {
    #probador = new ProbadorGiroscopio();

    constructor(navegar) {
        super(navegar);
    }

    iniciar() {
        document.getElementById('btn-ir-giro').addEventListener('click', () => {
            this.irA('pantalla-giro');
            this.#probador.iniciar();
        });
        document.getElementById('btn-volver-giro').addEventListener('click', () => {
            this.detener();
            this.irA('pantalla-ajustes');
        });
    }

    detener() {
        this.#probador.detener();
    }
}
