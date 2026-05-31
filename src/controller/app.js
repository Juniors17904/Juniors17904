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
window.ToastManager = ToastManager;
// Mostrar errores acumulados antes de que ToastManager existiera
(window.__modelErrors || []).forEach(msg => ToastManager.mostrar(msg, 'error'));
window.__modelErrors = [];

// ================================================================
// CLASS: OrientacionManager — forzar/detectar landscape
// ================================================================
class OrientacionManager {
    static #PANTALLAS_LANDSCAPE = ['pantalla-juego', 'pantalla-espera'];
    static #toastTimer = 0;
    static saltarCheck = false;

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
        if (OrientacionManager.saltarCheck) return;
        const esMovil = 'ontouchstart' in window;
        const tipo = screen.orientation?.type ?? '';
        const esVertical = tipo ? tipo.startsWith('portrait') : window.innerHeight > window.innerWidth;
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
        pista: 'ciudad',
        juego: null,
    };

    #backNav = false;

    constructor() {
        OrientacionManager.iniciarListeners();
        this.#inicializarEventos();
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
        if (id !== 'pantalla-juego') this.#td3dPending = false;
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
            this.#iniciarCuentaRegresiva();
        });

        document.getElementById('btn-crear').addEventListener('click', async () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#estado.modoSolo = false;
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

        document.getElementById('btn-test-drive').addEventListener('click', () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#iniciarTestDrive();
        });

        document.getElementById('btn-test-drive-3d').addEventListener('click', () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#iniciarTestDrive3D();
        });

        document.getElementById('btn-exit-td3d').addEventListener('click', () => {
            this.#limpiarTestDrive3D();
            OrientacionManager.liberar();
            this.#mostrar('pantalla-ajustes');
        });
        document.getElementById('btn-exit-cir3d').addEventListener('click', () => {
            this.#limpiarCircuito3D();
            OrientacionManager.liberar();
            this.#mostrar('pantalla-detalle-pista');
        });

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

        document.getElementById('btn-ir-pista').addEventListener('click', () => this.#mostrar('pantalla-pista'));
        document.getElementById('btn-volver-pista').addEventListener('click', () => this.#mostrar('pantalla-ajustes'));
        document.getElementById('btn-volver-detalle-pista').addEventListener('click', () => this.#mostrar('pantalla-pista'));
        document.getElementById('btn-seleccionar-pista').addEventListener('click', () => {
            this.#mostrar('pantalla-juego');
            this.#iniciarCircuito3D(this.#estado.pista);
        });
        document.getElementById('pantalla-pista').addEventListener('click', e => {
            const card = e.target.closest('.pista-card');
            if (!card) return;
            document.querySelectorAll('.pista-card').forEach(c => c.classList.remove('sel'));
            card.classList.add('sel');
            this.#estado.pista = card.dataset.pista;
            document.getElementById('detalle-pista-nombre').textContent =
                card.querySelector('.pista-nombre').textContent;
            document.getElementById('detalle-pista-desc').textContent =
                card.querySelector('.pista-desc').textContent;
            this.#dibujarMapaPista(card.dataset.pista);
            this.#mostrar('pantalla-detalle-pista');
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
            this.#limpiarTestDrive3D();
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

        this.#estado.juego = new Juego(this.#estado.color, this.#estado.control, this.#estado.tipoAuto, this.#estado.pista);

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

    // ── Test Drive ───────────────────────────────────────────────
    #iniciarTestDrive() {
        this.#mostrar('pantalla-juego');
        OrientacionManager.verificar();
        document.getElementById('ctrl-accel').style.display = 'flex';
        this.#estado.juego = new Juego(this.#estado.color, this.#estado.control, this.#estado.tipoAuto, 'testdrive');
        window.onCarreraTerminada = null;
        this.#estado.juego.iniciar(null);
    }

    #iniciarTestDrivePista(tipoPista) {
        // Crea una versión libre de la pista (sin meta, sin fin)
        const base = window.PISTAS?.[tipoPista];
        if (!base) { this.#iniciarTestDrive(); return; }
        window.PISTAS['__td__'] = {
            ...base,
            distMeta: Infinity,
            esTestDrive: true,
        };
        this.#mostrar('pantalla-juego');
        OrientacionManager.verificar();
        document.getElementById('ctrl-accel').style.display = 'flex';
        this.#estado.juego = new Juego(this.#estado.color, this.#estado.control, this.#estado.tipoAuto, '__td__');
        window.onCarreraTerminada = null;
        this.#estado.juego.iniciar(null);
    }

    // ── Test Drive 3D ────────────────────────────────────────────
    #td3d = null;
    #td3dKeyDown = null;
    #td3dKeyUp = null;
    #td3dTouchHandlers = [];
    #td3dPista = 'ciudad';
    #td3dPending = false;

    #iniciarTestDrive3D(tipoPista = 'ciudad') {
        this.#td3dPending = true;
        if (!window.TestDrive3D) {
            setTimeout(() => { if (this.#td3dPending) this.#iniciarTestDrive3D(tipoPista); }, 200);
            return;
        }
        this.#td3dPending = false;
        this.#td3dPista = tipoPista;
        this.#limpiarPantallaJuego();
        OrientacionManager.saltarCheck = true;
        this.#mostrar('pantalla-juego');

        document.getElementById('canvas-td3d').style.display = 'block';
        document.getElementById('titulo-td3d').style.display = 'block';
        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display = 'flex';
        document.getElementById('btn-exit-td3d').style.display = 'flex';

        const canvas = document.getElementById('canvas-td3d');
        const td = new window.TestDrive3D(canvas);
        this.#td3d = td;
        td.cargar(this.#estado.tipoAuto, this.#estado.color);
        td.iniciar();
        const td3dInitRotY = td.rotY;

        this.#td3dKeyDown = e => {
            if (e.key === 'ArrowUp'    || e.key === 'w') td.accelInput =  1;
            if (e.key === 'ArrowDown'  || e.key === 's') td.accelInput = -1;
            if (e.key === 'ArrowLeft'  || e.key === 'a') td.steerInput = -1;
            if (e.key === 'ArrowRight' || e.key === 'd') td.steerInput =  1;
        };
        this.#td3dKeyUp = e => {
            if (e.key === 'ArrowUp'   || e.key === 'w' ||
                e.key === 'ArrowDown' || e.key === 's') td.accelInput = 0;
            if (e.key === 'ArrowLeft' || e.key === 'a' ||
                e.key === 'ArrowRight'|| e.key === 'd') td.steerInput = 0;
        };
        window.addEventListener('keydown', this.#td3dKeyDown);
        window.addEventListener('keyup',   this.#td3dKeyUp);

        this.#td3dTouchHandlers = [];
        const addTouch = (id, onStart, onEnd) => {
            const el = document.getElementById(id);
            el.addEventListener('touchstart', onStart, { passive: true });
            el.addEventListener('touchend',   onEnd);
            this.#td3dTouchHandlers.push({ el, onStart, onEnd });
        };
        addTouch('btn-gas', () => { td.accelInput =  1; }, () => { td.accelInput = 0; });
        addTouch('btn-rev', () => { td.accelInput = -1; }, () => { td.accelInput = 0; });
        addTouch('btn-izq', () => { td.steerInput = -1; }, () => { td.steerInput = 0; });
        addTouch('btn-der', () => { td.steerInput =  1; }, () => { td.steerInput = 0; });

        // Slider altura de cámara
        const sliderCam = document.getElementById('slider-cam-height');
        const ctrlCam   = document.getElementById('ctrl-cam-height');
        sliderCam.value = '2.8';
        ctrlCam.style.display = 'flex';
        sliderCam.addEventListener('input', e => { td.camHeight = parseFloat(e.target.value); });

        // Minimapa
        const mmCanvas = document.getElementById('minimap-td3d');
        const mmBtn    = document.getElementById('btn-toggle-minimap');
        let   mmVisible = true;
        mmCanvas.style.display = 'block';
        mmBtn.style.display = 'block';
        mmBtn.addEventListener('click', () => {
            mmVisible = !mmVisible;
            mmCanvas.style.display = mmVisible ? 'block' : 'none';
            mmBtn.textContent = mmVisible ? 'MAPA' : 'MAPA ✕';
        });
        const mmCtx = mmCanvas.getContext('2d');
        const MM_W = 90, MM_H = 120;
        const MM_CX = MM_W / 2;
        const MM_PAD = 10;

        // Test drive: pista recta — sin circuito de referencia
        const mmCircuit = null;

        // Recorrido (trail) del test drive
        const trailCanvas = document.getElementById('trail-map');
        const trailBtn    = document.getElementById('btn-toggle-trail');
        const trailCtx    = trailCanvas.getContext('2d');
        let trailVisible  = true;
        let trailPts      = [];
        trailCanvas.style.display = 'block';
        trailBtn.style.display    = 'block';
        trailBtn.textContent = 'RECORRIDO';
        trailBtn.onclick = () => {
            trailVisible = !trailVisible;
            trailCanvas.style.display = trailVisible ? 'block' : 'none';
            trailBtn.textContent = trailVisible ? 'RECORRIDO' : 'RECORRIDO ✕';
        };

        // Debug overlay
        document.getElementById('debug-td3d').style.display = 'flex';
        let _dbgLast = performance.now(), _dbgFrames = 0, _dbgFps = 60;
        const _dbgLoop = () => {
            if (!this.#td3d) return;
            _dbgFrames++;
            const now = performance.now();
            if (now - _dbgLast >= 500) {
                _dbgFps = Math.round(_dbgFrames * 1000 / (now - _dbgLast));
                _dbgFrames = 0; _dbgLast = now;
            }
            const s = td.speed, a = td.accel;
            const kmh = Math.round(Math.abs(s) * 216);
            // AUTO
            document.getElementById('dbg-vel').textContent    = Math.abs(s).toFixed(3);
            document.getElementById('dbg-kmh').textContent    = kmh;
            document.getElementById('dbg-acel').textContent   = (a >= 0 ? '+' : '') + a.toFixed(4);
            document.getElementById('dbg-vmax').textContent   = td.maxSpeed.toFixed(3);
            document.getElementById('dbg-iacel').textContent  = td.accelInput ===  1 ? '⬆ GAS'
                                                              : td.accelInput === -1 ? '⬇ REVERSA' : 'NEUTRO';
            document.getElementById('dbg-idir').textContent   = td.steerInput < -0.1 ? '◀ IZQ'
                                                              : td.steerInput >  0.1 ? 'DER ▶' : 'RECTO';
            // PISTA
            document.getElementById('dbg-px').textContent     = td.px.toFixed(2);
            document.getElementById('dbg-pz').textContent     = td.pz.toFixed(2);
            document.getElementById('dbg-rotx').textContent   = (0).toFixed(1);
            document.getElementById('dbg-rumbo').textContent  = (((td.rotY - td3dInitRotY) * 180 / Math.PI % 360 + 360) % 360).toFixed(1);
            document.getElementById('dbg-rotz').textContent   = (td.rotZ * 180 / Math.PI).toFixed(1);
            document.getElementById('dbg-fps').textContent    = _dbgFps;
            // CÁMARA
            document.getElementById('dbg-camh').textContent   = td.camHeight.toFixed(2);
            document.getElementById('dbg-cam-roty').textContent = (td.camRotY * 180 / Math.PI).toFixed(1);
            document.getElementById('dbg-cam-dist').textContent = td.physics.camDist;
            // FÍSICAS
            const ph = td.physics;
            document.getElementById('dbg-f-accel').textContent  = ph.accel;
            document.getElementById('dbg-f-brake').textContent  = ph.brake;
            document.getElementById('dbg-f-drag').textContent   = ph.drag;
            document.getElementById('dbg-f-steer').textContent  = ph.steer;
            document.getElementById('dbg-f-maxfwd').textContent = ph.maxFwd;
            document.getElementById('dbg-f-maxrev').textContent = ph.maxRev;
            // Minimapa — pista recta
            if (mmVisible) {
                mmCtx.clearRect(0, 0, MM_W, MM_H);
                mmCtx.fillStyle = 'rgba(0,0,0,0.70)';
                mmCtx.roundRect(0, 0, MM_W, MM_H, 8); mmCtx.fill();
                mmCtx.strokeStyle = '#6b7280'; mmCtx.lineWidth = 3; mmCtx.lineCap = 'round';
                mmCtx.beginPath(); mmCtx.moveTo(MM_CX, MM_PAD); mmCtx.lineTo(MM_CX, MM_H - MM_PAD); mmCtx.stroke();
                const mmPy = MM_H - MM_PAD - (td.pz / 950) * (MM_H - MM_PAD * 2);
                const mmPx = MM_CX;
                mmCtx.shadowColor = '#ef4444'; mmCtx.shadowBlur = 8;
                mmCtx.fillStyle = '#ef4444';
                mmCtx.beginPath(); mmCtx.arc(mmPx, mmPy, 4, 0, Math.PI * 2); mmCtx.fill();
                mmCtx.shadowBlur = 0;
            }

            // Recorrido (trail) — trayectoria real en la recta
            if (trailVisible) {
                const lastTp = trailPts[trailPts.length - 1];
                const ddx = lastTp ? td.px - lastTp[0] : 999;
                const ddz = lastTp ? td.pz - lastTp[1] : 999;
                if (ddx*ddx + ddz*ddz > 0.04) trailPts.push([td.px, td.pz]);
                if (trailPts.length > 3000) trailPts.shift();

                trailCtx.clearRect(0, 0, MM_W, MM_H);
                trailCtx.fillStyle = 'rgba(0,0,0,0.70)';
                trailCtx.roundRect(0, 0, MM_W, MM_H, 8); trailCtx.fill();
                // carretera de fondo (oculta)
                // trail real
                if (trailPts.length > 1) {
                    trailCtx.strokeStyle = '#06b6d4'; trailCtx.lineWidth = 1.5; trailCtx.lineCap = 'round'; trailCtx.lineJoin = 'round';
                    trailCtx.beginPath();
                    trailPts.forEach(([wx, wz], i) => {
                        const tx = MM_CX + (-wx / 3.8) * (MM_W * 0.15);
                        const ty = MM_H - MM_PAD - (wz / 950) * (MM_H - MM_PAD * 2);
                        i === 0 ? trailCtx.moveTo(tx, ty) : trailCtx.lineTo(tx, ty);
                    });
                    trailCtx.stroke();
                }
                // punto del auto
                const tpx = MM_CX + (-td.px / 3.8) * (MM_W * 0.15);
                const tpy = MM_H - MM_PAD - (td.pz / 950) * (MM_H - MM_PAD * 2);
                trailCtx.shadowColor = '#ef4444'; trailCtx.shadowBlur = 8;
                trailCtx.fillStyle = '#ef4444';
                trailCtx.beginPath(); trailCtx.arc(tpx, tpy, 4, 0, Math.PI * 2); trailCtx.fill();
                trailCtx.shadowBlur = 0;
                trailCtx.fillStyle = 'rgba(255,255,255,0.5)';
                trailCtx.font = '7px monospace';
                trailCtx.fillText('RUTA', 3, 8);
            }

            requestAnimationFrame(_dbgLoop);
        };
        requestAnimationFrame(_dbgLoop);
    }

    #limpiarPantallaJuego() {
        this.#limpiarTestDrive3D();
        this.#limpiarCircuito3D();
        const hide = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
        hide('canvas-td3d');
        hide('canvas-cir3d');
        hide('titulo-td3d');
        hide('titulo-cir3d');
        hide('btn-exit-td3d');
        hide('btn-exit-cir3d');
        hide('ctrl-botones');
        hide('ctrl-accel');
        hide('ctrl-cam-height');
        hide('debug-td3d');
        hide('debug-path');
        hide('minimap-td3d');
        hide('trail-map');
        hide('btn-toggle-minimap');
        hide('btn-toggle-trail');
        hide('btn-toggle-datos');
        hide('btn-toggle-mapas');
        hide('btn-cam-aerea');
        document.getElementById('canvas-carro-3d').style.display = '';
    }

    #limpiarTestDrive3D() {
        this.#td3dPending = false;
        if (!this.#td3d) return;
        this.#td3d.detener();
        this.#td3d = null;
        if (this.#td3dKeyDown) window.removeEventListener('keydown', this.#td3dKeyDown);
        if (this.#td3dKeyUp)   window.removeEventListener('keyup',   this.#td3dKeyUp);
        this.#td3dKeyDown = null;
        this.#td3dKeyUp   = null;
        for (const { el, onStart, onEnd } of this.#td3dTouchHandlers) {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchend',   onEnd);
        }
        this.#td3dTouchHandlers = [];
        OrientacionManager.saltarCheck = false;
        document.getElementById('canvas-td3d').style.display = 'none';
        document.getElementById('titulo-td3d').style.display = 'none';
        document.getElementById('canvas-carro-3d').style.display = '';
        document.getElementById('ctrl-accel').style.display = 'none';
        document.getElementById('btn-exit-td3d').style.display = 'none';
        document.getElementById('debug-td3d').style.display = 'none';
        document.getElementById('minimap-td3d').style.display = 'none';
        document.getElementById('trail-map').style.display = 'none';
        document.getElementById('btn-toggle-minimap').style.display = 'none';
        document.getElementById('btn-toggle-trail').style.display = 'none';
        document.getElementById('ctrl-cam-height').style.display = 'none';
    }

    // ── Circuito 3D (pista con curvas) ──────────────────────────
    #cir3d = null;
    #cir3dTipoPista = 'ciudad';
    #cir3dVisibilityHandler = null;
    #cir3dKeyDown = null;
    #cir3dKeyUp   = null;
    #cir3dTouchHandlers = [];
    #cir3dCanvasTouchStart = null;
    #cir3dCanvasTouchMove  = null;

    #iniciarCircuito3D(tipoPista = 'ciudad') {
        if (!window.CircuitoUrbano) {
            setTimeout(() => this.#iniciarCircuito3D(tipoPista), 150);
            return;
        }
        this.#cir3dTipoPista = tipoPista;
        this.#limpiarPantallaJuego();
        OrientacionManager.saltarCheck = true;

        // Detectar pérdida de contexto WebGL al desbloquear pantalla
        this.#cir3dVisibilityHandler = () => {
            if (!document.hidden && this.#cir3d?.contextLost) {
                ToastManager.mostrar('Contexto GPU perdido — recuperando...', 'warn');
                const pista = this.#cir3dTipoPista;
                // Esperar 1s: Three.js intenta restaurar el contexto solo.
                // Si después sigue perdido, limpiar y reiniciar con delay adicional.
                setTimeout(() => {
                    if (!this.#cir3d || this.#cir3d.contextLost) {
                        this.#limpiarCircuito3D();
                        setTimeout(() => {
                            ToastManager.mostrar('Reiniciando circuito...', 'warn');
                            this.#iniciarCircuito3D(pista);
                        }, 500);
                    }
                }, 1000);
            }
        };
        document.addEventListener('visibilitychange', this.#cir3dVisibilityHandler);

        const canvas = document.getElementById('canvas-cir3d');
        canvas.style.display = 'block';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        document.getElementById('canvas-carro-3d').style.display = 'none';
        document.getElementById('titulo-cir3d').style.display = 'block';
        document.getElementById('btn-exit-cir3d').style.display = 'block';

        const cir = new window.CircuitoUrbano(canvas, tipoPista);
        this.#cir3d = cir;
        cir.cargar(this.#estado.tipoAuto, this.#estado.color);
        cir.iniciar();
        const cirInitRotY = cir.rotY;

        this.#cir3dKeyDown = e => {
            if (cir.camAereaActiva && cir.camAerea) {
                if (e.key==='ArrowLeft' ||e.key==='a') cir.camAerea.moveX=-1;
                if (e.key==='ArrowRight'||e.key==='d') cir.camAerea.moveX= 1;
                if (e.key==='ArrowUp'   ||e.key==='w') cir.camAerea.moveZ=-1;
                if (e.key==='ArrowDown' ||e.key==='s') cir.camAerea.moveZ= 1;
            } else {
                if (e.key==='ArrowUp'   ||e.key==='w') cir.accelInput= 1;
                if (e.key==='ArrowDown' ||e.key==='s') cir.accelInput=-1;
                if (e.key==='ArrowLeft' ||e.key==='a') cir.steerInput=-1;
                if (e.key==='ArrowRight'||e.key==='d') cir.steerInput= 1;
            }
        };
        this.#cir3dKeyUp = e => {
            if (cir.camAereaActiva && cir.camAerea) {
                if (e.key==='ArrowLeft'||e.key==='a'||e.key==='ArrowRight'||e.key==='d') cir.camAerea.moveX=0;
                if (e.key==='ArrowUp'||e.key==='w'||e.key==='ArrowDown'||e.key==='s')   cir.camAerea.moveZ=0;
            } else {
                if (e.key==='ArrowUp'||e.key==='w'||e.key==='ArrowDown'||e.key==='s') cir.accelInput=0;
                if (e.key==='ArrowLeft'||e.key==='a'||e.key==='ArrowRight'||e.key==='d') cir.steerInput=0;
            }
        };
        window.addEventListener('keydown', this.#cir3dKeyDown);
        window.addEventListener('keyup',   this.#cir3dKeyUp);

        // Drag 1 dedo = pan, 2 dedos = zoom (pinch)
        {
            let prevX = 0, prevY = 0;
            let pinchDist = 0, pinchH = 0, wasPinching = false;
            const getDist = t => {
                const dx = t[0].clientX - t[1].clientX;
                const dy = t[0].clientY - t[1].clientY;
                return Math.sqrt(dx * dx + dy * dy);
            };
            this.#cir3dCanvasTouchStart = e => {
                if (!cir.camAereaActiva) return;
                if (e.touches.length === 2) {
                    pinchDist = getDist(e.touches);
                    pinchH    = cir.camAerea.h;
                } else {
                    prevX = e.touches[0].clientX;
                    prevY = e.touches[0].clientY;
                }
            };
            this.#cir3dCanvasTouchMove = e => {
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
            canvas.addEventListener('touchstart', this.#cir3dCanvasTouchStart, {passive: true});
            canvas.addEventListener('touchmove',  this.#cir3dCanvasTouchMove,  {passive: false});
        }

        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display   = 'flex';

        const addTouch = (id, onStart, onEnd) => {
            const el = document.getElementById(id);
            el.addEventListener('touchstart', onStart, {passive:true});
            el.addEventListener('touchend', onEnd);
            this.#cir3dTouchHandlers.push({el, onStart, onEnd});
        };
        addTouch('btn-gas',
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveZ=-1; else cir.accelInput= 1; },
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveZ= 0; else cir.accelInput=0; });
        addTouch('btn-rev',
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveZ= 1; else cir.accelInput=-1; },
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveZ= 0; else cir.accelInput=0; });
        addTouch('btn-izq',
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveX=-1; else cir.steerInput=-1; },
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveX= 0; else cir.steerInput=0; });
        addTouch('btn-der',
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveX= 1; else cir.steerInput= 1; },
            ()=>{ if(cir.camAereaActiva&&cir.camAerea) cir.camAerea.moveX= 0; else cir.steerInput=0; });

        // Slider cámara
        const sliderCam = document.getElementById('slider-cam-height');
        sliderCam.value = '2.8';
        document.getElementById('ctrl-cam-height').style.display = 'flex';
        sliderCam.addEventListener('input', e => {
            if (cir.camAereaActiva) cir.setCamAereaAltura(parseFloat(e.target.value));
            else cir.camHeight = parseFloat(e.target.value);
        });

        // Botón cámara aérea
        const btnCamAerea = document.getElementById('btn-cam-aerea');
        btnCamAerea.style.display = 'block';
        btnCamAerea.textContent = 'CAM↑';
        btnCamAerea.onclick = () => {
            const activa = cir.toggleCamaraAerea();
            btnCamAerea.textContent = activa ? 'CHASE' : 'CAM↑';
            document.getElementById('ctrl-botones').style.display         = activa ? 'none'  : 'flex';
            document.getElementById('btn-toggle-datos').style.display     = activa ? 'none'  : 'block';
            document.getElementById('btn-toggle-mapas').style.display     = activa ? 'none'  : 'block';
            document.getElementById('ctrl-cam-height').style.display      = activa ? 'none'  : 'flex';
            cir.accelInput = 0; cir.steerInput = 0;
        };

        // Botón toggle paneles de datos
        const btnToggleDatos = document.getElementById('btn-toggle-datos');
        btnToggleDatos.style.display = 'block';
        let datosVisible = true;
        btnToggleDatos.onclick = () => {
            datosVisible = !datosVisible;
            document.getElementById('debug-td3d').style.display = datosVisible ? 'flex' : 'none';
            document.getElementById('debug-path').style.display = datosVisible ? 'block' : 'none';
            btnToggleDatos.textContent = datosVisible ? 'DATOS' : 'DATOS ✕';
        };

        // Botón toggle mapas (minimapa + recorrido)
        const btnToggleMapas = document.getElementById('btn-toggle-mapas');
        btnToggleMapas.style.display = 'block';
        let mapasAreaVisible = true;
        btnToggleMapas.onclick = () => {
            mapasAreaVisible = !mapasAreaVisible;
            mmVisible    = mapasAreaVisible;
            trailVisible = mapasAreaVisible;
            mmCanvas.style.display    = mapasAreaVisible ? 'block' : 'none';
            trailCanvas.style.display = mapasAreaVisible ? 'block' : 'none';
            btnToggleMapas.textContent = mapasAreaVisible ? 'MAPAS' : 'MAPAS ✕';
        };

        // Debug overlay
        document.getElementById('debug-td3d').style.display = 'flex';
        document.getElementById('debug-path').style.display = 'block';

        // Minimapa — trazado desde tramos
        const mmCanvas = document.getElementById('minimap-td3d');
        mmCanvas.style.display = 'block';
        mmCanvas.style.pointerEvents = 'auto';
        mmCanvas.style.cursor = 'grab';
        // Drag con el dedo
        {
            let sx, sy, ox, oy;
            mmCanvas.addEventListener('touchstart', e => {
                const t = e.touches[0];
                sx = t.clientX; sy = t.clientY;
                ox = mmCanvas.offsetLeft; oy = mmCanvas.offsetTop;
                e.stopPropagation();
            }, {passive:true});
            mmCanvas.addEventListener('touchmove', e => {
                e.preventDefault(); e.stopPropagation();
                const t = e.touches[0];
                mmCanvas.style.left   = (ox + t.clientX - sx) + 'px';
                mmCanvas.style.top    = (oy + t.clientY - sy) + 'px';
                mmCanvas.style.right  = 'auto';
                mmCanvas.style.bottom = 'auto';
            }, {passive:false});
        }
        const mmCtx = mmCanvas.getContext('2d');
        const MM_W=90, MM_H=120, MM_PAD=10;
        const pistaCfg = window.PISTAS?.[tipoPista];
        let _mmScl=1, _mmOx=0, _mmOy=0;
        const mmCircuit = (() => {
            if (!pistaCfg?.tramos?.length) return null;
            const pts=[];
            let x=0,y=0,angle=-Math.PI/2;
            for (let i=0; i<pistaCfg.totalSegs; i++) {
                const tr=pistaCfg.tramos.find(([d,h])=>i>=d&&i<h);
                angle+=(tr?tr[2]:0)*0.045;
                x-=Math.cos(angle)*1.5; y+=Math.sin(angle)*1.5; pts.push([x,y]);
            }
            const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
            const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
            const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX||1),(MM_H-MM_PAD*2)/(maxY-minY||1));
            const ox=(MM_W-(maxX-minX)*scl)/2-minX*scl, oy=(MM_H-(maxY-minY)*scl)/2-minY*scl;
            _mmScl=scl; _mmOx=ox; _mmOy=oy;
            return pts.map(([px,py])=>({x:px*scl+ox, y:py*scl+oy}));
        })();
        // Transforma coordenadas mundo 3D → canvas (mismo espacio que mmCircuit)
        const RATIO = 1.5/4;
        const wToC = (wx,wz) => ({ x: -wx*RATIO*_mmScl+_mmOx, y: -wz*RATIO*_mmScl+_mmOy });

        // Mapa de recorrido (trail)
        const trailCanvas = document.getElementById('trail-map');
        const trailCtx = trailCanvas.getContext('2d');
        trailCanvas.style.display = 'block';
        trailCanvas.style.pointerEvents = 'auto';
        trailCanvas.style.cursor = 'grab';
        // Drag con el dedo
        {
            let sx, sy, ox, oy;
            trailCanvas.addEventListener('touchstart', e => {
                const t = e.touches[0];
                sx = t.clientX; sy = t.clientY;
                ox = trailCanvas.offsetLeft; oy = trailCanvas.offsetTop;
                e.stopPropagation();
            }, {passive:true});
            trailCanvas.addEventListener('touchmove', e => {
                e.preventDefault(); e.stopPropagation();
                const t = e.touches[0];
                trailCanvas.style.left   = (ox + t.clientX - sx) + 'px';
                trailCanvas.style.top    = (oy + t.clientY - sy) + 'px';
                trailCanvas.style.right  = 'auto';
                trailCanvas.style.bottom = 'auto';
            }, {passive:false});
        }
        const trailPts = [];

        // Circuito en coordenadas mundo 3D — puntos reales de la CatmullRom
        const worldCircuit = cir.pathSamples(300).map(p => [p.x, p.z]);
        // Escala fija del trail canvas (basada en bounding box del circuito)
        const _buildTrailScale = () => {
            if (!worldCircuit) return null;
            const wxs=worldCircuit.map(p=>p[0]), wzs=worldCircuit.map(p=>p[1]);
            const minX=Math.min(...wxs)-8, maxX=Math.max(...wxs)+8;
            const minZ=Math.min(...wzs)-8, maxZ=Math.max(...wzs)+8;
            const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX),(MM_H-MM_PAD*2)/(maxZ-minZ));
            const ox=(MM_W-(maxX-minX)*scl)/2+maxX*scl;
            const oz=(MM_H-(maxZ-minZ)*scl)/2+maxZ*scl;
            return { scl, ox, oz };
        };
        const _ts = _buildTrailScale();
        const wToT = _ts ? (wx,wz) => ({ x: -wx*_ts.scl+_ts.ox, y: -wz*_ts.scl+_ts.oz }) : null;

        let mmVisible = true;
        let trailVisible = true;
        let _dbgLast=performance.now(), _dbgFrames=0, _dbgFps=60;
        const _dbgLoop = () => {
            if (!this.#cir3d) return;
            _dbgFrames++;
            const now=performance.now();
            if (now-_dbgLast>=500) { _dbgFps=Math.round(_dbgFrames*1000/(now-_dbgLast)); _dbgFrames=0; _dbgLast=now; }
            const s=cir.speed, a=cir.accel, kmh=Math.round(Math.abs(s)*216);
            // AUTO
            document.getElementById('dbg-vel').textContent   = Math.abs(s).toFixed(3);
            document.getElementById('dbg-kmh').textContent   = kmh;
            document.getElementById('dbg-acel').textContent  = (a>=0?'+':'')+a.toFixed(4);
            document.getElementById('dbg-vmax').textContent  = cir.maxSpeed.toFixed(3);
            document.getElementById('dbg-iacel').textContent = cir.accelInput===1?'⬆ GAS':cir.accelInput===-1?'⬇ REVERSA':'NEUTRO';
            document.getElementById('dbg-idir').textContent  = cir.steerInput<-0.1?'◀ IZQ':cir.steerInput>0.1?'DER ▶':'RECTO';
            document.getElementById('dbg-rotx').textContent  = (0).toFixed(1);
            document.getElementById('dbg-rumbo').textContent = (((cir.rotY-cirInitRotY)*180/Math.PI%360)+360)%360 |0;
            document.getElementById('dbg-rotz').textContent  = (cir.rotZ*180/Math.PI).toFixed(1);
            // PISTA
            document.getElementById('dbg-px').textContent    = cir.px.toFixed(1);
            document.getElementById('dbg-pz').textContent    = cir.pz.toFixed(1);
            document.getElementById('dbg-fps').textContent   = _dbgFps;
            // CÁMARA
            document.getElementById('dbg-camh').textContent      = cir.camHeight.toFixed(2);
            document.getElementById('dbg-cam-roty').textContent  = (cir.rotY*180/Math.PI|0);
            document.getElementById('dbg-cam-dist').textContent  = cir.physics.camDist;
            // FÍSICAS
            const ph=cir.physics;
            document.getElementById('dbg-f-accel').textContent = ph.accel;
            document.getElementById('dbg-f-brake').textContent = ph.brake;
            document.getElementById('dbg-f-drag').textContent  = ph.drag;
            document.getElementById('dbg-f-steer').textContent = ph.steer;
            document.getElementById('dbg-f-maxfwd').textContent= ph.maxFwd;
            document.getElementById('dbg-f-maxrev').textContent= ph.maxRev;
            // Panel PATH
            const totalKm = (cir.pathLen / 1000).toFixed(2);
            document.getElementById('dbg-total').textContent = totalKm;
            document.getElementById('dbg-recor').textContent = (cir.progress * cir.pathLen / 1000).toFixed(3);
            const pp  = cir.pathPos;
            const off = Math.sqrt((cir.px-pp.x)**2 + (cir.pz-pp.z)**2);
            const seg = (cir.progress * pistaCfg.totalSegs) | 0;
            const trP = pistaCfg.tramos.find(([d,h]) => seg>=d && seg<h);
            document.getElementById('dbg-seg').textContent    = seg;
            document.getElementById('dbg-curva').textContent  = trP ? trP[2].toFixed(1) : '0.0';
            document.getElementById('dbg-path-x').textContent = pp.x.toFixed(1);
            document.getElementById('dbg-path-z').textContent = pp.z.toFixed(1);
            document.getElementById('dbg-off').textContent    = off.toFixed(2);
            document.getElementById('dbg-lat').textContent    = cir.lateral.toFixed(2);

            // Minimapa
            if (mmVisible && mmCircuit) {
                mmCtx.clearRect(0,0,MM_W,MM_H);
                mmCtx.fillStyle='rgba(0,0,0,0.70)';
                mmCtx.roundRect(0,0,MM_W,MM_H,8); mmCtx.fill();
                mmCtx.strokeStyle='#6b7280'; mmCtx.lineWidth=2.5; mmCtx.lineCap='round'; mmCtx.lineJoin='round';
                mmCtx.beginPath();
                mmCircuit.forEach((p,i)=>i===0?mmCtx.moveTo(p.x,p.y):mmCtx.lineTo(p.x,p.y));
                mmCtx.closePath(); mmCtx.stroke();
                mmCtx.fillStyle='#f59e0b';
                mmCtx.fillRect(mmCircuit[0].x-5,mmCircuit[0].y-1,10,2);
                const idx=(cir.progress*mmCircuit.length)|0;
                const cp=mmCircuit[Math.min(idx,mmCircuit.length-1)];
                mmCtx.shadowColor='#ef4444'; mmCtx.shadowBlur=8;
                mmCtx.fillStyle='#ef4444';
                mmCtx.beginPath(); mmCtx.arc(cp.x,cp.y,4,0,Math.PI*2); mmCtx.fill();
                mmCtx.shadowBlur=0;
            }

            // Mapa de recorrido (trail) — coordenadas mundo 3D reales
            if (trailVisible) {
                // Registrar posición real del auto cada ~0.5m
                const lastPt = trailPts[trailPts.length-1];
                const ddx = lastPt ? cir.px-lastPt[0] : 999, ddz = lastPt ? cir.pz-lastPt[1] : 999;
                if (ddx*ddx+ddz*ddz > 0.25) trailPts.push([cir.px, cir.pz]);
                if (trailPts.length > 4000) trailPts.shift();

                trailCtx.clearRect(0,0,MM_W,MM_H);
                trailCtx.fillStyle='rgba(0,0,0,0.70)';
                trailCtx.roundRect(0,0,MM_W,MM_H,8); trailCtx.fill();

                // Circuito de fondo en coords mundo (muy tenue)
                if (worldCircuit && wToT) {
                    trailCtx.strokeStyle='#374151'; trailCtx.lineWidth=2.5;
                    trailCtx.lineCap='round'; trailCtx.lineJoin='round';
                    trailCtx.beginPath();
                    worldCircuit.forEach(([wx,wz],i)=>{ const p=wToT(wx,wz); i===0?trailCtx.moveTo(p.x,p.y):trailCtx.lineTo(p.x,p.y); });
                    trailCtx.closePath(); trailCtx.stroke();
                }

                // Línea del recorrido real
                if (wToT && trailPts.length > 1) {
                    trailCtx.strokeStyle='#06b6d4'; trailCtx.lineWidth=1.5;
                    trailCtx.lineCap='round'; trailCtx.lineJoin='round';
                    trailCtx.beginPath();
                    trailPts.forEach(([wx,wz],i)=>{ const p=wToT(wx,wz); i===0?trailCtx.moveTo(p.x,p.y):trailCtx.lineTo(p.x,p.y); });
                    trailCtx.stroke();
                }

                // Punto del auto
                const tc = wToT ? wToT(cir.px, cir.pz) : {x:MM_W/2,y:MM_H/2};
                trailCtx.shadowColor='#ef4444'; trailCtx.shadowBlur=8;
                trailCtx.fillStyle='#ef4444';
                trailCtx.beginPath(); trailCtx.arc(tc.x,tc.y,4,0,Math.PI*2); trailCtx.fill();
                trailCtx.shadowBlur=0;

                if (cir.camAereaActiva && cir.camAerea && wToT) {
                    const zona = cir.camAerea.zonaVisible;
                    const c = wToT(zona.x, zona.z);
                    const r = zona.radio * _ts.scl;
                    trailCtx.strokeStyle='rgba(255,255,255,0.6)'; trailCtx.lineWidth=1.5;
                    trailCtx.setLineDash([3,2]);
                    trailCtx.beginPath(); trailCtx.rect(c.x-r, c.y-r, r*2, r*2); trailCtx.stroke();
                    trailCtx.setLineDash([]);
                }

                // Etiqueta RUTA
                trailCtx.fillStyle='rgba(255,255,255,0.5)';
                trailCtx.font='7px monospace';
                trailCtx.fillText('RUTA',3,8);
            }

            requestAnimationFrame(_dbgLoop);
        };
        requestAnimationFrame(_dbgLoop);
    }

    #limpiarCircuito3D() {
        if (!this.#cir3d) return;
        if (this.#cir3dVisibilityHandler) {
            document.removeEventListener('visibilitychange', this.#cir3dVisibilityHandler);
            this.#cir3dVisibilityHandler = null;
        }
        this.#cir3d.detener(); this.#cir3d=null;
        if (this.#cir3dKeyDown) window.removeEventListener('keydown',this.#cir3dKeyDown);
        if (this.#cir3dKeyUp)   window.removeEventListener('keyup',  this.#cir3dKeyUp);
        this.#cir3dKeyDown=null; this.#cir3dKeyUp=null;
        for (const {el,onStart,onEnd} of this.#cir3dTouchHandlers) {
            el.removeEventListener('touchstart',onStart);
            el.removeEventListener('touchend',onEnd);
        }
        this.#cir3dTouchHandlers=[];
        if (this.#cir3dCanvasTouchStart) {
            const _c = document.getElementById('canvas-cir3d');
            _c.removeEventListener('touchstart', this.#cir3dCanvasTouchStart);
            _c.removeEventListener('touchmove',  this.#cir3dCanvasTouchMove);
            this.#cir3dCanvasTouchStart = null;
            this.#cir3dCanvasTouchMove  = null;
        }
        OrientacionManager.saltarCheck=false;
        // Restaurar pointer-events de los mapas para que TestDrive3D pueda usarlos
        const _mmC = document.getElementById('minimap-td3d');
        const _trC = document.getElementById('trail-map');
        if (_mmC) { _mmC.style.pointerEvents='none'; _mmC.style.cursor=''; }
        if (_trC) { _trC.style.pointerEvents='none'; _trC.style.cursor=''; }
        document.getElementById('canvas-cir3d').style.display='none';
        document.getElementById('canvas-carro-3d').style.display='';
        document.getElementById('titulo-cir3d').style.display='none';
        document.getElementById('ctrl-accel').style.display='none';
        document.getElementById('btn-exit-cir3d').style.display='none';
        document.getElementById('btn-cam-aerea').style.display='none';
        document.getElementById('btn-toggle-datos').style.display='none';
        document.getElementById('btn-toggle-mapas').style.display='none';
        document.getElementById('debug-td3d').style.display='none';
        document.getElementById('debug-path').style.display='none';
        document.getElementById('minimap-td3d').style.display='none';
        document.getElementById('trail-map').style.display='none';
        document.getElementById('btn-toggle-minimap').style.display='none';
        document.getElementById('btn-toggle-trail').style.display='none';
        document.getElementById('ctrl-cam-height').style.display='none';
    }

    // ── Mapa de pista ────────────────────────────────────────────
    #dibujarMapaPista(tipoPista) {
        const canvas = document.getElementById('canvas-mapa-pista');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const pista = window.PISTAS?.[tipoPista];
        if (!pista) {
            ctx.fillStyle = '#1e1e40';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#4a4a70';
            ctx.font = '13px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PRÓXIMAMENTE', W / 2, H / 2);
            return;
        }

        // Generar puntos desde los tramos (ahora suman ~2π → circuito cerrado)
        const puntos = [];
        let x = 0, y = 0, angle = -Math.PI / 2;
        for (let i = 0; i < pista.totalSegs; i++) {
            const tramo = pista.tramos.find(([d, h]) => i >= d && i < h);
            angle += (tramo ? tramo[2] : 0) * 0.045;
            x -= Math.cos(angle) * 1.5;
            y += Math.sin(angle) * 1.5;
            puntos.push([x, y]);
        }
        const xs = puntos.map(p => p[0]), ys = puntos.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = 28;
        const scl = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
        const ox = (W - (maxX - minX) * scl) / 2 - minX * scl;
        const oy = (H - (maxY - minY) * scl) / 2 - minY * scl;
        const sx = px => px * scl + ox;
        const sy = py => py * scl + oy;

        // Trazo suave por midpoints (cierra sin puntas incluso con gap mínimo)
        const traceSuave = () => {
            const n = puntos.length;
            const last = puntos[n - 1], first = puntos[0];
            ctx.moveTo((sx(last[0]) + sx(first[0])) / 2, (sy(last[1]) + sy(first[1])) / 2);
            for (let i = 0; i < n; i++) {
                const [px0, py0] = puntos[i];
                const [px1, py1] = puntos[(i + 1) % n];
                ctx.quadraticCurveTo(sx(px0), sy(py0), (sx(px0) + sx(px1)) / 2, (sy(py0) + sy(py1)) / 2);
            }
            ctx.closePath();
        };

        // Sombra del trazado
        ctx.strokeStyle = 'rgba(124,58,237,0.15)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        traceSuave();
        ctx.stroke();

        // Trazado principal
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4;
        ctx.beginPath();
        traceSuave();
        ctx.stroke();

        // Línea de salida/meta
        const [fx, fy] = puntos[0];
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx(fx), sy(fy), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('S/F', sx(fx) + 8, sy(fy));
    }
}

// ================================================================
// ARRANCAR
// ================================================================
new App();
