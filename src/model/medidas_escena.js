'use strict';

// ================================================================
// MODEL — MedidasEscena: todas las medidas del juego 3D en un solo lugar
// (PRD 009, D5). Escala: 1 unidad = 1 metro.
//   - Medidas de cada tipo de carro (MedidaCarro).
//   - Ancho del asfalto y del piano, y los bordes que salen de ellos.
//   La usan la vista (carro, pista, cámara, minimapa) y el modelo
//   (DetectorSuperficie y DetectorChoques).
// ================================================================
class MedidasEscena {
    static #MEDIO_ANCHO_ASFALTO = 4;
    static #ANCHO_PIANO         = 0.7;
    static #MARGEN_LIMITE_SUAVE = 0.2;   // el límite suave de los Test Drive, antes del borde
    static #MARGEN_LINEA_BORDE  = 0.1;   // la línea blanca del borde, dentro del asfalto
    static #LARGO_REFERENCIA    = 2.6;   // largo con que se dibujaba el carro antes del PRD 009

    // Largo real (D3) y proporciones ancho/largo y alto/largo de cada modelo GLB
    #carros = new Map([
        ['deportivo', new window.MedidaCarro(4.5, 0.4598, 0.3216)],
        ['suv',       new window.MedidaCarro(4.6, 0.5585, 0.4561)],
        ['muscle',    new window.MedidaCarro(4.8, 0.4647, 0.3155)],
        ['formula',   new window.MedidaCarro(5.0, 0.4598, 0.3216)],
        ['pickup',    new window.MedidaCarro(5.3, 0.5585, 0.4387)],
        ['clasico',   new window.MedidaCarro(6.0, 0.2747, 0.1963)],
    ]);

    get medioAnchoAsfalto() { return MedidasEscena.#MEDIO_ANCHO_ASFALTO; }
    get anchoPiano()        { return MedidasEscena.#ANCHO_PIANO; }
    get limitePiano()       { return MedidasEscena.#MEDIO_ANCHO_ASFALTO + MedidasEscena.#ANCHO_PIANO; }
    get limiteSuave()       { return MedidasEscena.#MEDIO_ANCHO_ASFALTO - MedidasEscena.#MARGEN_LIMITE_SUAVE; }
    get lineaBorde()        { return MedidasEscena.#MEDIO_ANCHO_ASFALTO - MedidasEscena.#MARGEN_LINEA_BORDE; }
    get tipos()             { return [...this.#carros.keys()]; }

    // Sin tipo o con un tipo desconocido se usan las del deportivo (carro básico)
    medidaCarro(tipo) {
        return this.#carros.get(tipo) ?? this.#carros.get('deportivo');
    }

    // Cuánto más grande es el carro que antes: la cámara se aleja en proporción (D7)
    escalaCamara(tipo) {
        return this.medidaCarro(tipo).largo / MedidasEscena.#LARGO_REFERENCIA;
    }
}

window.MedidasEscena = MedidasEscena;
