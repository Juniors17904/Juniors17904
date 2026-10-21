'use strict';

// ================================================================
// CONTROLLER — Modo: superclase de una forma de jugar (PRD 002 D8)
// Cada modo conoce su nombre, los ids de sus botones de entrada y los
// ids de sus pantallas. Los ids del DOM son referencias de vista.
// El modo NO decide su estado: eso lo hace ModosDisponibles.
// ================================================================

try {

class Modo {
    static #SUFIJO_PROXIMAMENTE = ' · Próximamente';

    #nombre;
    #idsBotones;
    #idsPantallas;

    constructor(nombre, idsBotones, idsPantallas) {
        this.#nombre       = nombre;
        this.#idsBotones   = Object.freeze([...idsBotones]);
        this.#idsPantallas = Object.freeze([...idsPantallas]);
    }

    // ── Getters ─────────────────────────────────────────────────

    get nombre()       { return this.#nombre; }
    get idsBotones()   { return this.#idsBotones; }
    get idsPantallas() { return this.#idsPantallas; }

    // ── Pertenencia ─────────────────────────────────────────────

    tienePantalla(idPantalla) {
        return this.#idsPantallas.includes(idPantalla);
    }

    // ── Aplicar a la página ─────────────────────────────────────

    // Oculto: el botón no se ve ni se puede tocar
    ocultarBotones(documento) {
        for (const boton of this.#botones(documento)) {
            boton.hidden        = true;
            boton.disabled      = true;
            boton.style.display = 'none';
        }
    }

    // Próximamente: el botón se ve, desactivado y con el texto "Próximamente"
    marcarProximamente(documento) {
        for (const boton of this.#botones(documento)) {
            if (!('proximamente' in boton.dataset)) {
                boton.textContent = this.#textoBase(boton.textContent) + Modo.#SUFIJO_PROXIMAMENTE;
                boton.dataset.proximamente = 'si';
            }
            boton.disabled = true;
            boton.setAttribute('aria-disabled', 'true');
            boton.classList.add('modo-proximamente');
            boton.style.opacity = '0.55';
            boton.style.cursor  = 'not-allowed';
        }
    }

    #botones(documento) {
        return this.#idsBotones
            .map(id => documento.getElementById(id))
            .filter(boton => boton);
    }

    // Quita la flecha final ("Únete →") antes de añadir el sufijo
    #textoBase(texto) {
        return String(texto ?? '').replace(/[\s→›]+$/u, '').trim() || this.#nombre;
    }
}

window.Modo = Modo;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo.js] ' + e.message);
    console.error('[modo.js]', e);
}
