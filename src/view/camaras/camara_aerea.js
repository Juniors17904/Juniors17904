'use strict';
import * as THREE from 'three';

// ================================================================
// VIEW — CamaraAerea
// Vista cenital (bird's eye view) con desplazamiento por teclas/pan.
// ================================================================
export class CamaraAerea {
    #cam;
    #x = 0; #z = 0; #h = 80;
    #spd = 2.5;

    moveX = 0;
    moveZ = 0;

    constructor(aspect) {
        this.#cam = new THREE.PerspectiveCamera(60, aspect, 0.5, 3000);
        this.#cam.up.set(0, 0, 1);
    }

    get camera() { return this.#cam; }

    activar(x, z) {
        this.#x = x; this.#z = z;
        this.#aplicar();
    }

    setAltura(sliderVal) {
        this.#h = sliderVal * 25;
        this.#aplicar();
    }

    actualizar() {
        this.#x += this.moveX * this.#spd;
        this.#z += this.moveZ * this.#spd;
        this.#aplicar();
    }

    get h() { return this.#h; }
    set h(val) { this.#h = Math.max(10, Math.min(300, val)); this.#aplicar(); }

    pan(dx, dz) { this.#x += dx; this.#z += dz; this.#aplicar(); }

    resize(aspect) {
        this.#cam.aspect = aspect;
        this.#cam.updateProjectionMatrix();
    }

    #aplicar() {
        this.#cam.position.set(this.#x, this.#h, this.#z);
        this.#cam.lookAt(this.#x, 0, this.#z);
    }
}
