'use strict';

// ================================================================
// CLASS: MinimapaDisenoGeneral — minimapa de la pantalla Diseño General
//        Muestra fondo verde del área de mapa.
//        Con guía activada, dibuja el trazado de la pista actual.
// ================================================================
class MinimapaDisenoGeneral extends MinimapBase {
    #mostrarGuia = false;
    #ultimaAncho = 0;
    #ultimoAlto  = 0;

    set mostrarGuia(v) {
        this.#mostrarGuia = !!v;
        this.#ultimaAncho = 0; // fuerza reconstrucción en el próximo dibujar
    }
    get mostrarGuia() { return this.#mostrarGuia; }

    setCircuito(pistaCfg) {
        super.setCircuito(pistaCfg);
        this.#ultimaAncho = 0;
    }

    dibujar(ctx, ancho, alto) {
        // Fondo verde del área de mapa
        ctx.fillStyle = '#1a4a1a';
        ctx.fillRect(0, 0, ancho, alto);

        if (!this.#mostrarGuia) return;

        // Reconstruir puntos si el tamaño cambia o aún no están calculados
        if (!this._tienePuntos || ancho !== this.#ultimaAncho || alto !== this.#ultimoAlto) {
            this.#ultimaAncho = ancho;
            this.#ultimoAlto  = alto;
            this._construirPuntos(ancho, alto, 20);
        }
        if (!this._tienePuntos) return;

        // Trazado: capa sombra + capa visible
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 6;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        this._dibujarTrazado(ctx);
        ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3;
        this._dibujarTrazado(ctx);

        // Punto de meta
        const sf = this._primerPunto;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(sf.x, sf.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('S/F', sf.x + 9, sf.y);
    }
}

window.MinimapaDisenoGeneral = MinimapaDisenoGeneral;
