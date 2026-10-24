'use strict';

// ================================================================
// MODEL — CarreraVueltas: progreso, superficie, puntos de control y vueltas
// Recibe las muestras de la ruta (instancias de MuestraRuta por longitud de arco)
// y cada frame la posición del carro. Sin Three.js ni DOM.
// La superficie bajo el carro la decide DetectorSuperficie (PRD 008).
// ================================================================

try {

class CarreraVueltas {
    // ── Constantes internas (reglas de negocio) ─────────────────
    static #PC1             = 0.33;
    static #PC2             = 0.66;
    static #FRACCION_VENTANA = 0.1;

    static #EVENTO_NADA          = 'nada';
    static #EVENTO_PUNTO_CONTROL = 'puntoControl';
    static #EVENTO_VUELTA        = 'vuelta';
    static #EVENTO_META          = 'meta';

    // ── Estado ──────────────────────────────────────────────────
    #muestras           = [];
    #totalMuestras      = 0;
    #ventana            = 1;
    #totalVueltas       = 3;

    #indice             = 0;
    #lateral            = 0;
    #detector           = new window.DetectorSuperficie();
    #superficie         = null;

    #vueltaActual       = 1;
    #vueltasCompletadas = 0;
    #pc1Marcado         = false;
    #pc2Marcado         = false;
    #terminada          = false;

    constructor(muestras, totalVueltas = 3) {
        if (!Array.isArray(muestras) || muestras.length < 2) {
            throw new Error('CarreraVueltas: se necesitan al menos 2 muestras de la ruta');
        }
        if (!muestras.every(m => m instanceof window.MuestraRuta)) {
            throw new Error('CarreraVueltas: las muestras deben ser instancias de MuestraRuta');
        }
        this.#muestras      = muestras;
        this.#totalMuestras = muestras.length;
        this.#ventana       = Math.max(1, Math.round(CarreraVueltas.#FRACCION_VENTANA * this.#totalMuestras));
        this.#totalVueltas  = Math.max(1, Math.floor(totalVueltas) || 1);
        this.reiniciar();
    }

    // ── Getters ─────────────────────────────────────────────────
    get vueltaActual()   { return this.#vueltaActual; }
    get totalVueltas()   { return this.#totalVueltas; }
    get progreso()       { return this.#indice / this.#totalMuestras; }
    get lateral()        { return this.#lateral; }
    get superficie()     { return this.#superficie; }
    get enPasto()        { return this.#superficie.esPasto; }
    get terminada()      { return this.#terminada; }
    get puntoControlSiguiente() {
        if (!this.#pc1Marcado) return 1;
        if (!this.#pc2Marcado) return 2;
        return 3;
    }

    // ── Ciclo ───────────────────────────────────────────────────
    reiniciar() {
        this.#indice             = 0;
        this.#lateral            = 0;
        this.#superficie         = this.#detector.superficieEn(0);
        this.#vueltaActual       = 1;
        this.#vueltasCompletadas = 0;
        this.#pc1Marcado         = false;
        this.#pc2Marcado         = false;
        this.#terminada          = false;
    }

    actualizar(px, pz) {
        const indiceAnterior = this.#indice;
        this.#indice = this.#buscarIndiceCercano(px, pz, indiceAnterior);
        this.#lateral = this.#calcularLateral(px, pz, this.#indice);
        this.#superficie = this.#detector.superficieEn(this.#lateral);

        if (this.#terminada) return CarreraVueltas.#EVENTO_NADA;
        return this.#evaluarCruces(indiceAnterior, this.#indice);
    }

    // ── Proyección: ventana circular ±V alrededor del índice anterior ──
    #buscarIndiceCercano(px, pz, indiceAnterior) {
        const n = this.#totalMuestras;
        let mejorIndice = indiceAnterior;
        let mejorDist   = Infinity;
        // Recorre del centro hacia afuera para que, en empate, gane el más cercano al anterior
        for (let k = 0; k <= this.#ventana; k++) {
            const candidatos = k === 0 ? [0] : [k, -k];
            for (const desplazamiento of candidatos) {
                const j  = ((indiceAnterior + desplazamiento) % n + n) % n;
                const m  = this.#muestras[j];
                const dx = px - m.x;
                const dz = pz - m.z;
                const d  = dx * dx + dz * dz;
                if (d < mejorDist) { mejorDist = d; mejorIndice = j; }
            }
        }
        return mejorIndice;
    }

    // ── Lateral con signo al segmento (muestra elegida + vecina más cercana) ──
    #calcularLateral(px, pz, indice) {
        const n        = this.#totalMuestras;
        const actual   = this.#muestras[indice];
        const anterior = this.#muestras[(indice - 1 + n) % n];
        const siguiente = this.#muestras[(indice + 1) % n];

        const dAnt = (px - anterior.x) ** 2 + (pz - anterior.z) ** 2;
        const dSig = (px - siguiente.x) ** 2 + (pz - siguiente.z) ** 2;
        const inicio = dSig <= dAnt ? actual : anterior;
        const fin    = dSig <= dAnt ? siguiente : actual;

        let ux = fin.x - inicio.x;
        let uz = fin.z - inicio.z;
        const largo = Math.hypot(ux, uz);
        if (largo > 1e-9) {
            ux /= largo;
            uz /= largo;
        } else {
            ux = Math.sin(actual.angulo);
            uz = Math.cos(actual.angulo);
        }
        const dx = px - inicio.x;
        const dz = pz - inicio.z;
        return dx * uz + dz * (-ux);
    }

    // ── Puntos de control y meta ────────────────────────────────
    #evaluarCruces(indiceAnterior, indiceActual) {
        const n = this.#totalMuestras;
        // Δ envuelto en índices, rango (−n/2, n/2]
        let deltaIndices = ((indiceActual - indiceAnterior) % n + n) % n;
        if (deltaIndices > n / 2) deltaIndices -= n;
        const delta = deltaIndices / n;

        if (delta === 0 || Math.abs(delta) >= 0.5) return CarreraVueltas.#EVENTO_NADA;

        const anterior = indiceAnterior / n;
        const actual   = indiceActual / n;

        if (delta < 0) {
            // Cruce de meta hacia atrás (~0 → ~1): reinicia los PC de la vuelta en curso
            if (anterior < actual) {
                this.#pc1Marcado = false;
                this.#pc2Marcado = false;
            }
            return CarreraVueltas.#EVENTO_NADA;
        }

        // Avance: si envuelve, primero el tramo anterior..1, luego la meta, luego 0..actual
        const envuelve = anterior > actual;
        let evento = CarreraVueltas.#EVENTO_NADA;

        if (envuelve) {
            evento = this.#mayorEvento(evento, this.#marcarPuntosControl(anterior, 1));
            const eventoMeta = this.#cruzarMeta();
            evento = this.#mayorEvento(evento, eventoMeta);
            if (this.#terminada) return evento;
            evento = this.#mayorEvento(evento, this.#marcarPuntosControl(0, actual));
        } else {
            evento = this.#mayorEvento(evento, this.#marcarPuntosControl(anterior, actual));
        }
        return evento;
    }

    // Marca los PC cruzados hacia adelante en el tramo (desde, hasta]
    #marcarPuntosControl(desde, hasta) {
        let evento = CarreraVueltas.#EVENTO_NADA;

        if (!this.#pc1Marcado && this.#cruzaUmbral(CarreraVueltas.#PC1, desde, hasta)) {
            this.#pc1Marcado = true;
            evento = CarreraVueltas.#EVENTO_PUNTO_CONTROL;
        }
        if (this.#pc1Marcado && !this.#pc2Marcado && this.#cruzaUmbral(CarreraVueltas.#PC2, desde, hasta)) {
            this.#pc2Marcado = true;
            evento = CarreraVueltas.#EVENTO_PUNTO_CONTROL;
        }
        return evento;
    }

    #cruzaUmbral(umbral, desde, hasta) {
        return desde < umbral && umbral <= hasta;
    }

    #cruzarMeta() {
        if (!this.#pc1Marcado || !this.#pc2Marcado) return CarreraVueltas.#EVENTO_NADA;

        this.#pc1Marcado = false;
        this.#pc2Marcado = false;
        this.#vueltasCompletadas++;

        if (this.#vueltasCompletadas >= this.#totalVueltas) {
            this.#terminada    = true;
            this.#vueltaActual = this.#totalVueltas;
            return CarreraVueltas.#EVENTO_META;
        }
        this.#vueltaActual = this.#vueltasCompletadas + 1;
        return CarreraVueltas.#EVENTO_VUELTA;
    }

    // Prioridad de eventos: meta > vuelta > puntoControl > nada
    #mayorEvento(a, b) {
        const orden = [
            CarreraVueltas.#EVENTO_NADA,
            CarreraVueltas.#EVENTO_PUNTO_CONTROL,
            CarreraVueltas.#EVENTO_VUELTA,
            CarreraVueltas.#EVENTO_META,
        ];
        return orden.indexOf(b) > orden.indexOf(a) ? b : a;
    }
}

window.CarreraVueltas = CarreraVueltas;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[carrera_vueltas.js] ' + e.message);
    console.error('[carrera_vueltas.js]', e);
}
