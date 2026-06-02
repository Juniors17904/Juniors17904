'use strict';

// ================================================================
// MODEL — Segmento: unidad básica de la pista pseudo-3D
// ================================================================

class Segmento {
    constructor(index, curva, nivel) {
        this.index     = index;
        this.curva     = curva;
        this.nivel     = nivel;
        this.obstaculos = [];
    }
}

window.Segmento = Segmento;
