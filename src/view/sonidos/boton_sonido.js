'use strict';

// ================================================================
// VIEW — BotonSonido: los botones 🔊/🔇 de "Preparar carrera" y de la
// carrera (PRD 022, D5). Todos muestran el mismo estado: al tocar uno se
// prende o apaga el sonido (AudioJuego lo recuerda) y se actualizan todos.
// ================================================================
class BotonSonido {
    #botones;
    #audio;

    constructor(botones, audio) {
        this.#botones = [...(botones ?? [])].filter(Boolean);
        this.#audio   = audio;
        for (const boton of this.#botones) {
            boton.addEventListener('click', e => {
                e.stopPropagation();
                this.#audio.prendido = !this.#audio.prendido;
                if (this.#audio.prendido) this.#audio.despertar();
                this.#mostrar();
            });
        }
        this.#mostrar();
    }

    #mostrar() {
        const prendido = this.#audio.prendido;
        for (const boton of this.#botones) {
            boton.textContent = prendido ? '🔊' : '🔇';
            boton.setAttribute('aria-label', prendido ? 'Apagar el sonido' : 'Prender el sonido');
            boton.classList.toggle('apagado', !prendido);
        }
    }
}

window.BotonSonido = BotonSonido;
