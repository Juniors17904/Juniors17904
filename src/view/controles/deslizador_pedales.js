'use strict';

// ================================================================
// VIEW — DeslizadorPedales: deslizar el dedo entre ACEL y FRENO cambia de
// pedal sin levantarlo, como en un carro de verdad (PRD 024, D2). Solo en
// Jugar Solo: se pregunta al empezar cada toque (enJugarSolo).
//   - Los movimientos del dedo llegan siempre al botón donde empezó; se mira
//     sobre qué pedal está con su caja sin achicar (la del momento del toque,
//     porque apretado lo achica un poco). En el hueco entre pedales o fuera
//     de ellos se queda el pedal que estaba.
//   - El pedal bajo el dedo se ve apretado y vibra al cambiar (PRD 016, D6);
//     al soltar, los dos se ven sueltos. Soltar lo resuelve ControlTimon.
// destruir() deja de escuchar.
// ================================================================
class DeslizadorPedales {
    static #VIBRACION_MS = 12;

    #acel; #freno; #destino; #enJugarSolo;
    #dedo   = null;    // identificador del dedo que empezó en un pedal
    #pedal  = null;    // botón bajo el dedo
    #cajas  = null;    // [cajaAcel, cajaFreno] sin achicar
    #escuchas = [];

    constructor(acel, freno, destino, enJugarSolo) {
        this.#acel = acel; this.#freno = freno; this.#destino = destino;
        this.#enJugarSolo = typeof enJugarSolo === 'function' ? enJugarSolo : () => false;
        if (!acel || !freno) return;
        for (const boton of [acel, freno]) {
            this.#escuchar(boton, 'touchstart', e => this.#empezar(e, boton));
            this.#escuchar(boton, 'touchmove', e => this.#mover(e));
            this.#escuchar(boton, 'touchend', e => this.#terminar(e));
            this.#escuchar(boton, 'touchcancel', e => this.#terminar(e));
        }
    }

    destruir() {
        for (const [el, tipo, fn] of this.#escuchas) el.removeEventListener(tipo, fn);
        this.#escuchas = [];
        if (this.#dedo !== null) for (const b of [this.#acel, this.#freno]) b.classList.remove('apretado');
        this.#dedo = null;
    }

    #escuchar(el, tipo, fn) {
        el.addEventListener(tipo, fn, { passive: true });
        this.#escuchas.push([el, tipo, fn]);
    }

    #empezar(e, boton) {
        if (this.#dedo !== null || !this.#enJugarSolo()) return;
        const t = e.changedTouches?.[0];
        if (!t) return;
        this.#dedo  = t.identifier;
        this.#pedal = boton;
        this.#cajas = [this.#acel, this.#freno].map(b => this.#cajaSinAchicar(b));
    }

    #mover(e) {
        if (this.#dedo === null) return;
        const t = Array.from(e.changedTouches ?? []).find(x => x.identifier === this.#dedo);
        if (!t) return;
        const [cajaAcel, cajaFreno] = this.#cajas;
        const nuevo = this.#dentro(cajaAcel, t) ? this.#acel : this.#dentro(cajaFreno, t) ? this.#freno : this.#pedal;
        if (nuevo === this.#pedal) return;
        this.#pedal = nuevo;
        this.#destino.entradaAcel = nuevo === this.#acel ? 1 : -1;
        this.#acel.classList.toggle('apretado', nuevo === this.#acel);
        this.#freno.classList.toggle('apretado', nuevo === this.#freno);
        try { navigator.vibrate?.(DeslizadorPedales.#VIBRACION_MS); } catch { /* sin vibración */ }
    }

    #terminar(e) {
        if (this.#dedo === null || !Array.from(e.changedTouches ?? []).some(t => t.identifier === this.#dedo)) return;
        this.#dedo = null;
        this.#acel.classList.remove('apretado');
        this.#freno.classList.remove('apretado');
    }

    // La caja del botón sin el achique de "apretado" (offset en la página)
    #cajaSinAchicar(boton) {
        const b = boton.getBoundingClientRect(), ancho = boton.offsetWidth || b.width, alto = boton.offsetHeight || b.height;
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        return [cx - ancho / 2, cy - alto / 2, cx + ancho / 2, cy + alto / 2];
    }

    #dentro([x0, y0, x1, y1], t) {
        return t.clientX >= x0 && t.clientX <= x1 && t.clientY >= y0 && t.clientY <= y1;
    }
}

window.DeslizadorPedales = DeslizadorPedales;
