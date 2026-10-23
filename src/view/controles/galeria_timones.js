'use strict';

// ================================================================
// CLASE: GaleriaTimones — dibuja la vista previa de cada modelo de
// timón en las tarjetas de #pantalla-timon-diseno (con
// RenderizadorTimon) y marca la tarjeta del modelo elegido.
// ================================================================
class GaleriaTimones {
    dibujar(modeloElegido) {
        document.querySelectorAll('#pantalla-timon-diseno .timon-card').forEach((card, i) => {
            const canvas = card.querySelector('.timon-preview');
            const ctx    = canvas.getContext('2d');
            const S      = Math.min(canvas.width, canvas.height);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            window.RenderizadorTimon.dibujar(ctx, S, i);
            ctx.restore();
            card.classList.toggle('sel', i === modeloElegido);
        });
    }
}
