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
    #rotY;

    constructor(x, z, rotY = 0) {
        this.#x    = x;
        this.#z    = z;
        this.#rotY = rotY;
    }

    construir(scene) {
        this.#grupo = new THREE.Group();
        this.#grupo.position.set(this.#x, 0, this.#z);
        this.#grupo.rotation.y = this.#rotY;
        this._poblar(this.#grupo);
        scene.add(this.#grupo);
    }

    setVisible(v) { if (this.#grupo) this.#grupo.visible = v; }

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
