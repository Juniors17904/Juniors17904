'use strict';

// ================================================================
// CLASE: ControladorGaraje — pantallas de garaje y vista previa del
// carro (PRD 004 D6). Por ahora usa la clase Garaje tal cual: al
// entrar le pasa el estado y la forma de navegar (D7 la dividirá).
// ================================================================
class ControladorGaraje extends ControladorPantalla {
    #estado = null;

    constructor(estado, navegar) {
        super(navegar);
        this.#estado = estado;
    }

    iniciar() {
        document.getElementById('btn-ir-garage').addEventListener('click', () => {
            this.irA('pantalla-garage');
            Garaje.iniciar(this.#estado, id => this.irA(id));
        });
    }
}
