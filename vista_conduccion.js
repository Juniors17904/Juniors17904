'use strict';

// ================================================================
// CLASS: VistaConduccion — preferencias visuales de conducción
//        Encapsula: tipo de cámara, altura, tipo de control
// ================================================================
class VistaConduccion {
    static #CLAVE = 'vc_preferencias';

    #tipoCamara   = 'chase';  // 'chase' | 'aerea'
    #alturaCamara = 2.8;
    #tipoControl  = 'timon';  // 'timon' | 'teclado'
    #control      = null;

    get tipoCamara()  { return this.#tipoCamara; }
    get alturaCamara(){ return this.#alturaCamara; }
    get tipoControl() { return this.#tipoControl; }

    set tipoCamara(val) {
        if (val !== 'chase' && val !== 'aerea') return;
        this.#tipoCamara = val;
        this.#guardar();
    }

    set alturaCamara(val) {
        this.#alturaCamara = Math.max(1, Math.min(8, +val));
        this.#guardar();
    }

    set tipoControl(val) {
        if (val !== 'timon' && val !== 'teclado') return;
        this.#tipoControl = val;
        this.#guardar();
    }

    cargar() {
        try {
            const raw = localStorage.getItem(VistaConduccion.#CLAVE);
            if (!raw) return this;
            const d = JSON.parse(raw);
            if (d.tipoCamara  === 'chase'   || d.tipoCamara  === 'aerea'  ) this.#tipoCamara  = d.tipoCamara;
            if (d.tipoControl === 'timon'   || d.tipoControl === 'teclado') this.#tipoControl = d.tipoControl;
            if (typeof d.alturaCamara === 'number') this.#alturaCamara = d.alturaCamara;
        } catch { /* sin datos guardados */ }
        return this;
    }

    aplicarA(circuito, timonModelo = 0) {
        // Cámara
        circuito.camHeight = this.#alturaCamara;
        const estaAerea = circuito.camAereaActiva;
        if (this.#tipoCamara === 'aerea' && !estaAerea) circuito.toggleCamaraAerea();
        if (this.#tipoCamara === 'chase' &&  estaAerea) circuito.toggleCamaraAerea();

        // Control
        this.#control?.destruir();
        this.#control = this.#tipoControl === 'teclado'
            ? new ControlTeclado()
            : new ControlTimon('canvas-timon', timonModelo);
        this.#control.activar(circuito);
        return this;
    }

    destruirControl() {
        this.#control?.destruir();
        this.#control = null;
    }

    #guardar() {
        localStorage.setItem(VistaConduccion.#CLAVE, JSON.stringify({
            tipoCamara:   this.#tipoCamara,
            alturaCamara: this.#alturaCamara,
            tipoControl:  this.#tipoControl,
        }));
    }
}

window.VistaConduccion = VistaConduccion;
