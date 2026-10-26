'use strict';

// ================================================================
// VIEW — AvisoRecord: el récord de la pista en el panel de resultado
// (PRD 020, D4 y D5): una línea con el récord y, si se batió, "¡Nuevo
// récord!" bien visible. Crea sus dos líneas dentro de los textos del
// panel; ocultar() las vacía para que Revancha no muestre el aviso viejo.
// ================================================================
class AvisoRecord {
    #linea = null;
    #nuevo = null;

    constructor(contenedorTextos) {
        if (!contenedorTextos || typeof document === 'undefined') return;
        this.#nuevo = this.#crear(contenedorTextos, 'resultado-carrera-nuevo-record',
            'font-size:22px;color:#ffcc00;font-weight:900;text-shadow:0 0 12px rgba(255,204,0,0.8);');
        this.#linea = this.#crear(contenedorTextos, 'resultado-carrera-record',
            'font-size:15px;color:#c4b5fd;font-weight:bold;text-align:center;');
        this.ocultar();
    }

    mostrar(texto, esNuevo) {
        if (this.#linea) { this.#linea.textContent = texto ?? ''; this.#linea.style.display = ''; }
        if (this.#nuevo) {
            this.#nuevo.textContent = esNuevo ? '¡Nuevo récord!' : '';
            this.#nuevo.style.display = esNuevo ? '' : 'none';
        }
    }

    ocultar() {
        for (const linea of [this.#linea, this.#nuevo]) {
            if (!linea) continue;
            linea.textContent = '';
            linea.style.display = 'none';
        }
    }

    #crear(contenedor, clase, estilo) {
        let linea = contenedor.querySelector('.' + clase);
        if (!linea) {
            linea = document.createElement('div');
            linea.className = clase;
            linea.style.cssText = estilo;
            const tabla = contenedor.querySelector('.resultado-carrera-tabla');   // antes de la tabla de puestos
            if (tabla) contenedor.insertBefore(linea, tabla); else contenedor.appendChild(linea);
        }
        return linea;
    }
}

window.AvisoRecord = AvisoRecord;
