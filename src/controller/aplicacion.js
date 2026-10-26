'use strict';

// ================================================================
// CLASS: Aplicacion  (antes App) — controlador principal de la aplicación
// PRD 004 D5: solo navega entre pantallas (#mostrar, popstate y
// ModosDisponibles) y guarda un controlador por pantalla.
// ================================================================
class Aplicacion {
    #estado = new EstadoJuego();   // lo que eligió el jugador, compartido por las pantallas

    #backNav            = false;
    #vistaConduccion    = new VistaConduccion().cargar();
    #carreraSolo        = null;
    #preferenciasCarrera = new PreferenciasCarrera();   // PRD 018: recuerda la última elección de Jugar Solo
    #modos              = new ModosDisponibles();   // PRD 002 D8: decide qué modos se ven y se abren

    // PRD 004 D5/D6: un controlador por pantalla
    #inicio                     = null;
    #ajustes                    = null;
    #giroscopio                 = null;
    #pistas                     = null;
    #prepararCarrera            = null;   // PRD 018: "Preparar carrera" antes de Jugar Solo
    #controles                  = null;
    #velocimetro                = null;
    #controladorVistaConduccion = null;
    #testDrive3D                = null;
    #disenoPistas               = null;
    #garaje                     = null;
    #disenoGeneral              = null;
    #disenoObjetos              = null;
    #limpiadorJuego             = null;   // vacía la pantalla de juego que comparten Test Drive y circuito

    constructor() {
        this.#modos.aplicarA(document);   // RF-01, RF-04, RF-05
        this.#crearControladoresDePantalla();
        history.replaceState({ pantalla: 'pantalla-inicio' }, '');
        this.#mostrar('pantalla-inicio');
        window.addEventListener('popstate', e => {
            const id = e.state?.pantalla;
            if (id) {
                this.#backNav = true;
                this.#mostrar(id);
                this.#backNav = false;
            } else {
                history.pushState({ pantalla: 'pantalla-inicio' }, '');
                this.#backNav = true;
                this.#mostrar('pantalla-inicio');
                this.#backNav = false;
            }
        });
    }

    // ── Navegación ──────────────────────────────────────────────
    #mostrar(id) {
        // PRD 005 D3 / RF-03: una pantalla que no existe lleva a Inicio, nunca a una página en blanco
        if (!document.getElementById(id)) {
            id = 'pantalla-inicio';
            if (this.#backNav) history.replaceState({ pantalla: id }, '');
        }

        // PRD 002 D3 / RF-08 / RF-09: pantallas de modos ocultos o "Próximamente" → Inicio.
        // Se evalúa antes de limpiar nada: el visor 3D (o su arranque) ya debe estar marcado.
        if (this.#modos.debeRedirigirAInicio(id, this.#hayVisor3D())) {
            id = 'pantalla-inicio';
            if (this.#backNav) history.replaceState({ pantalla: id }, '');
        }

        // Carrera Solo 3D: liberar al salir y no mostrar la pantalla vacía sin controlador
        if (this.#carreraSolo && id !== 'pantalla-carrera-solo') {
            this.#carreraSolo.detener();
            this.#carreraSolo = null;
        }
        if (id === 'pantalla-carrera-solo' && !this.#carreraSolo) {
            id = 'pantalla-inicio';
            if (this.#backNav) history.replaceState({ pantalla: id }, '');
        }
        // "Preparar carrera" se rehace cada vez que se abre, también con atrás (récord al día, PRD 020)
        if (id === 'pantalla-preparar-carrera') this.#prepararCarrera?.mostrar();

        if (id !== 'pantalla-juego') {
            this.#testDrive3D.cancelarArranque();
            this.#disenoPistas.cancelarArranque();
        }

        // Ocultar overlays globales al salir del juego
        if (id !== 'pantalla-juego') {
            document.getElementById('ctrl-botones').style.display = 'none';
            document.getElementById('ctrl-accel').style.display   = 'none';
        }

        // Limpiar circuito 3D si está activo y navegamos fuera
        this.#disenoPistas.liberarAlNavegar();

        // Limpiar visores al salir de sus pantallas (funciona con botón atrás del SO también)
        const pantallaActual = document.querySelector('.pantalla.activa')?.id;
        if (pantallaActual === 'pantalla-diseno-general' && id !== 'pantalla-diseno-general') {
            this.#disenoGeneral.detener();
        }
        if (pantallaActual === 'pantalla-diseno-objetos' && id !== 'pantalla-diseno-objetos') {
            this.#disenoObjetos.detener();
        }

        document.querySelectorAll('.pantalla').forEach(p => {
            p.classList.remove('activa');
            p.style.display = 'none';
        });
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex';
            el.classList.add('activa');
        }
        if (!this.#backNav) {
            history.pushState({ pantalla: id }, '');
        }
    }

    // Hay un visor 3D cargado o arrancando en la pantalla de juego (RF-09)
    #hayVisor3D() {
        return this.#testDrive3D.ocupaPantallaJuego || this.#disenoPistas.ocupaPantallaJuego;
    }

