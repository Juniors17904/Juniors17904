'use strict';

// ================================================================
// CLASE: ControladorDisenoPistas — circuito 3D de la pantalla de
// juego (#cir3d) (PRD 004 D6). Lo abren Diseño de Pistas → Entrar y
// Test Drive 3D → Con Ruta; cada uno le pasa su DestinoCircuito3D,
// que dice qué visor crear, el título y a dónde vuelve. Orquesta
// PanelDatosCircuito3D, MapasCircuito3D, ControlesCircuito3D,
// GestosCamaraAerea y DeslizadorAlturaCamara, y recupera el circuito
// si se pierde la GPU.
// ================================================================
class ControladorDisenoPistas extends ControladorPantallaJuego {
    #estado               = null;
    #vistaConduccion      = null;
    #limpiarPantallaJuego = null;

    #visor                 = null;
    #tipoPista             = 'ciudad';
    #destino               = new DestinoCarreraUrbana();
    #manejadorVisibilidad  = null;
    #controles             = null;
    #mapas                 = null;
    #gestos                = null;
    #deslizador            = new DeslizadorAlturaCamara();

    constructor(estado, vistaConduccion, navegar, limpiarPantallaJuego) {
        super(navegar);
        this.#estado               = estado;
        this.#vistaConduccion      = vistaConduccion;
        this.#limpiarPantallaJuego = limpiarPantallaJuego;
    }

    iniciar() {
        document.getElementById('btn-exit-cir3d').addEventListener('click', () => {
            this.detener();
            this.irA(this.#destino.origen);
        });
    }

    get tieneVisor() {
        return Boolean(this.#visor);
    }

    // Aplicacion lo llama en cada navegación: si hay circuito, lo libera
    liberarAlNavegar() {
        if (!this.#visor) return;
        this.detener();
        this.#vistaConduccion.ocultarOverlay();
    }

    // Entrada normal a un circuito 3D (destino: un DestinoCircuito3D).
    // Lección 6: se marca el arranque ANTES de mostrar para que nunca redirija a Inicio.
    entrar(tipoPista, destino) {
        this.marcarArranque();
        this.irA('pantalla-juego');
        this.#arrancar(tipoPista, destino);
    }

    #arrancar(tipoPista, destino) {
        this.marcarArranque();
        const ClaseVisor = destino.claseVisor;
        if (!ClaseVisor) {
            // Si el jugador salió de la pantalla mientras cargaba, Aplicacion apaga el arranque
            setTimeout(() => { if (this.arrancando) this.#arrancar(tipoPista, destino); }, 150);
            return;
        }
        this.#tipoPista = tipoPista;
        this.#destino   = destino;
        this.#limpiarPantallaJuego();
        this.#vigilarContextoGPU();

        const canvas = this.#prepararPantalla(destino);
        const cir = new ClaseVisor(canvas, tipoPista);
        this.#visor = cir;
        this.cancelarArranque();
        this.#vistaConduccion.aplicarA(cir, this.#estado.timonModelo);
        this.#vistaConduccion.mostrarOverlay();
        cir.cargar(this.#estado.tipoAuto, this.#estado.color);
        cir.setVelocimetroModelo(this.#estado.velocimetroModelo);
        cir.iniciar();

        const pistaCfg = window.registroPistas?.obtener(tipoPista);
        const datos = new PanelDatosCircuito3D(cir, pistaCfg);
        const mapas = new MapasCircuito3D(cir, pistaCfg);
        this.#mapas = mapas;
        this.#controles = new ControlesCircuito3D(cir, mapas);
        this.#controles.activar();
        this.#gestos = new GestosCamaraAerea(canvas);
        this.#gestos.conectar(cir);
        this.#deslizador.conectar(altura => {
            if (cir.camAereaActiva) cir.setCamAereaAltura(altura);
            else cir.alturaCamara = altura;
        });
        datos.mostrar();
        mapas.mostrar();

        const bucle = () => {
            if (!this.#visor) return;
            datos.actualizar();
            mapas.dibujar(cir);
            requestAnimationFrame(bucle);
        };
        requestAnimationFrame(bucle);
    }

    // Si la pestaña vuelve y la GPU perdió el contexto, se reinicia el mismo circuito
    #vigilarContextoGPU() {
        this.#manejadorVisibilidad = () => {
            if (!document.hidden && this.#visor?.contextLost) {
                GestorAlertas.mostrar('Contexto GPU perdido — recuperando...', 'warn');
                const pista   = this.#tipoPista;
                const destino = this.#destino;
                setTimeout(() => {
                    if (!this.#visor || this.#visor.contextLost) {
                        this.detener();
                        setTimeout(() => {
                            GestorAlertas.mostrar('Reiniciando circuito...', 'warn');
                            this.#arrancar(pista, destino);
                        }, 500);
                    }
                }, 1000);
            }
        };
        document.addEventListener('visibilitychange', this.#manejadorVisibilidad);
    }

    // Muestra los canvas, el título y el botón de salir; devuelve el canvas 3D
    #prepararPantalla(destino) {
        const canvas = document.getElementById('canvas-cir3d');
        canvas.style.display = 'block';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        const hudCir = document.getElementById('canvas-hud-cir3d');
        hudCir.style.display = 'block';
        hudCir.width  = window.innerWidth;
        hudCir.height = window.innerHeight;
        const tituloCir = document.getElementById('titulo-cir3d');
        tituloCir.textContent = destino.titulo;
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
        this.#gestos?.desconectar();
        this.#gestos = null;
        this.#deslizador.desconectar();
        this.#mapas?.soltar();
        this.#mapas = null;
        const ocultos = ['canvas-cir3d', 'canvas-hud-cir3d', 'titulo-cir3d', 'ctrl-accel',
            'btn-exit-cir3d', 'btn-cam-aerea', 'btn-toggle-datos', 'btn-toggle-mapas',
            'btn-mov-libre', 'ctrl-timon', 'debug-td3d', 'debug-path', 'minimap-td3d',
            'trail-map', 'btn-toggle-minimap', 'btn-toggle-trail', 'ctrl-cam-height'];
        for (const id of ocultos) document.getElementById(id).style.display = 'none';
    }
}
