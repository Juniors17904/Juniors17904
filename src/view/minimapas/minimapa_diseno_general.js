'use strict';

// ================================================================
// CLASS: MinimapaDisenoGeneral — minimapa de la pantalla Diseño General
//        Capas activables: pasto → vía → auto
// ================================================================
class MinimapaDisenoGeneral extends MinimapBase {
    #mostrarGuia  = false;
    #mostrarAuto  = false;
    #colorAuto    = '#ef4444';
    #progresoAuto = 0;
    #ultimaAncho  = 0;
    #ultimoAlto   = 0;

    set mostrarGuia(v) { this.#mostrarGuia = !!v; this.#ultimaAncho = 0; }
    get mostrarGuia()  { return this.#mostrarGuia; }

    set mostrarAuto(v) { this.#mostrarAuto = !!v; }
    get mostrarAuto()  { return this.#mostrarAuto; }

    set colorAuto(v)   { this.#colorAuto = v || '#ef4444'; }

    setCircuito(pistaCfg) {
        super.setCircuito(pistaCfg);
        this.#ultimaAncho = 0;
        this.#progresoAuto = 0;
    }

    // Avanza el auto una fracción (llamado desde el loop de animación)
    avanzarAuto(delta = 0.0005) {
        this.#progresoAuto = (this.#progresoAuto + delta) % 1;
    }

    dibujar(ctx, ancho, alto) {
        ctx.save();

        // Capa 1: pasto
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(0, 0, ancho, alto);

        // Construir puntos si es necesario (guía o auto activos)
        if (this.#mostrarGuia || this.#mostrarAuto) {
            if (!this._tienePuntos || ancho !== this.#ultimaAncho || alto !== this.#ultimoAlto) {
                this.#ultimaAncho = ancho;
                this.#ultimoAlto  = alto;
                this._construirPuntos(ancho, alto, 20);
            }
        }

        // Capa 2: vía
        if (this.#mostrarGuia && this._tienePuntos) {
            ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 6;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            this._dibujarTrazado(ctx);
            ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3;
            this._dibujarTrazado(ctx);

            const sf = this._primerPunto;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(sf.x, sf.y, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 10px Orbitron';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('S/F', sf.x + 9, sf.y);
        }

        // Capa 3: auto
        if (this.#mostrarAuto && this._tienePuntos) {
            const pos = this._posEnProgreso(this.#progresoAuto);
            ctx.shadowColor = this.#colorAuto; ctx.shadowBlur = 14;
            ctx.fillStyle   = this.#colorAuto;
            ctx.beginPath(); ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

window.MinimapaDisenoGeneral = MinimapaDisenoGeneral;