    // PRD 004 D6: cada pantalla tiene su controlador; registran sus
    // eventos en iniciar() y piden navegar con el callback
    #crearControladoresDePantalla() {
        const navegar = id => this.#mostrar(id);
        const limpiarPantallaJuego = () => this.#limpiadorJuego.limpiar();
        this.#disenoPistas  = new ControladorDisenoPistas(this.#estado, this.#vistaConduccion,
            navegar, limpiarPantallaJuego);
        this.#testDrive3D   = new ControladorTestDrive3D(this.#estado, navegar,
            (tipoPista, destino) => this.#disenoPistas.entrar(tipoPista, destino), limpiarPantallaJuego);
        this.#limpiadorJuego = new LimpiadorPantallaJuego(this.#testDrive3D, this.#disenoPistas);
        this.#garaje        = new ControladorGaraje(this.#estado, navegar);
        this.#disenoGeneral = new ControladorDisenoGeneral(this.#estado, this.#vistaConduccion, navegar);
        this.#disenoObjetos = new ControladorDisenoObjetos(navegar);
        this.#controles   = new ControladorControles(this.#estado, navegar);
        this.#preferenciasCarrera.cargar(this.#estado);
        this.#prepararCarrera = new ControladorPrepararCarrera(this.#estado, navegar,
            this.#preferenciasCarrera, () => this.#iniciarCarreraSolo());
        // "Jugar Solo" abre "Preparar carrera" (PRD 018, RF-01)
        this.#inicio      = new ControladorInicio(this.#estado, navegar, this.#controles,
            () => this.#mostrar('pantalla-preparar-carrera'));
        this.#ajustes     = new ControladorAjustes(navegar);
        this.#velocimetro = new ControladorVelocimetro(this.#estado, navegar);
        this.#giroscopio  = new ControladorGiroscopio(navegar);
        this.#controladorVistaConduccion = new ControladorVistaConduccion(this.#vistaConduccion, navegar);
        this.#pistas      = new ControladorPistas(this.#estado, navegar,
            (tipoPista, destino) => this.#disenoPistas.entrar(tipoPista, destino));

        this.#inicio.iniciar();
        this.#controles.iniciar();
        this.#velocimetro.iniciar();
        this.#ajustes.iniciar();
        this.#giroscopio.iniciar();
        this.#controladorVistaConduccion.iniciar();
        this.#pistas.iniciar();
        this.#prepararCarrera.iniciar();
        // Mismo orden de registro que antes de la Fase 1b
        this.#testDrive3D.iniciar();
        this.#disenoPistas.iniciar();
        this.#garaje.iniciar();
        this.#disenoGeneral.iniciar();
        this.#disenoObjetos.iniciar();
    }

    // ── Jugar Solo ───────────────────────────────────────────────
    #iniciarCarreraSolo() {
        this.#carreraSolo?.detener();
        // Se crea antes de #mostrar para que la pantalla no se redirija a Inicio;
        // el constructor no toca el DOM: todo arranca en iniciar()
        const carrera = new ControladorCarreraSolo(
            this.#estado, this.#vistaConduccion, () => this.#mostrar('pantalla-inicio'));
        this.#carreraSolo = carrera;
        this.#mostrar('pantalla-carrera-solo');
        carrera.iniciar();
    }
}

// ================================================================
// ARRANCAR
// ================================================================
new Aplicacion();
