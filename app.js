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
            ToastManager.mostrar('Pista seleccionada ✓', 'info');
            this.#mostrar('pantalla-ajustes');
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

    // ── Test Drive 3D ────────────────────────────────────────────
    #td3d = null;
    #td3dKeyDown = null;
    #td3dKeyUp = null;
    #td3dTouchHandlers = [];

    #iniciarTestDrive3D() {
        OrientacionManager.saltarCheck = true;
        this.#mostrar('pantalla-juego');

        document.getElementById('canvas-carro-3d').style.display = 'none';
        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display = 'flex';
        document.getElementById('btn-exit-td3d').style.display = 'flex';

        const canvas = document.getElementById('canvas-juego');
        const td = new window.TestDrive3D(canvas);
        this.#td3d = td;
        td.cargar(this.#estado.tipoAuto, this.#estado.color);
        td.iniciar();

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

        // Debug overlay
        document.getElementById('debug-td3d').style.display = 'block';
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
            document.getElementById('dbg-vel').textContent   = Math.abs(s).toFixed(3);
            document.getElementById('dbg-kmh').textContent   = kmh;
            document.getElementById('dbg-acel').textContent  = (a >= 0 ? '+' : '') + a.toFixed(4);
            document.getElementById('dbg-vmax').textContent  = td.maxSpeed.toFixed(3);
            document.getElementById('dbg-iacel').textContent = td.accelInput ===  1 ? '⬆ GAS'
                                                             : td.accelInput === -1 ? '⬇ REVERSA' : 'NEUTRO';
            document.getElementById('dbg-idir').textContent  = td.steerInput < -0.1 ? '◀ IZQ'
                                                             : td.steerInput >  0.1 ? 'DER ▶' : 'RECTO';
            document.getElementById('dbg-px').textContent    = td.px.toFixed(2);
            document.getElementById('dbg-pz').textContent    = td.pz.toFixed(2);
            document.getElementById('dbg-rumbo').textContent = ((td.rotY * 180 / Math.PI) % 360).toFixed(1);
            document.getElementById('dbg-fps').textContent   = _dbgFps;
            requestAnimationFrame(_dbgLoop);
        };
        requestAnimationFrame(_dbgLoop);
    }

    #limpiarTestDrive3D() {
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
        document.getElementById('canvas-carro-3d').style.display = '';
        document.getElementById('ctrl-accel').style.display = 'none';
        document.getElementById('btn-exit-td3d').style.display = 'none';
        document.getElementById('debug-td3d').style.display = 'none';
        document.getElementById('ctrl-cam-height').style.display = 'none';
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

        // Simular trayectoria con los tramos de curvas
        const puntos = [];
        let x = 0, y = 0, angle = -Math.PI / 2;
        const paso = 1.5;
        for (let i = 0; i < pista.totalSegs; i++) {
            const tramo = pista.tramos.find(([d, h]) => i >= d && i < h);
            angle += (tramo ? tramo[2] : 0) * 0.045;
            x += Math.cos(angle) * paso;
            y += Math.sin(angle) * paso;
            puntos.push([x, y]);
        }

        // Escalar para centrar en el canvas
        const xs = puntos.map(p => p[0]), ys = puntos.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = 30;
        const scl = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
        const ox = (W - (maxX - minX) * scl) / 2 - minX * scl;
        const oy = (H - (maxY - minY) * scl) / 2 - minY * scl;
        const sx = px => px * scl + ox;
        const sy = py => py * scl + oy;

        // Sombra del trazado
        ctx.strokeStyle = 'rgba(124,58,237,0.15)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        puntos.forEach(([px, py], i) => i === 0 ? ctx.moveTo(sx(px), sy(py)) : ctx.lineTo(sx(px), sy(py)));
        ctx.closePath();
        ctx.stroke();

        // Trazado principal
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4;
        ctx.beginPath();
        puntos.forEach(([px, py], i) => i === 0 ? ctx.moveTo(sx(px), sy(py)) : ctx.lineTo(sx(px), sy(py)));
        ctx.closePath();
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
