'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: ObjetoEscena — superclase para objetos decorativos 3D
//        Subclases implementan _poblar(grupo) con sus propios meshes.
// ================================================================
export class ObjetoEscena {
    #grupo = null;
    #x;
    #z;

    constructor(x, z) {
        this.#x = x;
        this.#z = z;
    }

    construir(scene) {
        this.#grupo = new THREE.Group();
        this.#grupo.position.set(this.#x, 0, this.#z);
        this._poblar(this.#grupo);
        scene.add(this.#grupo);
    }

    destruir(scene) {
        if (!this.#grupo) return;
        scene.remove(this.#grupo);
        this.#grupo.traverse(child => {
            child.geometry?.dispose();
            child.material?.dispose();
        });
        this.#grupo = null;
    }

    _poblar(grupo) {}
}
