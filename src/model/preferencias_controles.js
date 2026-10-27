'use strict';

// ================================================================
// MODEL — PreferenciasControles: recuerda el timón y el estilo de pedales
// elegidos (PRD 021, D6 y D7), también después de recargar la página.
// Los guarda por su clave (por ejemplo 'rally'), no por número, con su
// propia clave del almacenamiento del navegador. Si no hay nada guardado
// o lo guardado no se conoce, queda el Clásico. El velocímetro no se guarda.
// ================================================================
class PreferenciasControles {
    static #CLAVE = 'tr_controles';

    #almacen;
    #catalogo = new window.CatalogoControles();

    constructor(almacen = null) {
        this.#almacen = almacen ?? this.#almacenNavegador();
    }

    // Pone en el estado el timón y los pedales guardados (o los Clásicos)
    cargar(estado) {
        const datos = this.#leer();
        estado.timon         = this.#catalogo.timonValido(datos?.timon);
        estado.estiloPedales = this.#catalogo.pedalesValidos(datos?.pedales);
    }

    guardar(estado) {
        if (!this.#almacen) return;
        try {
            this.#almacen.setItem(PreferenciasControles.#CLAVE, JSON.stringify({
                timon: estado.timon, pedales: estado.estiloPedales,
            }));
        } catch { /* sin almacenamiento: solo se pierde el recuerdo */ }
    }

    #leer() {
        try {
            const datos = JSON.parse(this.#almacen?.getItem(PreferenciasControles.#CLAVE) ?? 'null');
            return datos && typeof datos === 'object' ? datos : null;
        } catch { return null; }
    }

    #almacenNavegador() {
        try { return window.localStorage ?? null; } catch { return null; }
    }
}

window.PreferenciasControles = PreferenciasControles;
