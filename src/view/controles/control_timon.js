'use strict';
try {

// ================================================================
// CLASS: ControlTimon — timón táctil para el circuito
//        Extiende ControlEntrada: activar(circuito) monta todo,
//        destruir() desmonta y limpia.
// ================================================================
class ControlTimon extends ControlEntrada {
    #canvasId;
    #modelo;

    #canvas = null;
    #ctx    = null;
    #cir    = null;
    #raf    = 0;

    // Estado del giro
    #steerInput      = 0;
    #angle           = 0;
    #targetAngle     = 0;
    #touchId         = null;
    #startX          = 0;
    #startWheelAngle = 0;
    #maxAngle        = Math.PI / 3;
    #sensitivity     = 80;
    #mouseDown       = false;

    // Handlers guardados para poder removerlos
    #accelKeyDown    = null;
    #accelKeyUp      = null;
    #aceleradorHandlers = [];

    constructor(canvasId = 'canvas-timon', modelo = 0) {
        super();
        this.#canvasId = canvasId;
        this.#modelo   = modelo;
    }

    mostrarOverlay() {
        document.getElementById('ctrl-timon').style.display   = 'flex';
        document.getElementById('ctrl-botones').style.display = 'none';
        document.getElementById('ctrl-accel').style.display   = 'none';
    }

    ocultarOverlay() {
        document.getElementById('ctrl-timon').style.display = 'none';
    }

    activar(circuito) {
        this.#cir    = circuito;
        this.#canvas = document.getElementById(this.#canvasId);
        this.#ctx    = this.#canvas.getContext('2d');

        this.#setupCanvas();
        this.#wireAcelerador(circuito);
        this.#loop();
    }

    destruir() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;

        if (this.#accelKeyDown) window.removeEventListener('keydown', this.#accelKeyDown);
        if (this.#accelKeyUp)   window.removeEventListener('keyup',   this.#accelKeyUp);
        this.#accelKeyDown = null;
        this.#accelKeyUp   = null;

        for (const { el, onStart, onEnd, onCancel } of this.#aceleradorHandlers) {
            el.removeEventListener('touchstart',  onStart);
            el.removeEventListener('touchend',    onEnd);
            el.removeEventListener('touchcancel', onCancel);
            el.removeEventListener('mousedown',   onStart);
            el.removeEventListener('mouseup',     onEnd);
        }
        this.#aceleradorHandlers = [];

        this.ocultarOverlay();
        if (this.#cir) { this.#cir.accelInput = 0; this.#cir.steerInput = 0; }
        this.#cir    = null;
        this.#canvas = null;
        this.#ctx    = null;
    }

    // ── Configurar canvas del timón ──────────────────────────────
    #setupCanvas() {
        const c = this.#canvas;
        c.addEventListener('touchstart',  e => { e.preventDefault(); this.#onTouchStart(e); }, { passive: false });
        c.addEventListener('touchmove',   e => { e.preventDefault(); this.#onTouchMove(e);  }, { passive: false });
        c.addEventListener('touchend',    () => this.#reset());
        c.addEventListener('touchcancel', () => this.#reset());
        c.addEventListener('mousedown',   e => {
            this.#mouseDown      = true;
            this.#startX         = e.clientX;
            this.#startWheelAngle = this.#angle;
        });
        window.addEventListener('mousemove', e => { if (this.#mouseDown) this.#applyX(e.clientX); });
        window.addEventListener('mouseup',   () => this.#reset());
    }

    // ── Botones acelerar / freno + teclado para accel ────────────
    #wireAcelerador(cir) {
        const addBtn = (id, valStart, valEnd) => {
            const el = document.getElementById(id);
            if (!el) return;
            const onStart  = () => { cir.accelInput = valStart; };
            const onEnd    = () => { cir.accelInput = valEnd; };
            const onCancel = () => { cir.accelInput = valEnd; };
            el.addEventListener('touchstart',  onStart, { passive: true });
            el.addEventListener('touchend',    onEnd);
            el.addEventListener('touchcancel', onCancel);
            el.addEventListener('mousedown',   onStart);
            el.addEventListener('mouseup',     onEnd);
            this.#aceleradorHandlers.push({ el, onStart, onEnd, onCancel });
        };
        addBtn('btn-acelerar',  1, 0);
        addBtn('btn-freno',    -1, 0);

        // Teclado para aceleración y panning de cámara aérea
        this.#accelKeyDown = e => {
            if (cir.camAereaActiva && cir.camAerea) {
                if (e.key === 'ArrowLeft'  || e.key === 'a') cir.camAerea.moveX = -1;
                if (e.key === 'ArrowRight' || e.key === 'd') cir.camAerea.moveX =  1;
                if (e.key === 'ArrowUp'    || e.key === 'w') cir.camAerea.moveZ = -1;
                if (e.key === 'ArrowDown'  || e.key === 's') cir.camAerea.moveZ =  1;
            } else {
                if (e.key === 'ArrowUp'   || e.key === 'w') cir.accelInput =  1;
                if (e.key === 'ArrowDown' || e.key === 's') cir.accelInput = -1;
            }
        };
        this.#accelKeyUp = e => {
            if (cir.camAereaActiva && cir.camAerea) {
                if (e.key === 'ArrowLeft'  || e.key === 'a' ||
                    e.key === 'ArrowRight' || e.key === 'd') cir.camAerea.moveX = 0;
                if (e.key === 'ArrowUp'    || e.key === 'w' ||
                    e.key === 'ArrowDown'  || e.key === 's') cir.camAerea.moveZ = 0;
            } else {
                if (e.key === 'ArrowUp'   || e.key === 'w' ||
                    e.key === 'ArrowDown' || e.key === 's') cir.accelInput = 0;
            }
        };
        window.addEventListener('keydown', this.#accelKeyDown);
        window.addEventListener('keyup',   this.#accelKeyUp);
    }

    // ── Lógica interna del timón ─────────────────────────────────
    #applyX(x) {
        const dx     = x - this.#startX;
        const target = this.#startWheelAngle + (dx / this.#sensitivity) * this.#maxAngle;
        this.#targetAngle = Math.max(-this.#maxAngle, Math.min(this.#maxAngle, target));
        this.#steerInput  = this.#targetAngle / this.#maxAngle;
    }

    #reset() {
        this.#touchId     = null;
        this.#mouseDown   = false;
        this.#targetAngle = 0;
        this.#steerInput  = 0;
    }

    #onTouchStart(e) {
        if (this.#touchId !== null) return;
        const t = e.changedTouches[0];
        this.#touchId         = t.identifier;
        this.#startX          = t.clientX;
        this.#startWheelAngle = this.#angle;
    }

    #onTouchMove(e) {
        if (this.#touchId === null) return;
        const t = Array.from(e.changedTouches).find(tt => tt.identifier === this.#touchId);
        if (t) this.#applyX(t.clientX);
    }

    #loop() {
        this.#raf = requestAnimationFrame(() => this.#loop());
        this.#angle += (this.#targetAngle - this.#angle) * 0.18;
        if (this.#cir) this.#cir.steerInput = this.#steerInput;
        this.#draw();
    }

    #draw() {
        if (!this.#ctx || !this.#canvas) return;
        const ctx = this.#ctx;
        const W = this.#canvas.width, H = this.#canvas.height;
        const S = Math.min(W, H);
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(this.#angle);
        window.RenderizadorTimon.dibujar(ctx, S, this.#modelo);
        ctx.restore();
    }
}

window.ControlTimon = ControlTimon;
window.TimonControl = ControlTimon; // alias de compatibilidad

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[control_timon.js] ' + e.message);
    console.error('[control_timon.js]', e);
}
