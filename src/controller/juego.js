'use strict';

// Model
const CFG      = window.CFG;
const NIVELES  = window.NIVELES;
const PISTAS   = window.PISTAS;
const Carro2D  = window.Carro2D;
const Pista    = window.Pista;
// View
const RenderizadorPista = window.RenderizadorPista || window.RenderPista;
const RenderizadorAuto  = window.RenderizadorAuto  || window.RenderAuto;

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

    constructor(color, tipoControl, tipoAuto = 'deportivo', tipoPista = null, velocimetroModelo = 0) {
        this.#canvas = document.getElementById('canvas-juego');
        this.#ctx    = this.#canvas.getContext('2d');

        this.#pista       = new Pista(tipoPista);
        this.#renderPista = new RenderizadorPista(this.#pista);

        const pistaCfg    = PISTAS[tipoPista];
        this.#distMeta    = pistaCfg ? pistaCfg.distMeta : CFG.DIST_META;
        this.#esTestDrive = pistaCfg?.esTestDrive ?? false;

        this.#carro     = new Carro2D(color, this.#distMeta);
        this.#hud       = new PantallaJuego();
        this.#hud.setCircuito(pistaCfg);
        this.#hud.setVelocimetroModelo(velocimetroModelo);
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
        if (this.#esTestDrive) c.entradaAcel = this.#controles.leerAcel();

        const fuera = this.#pista.fueraDePista(c.camX / (CFG.GIRO_MAX * 4));
        c.update(dt, fuera);

        const hit = this.#pista.detectarColision(c.posicion, c.camX / (CFG.GIRO_MAX * 3));
        if (hit === 'carro' || hit === 'bache') {
            c.velocidad = Math.max(0, c.velocidad - 0.03);
        } else if (hit === 'turbo') {
            c.activarTurbo();
            if (c.turbosLeft < c.turboMaximo) c.turbosLeft = Math.min(c.turboMaximo, c.turbosLeft + 1);
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
        RenderizadorAuto.dibujar(ctx, W, H, c);
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
