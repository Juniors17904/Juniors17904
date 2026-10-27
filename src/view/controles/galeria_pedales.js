'use strict';
try {

// ================================================================
// VIEW — GaleriaPedales: la galería de estilos de pedales de
// #pantalla-pedales-diseno (PRD 021, RF-01). Arma una tarjeta por estilo
// con su nombre y una muestra de FRENO y ACEL dibujada con el mismo
// estilo (EstiloPedales) que se usa en Jugar Solo, y marca el elegido.
// No guarda nada: avisa la clave elegida a quien se lo pida (el controlador).
// ================================================================
class GaleriaPedales {
    #contenedor;
    #registro = new window.RegistroEstilosPedales();
    #tarjetas = [];      // [clave, elemento]
    #alElegir = null;

    constructor(contenedor) {
        this.#contenedor = contenedor ?? null;
    }

    // alElegir(clave): se llama al tocar una tarjeta
    alElegir(funcion) { this.#alElegir = funcion; }

    dibujar(claveElegida) {
        if (!this.#tarjetas.length) this.#armar();
        for (const [clave, tarjeta] of this.#tarjetas) tarjeta.classList.toggle('sel', clave === claveElegida);
    }

    #armar() {
        if (!this.#contenedor) return;
        for (const estilo of this.#registro.estilos) {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'timon-card pedales-card';
            tarjeta.dataset.pedales = estilo.clave;
            const muestra = document.createElement('div');
            muestra.className = 'pedales-muestra';
            const freno = this.#muestraPedal('FRENO', 'freno');
            const acel  = this.#muestraPedal('ACEL', 'acel');
            muestra.append(freno, acel);
            estilo.aplicarA([freno, acel]);
            const nombre = document.createElement('span');
            nombre.className = 'timon-nombre';
            nombre.textContent = estilo.nombre;
            tarjeta.append(muestra, nombre);
            tarjeta.addEventListener('click', () => this.#alElegir?.(estilo.clave));
            this.#contenedor.appendChild(tarjeta);
            this.#tarjetas.push([estilo.clave, tarjeta]);
        }
    }

    #muestraPedal(texto, pedal) {
        const el = document.createElement('span');
        el.className = 'btn-dir pedal-muestra';
        el.dataset.pedal = pedal;
        el.textContent = texto;
        el.setAttribute('aria-label', texto);
        return el;
    }
}

window.GaleriaPedales = GaleriaPedales;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[galeria_pedales.js] ' + e.message);
    console.error('[galeria_pedales.js]', e);
}
