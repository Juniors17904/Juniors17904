'use strict';

// ================================================================
// MODEL — MedidaCarro: largo, ancho y alto reales de un tipo de carro,
// en metros (1 unidad = 1 metro, PRD 009). Ancho y alto salen de la
// forma de su modelo 3D (proporción medida del GLB).
// ================================================================
class MedidaCarro {
    #largo; #ancho; #alto;

    constructor(largo, anchoSobreLargo, altoSobreLargo) {
        this.#largo = largo;
        this.#ancho = largo * anchoSobreLargo;
        this.#alto  = largo * altoSobreLargo;
    }

    get largo() { return this.#largo; }
    get ancho() { return this.#ancho; }
    get alto()  { return this.#alto; }
}

window.MedidaCarro = MedidaCarro;
