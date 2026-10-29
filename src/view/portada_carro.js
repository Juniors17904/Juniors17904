'use strict';

// ================================================================
// VIEW — PortadaCarro: el carro grande de Inicio (PRD 026, D3). Dibuja
// de lado el carro elegido con el color elegido, con los mismos perfiles
// del garaje (PerfilCarro), ajustado al ancho del canvas.
// ================================================================
class PortadaCarro {
    static #ANCHO_PERFIL = 110;   // lo que ocupa un perfil de lado, con aire
    static #ALTO_PERFIL  = 48;

    #canvas   = null;
    #catalogo = null;

    constructor(canvas, catalogo) {
        this.#canvas   = canvas;
        this.#catalogo = catalogo;
    }

    dibujar(tipo, color) {
        const canvas = this.#canvas;
        if (!canvas) return;
        const escalaPantalla = window.devicePixelRatio || 1;
        const ancho = canvas.clientWidth || 300, alto = canvas.clientHeight || 120;
        canvas.width  = Math.round(ancho * escalaPantalla);
        canvas.height = Math.round(alto * escalaPantalla);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(escalaPantalla, 0, 0, escalaPantalla, 0, 0);
        ctx.clearRect(0, 0, ancho, alto);
        const escala = Math.min(ancho / PortadaCarro.#ANCHO_PERFIL, alto / PortadaCarro.#ALTO_PERFIL);
        const piso = alto * 0.86;
        // Sombra en el piso
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.ellipse(ancho / 2, piso + 2, 48 * escala, 4 * escala, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.translate(ancho / 2, piso - 6 * escala);
        ctx.scale(escala, escala);
        (this.#catalogo.obtener(tipo) ?? this.#catalogo.obtener('deportivo'))?.dibujar(ctx, color);
        ctx.restore();
    }
}

window.PortadaCarro = PortadaCarro;
