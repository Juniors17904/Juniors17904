'use strict';
try {

// ================================================================
// VIEW — EstiloPedales: superclase de los estilos de ACEL y FRENO
// (PRD 021, D3, D4 y D7). Cada estilo es una clase CSS que dibuja su
// forma DENTRO de la caja del PRD 016 (tamaño, lugar y separación no
// cambian): la galería la pone en sus muestras y EstiloControlesCarrera
// en los botones de Jugar Solo. Así hay una sola forma de dibujarlos.
// Interfaz: clave, nombre, claseCss, aplicarA(elementos), quitar().
// La luz y el hundido al apretar (.apretado, RespuestaToque) siguen
// valiendo en todos los estilos.
// ================================================================
class EstiloPedales {
    #elementos = [];   // a los que se les puso la clase (para poder sacarla)

    get clave()  { return ''; }
    get nombre() { return ''; }
    get claseCss() { return 'pedales-' + this.clave; }

    // Pone el estilo en los elementos dados (botones o muestras de la galería)
    aplicarA(elementos) {
        for (const el of elementos ?? []) {
            if (!el?.classList) continue;
            el.classList.add(this.claseCss);
            this.#elementos.push(el);
        }
    }

    // Saca el estilo de todo lo que lo recibió: vuelven a su aspecto de siempre
    quitar() {
        for (const el of this.#elementos) el.classList.remove(this.claseCss);
        this.#elementos = [];
    }
}

window.EstiloPedales = EstiloPedales;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[estilo_pedales.js] ' + e.message);
    console.error('[estilo_pedales.js]', e);
}
