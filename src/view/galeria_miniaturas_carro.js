'use strict';

// ================================================================
// CLASE: GaleriaMiniaturasCarro — dibuja las miniaturas laterales
// de las tarjetas del garaje (.carro-mini-canvas) con un color.
// Cada canvas dice su tipo en data-tipo; el perfil sale del catálogo.
// ================================================================
class GaleriaMiniaturasCarro {
    #catalogo = null;

    constructor(catalogo) {
        this.#catalogo = catalogo;
    }

    // Vuelve a dibujar todas las miniaturas con el color dado
    dibujar(color) {
        document.querySelectorAll('.carro-mini-canvas').forEach(c =>
            this.#dibujarMiniatura(c, c.dataset.tipo, color)
        );
    }

    #dibujarMiniatura(canvas, tipo, color) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 8); ctx.fill();
        ctx.save();
        ctx.translate(W / 2, H * 0.78);
        this.#catalogo.obtener(tipo)?.dibujar(ctx, color);
        ctx.restore();
    }
}

window.GaleriaMiniaturasCarro = GaleriaMiniaturasCarro;
