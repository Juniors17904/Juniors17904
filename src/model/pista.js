'use strict';

// MODEL — Pista pseudo-3D: segmentos, colisiones, límites
// Depende de model.js (CFG, NIVELES, PISTAS) y segmento.js cargados antes.

try {
const CFG     = window.CFG;
const NIVELES = window.NIVELES;
const PISTAS  = window.PISTAS;

class Pista {
    #segmentos = [];
    #totalSegs;
    #nivelFijo = null;

    constructor(tipoPista) {
        this.config    = PISTAS[tipoPista] || null;
        this.tipoPista = tipoPista;
        this.#totalSegs = this.config ? this.config.totalSegs : CFG.TOTAL_SEGS;
        this.#nivelFijo = this.config ? this.config.nivelFijo : null;
        this.#generarPista();
    }

    #generarPista() {
        const N = this.#totalSegs;
        const p = this.config;
        for (let i = 0; i < N; i++) {
            let nivelActual, curva;
            if (p) {
                nivelActual = p.nivelFijo;
                const tramo = p.tramos.find(([d, h]) => i >= d && i < h);
                curva = tramo ? tramo[2] : 0;
            } else {
                nivelActual = NIVELES.reduce((prev, nv) =>
                    (i * CFG.SEG_LARGO < nv.desde) ? prev : nv, NIVELES[0]);
                const bloque = Math.floor(i / 40);
                curva = bloque % 3 === 1 ? 0.8 : bloque % 3 === 2 ? -0.6 : 0;
            }
            this.#segmentos.push(new Segmento(i, curva, nivelActual));
        }
    }

    get totalSegs() { return this.#totalSegs; }

    obtenerSeg(pos) {
        const idx = Math.floor(pos / CFG.SEG_LARGO) % this.#totalSegs;
        return this.#segmentos[idx < 0 ? idx + this.#totalSegs : idx];
    }

    nivelParaPos(pos) {
        if (this.#nivelFijo) return this.#nivelFijo;
        const dist = pos * CFG.SEG_LARGO;
        return NIVELES.reduce((prev, nv) => (dist >= nv.desde ? nv : prev), NIVELES[0]);
    }

    detectarColision(posicion, camX) {
        for (let i = 0; i < 8; i++) {
            const seg = this.obtenerSeg(posicion + i * CFG.SEG_LARGO * 0.3);
            for (const ob of seg.obstaculos) {
                const obX = ob.carril * 0.33;
                if (Math.abs(camX - obX) < 0.18) {
                    const hit = ob.tipo;
                    if (hit !== 'turbo') seg.obstaculos = seg.obstaculos.filter(o => o !== ob);
                    return hit;
                }
            }
        }
        return null;
    }

    fueraDePista(camX) { return Math.abs(camX) > 0.55; }
}

window.Pista = Pista;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pista.js] ' + e.message);
    console.error('[pista.js]', e);
}
