'use strict';

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
            GestorAlertas.mostrar('Tu dispositivo no soporta giroscopio', 'warn');
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
                .catch(e => GestorAlertas.mostrar('Giroscopio: ' + e.message, 'error'));
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

window.Controles = Controles;
