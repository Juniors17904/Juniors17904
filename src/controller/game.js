'use strict';

// Model
const CFG      = window.CFG;
const NIVELES  = window.NIVELES;
const PISTAS   = window.PISTAS;
const crearCarro = window.crearCarro;
const Pista    = window.Pista;
// View
const RenderPista = window.RenderPista;
const RenderAuto  = window.RenderAuto;
const HUD         = window.HUD;

// ================================================================
// CLASE: Controles (teclado, botones, timón, giroscopio)
// ================================================================
class Controles {
    #izq = false;
    #der = false;
    #gas = false;
    #rev = false;
    #giroRaw = 0;

    constructor(modo, carro) {
        this.modo  = modo;
        this.carro = carro;

        if (modo === 'botones') this.#initBotones();
        if (modo === 'timon')   this.#initTimon();
        if (modo === 'giro')    this.#initGiroscopio();
        this.#initTeclado();
    }

    #initTeclado() {
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft')              this.#izq = true;
            if (e.key === 'ArrowRight')             this.#der = true;
            if (e.key === 'ArrowUp'   || e.key === 'w') this.#gas = true;
            if (e.key === 'ArrowDown' || e.key === 's') this.#rev = true;
            if (e.key === ' ') this.carro.activarTurbo();
        });
        document.addEventListener('keyup', e => {
            if (e.key === 'ArrowUp'   || e.key === 'w') this.#gas = false;
            if (e.key === 'ArrowDown' || e.key === 's') this.#rev = false;
            if (e.key === 'ArrowLeft')  this.#izq = false;
            if (e.key === 'ArrowRight') this.#der = false;
        });
    }

    #initBotones() {
        const izqEl  = document.getElementById('btn-izq');
        const derEl  = document.getElementById('btn-der');
        const ctrlEl = document.getElementById('ctrl-botones');
        ctrlEl.style.display = 'flex';

        ['touchstart', 'mousedown'].forEach(ev => {
            izqEl.addEventListener(ev, e => { e.preventDefault(); this.#izq = true; });
            derEl.addEventListener(ev, e => { e.preventDefault(); this.#der = true; });
        });
        ['touchend', 'mouseup', 'touchcancel'].forEach(ev => {
            izqEl.addEventListener(ev, e => { e.preventDefault(); this.#izq = false; });
            derEl.addEventListener(ev, e => { e.preventDefault(); this.#der = false; });
        });

        izqEl.addEventListener('dblclick', () => this.carro.activarTurbo());
        derEl.addEventListener('dblclick', () => this.carro.activarTurbo());

        const gasEl = document.getElementById('btn-gas');
        const revEl = document.getElementById('btn-rev');
        if (gasEl && revEl) {
            ['touchstart', 'mousedown'].forEach(ev => {
                gasEl.addEventListener(ev, e => { e.preventDefault(); this.#gas = true; });
                revEl.addEventListener(ev, e => { e.preventDefault(); this.#rev = true; });
            });
            ['touchend', 'mouseup', 'touchcancel'].forEach(ev => {
                gasEl.addEventListener(ev, e => { e.preventDefault(); this.#gas = false; });
                revEl.addEventListener(ev, e => { e.preventDefault(); this.#rev = false; });
            });
        }
    }

    #initTimon() {
        const wrap   = document.getElementById('ctrl-timon');
        wrap.style.display = 'block';
        const canvas = document.getElementById('canvas-timon');
        const ctx    = canvas.getContext('2d');
        let startX   = null;

        const dibujarTimon = (angle = 0) => {
            const cx = 80, cy = 80, r = 68;
            ctx.clearRect(0, 0, 160, 160);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 10;
            ctx.globalAlpha = 0.9;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 3) {
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
            }
            ctx.restore();
        };
        dibujarTimon();

        canvas.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (startX === null) return;
            const diff = e.touches[0].clientX - startX;
            this.#giroRaw = Math.max(-1, Math.min(1, diff / 50));
            dibujarTimon(this.#giroRaw * 0.5);
        }, { passive: false });
        canvas.addEventListener('touchend', () => {
            this.#giroRaw *= 0.5;
            startX = null;
            dibujarTimon(0);
        });
        canvas.addEventListener('dblclick', () => this.carro.activarTurbo());
    }

    #initGiroscopio() {
        if (!window.DeviceOrientationEvent) {
            ToastManager.mostrar('Tu dispositivo no soporta giroscopio', 'warn');
            return;
        }
        const h = e => {
            const angle = screen.orientation?.angle ?? 0;
            const gamma = e.gamma ?? 0;
            const beta  = e.beta  ?? 0;
            let valor;
            if (angle === 90)                       valor = -beta / 30;
            else if (angle === 270 || angle === -90) valor =  beta / 30;
            else                                     valor =  gamma / 30;
            this.#giroRaw = Math.max(-1, Math.min(1, valor));
        };
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(p => { if (p === 'granted') window.addEventListener('deviceorientation', h); })
                .catch(e => ToastManager.mostrar('Giroscopio: ' + e.message, 'error'));
        } else {
            window.addEventListener('deviceorientation', h);
        }
    }

    leerGiro() {
        if (this.#izq) return -1;
        if (this.#der) return  1;
        return this.#giroRaw;
    }

    leerAcel() {
        if (this.#gas) return  1;
        if (this.#rev) return -1;
        return 0;
    }
}

// ================================================================
// CLASE: Juego principal
// ================================================================
class Juego {
    #pista;
    #renderPista;
    #carro;
    #hud;
    #controles;
    #canvas;
    #ctx;
    #ultimoTiempo = 0;
    #animFrame    = null;
    #esTestDrive  = false;
    #syncTimer    = 0;
    #oponenteProgreso = null;
    #oponenteNombre   = '';
    #nivel        = NIVELES[0];
    #enCurso      = false;
    #tiempoInicio = 0;
    #visor3d      = null;
    #distMeta     = CFG.DIST_META;

    constructor(color, tipoControl, tipoAuto = 'deportivo', tipoPista = null) {
        this.#canvas = document.getElementById('canvas-juego');
        this.#ctx    = this.#canvas.getContext('2d');

        this.#pista       = new Pista(tipoPista);
        this.#renderPista = new RenderPista(this.#pista);

        const pistaCfg    = PISTAS[tipoPista];
        this.#distMeta    = pistaCfg ? pistaCfg.distMeta : CFG.DIST_META;
        this.#esTestDrive = pistaCfg?.esTestDrive ?? false;

        this.#carro     = crearCarro(tipoAuto, color, this.#distMeta);
        this.#hud       = new HUD();
        this.#controles = new Controles(tipoControl, this.#carro);

        const c3d = document.getElementById('canvas-carro-3d');
        if (c3d && window.VisorJuego3D) {
            this.#visor3d = new window.VisorJuego3D(c3d);
            this.#visor3d.cargar(tipoAuto, color);
            c3d.style.display = 'block';
        }

        window.addEventListener('resize', () => this.#ajustarCanvas());
        this.#ajustarCanvas();
    }

    #ajustarCanvas() {
        this.#canvas.width  = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }

    iniciar(oponenteNombre) {
        this.#oponenteNombre = oponenteNombre;
        this.#enCurso        = true;
        this.#tiempoInicio   = Date.now();
        this.#ultimoTiempo   = performance.now();
        this.#loop(performance.now());
    }

    #loop(now) {
        if (!this.#enCurso) return;
        const dt = Math.min(now - this.#ultimoTiempo, 50);
        this.#ultimoTiempo = now;
        this.#actualizar(dt);
        this.#dibujar();
        this.#animFrame = requestAnimationFrame(t => this.#loop(t));
    }

    #actualizar(dt) {
        const c = this.#carro;
        c.giro = this.#controles.leerGiro();
        if (this.#esTestDrive) c.accelInput = this.#controles.leerAcel();

        const fuera = this.#pista.fueraDePista(c.camX / (CFG.GIRO_MAX * 4));
        c.update(dt, fuera);

        const hit = this.#pista.detectarColision(c.posicion, c.camX / (CFG.GIRO_MAX * 3));
        if (hit === 'carro' || hit === 'bache') {
            c.velocidad = Math.max(0, c.velocidad - 0.03);
        } else if (hit === 'turbo') {
            c.activarTurbo();
            if (c.turbosLeft < c.turboMax) c.turbosLeft = Math.min(c.turboMax, c.turbosLeft + 1);
        }

        const dist = c.posicion * CFG.SEG_LARGO;
        this.#nivel = NIVELES.reduce((prev, nv) => (dist >= nv.desde ? nv : prev), NIVELES[0]);

        this.#syncTimer += dt;
        if (this.#syncTimer >= CFG.SYNC_MS) {
            this.#syncTimer = 0;
            if (window.multiJugador) window.multiJugador.publicarProgreso(c.progreso);
        }

        if (!this.#esTestDrive && c.progreso >= 1 && !c.tiempoFin) {
            c.tiempoFin  = Date.now();
            this.#enCurso = false;
            cancelAnimationFrame(this.#animFrame);
            if (window.onCarreraTerminada) {
                window.onCarreraTerminada(c.tiempoFin - this.#tiempoInicio, c.velMax);
            }
        }
    }

    #dibujar() {
        const ctx = this.#ctx;
        const W   = this.#canvas.width;
        const H   = this.#canvas.height;
        const c   = this.#carro;

        ctx.clearRect(0, 0, W, H);
        this.#renderPista.dibujar(ctx, W, H, c.posicion, c.camX / (CFG.GIRO_MAX * 4.5));
        RenderAuto.dibujar(ctx, W, H, c);
        if (this.#visor3d) {
            this.#visor3d.setTilt(c.tilt);
            this.#visor3d.render();
        }
        this.#hud.dibujar(ctx, W, H, c, this.#oponenteProgreso, this.#oponenteNombre, this.#nivel.nombre);
    }

    actualizarOponente(progreso) { this.#oponenteProgreso = progreso; }

    detener() {
        this.#enCurso = false;
        if (this.#animFrame) cancelAnimationFrame(this.#animFrame);
        if (this.#visor3d) {
            this.#visor3d.detener();
            this.#visor3d = null;
            const c3d = document.getElementById('canvas-carro-3d');
            if (c3d) c3d.style.display = 'none';
        }
    }

    get carro() { return this.#carro; }
}

window.Juego = Juego;
