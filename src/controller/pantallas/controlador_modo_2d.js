'use strict';

// ================================================================
// CLASE: ControladorModo2D — pantallas del motor 2D (PRD 004 D6):
// crear sala, unirse, sala de espera con cuenta regresiva, juego 2D
// y resultado. Siguen ocultas por ModosDisponibles (PRD 002); su
// lógica es la misma que tenía Aplicacion.
// ================================================================
class ControladorModo2D extends ControladorPantalla {
    #estado        = null;
    #alVolverAMenu = null;

    constructor(estado, navegar, alVolverAMenu) {
        super(navegar);
        this.#estado        = estado;
        this.#alVolverAMenu = alVolverAMenu;
    }

    iniciar() {
        document.getElementById('btn-confirmar-unirse').addEventListener('click', () => this.#confirmarUnirse());

        document.getElementById('btn-volver-1').addEventListener('click', () => this.irA('pantalla-inicio'));
        document.getElementById('btn-volver-2').addEventListener('click', () => this.irA('pantalla-inicio'));

        document.getElementById('btn-revancha').addEventListener('click', () => {
            if (window.multiJugador?.salaId) {
                this.irA('pantalla-crear');
                document.getElementById('codigo-display').textContent = window.multiJugador.salaId;
            } else {
                this.irA('pantalla-inicio');
            }
        });

        document.getElementById('btn-menu').addEventListener('click', async () => {
            if (window.multiJugador) await window.multiJugador.limpiar();
            window.multiJugador = null;
            this.#estado.juego = null;
            this.#alVolverAMenu();
            this.irA('pantalla-inicio');
        });
    }

    // ── Entradas desde Inicio ────────────────────────────────────
    async abrirCrearSala() {
        this.irA('pantalla-crear');
        await this.#iniciarCrearSala();
    }

    abrirUnirse() {
        this.irA('pantalla-unirse');
    }

    // ── Crear sala ───────────────────────────────────────────────
    async #iniciarCrearSala() {
        window.multiJugador = new MultiJugador();
        const codigo = await window.multiJugador.crearSala(this.#estado.nombre, this.#estado.color);
        document.getElementById('codigo-display').textContent = codigo;

        document.getElementById('btn-copiar').addEventListener('click', () => {
            navigator.clipboard.writeText(codigo).catch(() => {});
        });

        window.multiJugador.suscribir(
            (nombreOp, colorOp) => {
                this.#prepararSalaEspera(this.#estado.nombre, this.#estado.color, nombreOp, colorOp);
                this.iniciarCuentaRegresiva();
            },
            progreso => {
                if (this.#estado.juego) this.#estado.juego.actualizarOponente(progreso);
            },
            () => this.#mostrarResultado(false)
        );
    }

    // ── Unirse a sala ────────────────────────────────────────────
    async #confirmarUnirse() {
        const codigo = document.getElementById('inp-codigo').value.trim().toUpperCase();
        const errEl = document.getElementById('error-unirse');
        errEl.textContent = '';

        if (codigo.length !== 4) {
            errEl.textContent = 'El código debe tener 4 letras';
            return;
        }

        try {
            window.multiJugador = new MultiJugador();
            const datos = await window.multiJugador.unirSala(codigo, this.#estado.nombre, this.#estado.color);

            window.multiJugador.suscribir(
                null,
                progreso => {
                    if (this.#estado.juego) this.#estado.juego.actualizarOponente(progreso);
                },
                () => this.#mostrarResultado(false)
            );

            this.#prepararSalaEspera(datos.j1_nombre, datos.j1_color, this.#estado.nombre, this.#estado.color);
            this.iniciarCuentaRegresiva();
        } catch (err) {
            errEl.textContent = err.message;
        }
    }

    // ── Sala de espera ───────────────────────────────────────────
    #prepararSalaEspera(nombre1, color1, nombre2, color2) {
        this.irA('pantalla-espera');
        document.getElementById('nombre-j1').textContent = nombre1;
        document.getElementById('dot-j1').style.cssText = `background:${color1};box-shadow:0 0 8px ${color1}`;
        document.getElementById('nombre-j2').textContent = nombre2;
        document.getElementById('dot-j2').style.cssText = `background:${color2};box-shadow:0 0 8px ${color2}`;
    }

    // ── Cuenta regresiva ─────────────────────────────────────────
    iniciarCuentaRegresiva() {
        if (this.#estado.modoSolo) {
            this.irA('pantalla-espera');
            document.getElementById('nombre-j1').textContent = this.#estado.nombre;
            document.getElementById('dot-j1').style.background = this.#estado.color;
            document.getElementById('nombre-j2').textContent = 'CPU / Sin oponente';
            document.getElementById('dot-j2').style.background = '#475569';
            document.querySelectorAll('.vs-sep').forEach(el => el.textContent = '');
        }

        const el = document.getElementById('cuenta-regresiva');
        const pasos = ['3', '2', '1', '¡YA!'];
        let i = 0;
        this.irA('pantalla-espera');

        const intervalo = setInterval(() => {
            el.textContent = pasos[i++];
            if (i >= pasos.length) {
                clearInterval(intervalo);
                setTimeout(() => this.#iniciarJuego(), 300);
            }
        }, 900);
    }

    // ── Juego ────────────────────────────────────────────────────
    #iniciarJuego() {
        this.irA('pantalla-juego');

        const oponenteNombre = this.#estado.modoSolo
            ? null
            : (window.multiJugador?.jugadorNum === 1
                ? document.getElementById('nombre-j2').textContent
                : document.getElementById('nombre-j1').textContent);

        this.#estado.juego = new Juego(this.#estado.color, this.#estado.control, this.#estado.tipoAuto, this.#estado.pista, this.#estado.velocimetroModelo);

        window.onCarreraTerminada = (tiempoMs, velMax) => {
            if (!this.#estado.modoSolo && window.multiJugador) window.multiJugador.reportarGanador();
            this.#mostrarResultado(true, tiempoMs, velMax);
        };

        this.#estado.juego.iniciar(oponenteNombre);
    }

    // ── Resultado ────────────────────────────────────────────────
    #mostrarResultado(gane, tiempoMs = null, velMax = 0) {
        if (this.#estado.juego) this.#estado.juego.detener();
        this.irA('pantalla-resultado');

        const tituloEl = document.getElementById('titulo-resultado');
        tituloEl.textContent = gane ? '¡GANASTE! 🏆' : '¡PERDISTE! 💨';
        tituloEl.className = 'resultado-titulo ' + (gane ? 'gane' : 'perdi');

        document.getElementById('stat-tutiempo').textContent = tiempoMs ? this.#formatearTiempo(tiempoMs) : '--';
        document.getElementById('stat-eltiempo').textContent = '--';
        document.getElementById('stat-velmax').textContent = Math.round((velMax / CFG.VEL_MAX) * 220) + ' km/h';
    }

    #formatearTiempo(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const seg = s % 60;
        const cent = Math.floor((ms % 1000) / 10);
        return `${m}:${seg.toString().padStart(2,'0')}.${cent.toString().padStart(2,'0')}`;
    }

    // ── Test Drive 2D ────────────────────────────────────────────
    iniciarTestDrive() {
        this.irA('pantalla-juego');
        document.getElementById('ctrl-accel').style.display = 'flex';
        this.#estado.juego = new Juego(this.#estado.color, this.#estado.control, this.#estado.tipoAuto, 'testdrive');
        window.onCarreraTerminada = null;
        this.#estado.juego.iniciar(null);
    }
}
