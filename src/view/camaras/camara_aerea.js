'use strict';
import { CamaraBase } from './camara_base.js';

// ================================================================
// VIEW — CamaraAerea
// Vista cenital (bird's eye view) con desplazamiento por teclas/pan.
// ================================================================
export class CamaraAerea extends CamaraBase {
    #x = 0; #z = 0; #h = 80;
    #spd = 2.5;

    moveX = 0;
    moveZ = 0;

    constructor(aspect) {
        super(60, aspect, 0.5, 3000);
        this.camera.up.set(0, 0, 1);
    }

    activar(x, z) {
        this.#x = x; this.#z = z;
        this.#aplicar();
    }

    setAltura(sliderVal) {
        this.#h = sliderVal * 25;
        this.#aplicar();
    }

    actualizar(px = null, pz = null) {
        if (px !== null) { this.#x = px; this.#z = pz; }
        this.#x -= this.moveX * this.#spd;
        this.#z += this.moveZ * this.#spd;
        this.#aplicar();
    }

    get h() { return this.#h; }
    set h(val) { this.#h = Math.max(10, Math.min(300, val)); this.#aplicar(); }

    get zonaVisible() {
        const radio = this.#h * Math.tan(Math.PI / 6);
        return { x: this.#x, z: this.#z, radio };
    }

    pan(dx, dz) { this.#x -= dx; this.#z -= dz; this.#aplicar(); }

    #aplicar() {
        this.camera.position.set(this.#x, this.#h, this.#z);
        this.camera.lookAt(this.#x, 0, this.#z);
    }
}
