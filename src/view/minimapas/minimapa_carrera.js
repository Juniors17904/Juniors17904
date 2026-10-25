'use strict';

// ================================================================
// CLASE: MinimapaCarrera — minimapa de una carrera 3D (PRD 017): el
// recorrido entero de la pista (con el camino de vuelta, PRD 014), la
// línea de meta y un punto por carro en su lugar real, con el color de
// su auto. El jugador va más grande, con borde blanco y encima de todos
// (D3). El mapa no gira (D5) y su tamaño lo da el diseño vertical u
// horizontal de la carrera (D4). No nombra ninguna pantalla: sirve para
// cualquier carrera 3D, también el multijugador futuro (D7).
// ================================================================
class MinimapaCarrera extends MinimapBase {
    static #RELLENO      = 8;
    static #RADIO_RIVAL  = 3.5;
    static #RADIO_JUGADOR = 5.5;

    #lienzo = null;
    #ctx    = null;
    #carros = [];      // PuntoCarroMapa por índice; el del jugador se dibuja al final
    #ancho  = 0;
    #alto   = 0;
    #escala = 1;

    constructor(lienzo, pistaCfg) {
        super();
        this.#lienzo = lienzo ?? null;
        this.#ctx    = this.#lienzo?.getContext('2d') ?? null;
        this.setCircuito(pistaCfg);
    }

    setCircuito(pistaCfg) {
        super.setCircuito(pistaCfg);
        this.#ancho = 0;
        this.#carros = [];
    }

    // Lugar real de un carro en la pista; el color puede ser número (0xrrggbb) o texto CSS
    ubicar(indice, x, z, color, esJugador = false) {
        this.#carros[indice] = new window.PuntoCarroMapa(x, z, this.#colorCss(color), esJugador);
    }

    // Acomoda el tamaño al diseño actual y dibuja
    actualizar() {
        if (!this.#ctx) return;
        this.#dimensionar();
        const ctx = this.#ctx;
        ctx.setTransform(this.#escala, 0, 0, this.#escala, 0, 0);
        ctx.clearRect(0, 0, this.#ancho, this.#alto);
        this.dibujar(ctx, this.#ancho, this.#alto);
    }

    dibujar(ctx, ancho, alto) {
        ctx.save();
        ctx.fillStyle = 'rgba(8,12,24,0.55)';
        ctx.fillRect(0, 0, ancho, alto);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, ancho - 1, alto - 1);
        if (this._tienePuntos) {
            ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 2.5;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            this._dibujarTrazado(ctx);
            const meta = this._primerPunto;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(meta.x - 5, meta.y - 1.5, 10, 3);
            for (const carro of this.#ordenDibujo()) this.#dibujarCarro(ctx, carro);
        }
        ctx.restore();
    }

    destruir() {
        if (this.#ctx && this.#lienzo) {
            this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.#ctx.clearRect(0, 0, this.#lienzo.width, this.#lienzo.height);
        }
        this.#carros = [];
        this.#ctx = null;
        this.#lienzo = null;
    }

    // ── Privados ─────────────────────────────────────────────────
    #ordenDibujo() {
        const carros = this.#carros.filter(Boolean);
        return [...carros.filter(c => !c.esJugador), ...carros.filter(c => c.esJugador)];
    }

    #dibujarCarro(ctx, carro) {
        const p = this._aPixel(carro.x, carro.z);
        const radio = carro.esJugador ? MinimapaCarrera.#RADIO_JUGADOR : MinimapaCarrera.#RADIO_RIVAL;
        ctx.fillStyle = carro.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, radio, 0, Math.PI * 2); ctx.fill();
        if (carro.esJugador) {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    #dimensionar() {
        const diseno = new window.SelectorDisenoCarrera().elegir();
        const ancho = diseno.anchoMapa, alto = diseno.altoMapa;
        const escala = window.devicePixelRatio || 1;
        if (ancho === this.#ancho && alto === this.#alto && escala === this.#escala) return;
        this.#ancho = ancho; this.#alto = alto; this.#escala = escala;
        this.#lienzo.width  = Math.round(ancho * escala);
        this.#lienzo.height = Math.round(alto * escala);
        this.#lienzo.style.width  = ancho + 'px';
        this.#lienzo.style.height = alto + 'px';
        this._construirPuntos(ancho, alto, MinimapaCarrera.#RELLENO);
    }

    #colorCss(color) {
        if (typeof color === 'number') return '#' + (color & 0xffffff).toString(16).padStart(6, '0');
        return typeof color === 'string' && color ? color : '#ffffff';
    }
}

window.MinimapaCarrera = MinimapaCarrera;
