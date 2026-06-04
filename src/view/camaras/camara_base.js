'use strict';
import * as THREE from 'three';

// ================================================================
// CLASE BASE: CamaraBase — cámara Three.js con resize compartido
// ================================================================
export class CamaraBase {
    #cam;

    constructor(fov, aspect, near, far) {
        this.#cam = new THREE.PerspectiveCamera(fov, aspect, near, far);
    }

    get camera() { return this.#cam; }

    resize(aspect) {
        this.#cam.aspect = aspect;
        this.#cam.updateProjectionMatrix();
    }

    actualizar() {}
}
