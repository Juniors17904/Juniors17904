// ================================================================
// CLASE: PilotoAutomatico — maneja un carro por una Ruta para las pruebas
// de física (PRD 006 RF-06 y PRD 007 RF-06/07). Mira un punto adelante en
// la curva, gira hacia él y frena antes de las curvas cerradas. El mismo
// piloto maneja todas las físicas, así los tiempos se pueden comparar.
// ================================================================
class PilotoAutomatico {
    static #MUESTRAS = 3000;
    #muestras;
    #indice = 0;
    #longitud;

    constructor(ruta) {
        this.#muestras = ruta.muestras(PilotoAutomatico.#MUESTRAS);
        this.#longitud = ruta.longitud;
    }

    get progreso() { return this.#indice / PilotoAutomatico.#MUESTRAS; }

    // Da una vuelta y devuelve cuántos pasos de 1/60 s tardó (o null si se trabó)
    darVuelta(carro, maxPasos = 60 * 300) {
        const n = PilotoAutomatico.#MUESTRAS;
        let recorrido = 0;
        for (let paso = 1; paso <= maxPasos; paso++) {
            const antes = this.#indice;
            this.pasoAutomatico(carro);
            let delta = this.#indice - antes;
            if (delta < -n / 2) delta += n;
            if (delta > n / 2) delta -= n;
            recorrido += delta;
            if (recorrido >= n) return paso;
        }
        return null;
    }

    // Un paso de 1/60 s: decide las entradas, mueve el carro y lo ubica en la ruta
    pasoAutomatico(carro, alPaso = null) {
        const px = carro.px, pz = carro.pz;
        this.#conducir(carro);
        carro.actualizar(1000 / 60);
        alPaso?.(carro, px, pz);
        this.#ubicar(carro);
    }

    // Vuelve a ubicarse en la ruta tras mover el carro a mano
    reubicar(carro) { this.#ubicar(carro); }

    #ubicar(carro) {
        const n = PilotoAutomatico.#MUESTRAS;
        let mejor = this.#indice, mejorD = Infinity;
        for (let d = -40; d <= 120; d++) {
            const i = ((this.#indice + d) % n + n) % n;
            const m = this.#muestras[i];
            const dist = (m.x - carro.px) ** 2 + (m.z - carro.pz) ** 2;
            if (dist < mejorD) { mejorD = dist; mejor = i; }
        }
        this.#indice = mejor;
    }

    #conducir(carro) {
        const n = PilotoAutomatico.#MUESTRAS;
        const porMuestra = this.#longitud / n;
        const adelante   = Math.round(6 / porMuestra);
        const objetivo   = this.#muestras[(this.#indice + adelante) % n];
        const rumbo      = Math.atan2(objetivo.x - carro.px, objetivo.z - carro.pz);
        let error = rumbo - carro.rotY;
        error = Math.atan2(Math.sin(error), Math.cos(error));
        carro.entradaDireccion = Math.max(-1, Math.min(1, -error * 4));

        // Curva que viene: cuánto gira la pista en los próximos 40 m
        const lejos = this.#muestras[(this.#indice + Math.round(40 / porMuestra)) % n];
        const aqui  = this.#muestras[this.#indice];
        let giro = lejos.angle - aqui.angle;
        giro = Math.abs(Math.atan2(Math.sin(giro), Math.cos(giro)));
        const limite = giro > 0.6 ? 0.40 : giro > 0.3 ? 0.55 : 10;
        if (carro.velocidad > limite + 0.04) carro.entradaAcel = -1;
        else if (carro.velocidad > limite)   carro.entradaAcel = 0;
        else                                 carro.entradaAcel = 1;
    }
}

module.exports = { PilotoAutomatico };
