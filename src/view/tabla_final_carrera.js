'use strict';
try {

// ================================================================
// CLASE: TablaFinalCarrera — Vista de la tabla de posiciones de Jugar Solo
// (PRD 013, D5). Pinta una fila por puesto: "1.º", el nombre y el tiempo
// total (o "en carrera" si ese carro todavía no llegó). La fila del
// jugador va resaltada. Sin lógica de negocio: el orden lo da el modelo
// (TablaPosiciones → FilaPosicion[]).
// ================================================================
class TablaFinalCarrera {
    static #TEXTO_EN_CARRERA = 'en carrera';

    #contenedor = null;
    #formato = null;   // Cronometro: solo se usa su formatear(ms)

    constructor(contenedor) {
        if (!contenedor) throw new Error('TablaFinalCarrera: falta el contenedor');
        this.#contenedor = contenedor;
        this.#contenedor.classList?.add('tabla-final-carrera');
    }

    // ── Dibuja todas las filas (borra las anteriores) ───────────
    mostrar(filas) {
        const lista = Array.isArray(filas) ? filas : [];
        this.#vaciar();
        for (const fila of lista) this.#contenedor.appendChild(this.#crearFila(fila));
        this.#contenedor.style.display = lista.length > 0 ? 'flex' : 'none';
    }

    ocultar() {
        this.#vaciar();
        this.#contenedor.style.display = 'none';
    }

    // ── Privados ────────────────────────────────────────────────
    #vaciar() {
        if (typeof this.#contenedor.replaceChildren === 'function') this.#contenedor.replaceChildren();
        else this.#contenedor.textContent = '';
    }

    #crearFila(fila) {
        const div = document.createElement('div');
        div.className = fila.esJugador ? 'fila-tabla-final es-jugador' : 'fila-tabla-final';
        div.appendChild(this.#crearCelda('puesto-tabla-final', fila.puesto + '.º'));
        div.appendChild(this.#crearCelda('nombre-tabla-final', fila.nombre));
        div.appendChild(this.#crearCelda('tiempo-tabla-final', this.#textoTiempo(fila)));
        return div;
    }

    #crearCelda(clase, texto) {
        const celda = document.createElement('span');
        celda.className = clase;
        celda.textContent = String(texto ?? '');
        return celda;
    }

    #textoTiempo(fila) {
        if (!fila.terminado || !Number.isFinite(fila.tiempoMs)) return TablaFinalCarrera.#TEXTO_EN_CARRERA;
        return this.#formateador().formatear(fila.tiempoMs);
    }

    #formateador() {
        if (!this.#formato) this.#formato = new window.Cronometro();
        return this.#formato;
    }
}

window.TablaFinalCarrera = TablaFinalCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[tabla_final_carrera.js] ' + e.message);
    console.error('[tabla_final_carrera.js]', e);
}
