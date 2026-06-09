'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloNocturno — cielo oscuro con estrellas 3D.
//        Usa THREE.Points con sizeAttenuation:false (tamaño fijo en
//        píxeles de pantalla) para garantizar visibilidad en mobile.
// ================================================================
export class CieloNocturno extends Cielo {
    #estrellas = null;

    constructor(colorCielo) { super(colorCielo); }

    construir(scene) {
        super.construir(scene);
        this.#estrellas = this.#crearPuntos();
        scene.add(this.#estrellas);
        this._visibles.push(this.#estrellas);
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

    #crearPuntos() {
        const rng = this.#rng(98765);
        const pos = [];
        const R = 165;

        for (let i = 0; i < 320; i++) {
            const theta = rng() * Math.PI * 2;
            const phi   = rng() * Math.PI * 0.50;
            pos.push(
                R * Math.sin(phi) * Math.cos(theta),
                R * Math.cos(phi),
                R * Math.sin(phi) * Math.sin(theta)
            );
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xfffce0,
            size: 3,
            sizeAttenuation: false,
            depthWrite: false,
            depthTest: false,
            toneMapped: false,
        });

        const pts = new THREE.Points(geo, mat);
        pts.renderOrder   = 0;
        pts.frustumCulled = false;
        return pts;
    }

    #rng(semilla) {
        let s = semilla;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
