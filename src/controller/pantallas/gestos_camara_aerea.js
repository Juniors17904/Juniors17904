'use strict';

// ================================================================
// CLASE: GestosCamaraAerea — con la cámara aérea del circuito 3D
// activa, un dedo mueve la vista y dos dedos cambian la altura
// (pellizco) sobre el canvas del circuito.
// ================================================================
class GestosCamaraAerea {
    #lienzo      = null;
    #toqueInicio = null;
    #toqueMover  = null;

    constructor(lienzo) {
        this.#lienzo = lienzo;
    }

    conectar(cir) {
        this.desconectar();
        let prevX = 0, prevY = 0;
        let pinchDist = 0, pinchH = 0, wasPinching = false;
        const getDist = t => {
            const dx = t[0].clientX - t[1].clientX;
            const dy = t[0].clientY - t[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };
        this.#toqueInicio = e => {
            if (!cir.camAereaActiva) return;
            if (e.touches.length === 2) {
                pinchDist = getDist(e.touches);
                pinchH    = cir.camAerea.h;
            } else {
                prevX = e.touches[0].clientX;
                prevY = e.touches[0].clientY;
            }
        };
        this.#toqueMover = e => {
            if (!cir.camAereaActiva || !cir.camAerea) return;
            e.preventDefault();
            if (e.touches.length === 2) {
                wasPinching = true;
                cir.camAerea.h = pinchH * (pinchDist / getDist(e.touches));
            } else if (e.touches.length === 1) {
                const t = e.touches[0];
                if (wasPinching) {
                    wasPinching = false;
                    prevX = t.clientX; prevY = t.clientY;
                } else {
                    const scale = cir.camAerea.h / 300;
                    cir.camAerea.pan((prevX - t.clientX) * scale, (prevY - t.clientY) * scale);
                    prevX = t.clientX; prevY = t.clientY;
                }
            }
        };
        this.#lienzo.addEventListener('touchstart', this.#toqueInicio, {passive: true});
        this.#lienzo.addEventListener('touchmove',  this.#toqueMover,  {passive: false});
    }

    desconectar() {
        if (!this.#toqueInicio) return;
        this.#lienzo.removeEventListener('touchstart', this.#toqueInicio);
        this.#lienzo.removeEventListener('touchmove',  this.#toqueMover);
        this.#toqueInicio = null;
        this.#toqueMover  = null;
    }
}
