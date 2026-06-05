'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: AvisoEscena — letrero vial con panel de color
// ================================================================
export class AvisoEscena extends ObjetoEscena {
    #texto;
    #colorPanel;

    constructor(x, z, texto = '', colorPanel = 0x1a3a8f) {
        super(x, z);
        this.#texto      = texto;
        this.#colorPanel = colorPanel;
    }

    _poblar(grupo) {
        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        poste.position.y = 1.5;
        poste.castShadow = true;

        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(2.2, 0.9, 0.08),
            new THREE.MeshStandardMaterial({ color: this.#colorPanel, roughness: 0.5 })
        );
        panel.position.y = 3.3;
        panel.castShadow = true;

        const borde = new THREE.Mesh(
            new THREE.BoxGeometry(2.4, 1.1, 0.04),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        borde.position.y = 3.3;
        borde.position.z = -0.07;

        grupo.add(poste, panel, borde);
    }
}
