'use strict';

// ================================================================
// CLASE: MapaConduccion — superclase de los mapas pequeños de la
// pantalla de juego (#minimap-td3d y #trail-map): mismo tamaño,
// mismo fondo y se muestran u ocultan igual. Cada subclase dibuja su
// contenido en dibujarContenido(ctx, visor).
// ================================================================
class MapaConduccion {
    static #ANCHO  = 90;
    static #ALTO   = 120;
    static #MARGEN = 10;

    #lienzo  = null;
    #ctx     = null;
    #visible = true;

    constructor(idLienzo) {
        this.#lienzo = document.getElementById(idLienzo);
        this.#ctx    = this.#lienzo.getContext('2d');
    }

    get lienzo() { return this.#lienzo; }
    get ancho()  { return MapaConduccion.#ANCHO; }
    get alto()   { return MapaConduccion.#ALTO; }
    get margen() { return MapaConduccion.#MARGEN; }

    get visible() { return this.#visible; }
    set visible(valor) {
        this.#visible = Boolean(valor);
        this.#lienzo.style.display = this.#visible ? 'block' : 'none';
    }

    mostrar() {
        this.#lienzo.style.display = 'block';
    }

    dibujar(visor) {
        if (!this.#visible || !this.puedeDibujar) return;
        const ctx = this.#ctx;
        ctx.clearRect(0, 0, this.ancho, this.alto);
        ctx.fillStyle = 'rgba(0,0,0,0.70)';
        ctx.roundRect(0, 0, this.ancho, this.alto, 8); ctx.fill();
        this.dibujarContenido(ctx, visor);
    }

    // La subclase lo redefine si a veces no tiene qué dibujar
    get puedeDibujar() { return true; }

    // La subclase dibuja aquí su contenido sobre el fondo
    dibujarContenido(ctx, visor) {}

    // Punto rojo con brillo: la posición del carro
    dibujarCarro(ctx, x, y) {
        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 8;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Etiqueta "RUTA" de los recorridos
    dibujarEtiquetaRuta(ctx) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '7px monospace';
        ctx.fillText('RUTA', 3, 8);
    }
}
