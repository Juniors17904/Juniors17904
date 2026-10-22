'use strict';

// ================================================================
// CLASE: ControladorTestDrive3D — selector de Test Drive 3D y el
// Test Drive 3D simple (VisorTestdriveRecto) con su teclado, botones
// táctiles, altura de cámara, minimapa, recorrido y panel de datos
// (PRD 004 D6). "Con ruta" abre el circuito 3D, que maneja
// ControladorDisenoPistas: aquí solo se pide entrar.
// ================================================================
class ControladorTestDrive3D extends ControladorPantalla {
    #estado              = null;
    #alEntrarConRuta     = null;
    #limpiarPantallaJuego = null;

    #visor       = null;
    #teclaAbajo  = null;
    #teclaArriba = null;
    #botones     = new BotonesTactilesConduccion();
    #arrancando  = false;   // PRD 002 RF-09: visor pedido pero aún no creado

    constructor(estado, navegar, alEntrarConRuta, limpiarPantallaJuego) {
        super(navegar);
        this.#estado               = estado;
        this.#alEntrarConRuta      = alEntrarConRuta;
        this.#limpiarPantallaJuego = limpiarPantallaJuego;
    }

    iniciar() {
        document.getElementById('btn-test-drive-3d').addEventListener('click', () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.irA('pantalla-td3d-selector');
        });
        document.getElementById('btn-volver-td3d-selector').addEventListener('click', () => {
            this.irA('pantalla-ajustes');
        });
        document.getElementById('btn-td3d-simple').addEventListener('click', () => {
            this.#arrancar();
        });
        document.getElementById('btn-td3d-con-ruta').addEventListener('click', () => {
            this.#alEntrarConRuta('ciudad', 'pantalla-td3d-selector');
        });
        document.getElementById('btn-exit-td3d').addEventListener('click', () => {
            this.detener();
            this.irA('pantalla-ajustes');
        });
    }

    // Hay un visor cargado o arrancando en la pantalla de juego (PRD 002 RF-09)
    get ocupaPantallaJuego() {
        return Boolean(this.#visor || this.#arrancando);
    }

    // Aplicacion lo llama al navegar fuera de la pantalla de juego
    cancelarArranque() {
        this.#arrancando = false;
    }

    #arrancar() {
        this.#arrancando = true;
        if (!window.VisorTestdriveRecto) {
            setTimeout(() => { if (this.#arrancando) this.#arrancar(); }, 200);
            return;
        }
        this.#limpiarPantallaJuego();
        // Lección 6: el arranque queda marcado ANTES de mostrar para que no redirija a Inicio
        this.#arrancando = true;
        this.irA('pantalla-juego');

        document.getElementById('canvas-td3d').style.display = 'block';
        document.getElementById('titulo-td3d').style.display = 'block';
        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display = 'flex';
        document.getElementById('btn-exit-td3d').style.display = 'flex';

        const canvas = document.getElementById('canvas-td3d');
        const td = new window.VisorTestdriveRecto(canvas);
        this.#visor = td;
        this.#arrancando = false;
        td.cargar(this.#estado.tipoAuto, this.#estado.color);
        td.iniciar();
        const datos = new PanelDatosTestDriveRecto(td);

        this.#conectarTeclado(td);
        this.#botones.conectar(td);

        // Slider altura de cámara
        const sliderCam = document.getElementById('slider-cam-height');
        const ctrlCam   = document.getElementById('ctrl-cam-height');
        sliderCam.value = '2.8';
        ctrlCam.style.display = 'flex';
        sliderCam.addEventListener('input', e => { td.alturaCamara = parseFloat(e.target.value); });

        const mapas = new MapasTestDriveRecto();
        mapas.mostrar();
        datos.mostrar();

        const bucle = () => {
            if (!this.#visor) return;
            datos.actualizar();
            mapas.dibujar(td);
            requestAnimationFrame(bucle);
        };
        requestAnimationFrame(bucle);
    }

    #conectarTeclado(td) {
        this.#teclaAbajo = e => {
            if (e.key === 'ArrowUp'    || e.key === 'w') td.entradaAcel =  1;
            if (e.key === 'ArrowDown'  || e.key === 's') td.entradaAcel = -1;
            if (e.key === 'ArrowLeft'  || e.key === 'a') td.entradaDireccion = -1;
            if (e.key === 'ArrowRight' || e.key === 'd') td.entradaDireccion =  1;
        };
        this.#teclaArriba = e => {
            if (e.key === 'ArrowUp'   || e.key === 'w' ||
                e.key === 'ArrowDown' || e.key === 's') td.entradaAcel = 0;
            if (e.key === 'ArrowLeft' || e.key === 'a' ||
                e.key === 'ArrowRight'|| e.key === 'd') td.entradaDireccion = 0;
        };
        window.addEventListener('keydown', this.#teclaAbajo);
        window.addEventListener('keyup',   this.#teclaArriba);
    }

    // Libera el visor y oculta lo que el Test Drive simple mostró
    detener() {
        this.#arrancando = false;
        if (!this.#visor) return;
        this.#visor.detener();
        this.#visor = null;
        if (this.#teclaAbajo)  window.removeEventListener('keydown', this.#teclaAbajo);
        if (this.#teclaArriba) window.removeEventListener('keyup',   this.#teclaArriba);
        this.#teclaAbajo  = null;
        this.#teclaArriba = null;
        this.#botones.desconectar();
        document.getElementById('canvas-td3d').style.display = 'none';
        document.getElementById('titulo-td3d').style.display = 'none';
        document.getElementById('canvas-carro-3d').style.display = '';
        document.getElementById('ctrl-botones').style.display = 'none';
        document.getElementById('ctrl-accel').style.display = 'none';
        document.getElementById('btn-exit-td3d').style.display = 'none';
        document.getElementById('debug-td3d').style.display = 'none';
        document.getElementById('minimap-td3d').style.display = 'none';
        document.getElementById('trail-map').style.display = 'none';
        document.getElementById('btn-toggle-minimap').style.display = 'none';
        document.getElementById('btn-toggle-trail').style.display = 'none';
        document.getElementById('ctrl-cam-height').style.display = 'none';
    }
}
