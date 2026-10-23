'use strict';

// ================================================================
// CLASE: GaleriaVelocimetros — dibuja la vista previa y el nombre de
// cada modelo de velocímetro en las tarjetas .velocimetro-card (con
// RenderizadorVelocimetro) y marca la tarjeta del modelo elegido.
// ================================================================
class GaleriaVelocimetros {
    dibujar(modeloElegido) {
        document.querySelectorAll('.velocimetro-card').forEach((card, i) => {
            const canvas = card.querySelector('.velocimetro-preview');
            const ctx    = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2, cy = canvas.height / 2, r = canvas.width * 0.38;
            window.RenderizadorVelocimetro.dibujar(ctx, cx, cy, r, 0.62, i);
            card.querySelector('.velocimetro-nombre').textContent = window.RenderizadorVelocimetro.nombre(i);
            card.classList.toggle('sel', i === modeloElegido);
        });
    }
}
