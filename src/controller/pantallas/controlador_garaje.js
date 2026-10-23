'use strict';

// ================================================================
// CLASE: ControladorGaraje — pantallas de garaje y vista previa del
// carro (PRD 004 D6). Crea una instancia de Garaje (D7) y la hace
// entrar cada vez que se abre el garaje desde ⚙.
// ================================================================
class ControladorGaraje extends ControladorPantalla {
    #estado = null;
    #garaje = null;

    constructor(estado, navegar) {
        super(navegar);
        this.#estado = estado;
    }

    iniciar() {
        this.#garaje = new Garaje(this.#estado, id => this.irA(id));
        document.getElementById('btn-ir-garage').addEventListener('click', () => {
            this.irA('pantalla-garage');
            this.#garaje.entrar();
        });
    }
}
