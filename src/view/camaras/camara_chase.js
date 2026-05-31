'use strict';
import * as THREE from 'three';

// ================================================================
// VIEW — CamaraChase
// Cámara que sigue al carro. Dos modos:
//   seguirRotacion: false → ángulo fijo (Test Drive, pista recta)
//   seguirRotacion: true  → gira con el carro y mira adelante (Circuito)
// ================================================================
export class CamaraChase {
    #cam;
    #distancia;
    #seguirRotacion;

    altura = 2.8;

    constructor(aspect, { distancia = 7, altura = 2.8, seguirRotacion = true } = {}) {
        this.#cam            = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);
        this.#distancia      = distancia;
        this.#seguirRotacion = seguirRotacion;
        this.altura          = altura;
    }

    get camera() { return this.#cam; }

    resize(aspect) {
        this.#cam.aspect = aspect;
        this.#cam.updateProjectionMatrix();
    }

    actualizar(px, pz, rotY) {
        const ry   = this.#seguirRotacion ? rotY : 0;
        const sinY = Math.sin(ry);
        const cosY = Math.cos(ry);
        const D    = this.#distancia;

        this.#cam.position.set(px - sinY * D, this.altura, pz - cosY * D);

        if (this.#seguirRotacion) {
            this.#cam.lookAt(px + sinY * 4, 0.6, pz + cosY * 4);
        } else {
            this.#cam.lookAt(px, 0.6, pz);
        }
    }
}
