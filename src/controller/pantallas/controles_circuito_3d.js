'use strict';

// ================================================================
// CLASE: ControlesCircuito3D — controles extra del circuito 3D:
// tecla M (movimiento libre), arrastre y pellizco de la cámara aérea
// en el canvas, altura de cámara y los botones CAM↑, LIBRE/PATH,
// DATOS y MAPAS (PRD 004 D6, sacado de Aplicacion sin cambios).
// Las teclas de conducción las maneja el ControlEntrada activo.
// ================================================================
class ControlesCircuito3D {
    #visor        = null;
    #lienzo       = null;
    #mapas        = null;
    #teclaAbajo   = null;
    #toqueInicio  = null;
    #toqueMover   = null;

    constructor(visor, lienzo, mapas) {
        this.#visor  = visor;
        this.#lienzo = lienzo;
        this.#mapas  = mapas;
    }

    activar() {
        const cir = this.#visor;
        const btnMovLibre = document.getElementById('btn-mov-libre');

        // Solo 'm' queda aquí — las teclas de conducción las maneja el ControlEntrada activo
        this.#teclaAbajo = e => {
            if (e.key === 'm' || e.key === 'M') this.#alternarMovimientoLibre(btnMovLibre);
        };
        window.addEventListener('keydown', this.#teclaAbajo);

        this.#conectarCamaraAerea();

        const sliderCam = document.getElementById('slider-cam-height');
        sliderCam.value = '2.8';
        document.getElementById('ctrl-cam-height').style.display = 'flex';
        sliderCam.addEventListener('input', e => {
            if (cir.camAereaActiva) cir.setCamAereaAltura(parseFloat(e.target.value));
            else cir.alturaCamara = parseFloat(e.target.value);
        });

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
        if (this.#toqueInicio) {
            this.#lienzo.removeEventListener('touchstart', this.#toqueInicio);
            this.#lienzo.removeEventListener('touchmove',  this.#toqueMover);
            this.#toqueInicio = null;
            this.#toqueMover  = null;
        }
    }

    #alternarMovimientoLibre(btnMovLibre) {
        const libre = this.#visor.toggleMovimientoLibre();
        btnMovLibre.textContent = libre ? 'LIBRE' : 'PATH';
        btnMovLibre.style.color = libre ? '#34d399' : '#a78bfa';
    }

    // Con la cámara aérea: un dedo mueve la vista y dos dedos cambian la altura
    #conectarCamaraAerea() {
        const cir = this.#visor;
        let prevX = 0, prevY = 0;
        let pinchDist = 0, pinchH = 0, wasPinching = false;
        const getDist = t => {
            const dx = t[0].clientX - t[1].clientX;
            const dy = t[0].clientY - t[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };
        this.#toqueInicio = e => {
            if (!cir.camAereaActiva) return;
            if (e.touches.length === 2) {
                pinchDist = getDist(e.touches);
                pinchH    = cir.camAerea.h;
            } else {
                prevX = e.touches[0].clientX;
                prevY = e.touches[0].clientY;
            }
        };
        this.#toqueMover = e => {
            if (!cir.camAereaActiva || !cir.camAerea) return;
            e.preventDefault();
            if (e.touches.length === 2) {
                wasPinching = true;
                cir.camAerea.h = pinchH * (pinchDist / getDist(e.touches));
            } else if (e.touches.length === 1) {
                const t = e.touches[0];
                if (wasPinching) {
                    wasPinching = false;
                    prevX = t.clientX; prevY = t.clientY;
                } else {
                    const scale = cir.camAerea.h / 300;
                    cir.camAerea.pan((prevX - t.clientX) * scale, (prevY - t.clientY) * scale);
                    prevX = t.clientX; prevY = t.clientY;
                }
            }
        };
        this.#lienzo.addEventListener('touchstart', this.#toqueInicio, {passive: true});
        this.#lienzo.addEventListener('touchmove',  this.#toqueMover,  {passive: false});
    }
}
