'use strict';

// ================================================================
// CLASE: PanelDatosTestDriveRecto — panel de depuración (#debug-td3d)
// del Test Drive 3D simple: velocidad, entradas, posición, cámara,
// física y FPS (PRD 004 D6). Los FPS los cuenta PanelDatos.
// ================================================================
class PanelDatosTestDriveRecto extends PanelDatos {
    #visor       = null;
    #rotYInicial = 0;

    constructor(visor) {
        super();
        this.#visor       = visor;
        this.#rotYInicial = visor.rotY;
    }

    mostrar() {
        document.getElementById('debug-td3d').style.display = 'flex';
    }

    escribir(fps) {
        const td = this.#visor;
        const s = td.velocidad, a = td.aceleracion;
        const kmh = Math.round(Math.abs(s) * 216);
        document.getElementById('dbg-vel').textContent    = Math.abs(s).toFixed(3);
        document.getElementById('dbg-kmh').textContent    = kmh;
        document.getElementById('dbg-acel').textContent   = (a >= 0 ? '+' : '') + a.toFixed(4);
        document.getElementById('dbg-vmax').textContent   = td.velocidadMax.toFixed(3);
        document.getElementById('dbg-iacel').textContent  = td.entradaAcel ===  1 ? '⬆ GAS'
                                                          : td.entradaAcel === -1 ? '⬇ REVERSA' : 'NEUTRO';
        document.getElementById('dbg-idir').textContent   = td.entradaDireccion < -0.1 ? '◀ IZQ'
                                                          : td.entradaDireccion >  0.1 ? 'DER ▶' : 'RECTO';
        document.getElementById('dbg-px').textContent     = td.px.toFixed(2);
        document.getElementById('dbg-pz').textContent     = td.pz.toFixed(2);
        document.getElementById('dbg-rotx').textContent   = (0).toFixed(1);
        document.getElementById('dbg-rumbo').textContent  = (((td.rotY - this.#rotYInicial) * 180 / Math.PI % 360 + 360) % 360).toFixed(1);
        document.getElementById('dbg-rotz').textContent   = (td.rotZ * 180 / Math.PI).toFixed(1);
        document.getElementById('dbg-fps').textContent    = fps;
        document.getElementById('dbg-camh').textContent   = td.alturaCamara.toFixed(2);
        document.getElementById('dbg-cam-roty').textContent = (td.camRotY * 180 / Math.PI).toFixed(1);
        document.getElementById('dbg-cam-dist').textContent = td.camDist;
        const ph = td.constantesFisica;
        document.getElementById('dbg-f-accel').textContent  = ph?.aceleracion;
        document.getElementById('dbg-f-brake').textContent  = ph?.freno;
        document.getElementById('dbg-f-drag').textContent   = ph?.rodadura;
        document.getElementById('dbg-f-steer').textContent  = ph?.direccion;
        document.getElementById('dbg-f-maxfwd').textContent = ph?.velMaxAdelante;
        document.getElementById('dbg-f-maxrev').textContent = ph?.velMaxReversa;
    }
}
