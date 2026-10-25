'use strict';

// ================================================================
// MODEL — MedidasEscena: todas las medidas del juego 3D en un solo lugar
// (PRD 009, D5). Escala: 1 unidad = 1 metro.
//   - Medidas de cada tipo de carro (MedidaCarro).
//   - Ancho del asfalto y del piano, y los bordes que salen de ellos.
//   - Medidas del árbol, el poste y la señal de curva, y la distancia de
//     postes y señales a la pista (PRD 010, D3, D5 y D6).
//   - Alturas y líneas del piso de la pista (PRD 012, D8).
//   - Señalética: flechas de curva, arcos de meta y de salida y cartel de
//     aviso, y dónde van las flechas (PRD 011, D4 a D9).
//   La usan la vista (carro, pista, objetos, cámara, minimapa) y el modelo
//   (DetectorSuperficie, DetectorChoques, objetos sólidos y pistas).
// ================================================================
class MedidasEscena {
    static #MEDIO_ANCHO_ASFALTO = 4;
    static #ANCHO_PIANO         = 0.7;
    static #MARGEN_LIMITE_SUAVE = 0.2;   // el límite suave de los Test Drive, antes del borde
    static #MARGEN_LINEA_BORDE  = 0.1;   // la línea blanca del borde, dentro del asfalto
    static #LARGO_REFERENCIA    = 2.6;   // largo con que se dibujaba el carro antes del PRD 009

    // Objetos junto a la pista (PRD 010, D3): el árbol con tamaño propio 1
    static #ALTO_ARBOL          = 7;
    static #RADIO_TRONCO_ARBOL  = 0.3;
    static #ALTURA_MINIMA_COPA  = 2.3;   // la copa nunca empieza más abajo, con cualquier tamaño propio
    static #ALTO_POSTE          = 8;
    static #RADIO_POSTE         = 0.15;
    static #LARGO_BRAZO_POSTE   = 1.5;
    static #RADIO_LAMPARA       = 0.25;
    static #ALTO_PALO_SENAL     = 2.2;
    static #RADIO_PALO_SENAL    = 0.05;
    static #LADO_CARTEL_SENAL   = 0.7;
    static #GROSOR_CARTEL_SENAL = 0.03;
    static #DISTANCIA_POSTES_Y_SENALES = 6.0;   // del centro de la pista (PRD 010, D5)

    // Piso de la pista (PRD 012): el pasto queda a nivel 0
    static #ALTURA_ASFALTO       = 0.08;  // el asfalto, sobre el pasto
    static #ALTURA_PIANO         = 0.08;  // borde exterior del piano, sobre el asfalto
    static #LARGO_FRANJA_PIANO   = 1;     // franjas rojas y blancas
    static #ANCHO_LINEA_CENTRAL  = 0.15;
    static #TRAZO_LINEA_CENTRAL  = 3;
    static #HUECO_LINEA_CENTRAL  = 6;
    static #ANCHO_LINEA_BORDE    = 0.15;
    static #LARGO_META           = 1;
    static #LADO_CUADRO_META     = 0.5;

