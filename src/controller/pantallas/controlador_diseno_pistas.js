'use strict';

// ================================================================
// CLASE: ControladorDisenoPistas — circuito 3D de la pantalla de
// juego (#cir3d): Diseño de Pistas → Entrar (VisorCarreraUrbana) y
// Test Drive 3D con ruta (VisorTestdriveRuta), que comparten el mismo
// arranque (PRD 004 D6). Recupera el circuito si se pierde la GPU.
// ================================================================
class ControladorDisenoPistas extends ControladorPantalla {
    #estado               = null;
    #vistaConduccion      = null;
    #limpiarPantallaJuego = null;

    #visor                 = null;
    #tipoPista             = 'ciudad';
    #origen                = 'pantalla-detalle-pista';
    #manejadorVisibilidad  = null;
    #controles             = null;
    #arrancando            = false;   // PRD 002 RF-09: visor de circuito pedido pero aún no creado

    constructor(estado, vistaConduccion, navegar, limpiarPantallaJuego) {
        super(navegar);
        this.#estado               = estado;
        this.#vistaConduccion      = vistaConduccion;
        this.#limpiarPantallaJuego = limpiarPantallaJuego;
    }

    iniciar() {
        document.getElementById('btn-exit-cir3d').addEventListener('click', () => {
            this.detener();
            this.irA(this.#origen);
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

    // Aplicacion lo llama en cada navegación: si hay circuito, lo libera
    liberarAlNavegar() {
        if (!this.#visor) return;
        this.detener();
        this.#vistaConduccion.ocultarOverlay();
    }

    // Entrada normal a un circuito 3D (Test Drive 3D con ruta y Diseño de Pistas → Entrar).
    // Lección 6: se marca el arranque ANTES de mostrar para que nunca redirija a Inicio.
    entrar(tipoPista, origen) {
        this.#arrancando = true;
        this.irA('pantalla-juego');
        this.#arrancar(tipoPista, origen);
    }

    #arrancar(tipoPista = 'ciudad', origen = 'pantalla-detalle-pista') {
        this.#arrancando = true;
        const ClaseVisor = origen === 'pantalla-td3d-selector'
            ? window.VisorTestdriveRuta
            : window.VisorCarreraUrbana;
        if (!ClaseVisor) {
            // Si el jugador salió de la pantalla mientras cargaba, Aplicacion apaga el arranque
            setTimeout(() => { if (this.#arrancando) this.#arrancar(tipoPista, origen); }, 150);
            return;
        }
        this.#tipoPista = tipoPista;
        this.#origen    = origen;
        this.#limpiarPantallaJuego();
        this.#vigilarContextoGPU();

        const canvas = this.#prepararPantalla(origen);
        const cir = new ClaseVisor(canvas, tipoPista);
        this.#visor = cir;
        this.#arrancando = false;
        this.#vistaConduccion.aplicarA(cir, this.#estado.timonModelo);
        this.#vistaConduccion.mostrarOverlay();
        cir.cargar(this.#estado.tipoAuto, this.#estado.color);
        cir.setVelocimetroModelo(this.#estado.velocimetroModelo);
        cir.iniciar();

        const pistaCfg = window.PISTAS?.[tipoPista];
        const datos = new PanelDatosCircuito3D(cir, pistaCfg);
        const mapas = new MapasCircuito3D(cir, pistaCfg);
        this.#controles = new ControlesCircuito3D(cir, canvas, mapas);
        this.#controles.activar();
        datos.mostrar();
        mapas.mostrar();

        const bucle = () => {
            if (!this.#visor) return;
            datos.actualizar();
            mapas.dibujar();
            requestAnimationFrame(bucle);
        };
        requestAnimationFrame(bucle);
    }

    // Si la pestaña vuelve y la GPU perdió el contexto, se reinicia el circuito
    #vigilarContextoGPU() {
        this.#manejadorVisibilidad = () => {
            if (!document.hidden && this.#visor?.contextLost) {
                GestorAlertas.mostrar('Contexto GPU perdido — recuperando...', 'warn');
                const pista = this.#tipoPista;
                setTimeout(() => {
                    if (!this.#visor || this.#visor.contextLost) {
                        this.detener();
                        setTimeout(() => {
                            GestorAlertas.mostrar('Reiniciando circuito...', 'warn');
                            this.#arrancar(pista);
                        }, 500);
                    }
                }, 1000);
            }
        };
        document.addEventListener('visibilitychange', this.#manejadorVisibilidad);
    }

    // Muestra los canvas, el título y el botón de salir; devuelve el canvas 3D
    #prepararPantalla(origen) {
        const canvas = document.getElementById('canvas-cir3d');
        canvas.style.display = 'block';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        const hudCir = document.getElementById('canvas-hud-cir3d');
        hudCir.style.display = 'block';
        hudCir.width  = window.innerWidth;
        hudCir.height = window.innerHeight;
        document.getElementById('canvas-carro-3d').style.display = 'none';
        const tituloCir = document.getElementById('titulo-cir3d');
        tituloCir.textContent = origen === 'pantalla-td3d-selector'
            ? 'TEST DRIVE 3D · CON RUTA'
            : 'CIRCUITO URBANO';
        tituloCir.style.display = 'block';
        document.getElementById('btn-exit-cir3d').style.display = 'block';
        return canvas;
    }

    // Libera el circuito y oculta todo lo que mostró
    detener() {
        if (!this.#visor) return;
        if (this.#manejadorVisibilidad) {
            document.removeEventListener('visibilitychange', this.#manejadorVisibilidad);
            this.#manejadorVisibilidad = null;
        }
        this.#visor.detener(); this.#visor = null;
        this.#vistaConduccion.destruirControl();
        this.#controles?.desactivar();
        this.#controles = null;
        const _mmC = document.getElementById('minimap-td3d');
        const _trC = document.getElementById('trail-map');
        if (_mmC) { _mmC.style.pointerEvents='none'; _mmC.style.cursor=''; }
        if (_trC) { _trC.style.pointerEvents='none'; _trC.style.cursor=''; }
        const ocultos = ['canvas-cir3d', 'canvas-hud-cir3d', 'titulo-cir3d', 'ctrl-accel',
            'btn-exit-cir3d', 'btn-cam-aerea', 'btn-toggle-datos', 'btn-toggle-mapas',
            'btn-mov-libre', 'ctrl-timon', 'debug-td3d', 'debug-path', 'minimap-td3d',
            'trail-map', 'btn-toggle-minimap', 'btn-toggle-trail', 'ctrl-cam-height'];
        for (const id of ocultos) document.getElementById(id).style.display = 'none';
        document.getElementById('canvas-carro-3d').style.display = '';
    }
}
