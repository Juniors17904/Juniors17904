'use strict';

// ================================================================
// CLASE: MinimapaTestDriveRecto — minimapa (#minimap-td3d) del Test
// Drive 3D simple: la recta y el carro según cuánto avanzó.
// ================================================================
class MinimapaTestDriveRecto extends MapaConduccion {
    static #LARGO_RECTA = 950;

    constructor() {
        super('minimap-td3d');
    }

    dibujarContenido(mmCtx, td) {
        const MM_W = this.ancho, MM_H = this.alto, MM_PAD = this.margen, MM_CX = MM_W / 2;
        mmCtx.strokeStyle = '#6b7280'; mmCtx.lineWidth = 3; mmCtx.lineCap = 'round';
        mmCtx.beginPath(); mmCtx.moveTo(MM_CX, MM_PAD); mmCtx.lineTo(MM_CX, MM_H - MM_PAD); mmCtx.stroke();
        const mmPy = MM_H - MM_PAD - (td.pz / MinimapaTestDriveRecto.#LARGO_RECTA) * (MM_H - MM_PAD * 2);
        this.dibujarCarro(mmCtx, MM_CX, mmPy);
    }
}
