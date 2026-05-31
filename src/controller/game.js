'use strict';

// Datos del modelo — definidos en model.js, cargado antes que este archivo
const CFG    = window.CFG;
const NIVELES = window.NIVELES;
const PISTAS  = window.PISTAS;
// View — definidas en view_pista2d.js, cargado antes que este archivo
const Carretera = window.Carretera;
const HUD       = window.HUD;

// ================================================================
// CLASE: Carro del jugador (dibujado desde atrás)
// ================================================================
class Carro {
    #tilt = 0; // inclinación visual al girar

    constructor(color, distMeta = CFG.DIST_META) {
        this.color = color;
        this.distMeta = distMeta;
        this.velocidad = 0;
        this.posicion = 0;
        this.camX = 0;
        this.giro = 0;
        this.accelInput = 1;  // 1=adelante, 0=neutro, -1=reversa
        this.turbosLeft = CFG.TURBO_MAX;
        this.turboActivo = false;
        this.turboTimer = 0;
        this.velMax = 0;
        this.tiempoFin = null;
    }

    activarTurbo() {
        if (this.turbosLeft <= 0) return;
        this.turbosLeft--;
        this.turboActivo = true;
        this.turboTimer = CFG.TURBO_DUR;
    }

    update(dt, fuera) {
        // Turbo timer
        if (this.turboActivo) {
            this.turboTimer -= dt;
            if (this.turboTimer <= 0) {
                this.turboActivo = false;
                this.turboTimer = 0;
            }
        }

        const velLimite = this.turboActivo ? CFG.VEL_MAX * CFG.TURBO_MULT : CFG.VEL_MAX;
        const freno = fuera ? CFG.VEL_FRENO * 3 : CFG.VEL_FRENO;

        if (this.accelInput > 0) {
            if (this.velocidad < velLimite)
                this.velocidad = Math.min(velLimite, this.velocidad + CFG.VEL_ACC * dt * 0.06);
            else
                this.velocidad += (velLimite - this.velocidad) * 0.05;
            if (fuera) this.velocidad = Math.max(0, this.velocidad - freno * dt * 0.06);
        } else if (this.accelInput < 0) {
            const velRev = CFG.VEL_MAX * 0.45;
            this.velocidad = Math.max(-velRev, this.velocidad - CFG.VEL_ACC * dt * 0.05);
        } else {
            this.velocidad *= Math.pow(0.97, dt * 0.06 * 10);
            if (Math.abs(this.velocidad) < 0.001) this.velocidad = 0;
        }

        // Giro de cámara
        this.camX += this.giro * CFG.GIRO_VEL * Math.abs(this.velocidad) * 8;
        if (this.giro === 0) {
            this.camX *= (1 - CFG.GIRO_RETURN);
        }
        this.camX = Math.max(-CFG.GIRO_MAX * 4, Math.min(CFG.GIRO_MAX * 4, this.camX));

        // Tilt visual
        this.#tilt += (this.giro * 0.3 - this.#tilt) * 0.12;

        // Avanzar
        this.posicion += this.velocidad * dt * 0.06;
        if (this.velocidad > this.velMax) this.velMax = this.velocidad;
    }

    get progreso() {
        return Math.min(1, this.posicion / this.distMeta);
    }

