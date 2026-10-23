'use strict';

// ================================================================
// CLASE: PanelDatosDisenoGeneral — panel de depuración (#debug-dg) de
// Diseño General: velocidad, máxima, entradas, posición y FPS. Solo
// escribe si el panel está visible (el interruptor tog-datos-dg).
// ================================================================
class PanelDatosDisenoGeneral extends PanelDatos {
    #visor = null;

    constructor(visor) {
        super();
        this.#visor = visor;
    }

    escribir(fps) {
        const panel = document.getElementById('debug-dg');
        if (panel?.style.display === 'none') return;
        const dg  = this.#visor;
        this.poner('dgd-kmh',   Math.round(Math.abs(dg.velocidad) * 216));
        this.poner('dgd-vmax',  Math.round(dg.velocidadMax * 216));
        this.poner('dgd-gas',   dg.entradaAcel ===  1 ? '⬆ GAS'
                              : dg.entradaAcel === -1 ? '⬇ FREN' : 'NEUTRO');
        this.poner('dgd-steer', dg.entradaDireccion < -0.1 ? '◀ IZQ'
                              : dg.entradaDireccion >  0.1 ? 'DER ▶' : 'RECTO');
        this.poner('dgd-px',    dg.px.toFixed(1));
        this.poner('dgd-pz',    dg.pz.toFixed(1));
        this.poner('dgd-fps',   fps);
    }
}
