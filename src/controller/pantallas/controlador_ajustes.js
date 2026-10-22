'use strict';

// ================================================================
// CLASE: ControladorAjustes — pantalla de ajustes (PRD 004 D6)
// Entra con la tuerca de Inicio y vuelve a Inicio.
// ================================================================
class ControladorAjustes extends ControladorPantalla {
    constructor(navegar) {
        super(navegar);
    }

    iniciar() {
        document.getElementById('btn-garage').addEventListener('click', () => this.irA('pantalla-ajustes'));
        document.getElementById('btn-volver-ajustes').addEventListener('click', () => this.irA('pantalla-inicio'));
    }
}