    // Señalética (PRD 011). Flecha de curva: tablero de pista de carreras
    static #ANCHO_TABLERO_FLECHA  = 2.4;
    static #ALTO_TABLERO_FLECHA   = 0.8;
    static #BORDE_INFERIOR_FLECHA = 0.9;   // del piso al borde de abajo del tablero
    static #GROSOR_TABLERO_FLECHA = 0.03;
    static #RADIO_PALO_FLECHA     = 0.05;
    static #MARGEN_PALOS_FLECHA   = 0.2;   // de cada punta del tablero a su palo
    static #DISTANCIA_FLECHAS     = 5.4;   // del centro de la pista, fuera del piano (D5)
    static #PASO_FLECHAS          = 3;     // metros entre flechas, medidos en el centro de la pista
    static #LARGO_SEGMENTO_RUTA   = 4;     // metros de cada segmento con que Ruta arma la pista
    // Arcos de meta y de salida (D7): los postes van a la distancia de los postes de alumbrado
    static #ALTURA_LIBRE_ARCO     = 5.5;   // del piso a lo más bajo que cruza la pista
    static #RADIO_POSTE_ARCO      = 0.15;
    static #GROSOR_TRAVESANO_ARCO = 0.28;
    static #ALTO_BANDERA_META     = 0.8;
    static #LADO_CAJA_LUZ_SALIDA  = 0.55;
    static #FONDO_CAJA_LUZ_SALIDA = 0.44;
    static #GROSOR_BANDERA_META   = 0.06;
    // Cartel de aviso (D8): palo de 3 m y cartel de 1,4 × 0,75 m con marco blanco
    static #ALTO_PALO_AVISO       = 3;
    static #RADIO_PALO_AVISO      = 0.05;
    static #ANCHO_CARTEL_AVISO    = 1.4;
    static #ALTO_CARTEL_AVISO     = 0.75;
    static #MARCO_CARTEL_AVISO    = 0.1;   // borde blanco alrededor del panel de color
    static #GROSOR_CARTEL_AVISO   = 0.08;
    static #CENTRO_CARTEL_AVISO   = 3.3;   // altura del centro del cartel

