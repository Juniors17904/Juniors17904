'use strict';

// ================================================================
// VIEW — AudioJuego: el audio del navegador para toda la partida (PRD 022,
// D6 y D7). Crea el contexto de sonido con el primer toque del jugador
// (despertar), tiene un volumen general moderado y el silencio (🔇): con
// el sonido apagado el volumen general queda en cero y no suena nada.
// Si el navegador no tiene sonido, todo sigue funcionando sin él (RF-11).
// ================================================================
class AudioJuego {
    static #VOLUMEN = 0.3;

    #preferencia;
    #contexto = null;
    #salida   = null;   // volumen general: todo sonido pasa por aquí

    constructor(preferencia = null) {
        this.#preferencia = preferencia ?? new window.PreferenciaSonido();
    }

    get prendido() { return this.#preferencia.prendido; }
    set prendido(valor) {
        this.#preferencia.prendido = valor;
        this.#aplicarVolumen();
    }

    // Contexto listo para usar, o null si todavía no hay o no se puede
    get contexto() { return this.#contexto?.state === 'closed' ? null : this.#contexto; }
    get salida()   { return this.contexto ? this.#salida : null; }

    // Con un toque del jugador: crea o reanuda el audio
    despertar() {
        try {
            if (!this.#contexto) {
                const Clase = window.AudioContext ?? window.webkitAudioContext;
                if (typeof Clase !== 'function') return;
                this.#contexto = new Clase();
                this.#salida = this.#contexto.createGain();
                this.#salida.connect(this.#contexto.destination);
                this.#aplicarVolumen();
            }
            this.#contexto.resume?.();
        } catch { this.#contexto = null; this.#salida = null; }
    }

    // Pausa todo el audio (página oculta) y lo retoma
    suspender() { try { this.#contexto?.suspend?.(); } catch { /* sin audio */ } }
    reanudar()  { try { this.#contexto?.resume?.(); } catch { /* sin audio */ } }

    #aplicarVolumen() {
        if (!this.#salida) return;
        try { this.#salida.gain.value = this.prendido ? AudioJuego.#VOLUMEN : 0; } catch { /* sin audio */ }
    }
}

window.AudioJuego = AudioJuego;
