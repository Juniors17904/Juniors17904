'use strict';
import * as THREE from 'three';

// ================================================================
// VIEW — CamaraChase
// Cámara que sigue al carro. Dos modos:
//   camaraFija: true  → ángulo fijo, el carro se ve rotar (Test Drive)
//   camaraFija: false → gira con el carro, el mundo se ve rotar (Circuito)
// ================================================================
export class CamaraChase {
    #cam;
    #distancia;
    #camaraFija;

    altura = 2.8;

    constructor(aspect, { distancia = 7, altura = 2.8, camaraFija = false } = {}) {
        this.#cam        = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);
        this.#distancia  = distancia;
        this.#camaraFija = camaraFija;
        this.altura      = altura;
    }

    get camera() { return this.#cam; }

    resize(aspect) {
        this.#cam.aspect = aspect;
        this.#cam.updateProjectionMatrix();
    }

    actualizar(px, pz, rotY) {
        const ry   = this.#camaraFija ? 0 : rotY;
        const sinY = Math.sin(ry);
        const cosY = Math.cos(ry);
        const D    = this.#distancia;

        this.#cam.position.set(px - sinY * D, this.altura, pz - cosY * D);

        if (this.#camaraFija) {
            this.#cam.lookAt(px, 0.6, pz);
        } else {
            this.#cam.lookAt(px + sinY * 4, 0.6, pz + cosY * 4);
        }
    }
}
