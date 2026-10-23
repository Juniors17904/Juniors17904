'use strict';

// ================================================================
// CLASE: DeslizadorAlturaCamara — conecta el deslizador de altura de
// cámara (#slider-cam-height, dentro de #ctrl-cam-height) a un visor
// 3D. Usa oninput (un solo manejador) para que entrar varias veces no
// acumule escuchas. Lo usan Test Drive 3D simple y el circuito 3D.
// ================================================================
class DeslizadorAlturaCamara {
    static #ALTURA_INICIAL = '2.8';

    #deslizador = document.getElementById('slider-cam-height');
    #contenedor = document.getElementById('ctrl-cam-height');

    // alCambiar(valor) recibe la altura elegida como número
    conectar(alCambiar) {
        this.#deslizador.value = DeslizadorAlturaCamara.#ALTURA_INICIAL;
        this.#contenedor.style.display = 'flex';
        this.#deslizador.oninput = e => alCambiar(parseFloat(e.target.value));
    }

    desconectar() {
        this.#deslizador.oninput = null;
    }
}
