'use strict';

// ================================================================
// CLASE: ControladorPedales — pantalla de la galería de pedales
// (PRD 021, RF-01 y RF-08). Se llega desde "Diseño de botones y pedales"
// (#pantalla-controles). Al elegir un estilo lo pone en el estado
// compartido de Aplicacion y lo guarda con PreferenciasControles.
// ================================================================
class ControladorPedales extends ControladorPantalla {
    #estado       = null;
    #preferencias = null;
    #galeria      = null;

    constructor(estado, navegar, preferencias) {
        super(navegar);
        this.#estado       = estado;
        this.#preferencias = preferencias;
    }

    iniciar() {
        this.#galeria = new GaleriaPedales(document.querySelector('#pantalla-pedales-diseno .pedales-grid'));
        this.#galeria.alElegir(clave => this.#elegir(clave));
        document.getElementById('btn-disenar-pedales').addEventListener('click', () => {
            this.#galeria.dibujar(this.#estado.estiloPedales);
            this.irA('pantalla-pedales-diseno');
        });
        document.getElementById('btn-volver-pedales-diseno').addEventListener('click', () => this.irA('pantalla-controles'));
    }

    #elegir(clave) {
        this.#estado.estiloPedales = clave;
        this.#preferencias?.guardar(this.#estado);
        this.#galeria.dibujar(this.#estado.estiloPedales);
    }
}