    get tilt() { return this.#tilt; }

    dibujar(ctx, W, H) {
        const cx  = W / 2;
        const by  = H * 0.93;
        const carW = W * 0.12;
        const carH = carW * 1.7;

        ctx.save();
        ctx.translate(cx, by - carH / 2);
        ctx.rotate(this.#tilt * 0.15);

        // Sombra (siempre visible debajo del carro 3D)
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.beginPath();
        ctx.ellipse(0, carH * 0.52, carW * 0.7, carH * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Turbo glow
        if (this.turboActivo) {
            ctx.fillStyle = `rgba(251,191,36,${0.5 + Math.sin(Date.now() * 0.015) * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(0, carH * 0.52, carW * 0.4, carH * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    #colorMasBrillante(hex, amount) {
        const isRgb = hex.startsWith('rgb');
        if (isRgb) return hex;
        const num = parseInt(hex.replace('#',''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);
        return `rgb(${r},${g},${b})`;
    }
}

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
        this.modo = modo;
        this.carro = carro;

        if (modo === 'botones') this.#initBotones();
        if (modo === 'timon') this.#initTimon();
        if (modo === 'giro') this.#initGiroscopio();
        this.#initTeclado();
    }

    #initTeclado() {
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft')  this.#izq = true;
            if (e.key === 'ArrowRight') this.#der = true;
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
        const izqEl = document.getElementById('btn-izq');
        const derEl = document.getElementById('btn-der');
        const ctrlEl = document.getElementById('ctrl-botones');
        ctrlEl.style.display = 'flex';

        ['touchstart','mousedown'].forEach(ev => {
            izqEl.addEventListener(ev, e => { e.preventDefault(); this.#izq = true; });
            derEl.addEventListener(ev, e => { e.preventDefault(); this.#der = true; });
        });
        ['touchend','mouseup','touchcancel'].forEach(ev => {
            izqEl.addEventListener(ev, e => { e.preventDefault(); this.#izq = false; });
            derEl.addEventListener(ev, e => { e.preventDefault(); this.#der = false; });
        });

        // Doble tap = turbo
        izqEl.addEventListener('dblclick', () => this.carro.activarTurbo());
        derEl.addEventListener('dblclick', () => this.carro.activarTurbo());

        const gasEl = document.getElementById('btn-gas');
        const revEl = document.getElementById('btn-rev');
        if (gasEl && revEl) {
            ['touchstart','mousedown'].forEach(ev => {
                gasEl.addEventListener(ev, e => { e.preventDefault(); this.#gas = true; });
                revEl.addEventListener(ev, e => { e.preventDefault(); this.#rev = true; });
            });
            ['touchend','mouseup','touchcancel'].forEach(ev => {
                gasEl.addEventListener(ev, e => { e.preventDefault(); this.#gas = false; });
                revEl.addEventListener(ev, e => { e.preventDefault(); this.#rev = false; });
            });
        }
    }

    #initTimon() {
        const wrap = document.getElementById('ctrl-timon');
        wrap.style.display = 'block';
        const canvas = document.getElementById('canvas-timon');
        const ctx = canvas.getContext('2d');
        let startX = null, curX = null;

        const dibujarTimon = (angle = 0) => {
            const cx = 80, cy = 80, r = 68;
            ctx.clearRect(0, 0, 160, 160);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 10;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            // radios
            for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 3) {
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                ctx.stroke();
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
        // Tap centro = turbo
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

            // En landscape los ejes rotan con el celular
            let valor;
            if (angle === 90)                  valor = -beta / 30;  // landscape derecha
            else if (angle === 270 || angle === -90) valor =  beta / 30;  // landscape izquierda
            else                               valor =  gamma / 30; // portrait

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
    #carretera;
    #carro;
    #hud;
    #controles;
    #canvas;
    #ctx;
    #ultimoTiempo = 0;
    #animFrame = null;
    #esTestDrive = false;
    #syncTimer = 0;
    #oponenteProgreso = null;
    #oponenteNombre = '';
    #nivel = NIVELES[0];
    #enCurso = false;
    #tiempoInicio = 0;
    #visor3d = null;
    #distMeta = CFG.DIST_META;

    constructor(color, tipoControl, tipoAuto = 'deportivo', tipoPista = null) {
        this.#canvas = document.getElementById('canvas-juego');
        this.#ctx = this.#canvas.getContext('2d');
        this.#carretera = new Carretera(tipoPista);
        const pistaCfg = PISTAS[tipoPista];
        this.#distMeta = pistaCfg ? pistaCfg.distMeta : CFG.DIST_META;
        this.#esTestDrive = pistaCfg?.esTestDrive ?? false;
        this.#carro = new Carro(color, this.#distMeta);
        this.#hud = new HUD();
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
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }

    iniciar(oponenteNombre) {
        this.#oponenteNombre = oponenteNombre;
        this.#enCurso = true;
        this.#tiempoInicio = Date.now();
        this.#ultimoTiempo = performance.now();
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

        const fuera = this.#carretera.fueraDePista(c.camX / (CFG.GIRO_MAX * 4));
        c.update(dt, fuera);

        // Colisiones
        const hit = this.#carretera.detectarColision(c.posicion, c.camX / (CFG.GIRO_MAX * 3));
        if (hit === 'carro' || hit === 'bache') {
            c.velocidad = Math.max(0, c.velocidad - 0.03);
        } else if (hit === 'turbo') {
            c.activarTurbo();
            if (c.turbosLeft < CFG.TURBO_MAX) c.turbosLeft = Math.min(CFG.TURBO_MAX, c.turbosLeft + 1);
        }

        // Cambio de nivel
        const dist = c.posicion * CFG.SEG_LARGO;
        this.#nivel = NIVELES.reduce((prev, nv) => (dist >= nv.desde ? nv : prev), NIVELES[0]);

        // Sync multiplayer
        this.#syncTimer += dt;
        if (this.#syncTimer >= CFG.SYNC_MS) {
            this.#syncTimer = 0;
            if (window.multiJugador) {
                window.multiJugador.publicarProgreso(c.progreso);
            }
        }

        // Fin de carrera
        if (!this.#esTestDrive && c.progreso >= 1 && !c.tiempoFin) {
            c.tiempoFin = Date.now();
            this.#enCurso = false;
            cancelAnimationFrame(this.#animFrame);
            if (window.onCarreraTerminada) {
                window.onCarreraTerminada(c.tiempoFin - this.#tiempoInicio, c.velMax);
            }
        }
    }

    #dibujar() {
        const ctx = this.#ctx;
        const W = this.#canvas.width;
        const H = this.#canvas.height;
        const c = this.#carro;

        ctx.clearRect(0, 0, W, H);
        this.#carretera.dibujar(ctx, W, H, c.posicion, c.camX / (CFG.GIRO_MAX * 4.5));
        c.dibujar(ctx, W, H);
        if (this.#visor3d) {
            this.#visor3d.setTilt(c.tilt);
            this.#visor3d.render();
        }
        this.#hud.dibujar(ctx, W, H, c, this.#oponenteProgreso, this.#oponenteNombre, this.#nivel.nombre);
    }

    actualizarOponente(progreso) {
        this.#oponenteProgreso = progreso;
    }

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
