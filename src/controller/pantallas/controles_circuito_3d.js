'use strict';

// ================================================================
// CLASE: ControlesCircuito3D — botones de la barra del circuito 3D:
// CAM↑/CHASE, LIBRE/PATH (también con la tecla M), DATOS y MAPAS
// (PRD 004 D6). Los gestos de la cámara aérea los maneja
// GestosCamaraAerea y la altura de cámara DeslizadorAlturaCamara.
// Las teclas de conducción las maneja el ControlEntrada activo.
// ================================================================
class ControlesCircuito3D {
    #visor      = null;
    #mapas      = null;
    #teclaAbajo = null;

    constructor(visor, mapas) {
        this.#visor = visor;
        this.#mapas = mapas;
    }

    activar() {
        const cir = this.#visor;
        const btnMovLibre = document.getElementById('btn-mov-libre');

        // Solo 'm' queda aquí — las teclas de conducción las maneja el ControlEntrada activo
        this.#teclaAbajo = e => {
            if (e.key === 'm' || e.key === 'M') this.#alternarMovimientoLibre(btnMovLibre);
        };
        window.addEventListener('keydown', this.#teclaAbajo);

        const btnCamAerea = document.getElementById('btn-cam-aerea');
        btnCamAerea.style.display = 'block';
        btnCamAerea.textContent = 'CAM↑';
        btnCamAerea.onclick = () => {
            const activa = cir.toggleCamaraAerea();
            btnCamAerea.textContent = activa ? 'CHASE' : 'CAM↑';
            document.getElementById('ctrl-botones').style.display         = 'none';
            document.getElementById('btn-toggle-datos').style.display     = activa ? 'none'  : 'block';
            document.getElementById('btn-toggle-mapas').style.display     = activa ? 'none'  : 'block';
            document.getElementById('ctrl-cam-height').style.display      = activa ? 'none'  : 'flex';
            cir.entradaAcel = 0; cir.entradaDireccion = 0;
        };

        btnMovLibre.style.display = 'block';
        btnMovLibre.onclick = () => this.#alternarMovimientoLibre(btnMovLibre);

        const btnToggleDatos = document.getElementById('btn-toggle-datos');
        btnToggleDatos.style.display = 'block';
        let datosVisible = true;
        btnToggleDatos.onclick = () => {
            datosVisible = !datosVisible;
            document.getElementById('debug-td3d').style.display = datosVisible ? 'flex' : 'none';
            document.getElementById('debug-path').style.display = datosVisible ? 'block' : 'none';
            btnToggleDatos.textContent = datosVisible ? 'DATOS' : 'DATOS ✕';
        };

        const btnToggleMapas = document.getElementById('btn-toggle-mapas');
        btnToggleMapas.style.display = 'block';
        let mapasAreaVisible = true;
        btnToggleMapas.onclick = () => {
            mapasAreaVisible = !mapasAreaVisible;
            this.#mapas.mostrarAmbos(mapasAreaVisible);
            btnToggleMapas.textContent = mapasAreaVisible ? 'MAPAS' : 'MAPAS ✕';
        };
    }

    desactivar() {
        if (this.#teclaAbajo) window.removeEventListener('keydown', this.#teclaAbajo);
        this.#teclaAbajo = null;
    }

    #alternarMovimientoLibre(btnMovLibre) {
        const libre = this.#visor.toggleMovimientoLibre();
        btnMovLibre.textContent = libre ? 'LIBRE' : 'PATH';
        btnMovLibre.style.color = libre ? '#34d399' : '#a78bfa';
    }
}
