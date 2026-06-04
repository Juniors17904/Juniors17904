'use strict';

// ================================================================
// CLASS: VistaConduccion — preferencias visuales de conducción
//        Encapsula tipo de cámara, altura y (futuro) minimap
// ================================================================
class VistaConduccion {
    static #CLAVE = 'vc_preferencias';

    #tipoCamara   = 'chase'; // 'chase' | 'aerea'
    #alturaCamara = 2.8;

    get tipoCamara()   { return this.#tipoCamara; }
    get alturaCamara() { return this.#alturaCamara; }

    set tipoCamara(val) {
        if (val !== 'chase' && val !== 'aerea') return;
        this.#tipoCamara = val;
        this.#guardar();
    }

    set alturaCamara(val) {
        this.#alturaCamara = Math.max(1, Math.min(8, +val));
        this.#guardar();
    }

    cargar() {
        try {
            const raw = localStorage.getItem(VistaConduccion.#CLAVE);
            if (!raw) return this;
            const d = JSON.parse(raw);
            if (d.tipoCamara === 'chase' || d.tipoCamara === 'aerea') this.#tipoCamara = d.tipoCamara;
            if (typeof d.alturaCamara === 'number') this.#alturaCamara = d.alturaCamara;
        } catch { /* sin datos guardados */ }
        return this;
    }

    aplicarA(circuito) {
        circuito.camHeight = this.#alturaCamara;
        const estaAerea = circuito.camAereaActiva;
        if (this.#tipoCamara === 'aerea' && !estaAerea) circuito.toggleCamaraAerea();
        if (this.#tipoCamara === 'chase'  &&  estaAerea) circuito.toggleCamaraAerea();
        return this;
    }

    #guardar() {
        localStorage.setItem(VistaConduccion.#CLAVE, JSON.stringify({
            tipoCamara:   this.#tipoCamara,
            alturaCamara: this.#alturaCamara,
        }));
    }
}

window.VistaConduccion = VistaConduccion;
