'use strict';

// ================================================================
// CLASE: ControladorVistaConduccion — pantalla de vista de conducción
// (PRD 004 D6). Muestra y cambia la cámara y el control guardados en
// VistaConduccion (el modelo de esas preferencias).
// ================================================================
class ControladorVistaConduccion extends ControladorPantalla {
    #vistaConduccion = null;

    constructor(vistaConduccion, navegar) {
        super(navegar);
        this.#vistaConduccion = vistaConduccion;
    }

    iniciar() {
        // PRD 004 D2: se conserva el doble registro original de entrar y volver
        // (cada toque deja dos entradas en el historial, igual que antes)
        this.#registrarEntradaYSalida();
        this.#registrarEntradaYSalida();

        const vc = this.#vistaConduccion;
        document.getElementById('vc-cam-chase').addEventListener('click', () => {
            vc.tipoCamara = 'chase';
            this.#actualizarSeleccionCamara();
        });
        document.getElementById('vc-cam-aerea').addEventListener('click', () => {
            vc.tipoCamara = 'aerea';
            this.#actualizarSeleccionCamara();
        });
        document.getElementById('vc-altura').addEventListener('input', e => {
            vc.alturaCamara = +e.target.value;
            document.getElementById('vc-altura-val').textContent = (+e.target.value).toFixed(1);
        });
        document.getElementById('vc-ctrl-timon').addEventListener('click', () => {
            vc.tipoControl = 'timon';
            this.#actualizarSeleccionControl();
        });
        document.getElementById('vc-ctrl-teclado').addEventListener('click', () => {
            vc.tipoControl = 'teclado';
            this.#actualizarSeleccionControl();
        });
    }

    #registrarEntradaYSalida() {
        document.getElementById('btn-ir-vista-conduccion').addEventListener('click', () => {
            this.#sincronizarPantalla();
            this.irA('pantalla-vista-conduccion');
        });
        document.getElementById('btn-volver-vista-conduccion').addEventListener('click', () => this.irA('pantalla-ajustes'));
    }

    #sincronizarPantalla() {
        const vc = this.#vistaConduccion;
        document.getElementById('vc-check-chase').textContent = vc.tipoCamara === 'chase' ? '✓' : '';
        document.getElementById('vc-check-aerea').textContent = vc.tipoCamara === 'aerea' ? '✓' : '';
        const alturaInput = document.getElementById('vc-altura');
        alturaInput.value = vc.alturaCamara;
        document.getElementById('vc-altura-val').textContent = vc.alturaCamara.toFixed(1);
        document.getElementById('vc-altura-wrap').style.display = vc.tipoCamara === 'chase' ? '' : 'none';
        document.getElementById('vc-check-ctrl-timon').textContent  = vc.tipoControl === 'timon'   ? '✓' : '';
        document.getElementById('vc-check-ctrl-teclado').textContent = vc.tipoControl === 'teclado' ? '✓' : '';
    }

    #actualizarSeleccionCamara() {
        const vc = this.#vistaConduccion;
        document.getElementById('vc-check-chase').textContent = vc.tipoCamara === 'chase' ? '✓' : '';
        document.getElementById('vc-check-aerea').textContent = vc.tipoCamara === 'aerea' ? '✓' : '';
        document.getElementById('vc-altura-wrap').style.display = vc.tipoCamara === 'chase' ? '' : 'none';
    }

    #actualizarSeleccionControl() {
        const vc = this.#vistaConduccion;
        document.getElementById('vc-check-ctrl-timon').textContent  = vc.tipoControl === 'timon'   ? '✓' : '';
        document.getElementById('vc-check-ctrl-teclado').textContent = vc.tipoControl === 'teclado' ? '✓' : '';
    }
}
