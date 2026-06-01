'use strict';
try {

// ================================================================
// VIEW — TimonControl
// Timón táctil: dibuja la rueda en un canvas y expone steerInput.
// MVC: solo lógica visual y de input — no sabe nada del juego.
// ================================================================
class TimonControl {
    #canvas;
    #ctx;
    #steerInput  = 0;
    #angle       = 0;
    #targetAngle = 0;
    #touchId     = null;
    #startAngle  = 0;
    #cx = 0; #cy = 0;
    #maxAngle    = Math.PI / 3;
    #raf         = 0;
    #mouseDown   = false;

    get steerInput() { return this.#steerInput; }
    get isActive()   { return this.#touchId !== null || this.#mouseDown; }

    constructor(canvasId) {
        this.#canvas = document.getElementById(canvasId);
        this.#ctx    = this.#canvas.getContext('2d');
        this.#setup();
        this.#loop();
    }

    destroy() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
    }

    #center() {
        const r = this.#canvas.getBoundingClientRect();
        this.#cx = r.left + r.width  / 2;
        this.#cy = r.top  + r.height / 2;
    }

    #getAngle(x, y) {
        return Math.atan2(y - this.#cy, x - this.#cx);
    }

    #applyDelta(rawAngle) {
        const delta = rawAngle - this.#startAngle;
        this.#targetAngle = Math.max(-this.#maxAngle, Math.min(this.#maxAngle, delta));
        this.#steerInput  = this.#targetAngle / this.#maxAngle;
    }

    #reset() {
        this.#touchId     = null;
        this.#mouseDown   = false;
        this.#targetAngle = 0;
        this.#steerInput  = 0;
    }

    #setup() {
        const c = this.#canvas;
        c.addEventListener('touchstart',  e => { e.preventDefault(); this.#onTouchStart(e); }, { passive: false });
        c.addEventListener('touchmove',   e => { e.preventDefault(); this.#onTouchMove(e);  }, { passive: false });
        c.addEventListener('touchend',    e => this.#reset());
        c.addEventListener('touchcancel', e => this.#reset());
        c.addEventListener('mousedown',   e => { this.#center(); this.#mouseDown = true; this.#startAngle = this.#getAngle(e.clientX, e.clientY) - this.#angle; });
        window.addEventListener('mousemove', e => { if (this.#mouseDown) this.#applyDelta(this.#getAngle(e.clientX, e.clientY)); });
        window.addEventListener('mouseup',   () => this.#reset());
    }

    #onTouchStart(e) {
        if (this.#touchId !== null) return;
        const t = e.changedTouches[0];
        this.#center();
        this.#touchId    = t.identifier;
        this.#startAngle = this.#getAngle(t.clientX, t.clientY) - this.#angle;
    }

    #onTouchMove(e) {
        if (this.#touchId === null) return;
        const t = Array.from(e.changedTouches).find(tt => tt.identifier === this.#touchId);
        if (t) this.#applyDelta(this.#getAngle(t.clientX, t.clientY));
    }

    #loop() {
        this.#raf = requestAnimationFrame(() => this.#loop());
        this.#angle += (this.#targetAngle - this.#angle) * 0.18;
        this.#draw();
    }

    #draw() {
        const ctx = this.#ctx;
        const W   = this.#canvas.width, H = this.#canvas.height;
        const R   = Math.min(W, H) * 0.42;
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(this.#angle);

        // aro
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(124,58,237,0.9)';
        ctx.lineWidth   = R * 0.13;
        ctx.stroke();

        // rayos (3)
        for (let i = 0; i < 3; i++) {
            const a = (i * 2 * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82);
            ctx.lineTo(Math.cos(a) * R * 0.20, Math.sin(a) * R * 0.20);
            ctx.strokeStyle = 'rgba(167,139,250,0.85)';
            ctx.lineWidth   = R * 0.07;
            ctx.lineCap     = 'round';
            ctx.stroke();
        }

        // centro
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(124,58,237,0.9)';
        ctx.fill();

        // punto indicador (arriba)
        ctx.beginPath();
        ctx.arc(0, -R * 0.87, R * 0.07, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.restore();
    }
}

window.TimonControl = TimonControl;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_control.js] ' + e.message);
    console.error('[timon_control.js]', e);
}
