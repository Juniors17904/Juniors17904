'use strict';

// ================================================================
// CLASS: GiroscopioTester — verifica y muestra datos del giroscopio
// ================================================================
class GiroscopioTester {
    #handler = null;

    iniciar() {
        const bola    = document.getElementById('burbuja-bola');
        const estado  = document.getElementById('giro-estado');
        const valG    = document.getElementById('val-gamma');
        const valB    = document.getElementById('val-beta');
        const RADIO   = 80;

        if (!window.DeviceOrientationEvent) {
            estado.textContent = '❌ No soportado en este dispositivo';
            estado.style.color = 'var(--neon-r)';
            return;
        }

        this.#handler = e => {
            const gamma = e.gamma ?? 0;
            const beta  = e.beta  ?? 0;

            valG.textContent = gamma.toFixed(1) + '°';
            valB.textContent = beta.toFixed(1)  + '°';

            const x = Math.max(-RADIO, Math.min(RADIO, (gamma / 90) * RADIO));
            const y = Math.max(-RADIO, Math.min(RADIO, (beta  / 90) * RADIO));

            bola.style.left = `calc(50% + ${x}px)`;
            bola.style.top  = `calc(50% + ${y}px)`;

            estado.textContent = '✓ Giroscopio activo';
            estado.style.color = 'var(--neon-g)';
        };

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(p => {
                    if (p === 'granted') {
                        window.addEventListener('deviceorientation', this.#handler);
                    } else {
                        estado.textContent = '❌ Permiso denegado';
                        estado.style.color = 'var(--neon-r)';
                    }
                })
                .catch(e => {
                    estado.textContent = '❌ ' + e.message;
                    estado.style.color = 'var(--neon-r)';
                });
        } else {
            window.addEventListener('deviceorientation', this.#handler);
        }
    }

    detener() {
        if (this.#handler) {
            window.removeEventListener('deviceorientation', this.#handler);
            this.#handler = null;
        }
        // Resetear UI
        const bola = document.getElementById('burbuja-bola');
        if (bola) { bola.style.left = '50%'; bola.style.top = '50%'; }
        const estado = document.getElementById('giro-estado');
        if (estado) { estado.textContent = 'Esperando datos...'; estado.style.color = ''; }
    }
}

// ================================================================
// CLASS: ToastManager — notificaciones flotantes
// ================================================================
class ToastManager {
    static mostrar(msg, tipo = 'info') {
        const el = document.createElement('div');
        el.className = 'toast' + (tipo !== 'info' ? ' ' + tipo : '');
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 400);
        }, 4000);
    }
}

// ================================================================
// CLASS: OrientacionManager — forzar/detectar landscape
// ================================================================
class OrientacionManager {
    static #PANTALLAS_LANDSCAPE = ['pantalla-juego', 'pantalla-espera'];
    static #toastTimer = 0;

    static async forzar() {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                ToastManager.mostrar('Fullscreen: ' + e.message, 'error');
            }
        }
        if (screen.orientation && screen.orientation.lock) {
            try {
                await screen.orientation.lock('landscape');
            } catch (e) {
                ToastManager.mostrar('Orientación: ' + e.message, 'error');
            }
        } else {
            ToastManager.mostrar('Tu navegador no soporta orientation lock', 'warn');
        }
    }

    static liberar() {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    static verificar() {
        const esMovil = 'ontouchstart' in window;
        const esVertical = window.innerHeight > window.innerWidth;
        const pantallaActiva = [...document.querySelectorAll('.pantalla.activa')].map(p => p.id);
        const necesitaLandscape = pantallaActiva.some(
            id => OrientacionManager.#PANTALLAS_LANDSCAPE.includes(id)
        );
        const aviso = document.getElementById('pantalla-rotar');

        if (esMovil && esVertical && necesitaLandscape) {
            aviso.style.display = 'flex';
            aviso.classList.add('activa');
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(e => {
                    const ahora = Date.now();
                    if (ahora - OrientacionManager.#toastTimer > 5000) {
                        OrientacionManager.#toastTimer = ahora;
                        ToastManager.mostrar('Activa la rotación automática del sistema', 'warn');
                    }
                });
            }
        } else {
            aviso.style.display = 'none';
            aviso.classList.remove('activa');
        }
    }

    static iniciarListeners() {
        window.addEventListener('resize', () => OrientacionManager.verificar());
        window.addEventListener('orientationchange', () => OrientacionManager.verificar());
    }
}