    // Largo real (D3) y proporciones ancho/largo y alto/largo de cada modelo GLB
    #carros = new Map([
        ['deportivo', new window.MedidaCarro(4.5, 0.4598, 0.3216)],
        ['suv',       new window.MedidaCarro(4.5, 0.5585, 0.4561)],
        ['muscle',    new window.MedidaCarro(4.8, 0.4647, 0.3155)],
        ['formula',   new window.MedidaCarro(5.0, 0.4598, 0.3216)],
        ['pickup',    new window.MedidaCarro(4.5, 0.5585, 0.4387)],
        ['clasico',   new window.MedidaCarro(6.0, 0.2747, 0.1963)],
    ]);

    get medioAnchoAsfalto() { return MedidasEscena.#MEDIO_ANCHO_ASFALTO; }
    get anchoPiano()        { return MedidasEscena.#ANCHO_PIANO; }
    get limitePiano()       { return MedidasEscena.#MEDIO_ANCHO_ASFALTO + MedidasEscena.#ANCHO_PIANO; }
    get limiteSuave()       { return MedidasEscena.#MEDIO_ANCHO_ASFALTO - MedidasEscena.#MARGEN_LIMITE_SUAVE; }
    get lineaBorde()        { return MedidasEscena.#MEDIO_ANCHO_ASFALTO - MedidasEscena.#MARGEN_LINEA_BORDE; }

    // Árbol (tamaño propio 1: alto y radio se multiplican por el tamaño propio)
    get altoArbol()         { return MedidasEscena.#ALTO_ARBOL; }
    get radioTroncoArbol()  { return MedidasEscena.#RADIO_TRONCO_ARBOL; }
    get alturaMinimaCopa()  { return MedidasEscena.#ALTURA_MINIMA_COPA; }

    // Poste de alumbrado
    get altoPoste()         { return MedidasEscena.#ALTO_POSTE; }
    get radioPoste()        { return MedidasEscena.#RADIO_POSTE; }
    get largoBrazoPoste()   { return MedidasEscena.#LARGO_BRAZO_POSTE; }
    get radioLampara()      { return MedidasEscena.#RADIO_LAMPARA; }

    // Señal de curva
    get altoPaloSenal()     { return MedidasEscena.#ALTO_PALO_SENAL; }
    get radioPaloSenal()    { return MedidasEscena.#RADIO_PALO_SENAL; }
    get ladoCartelSenal()   { return MedidasEscena.#LADO_CARTEL_SENAL; }
    get grosorCartelSenal() { return MedidasEscena.#GROSOR_CARTEL_SENAL; }

    // Metros del centro de la pista a postes y señales de curva
    get distanciaPostesYSenales() { return MedidasEscena.#DISTANCIA_POSTES_Y_SENALES; }

    // Piso de la pista (PRD 012). El carro va a la altura del asfalto; los
    // objetos de la pista, sobre el pasto (nivel 0).
    get alturaAsfalto()     { return MedidasEscena.#ALTURA_ASFALTO; }
    get alturaPiano()       { return MedidasEscena.#ALTURA_PIANO; }
    get largoFranjaPiano()  { return MedidasEscena.#LARGO_FRANJA_PIANO; }
    get anchoLineaCentral() { return MedidasEscena.#ANCHO_LINEA_CENTRAL; }
    get trazoLineaCentral() { return MedidasEscena.#TRAZO_LINEA_CENTRAL; }
    get huecoLineaCentral() { return MedidasEscena.#HUECO_LINEA_CENTRAL; }
    get anchoLineaBorde()   { return MedidasEscena.#ANCHO_LINEA_BORDE; }
    get largoMeta()         { return MedidasEscena.#LARGO_META; }
    get ladoCuadroMeta()    { return MedidasEscena.#LADO_CUADRO_META; }

    // Flecha de curva (PRD 011, D4 y D5)
    get anchoTableroFlecha()  { return MedidasEscena.#ANCHO_TABLERO_FLECHA; }
    get altoTableroFlecha()   { return MedidasEscena.#ALTO_TABLERO_FLECHA; }
    get bordeInferiorFlecha() { return MedidasEscena.#BORDE_INFERIOR_FLECHA; }
    get grosorTableroFlecha() { return MedidasEscena.#GROSOR_TABLERO_FLECHA; }
    get radioPaloFlecha()     { return MedidasEscena.#RADIO_PALO_FLECHA; }
    get margenPalosFlecha()   { return MedidasEscena.#MARGEN_PALOS_FLECHA; }
    get distanciaFlechas()    { return MedidasEscena.#DISTANCIA_FLECHAS; }
    get pasoFlechas()         { return MedidasEscena.#PASO_FLECHAS; }
    get largoSegmentoRuta()   { return MedidasEscena.#LARGO_SEGMENTO_RUTA; }

    // Arcos de meta y de salida (PRD 011, D7)
    get distanciaPostesArco() { return MedidasEscena.#DISTANCIA_POSTES_Y_SENALES; }
    get alturaLibreArco()     { return MedidasEscena.#ALTURA_LIBRE_ARCO; }
    get radioPosteArco()      { return MedidasEscena.#RADIO_POSTE_ARCO; }
    get grosorTravesanoArco() { return MedidasEscena.#GROSOR_TRAVESANO_ARCO; }
    get altoBanderaMeta()     { return MedidasEscena.#ALTO_BANDERA_META; }
    get ladoCajaLuzSalida()   { return MedidasEscena.#LADO_CAJA_LUZ_SALIDA; }
    get fondoCajaLuzSalida()  { return MedidasEscena.#FONDO_CAJA_LUZ_SALIDA; }
    get grosorBanderaMeta()   { return MedidasEscena.#GROSOR_BANDERA_META; }

    // Cartel de aviso (PRD 011, D8)
    get altoPaloAviso()       { return MedidasEscena.#ALTO_PALO_AVISO; }
    get radioPaloAviso()      { return MedidasEscena.#RADIO_PALO_AVISO; }
    get anchoCartelAviso()    { return MedidasEscena.#ANCHO_CARTEL_AVISO; }
    get altoCartelAviso()     { return MedidasEscena.#ALTO_CARTEL_AVISO; }
    get marcoCartelAviso()    { return MedidasEscena.#MARCO_CARTEL_AVISO; }
    get grosorCartelAviso()   { return MedidasEscena.#GROSOR_CARTEL_AVISO; }
    get centroCartelAviso()   { return MedidasEscena.#CENTRO_CARTEL_AVISO; }

    // Sin tipo o con un tipo desconocido se usan las del deportivo (carro básico)
    medidaCarro(tipo) {
        return this.#carros.get(tipo) ?? this.#carros.get('deportivo');
    }

    // Cuánto más grande es el carro que antes: la cámara se aleja y las ruedas
    // giran más lento en proporción (D7)
    escalaCarro(tipo) {
        return this.medidaCarro(tipo).largo / MedidasEscena.#LARGO_REFERENCIA;
    }
}

window.MedidasEscena = MedidasEscena;
