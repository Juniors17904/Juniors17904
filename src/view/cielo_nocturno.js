'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — cielo de noche con campo de estrellas.
//        Extiende Cielo usando el color medianoche como base y
//        añade una capa de puntos (estrellas) que sigue la cámara.
// ================================================================
export class CieloNocturno extends Cielo {
    #estrellas = null;

    constructor(colorBase = '#060a14') {
        super(colorBase);
    }

    construir(scene) {
        super.construir(scene);
        this.#estrellas = this.#crearEstrellas();
        scene.add(this.#estrellas);
    }

    actualizar(camara) {
        super.actualizar(camara);
        if (this.#estrellas && camara) this.#estrellas.position.copy(camara.position);
    }

    destruir(scene) {
        if (this.#estrellas) {
            scene.remove(this.#estrellas);
            this.#estrellas.geometry.dispose();
            this.#estrellas.material.dispose();
            this.#estrellas = null;
        }
        super.destruir(scene);
    }

    #crearEstrellas() {
        const N = 700;
        const pos = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        for (let i = 0; i < N; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(Math.random()); // hemisferio superior uniforme
            const r     = 168;
            pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = r * Math.cos(phi);
            pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
            const b    = 0.8 + Math.random() * 0.2;
            col[i*3]   = b * (0.85 + Math.random() * 0.15);
            col[i*3+1] = b * (0.9  + Math.random() * 0.1);
            col[i*3+2] = b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
            vertexColors: true, size: 0.45,
            sizeAttenuation: true, depthWrite: false, toneMapped: false,
        });
        const pts = new THREE.Points(geo, mat);
        pts.renderOrder   = -1;
        pts.frustumCulled = false;
        return pts;
    }
}
