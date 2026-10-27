'use strict';
try {

// ================================================================
// VIEW — RegistroEstilosPedales: da el estilo de pedales por su clave
// (PRD 021, D7), en el orden de la galería (el mismo de
// CatalogoControles). Si la clave no se conoce, da el Clásico.
// Cada llamada a estilo() entrega una instancia nueva, para que cada
// lugar que lo usa pueda quitarlo sin tocar a los demás.
// ================================================================
class RegistroEstilosPedales {
    #clases = [window.PedalesClasicos, window.PedalesDeportivos, window.PedalesF1, window.PedalesRetro];

    // Un estilo de cada clase, en orden (para la galería)
    get estilos() { return this.#clases.map(Clase => new Clase()); }

    estilo(clave) {
        const Clase = this.#clases.find(C => new C().clave === clave) ?? this.#clases[0];
        return new Clase();
    }
}

window.RegistroEstilosPedales = RegistroEstilosPedales;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[registro_estilos_pedales.js] ' + e.message);
    console.error('[registro_estilos_pedales.js]', e);
}
