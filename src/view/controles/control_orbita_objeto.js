'use strict';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================================================================
// CLASS: ControlOrbitaObjeto — órbita táctil/ratón alrededor de
//        un objeto 3D. Encapsula OrbitControls con los parámetros
//        adecuados para previsualización de decoraciones.
// ================================================================
export class ControlOrbitaObjeto {
    #controls = null;

    activar(camara, canvas) {
        this.#controls = new OrbitControls(camara, canvas);
        this.#controls.target.set(0, 1.5, 0);
        this.#controls.enableDamping  = true;
        this.#controls.dampingFactor  = 0.08;
        this.#controls.minDistance    = 3;
        this.#controls.maxDistance    = 20;
        this.#controls.update();
    }

    actualizar() { this.#controls?.update(); }

    destruir() {
        this.#controls?.dispose();
        this.#controls = null;
    }
}
