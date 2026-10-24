'use strict';

// ================================================================
// MODEL — DetectorSuperficie: qué superficie hay a una distancia lateral
// del centro de la pista (PRD 008, D5). El ancho del asfalto y del piano
// lo lee de MedidasEscena (PRD 009, D5). No toca Ruta.
// ================================================================
class DetectorSuperficie {
    #medidas = new window.MedidasEscena();
    #asfalto = new window.SuperficieAsfalto();
    #piano   = new window.SuperficiePiano();
    #pasto   = new window.SuperficiePasto();

    superficieEn(lateral) {
        const d = Math.abs(Number(lateral) || 0);
        if (d <= this.#medidas.medioAnchoAsfalto) return this.#asfalto;
        if (d <= this.#medidas.limitePiano)       return this.#piano;
        return this.#pasto;
    }
}

window.DetectorSuperficie = DetectorSuperficie;