// ================================================================
// CLASS: App — controlador principal de la aplicación
// ================================================================
class App {
    #estado = {
        nombre: 'Jugador',
        color: '#ef4444',
        control: 'botones',
        modoSolo: true,
        tipoAuto: 'deportivo',
        juego: null,
    };

    constructor() {
        OrientacionManager.iniciarListeners();
        this.#inicializarEventos();
        this.#mostrar('pantalla-inicio');
    }

    // ── Navegación ──────────────────────────────────────────────
    #mostrar(id) {
        document.querySelectorAll('.pantalla').forEach(p => {
            p.classList.remove('activa');
            p.style.display = 'none';
        });
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex';
            el.classList.add('activa');
        }
    }

    // ── Utilidades ──────────────────────────────────────────────
    #formatearTiempo(ms) {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        const seg = s % 60;
        const cent = Math.floor((ms % 1000) / 10);
        return `${m}:${seg.toString().padStart(2,'0')}.${cent.toString().padStart(2,'0')}`;
    }

    // ── Eventos ─────────────────────────────────────────────────
    #inicializarEventos() {
        document.getElementById('colores-grid').addEventListener('click', e => {
            const btn = e.target.closest('.color-btn');
            if (!btn) return;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            this.#estado.color = btn.dataset.color;
        });

        document.getElementById('control-tabs').addEventListener('click', e => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            this.#estado.control = btn.dataset.ctrl;
        });

        document.getElementById('btn-solo').addEventListener('click', () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#estado.modoSolo = true;
            OrientacionManager.forzar();
            this.#iniciarCuentaRegresiva();
        });

        document.getElementById('btn-crear').addEventListener('click', async () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#estado.modoSolo = false;
            OrientacionManager.forzar();
            this.#mostrar('pantalla-crear');
            await this.#iniciarCrearSala();
        });

        document.getElementById('btn-unirse').addEventListener('click', () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#mostrar('pantalla-unirse');
        });

        document.getElementById('btn-confirmar-unirse').addEventListener('click', () => this.#confirmarUnirse());

        document.getElementById('btn-volver-1').addEventListener('click', () => this.#mostrar('pantalla-inicio'));
        document.getElementById('btn-volver-2').addEventListener('click', () => this.#mostrar('pantalla-inicio'));

        document.getElementById('btn-garage').addEventListener('click', () => this.#mostrar('pantalla-ajustes'));
        document.getElementById('btn-volver-ajustes').addEventListener('click', () => this.#mostrar('pantalla-inicio'));
        document.getElementById('btn-ir-garage').addEventListener('click', () => {
            this.#mostrar('pantalla-garage');
            Garage.iniciar(this.#estado, id => this.#mostrar(id));
        });

        const giroscopioTester = new GiroscopioTester();
        document.getElementById('btn-ir-giro').addEventListener('click', () => {
            this.#mostrar('pantalla-giro');
            giroscopioTester.iniciar();
        });
        document.getElementById('btn-volver-giro').addEventListener('click', () => {
            giroscopioTester.detener();
            this.#mostrar('pantalla-ajustes');
        });

        document.getElementById('btn-revancha').addEventListener('click', () => {
            if (window.multiJugador?.salaId) {
                this.#mostrar('pantalla-crear');
                document.getElementById('codigo-display').textContent = window.multiJugador.salaId;
            } else {
                this.#mostrar('pantalla-inicio');
            }
        });

        document.getElementById('btn-menu').addEventListener('click', async () => {
            OrientacionManager.liberar();
            if (window.multiJugador) await window.multiJugador.limpiar();
            window.multiJugador = null;
            this.#estado.juego = null;
            this.#mostrar('pantalla-inicio');
        });
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
                this.#iniciarCuentaRegresiva();
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
            this.#iniciarCuentaRegresiva();
        } catch (err) {
            errEl.textContent = err.message;
        }
    }

    // ── Sala de espera ───────────────────────────────────────────
    #prepararSalaEspera(nombre1, color1, nombre2, color2) {
        this.#mostrar('pantalla-espera');
        document.getElementById('nombre-j1').textContent = nombre1;
        document.getElementById('dot-j1').style.cssText = `background:${color1};box-shadow:0 0 8px ${color1}`;
        document.getElementById('nombre-j2').textContent = nombre2;
        document.getElementById('dot-j2').style.cssText = `background:${color2};box-shadow:0 0 8px ${color2}`;
    }

    // ── Cuenta regresiva ─────────────────────────────────────────
    #iniciarCuentaRegresiva() {
        if (this.#estado.modoSolo) {
            this.#mostrar('pantalla-espera');
            document.getElementById('nombre-j1').textContent = this.#estado.nombre;
            document.getElementById('dot-j1').style.background = this.#estado.color;
            document.getElementById('nombre-j2').textContent = 'CPU / Sin oponente';
            document.getElementById('dot-j2').style.background = '#475569';
            document.querySelectorAll('.vs-sep').forEach(el => el.textContent = '');
        }

        const el = document.getElementById('cuenta-regresiva');
        const pasos = ['3', '2', '1', '¡YA!'];
        let i = 0;
        this.#mostrar('pantalla-espera');

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
        this.#mostrar('pantalla-juego');
        OrientacionManager.verificar();

        const oponenteNombre = this.#estado.modoSolo
            ? null
            : (window.multiJugador?.jugadorNum === 1
                ? document.getElementById('nombre-j2').textContent
                : document.getElementById('nombre-j1').textContent);

        this.#estado.juego = new Juego(this.#estado.color, this.#estado.control, this.#estado.tipoAuto);

        window.onCarreraTerminada = (tiempoMs, velMax) => {
            if (!this.#estado.modoSolo && window.multiJugador) window.multiJugador.reportarGanador();
            this.#mostrarResultado(true, tiempoMs, velMax);
        };

        this.#estado.juego.iniciar(oponenteNombre);
    }

    // ── Resultado ────────────────────────────────────────────────
    #mostrarResultado(gane, tiempoMs = null, velMax = 0) {
        if (this.#estado.juego) this.#estado.juego.detener();
        this.#mostrar('pantalla-resultado');

        const tituloEl = document.getElementById('titulo-resultado');
        tituloEl.textContent = gane ? '¡GANASTE! 🏆' : '¡PERDISTE! 💨';
        tituloEl.className = 'resultado-titulo ' + (gane ? 'gane' : 'perdi');

        document.getElementById('stat-tutiempo').textContent = tiempoMs ? this.#formatearTiempo(tiempoMs) : '--';
        document.getElementById('stat-eltiempo').textContent = '--';
        document.getElementById('stat-velmax').textContent = Math.round((velMax / CFG.VEL_MAX) * 220) + ' km/h';
    }
}

// ================================================================
// ARRANCAR
// ================================================================
new App();
