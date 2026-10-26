'use strict';

// ================================================================
// MODEL — PreferenciasCarrera: recuerda la última elección de "Preparar
// carrera" (PRD 018, D5): modo, dificultad, rivales y pista, también
// después de recargar la página. Usa su propia clave del almacenamiento
// del navegador (no la de VistaConduccion). Si no hay nada guardado o el
// dato no sirve, queda la carrera de siempre.
// ================================================================
class PreferenciasCarrera {
    static #CLAVE = 'tr_carrera';

    #almacen;
    #catalogo = new window.CatalogoCarrera();

    constructor(almacen = null) {
        this.#almacen = almacen ?? this.#almacenNavegador();
    }

    get catalogo() { return this.#catalogo; }

    // Pone en el estado la elección guardada (y la pista, si existe)
    cargar(estado) {
        const eleccion = this.#catalogo.eleccionPorOmision();
        const datos = this.#leer();
        if (datos) {
            eleccion.modo       = this.#catalogo.modo(datos.modo);
            eleccion.dificultad = this.#catalogo.dificultad(datos.dificultad);
            if (typeof datos.rivales === 'number') eleccion.rivales = datos.rivales;
            if (datos.pista && window.registroPistas?.obtener(datos.pista)) estado.pista = datos.pista;
        }
        estado.eleccion = eleccion;
        return eleccion;
    }

    guardar(estado) {
        const eleccion = estado.eleccion;
        if (!eleccion || !this.#almacen) return;
        try {
            this.#almacen.setItem(PreferenciasCarrera.#CLAVE, JSON.stringify({
                modo: eleccion.modo.clave, dificultad: eleccion.dificultad.clave,
                rivales: eleccion.rivales, pista: estado.pista,
            }));
        } catch { /* sin almacenamiento: solo se pierde el recuerdo */ }
    }

    #leer() {
        try {
            const datos = JSON.parse(this.#almacen?.getItem(PreferenciasCarrera.#CLAVE) ?? 'null');
            return datos && typeof datos === 'object' ? datos : null;
        } catch { return null; }
    }

    #almacenNavegador() {
        try { return window.localStorage ?? null; } catch { return null; }
    }
}

window.PreferenciasCarrera = PreferenciasCarrera;
