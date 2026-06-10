'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: ObjetoEscena — superclase para objetos decorativos 3D
//        Subclases implementan _poblar(grupo) con sus propios meshes.
// ================================================================
export class ObjetoEscena {
    _grupo = null; // protegido: subclases como Luna lo usan en actualizar()
    #x;
    #z;
    #rotY;

    constructor(x, z, rotY = 0) {
        this.#x    = x;
        this.#z    = z;
        this.#rotY = rotY;
    }

    construir(scene) {
        this._grupo = new THREE.Group();
        this._grupo.position.set(this.#x, 0, this.#z);
        this._grupo.rotation.y = this.#rotY;
        this._poblar(this._grupo);
        scene.add(this._grupo);
    }

    setVisible(v) { if (this._grupo) this._grupo.visible = v; }

    // Hook para objetos que necesitan seguir la cámara (Luna, NubeAtmosferica, etc.)
    actualizar(camara) {}

    destruir(scene) {
        if (!this._grupo) return;
        scene.remove(this._grupo);
        this._grupo.traverse(child => {
            child.geometry?.dispose();
            child.material?.dispose();
        });
        this._grupo = null;
    }

    _poblar(grupo) {}
}
