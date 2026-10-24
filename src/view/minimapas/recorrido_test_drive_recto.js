'use strict';

// ================================================================
// CLASE: RecorridoTestDriveRecto — mapa del recorrido (#trail-map) del
// Test Drive 3D simple: el camino que hizo el carro sobre la recta.
// ================================================================
class RecorridoTestDriveRecto extends MapaConduccion {
    static #LARGO_RECTA  = 950;

    #historial = new HistorialRecorrido(0.04, 3000);
    #medioAncho = new window.MedidasEscena().limiteSuave;   // hasta donde llega el carro (PRD 009)

    constructor() {
        super('trail-map');
    }

    dibujarContenido(trailCtx, td) {
        this.#historial.registrar(td.px, td.pz);
        const trailPts = this.#historial.puntos;
        if (trailPts.length > 1) {
            trailCtx.strokeStyle = '#06b6d4'; trailCtx.lineWidth = 1.5; trailCtx.lineCap = 'round'; trailCtx.lineJoin = 'round';
            trailCtx.beginPath();
            trailPts.forEach((p, i) => {
                const tx = this.#aMapaX(p.x), ty = this.#aMapaY(p.z);
                i === 0 ? trailCtx.moveTo(tx, ty) : trailCtx.lineTo(tx, ty);
            });
            trailCtx.stroke();
        }
        this.dibujarCarro(trailCtx, this.#aMapaX(td.px), this.#aMapaY(td.pz));
        this.dibujarEtiquetaRuta(trailCtx);
    }

    // Mundo 3D → píxeles del recorrido
    #aMapaX(wx) {
        return this.ancho / 2 + (-wx / this.#medioAncho) * (this.ancho * 0.15);
    }

    #aMapaY(wz) {
        return this.alto - this.margen - (wz / RecorridoTestDriveRecto.#LARGO_RECTA) * (this.alto - this.margen * 2);
    }
}
