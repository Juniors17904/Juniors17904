'use strict';

// ================================================================
// CLASE: ControladorDisenoGeneral — pantalla Diseño General
// (#visorDG, VisorDisenoPista): menú hamburguesa, interruptores de lo
// que se ve, recargar, panel de datos y controles de conducción
// (PRD 004 D6).
// ================================================================
class ControladorDisenoGeneral extends ControladorPantalla {
    // Interruptor → propiedad del visor que muestra u oculta
    static #INTERRUPTORES = [
        ['tog-pasto',    'mostrarPasto'],
        ['tog-pista',    'mostrarPista'],
        ['tog-auto',     'mostrarAuto'],
        ['tog-objetos',  'mostrarObjetos'],
        ['tog-postes',   'mostrarPostes'],
        ['tog-senales',  'mostrarSenales'],
        ['tog-flechas',  'mostrarFlechas'],
        ['tog-montanas', 'mostrarMontanas'],
        ['tog-cielo',    'mostrarCielo'],
    ];

    #estado          = null;
    #vistaConduccion = null;
    #visor           = null;
    #botones         = new BotonesTactilesConduccion();

    constructor(estado, vistaConduccion, navegar) {
        super(navegar);
        this.#estado          = estado;
        this.#vistaConduccion = vistaConduccion;
    }

    iniciar() {
        document.getElementById('btn-ir-diseno-general').addEventListener('click', () => {
            this.irA('pantalla-diseno-general');
            this.#arrancarVisor();
        });
        document.getElementById('btn-volver-diseno-general').addEventListener('click', () => {
            this.detener();
            for (const [id] of ControladorDisenoGeneral.#INTERRUPTORES) {
                document.getElementById(id).checked = id !== 'tog-cielo';
            }
            document.getElementById('tog-botones').checked = true;
            this.irA('pantalla-ajustes');
        });
        document.getElementById('btn-recargar-diseno-general').addEventListener('click', () => {
            this.detener();
            setTimeout(() => this.#arrancarVisor(), 150);
        });
        document.getElementById('btn-dg-hamburgesa').addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('dg-dropdown').classList.toggle('abierto');
        });
        document.addEventListener('click', () => {
            document.getElementById('dg-dropdown').classList.remove('abierto');
        });

        for (const [id, propiedad] of ControladorDisenoGeneral.#INTERRUPTORES) {
            document.getElementById(id).addEventListener('change', e => {
                if (this.#visor) this.#visor[propiedad] = e.target.checked;
            });
        }
        document.getElementById('tog-botones').addEventListener('change', e => {
            if (e.target.checked) this.#vistaConduccion.mostrarOverlay();
            else                  this.#vistaConduccion.ocultarOverlay();
        });
    }

    #arrancarVisor() {
        if (!window.VisorDisenoPista) {
            setTimeout(() => this.#arrancarVisor(), 200);
            return;
        }
        if (this.#visor) return;

        const canvas  = document.getElementById('canvas-dg-visor');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        this.#visor = new window.VisorDisenoPista(canvas, window.PISTAS['ciudad']);
        this.#visor.cargar(this.#estado.tipoAuto, this.#estado.color);
        this.#visor.iniciar();

        document.getElementById('tog-cielo').checked = true;

        // Sincronizar estado real de los toggles (evita bug de timing)
        for (const [id, propiedad] of ControladorDisenoGeneral.#INTERRUPTORES) {
            this.#visor[propiedad] = document.getElementById(id).checked;
        }

        this.#iniciarPanelDatos();

        document.getElementById('tog-datos-dg').addEventListener('change', e => {
            document.getElementById('debug-dg').style.display = e.target.checked ? 'flex' : 'none';
        });

        // Activar control (teclado o timón según preferencia)
        this.#vistaConduccion.aplicarA(this.#visor, this.#estado.timonModelo);

        // Controles táctiles — activar toggle y mostrar el overlay correcto
        document.getElementById('tog-botones').checked = true;
        this.#vistaConduccion.mostrarOverlay();
        this.#botones.conectar(this.#visor);
    }

    // Panel de debug — loop RAF que actualiza datos si el panel está visible
    #iniciarPanelDatos() {
        let _dgFps = 60, _dgFrames = 0, _dgFpsLast = performance.now();
        const _dgDbgLoop = () => {
            if (!this.#visor) return;
            _dgFrames++;
            const now = performance.now();
            if (now - _dgFpsLast >= 500) {
                _dgFps = Math.round(_dgFrames * 1000 / (now - _dgFpsLast));
                _dgFrames = 0; _dgFpsLast = now;
            }
            const panel = document.getElementById('debug-dg');
            if (panel?.style.display !== 'none') {
                const dg  = this.#visor;
                const kmh = Math.round(Math.abs(dg.velocidad) * 216);
                document.getElementById('dgd-kmh').textContent   = kmh;
                document.getElementById('dgd-vmax').textContent  = Math.round(dg.velocidadMax * 216);
                document.getElementById('dgd-gas').textContent   = dg.entradaAcel ===  1 ? '⬆ GAS'
                                                                 : dg.entradaAcel === -1 ? '⬇ FREN' : 'NEUTRO';
                document.getElementById('dgd-steer').textContent = dg.entradaDireccion < -0.1 ? '◀ IZQ'
                                                                 : dg.entradaDireccion >  0.1 ? 'DER ▶' : 'RECTO';
                document.getElementById('dgd-px').textContent    = dg.px.toFixed(1);
                document.getElementById('dgd-pz').textContent    = dg.pz.toFixed(1);
                document.getElementById('dgd-fps').textContent   = _dgFps;
            }
            requestAnimationFrame(_dgDbgLoop);
        };
        requestAnimationFrame(_dgDbgLoop);
    }

    // Libera el visor al salir de la pantalla (también con el botón atrás)
    detener() {
        if (!this.#visor) return;
        this.#vistaConduccion.destruirControl();
        this.#botones.desconectar();
        this.#visor.detener();
        this.#visor = null;
    }
}
