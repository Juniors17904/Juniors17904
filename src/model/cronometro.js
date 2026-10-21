'use strict';

// ================================================================
// MODEL — Cronometro: tiempo total y por vuelta de la carrera
// Reloj inyectable (por defecto performance.now) para poder probarlo.
// Sin Three.js ni DOM.
// ================================================================

try {

class Cronometro {
    #reloj;
    #acumuladoMs        = 0;     // tiempo corrido en tramos ya cerrados
    #inicioTramoMs      = null;  // marca del reloj del tramo en curso (null = parado)
    #totalUltimaVueltaMs = 0;    // tiempoTotalMs en el último marcarVuelta()
    #tiemposVuelta      = [];

    constructor(reloj = () => performance.now()) {
        this.#reloj = reloj;
    }

    // ── Getters ─────────────────────────────────────────────────

    get tiempoTotalMs() {
        if (this.#inicioTramoMs === null) return this.#acumuladoMs;
        return this.#acumuladoMs + Math.max(0, this.#reloj() - this.#inicioTramoMs);
    }

    get tiempoVueltaActualMs() {
        return Math.max(0, this.tiempoTotalMs - this.#totalUltimaVueltaMs);
    }

    get tiemposVuelta() {
        return Object.freeze(this.#tiemposVuelta.slice());
    }

    get mejorVueltaMs() {
        if (this.#tiemposVuelta.length === 0) return null;
        return Math.min(...this.#tiemposVuelta);
    }

    // ── Control ─────────────────────────────────────────────────
    iniciar() {
        this.reiniciar();
        this.#inicioTramoMs = this.#reloj();
    }

    pausar() {
        if (this.#inicioTramoMs === null) return;
        this.#acumuladoMs   = this.tiempoTotalMs;
        this.#inicioTramoMs = null;
    }

    reanudar() {
        if (this.#inicioTramoMs !== null) return;
        this.#inicioTramoMs = this.#reloj();
    }

    marcarVuelta() {
        const total = this.tiempoTotalMs;
        this.#tiemposVuelta.push(total - this.#totalUltimaVueltaMs);
        this.#totalUltimaVueltaMs = total;
    }

    detener() {
        this.pausar();
    }

    reiniciar() {
        this.#acumuladoMs         = 0;
        this.#inicioTramoMs       = null;
        this.#totalUltimaVueltaMs = 0;
        this.#tiemposVuelta       = [];
    }

    // ── Formato m:ss.cc (centésimas truncadas) ──────────────────
    formatear(ms) {
        const valor = Number.isFinite(ms) && ms > 0 ? ms : 0;
        const s    = Math.floor(valor / 1000);
        const m    = Math.floor(s / 60);
        const seg  = s % 60;
        const cent = Math.floor(valor / 10) % 100;
        return `${m}:${String(seg).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
    }
}

window.Cronometro = Cronometro;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[cronometro.js] ' + e.message);
    console.error('[cronometro.js]', e);
}
