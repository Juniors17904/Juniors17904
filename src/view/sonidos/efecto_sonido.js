'use strict';

// ================================================================
// VIEW — EfectoSonido: superclase de los sonidos de la carrera (PRD 022,
// D8). Cada sonido se genera en el momento con el audio del navegador
// (AudioJuego), sin archivos. Da a las subclases un tono corto con su
// envolvente (sube rápido y se apaga) y un tono continuo que se puede
// prender, cambiar y callar. Sin audio, no hace nada.
//   - sonar(...): lo que hace sonar cada subclase.
//   - callar(): calla lo que siga sonando (también los tonos cortos ya pedidos).
// ================================================================
class EfectoSonido {
    #audio;
    #cortos = [];   // tonos cortos que pueden seguir sonando (se callan al salir)

    constructor(audio) {
        this.#audio = audio ?? null;
    }

    sonar() {}

    callar() {
        for (const osc of this.#cortos) { try { osc.stop(); } catch { /* ya terminó */ } }
        this.#cortos = [];
    }

    // Un tono corto: forma de onda, frecuencia (Hz), cuándo empieza (s desde ahora),
    // cuánto dura (s) y su volumen (0 a 1)
    _tono(tipo, frecuencia, demora, duracion, volumen) {
        const ctx = this.#audio?.contexto, salida = this.#audio?.salida;
        if (!ctx || !salida) return;
        try {
            const t0 = ctx.currentTime + demora;
            const osc = ctx.createOscillator(), env = ctx.createGain();
            osc.type = tipo;
            osc.frequency.setValueAtTime(frecuencia, t0);
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.linearRampToValueAtTime(volumen, t0 + 0.01);
            env.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
            osc.connect(env); env.connect(salida);
            osc.start(t0); osc.stop(t0 + duracion + 0.02);
            osc.onended = () => { this.#cortos = this.#cortos.filter(o => o !== osc); };
            this.#cortos.push(osc);
        } catch { /* sin audio */ }
    }

    // Un tono continuo apagado (volumen 0); devuelve [oscilador, volumen] o null
    _tonoContinuo(tipo, frecuencia) {
        const ctx = this.#audio?.contexto, salida = this.#audio?.salida;
        if (!ctx || !salida) return null;
        try {
            const osc = ctx.createOscillator(), vol = ctx.createGain();
            osc.type = tipo;
            osc.frequency.value = frecuencia;
            vol.gain.value = 0;
            osc.connect(vol); vol.connect(salida);
            osc.start();
            return [osc, vol];
        } catch { return null; }
    }

    // Lleva un valor del audio (frecuencia o volumen) hacia otro de a poco
    _llevar(parametro, valor) {
        const ctx = this.#audio?.contexto;
        if (!ctx || !parametro) return;
        try { parametro.setTargetAtTime(valor, ctx.currentTime, 0.05); } catch { parametro.value = valor; }
    }
}

window.EfectoSonido = EfectoSonido;
