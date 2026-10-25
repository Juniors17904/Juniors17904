'use strict';

// ================================================================
// MODEL — RectanguloCarro: la forma de choque del carro en un instante
// (PRD 009, D6): un rectángulo de su largo y su ancho, centrado en (x, z)
// y girado con el carro. Los objetos sólidos le preguntan su distancia
// para encontrar su punto más cercano (PRD 011, D10).
// ================================================================
export class RectanguloCarro {
    #x; #z;
    #fx; #fz;          // hacia el frente
    #sx; #sz;          // hacia el costado
    #medioLargo; #medioAncho;

    constructor(x, z, rotY, medioLargo, medioAncho) {
        this.#x = x;
        this.#z = z;
        this.#fx = Math.sin(rotY);
        this.#fz = Math.cos(rotY);
        this.#sx = this.#fz;
        this.#sz = -this.#fx;
        this.#medioLargo = medioLargo;
        this.#medioAncho = medioAncho;
    }

    get x()          { return this.#x; }
    get z()          { return this.#z; }
    get fx()         { return this.#fx; }
    get fz()         { return this.#fz; }
    get sx()         { return this.#sx; }
    get sz()         { return this.#sz; }
    get medioLargo() { return this.#medioLargo; }
    get medioAncho() { return this.#medioAncho; }
    // Lo más lejos que llega el rectángulo desde su centro (una esquina)
    get alcance()    { return Math.hypot(this.#medioLargo, this.#medioAncho); }

    // Distancia del punto (px, pz) al rectángulo. Dentro es negativa: cuánto
    // le falta para salir por el lado más cercano (así la más honda es la menor)
    distanciaA(px, pz) {
        const ox = px - this.#x, oz = pz - this.#z;
        const a = Math.abs(ox * this.#fx + oz * this.#fz) - this.#medioLargo;
        const c = Math.abs(ox * this.#sx + oz * this.#sz) - this.#medioAncho;
        if (a <= 0 && c <= 0) return Math.max(a, c);
        return Math.hypot(Math.max(0, a), Math.max(0, c));
    }
}
