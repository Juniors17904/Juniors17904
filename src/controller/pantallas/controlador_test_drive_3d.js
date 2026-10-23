'use strict';

// ================================================================
// CLASE: ControladorTestDrive3D — selector de Test Drive 3D y el
// Test Drive 3D simple (VisorTestdriveRecto) (PRD 004 D6). Orquesta
// las piezas del simple: TecladoConduccion, BotonesTactilesConduccion,
// DeslizadorAlturaCamara, MapasTestDriveRecto y PanelDatosTestDriveRecto.
// "Con ruta" abre el circuito 3D (DestinoTestDriveRuta), que maneja
// ControladorDisenoPistas: aquí solo se pide entrar.
// ================================================================
class ControladorTestDrive3D extends ControladorPantallaJuego {
    #estado               = null;
    #alEntrarConRuta      = null;
    #limpiarPantallaJuego = null;

    #visor      = null;
    #teclado    = new TecladoConduccion();
    #botones    = new BotonesTactilesConduccion();
    #deslizador = new DeslizadorAlturaCamara();

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
            this.#alEntrarConRuta('ciudad', new DestinoTestDriveRuta());
        });
        document.getElementById('btn-exit-td3d').addEventListener('click', () => {
            this.detener();
            this.irA('pantalla-ajustes');
        });
    }

    get tieneVisor() {
        return Boolean(this.#visor);
    }

    #arrancar() {
        this.marcarArranque();
        if (!window.VisorTestdriveRecto) {
            setTimeout(() => { if (this.arrancando) this.#arrancar(); }, 200);
            return;
        }
        this.#limpiarPantallaJuego();
        // Lección 6: el arranque queda marcado ANTES de mostrar para que no redirija a Inicio
        this.marcarArranque();
        this.irA('pantalla-juego');

        document.getElementById('canvas-td3d').style.display = 'block';
        document.getElementById('titulo-td3d').style.display = 'block';
        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display = 'flex';
        document.getElementById('btn-exit-td3d').style.display = 'flex';

        const canvas = document.getElementById('canvas-td3d');
        const td = new window.VisorTestdriveRecto(canvas);
        this.#visor = td;
        this.cancelarArranque();
        td.cargar(this.#estado.tipoAuto, this.#estado.color);
        td.iniciar();
        const datos = new PanelDatosTestDriveRecto(td);

        this.#teclado.conectar(td);
        this.#botones.conectar(td);
        this.#deslizador.conectar(altura => { td.alturaCamara = altura; });

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

    // Libera el visor y oculta lo que el Test Drive simple mostró
    detener() {
        this.cancelarArranque();
        if (!this.#visor) return;
        this.#visor.detener();
        this.#visor = null;
        this.#teclado.desconectar();
        this.#botones.desconectar();
        this.#deslizador.desconectar();
        const ocultos = ['canvas-td3d', 'titulo-td3d', 'ctrl-botones', 'ctrl-accel', 'btn-exit-td3d',
            'debug-td3d', 'minimap-td3d', 'trail-map', 'btn-toggle-minimap', 'btn-toggle-trail',
            'ctrl-cam-height'];
        for (const id of ocultos) document.getElementById(id).style.display = 'none';
        document.getElementById('canvas-carro-3d').style.display = '';
    }
}
