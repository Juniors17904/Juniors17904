'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: AvisoEscena — letrero vial con panel de color y marco blanco.
//        Medidas de MedidasEscena (PRD 011, D8).
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
        const m = new window.MedidasEscena();
        const ancho = m.anchoCartelAviso, alto = m.altoCartelAviso, marco = m.marcoCartelAviso;
        const grosor = m.grosorCartelAviso, y = m.centroCartelAviso;

        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(m.radioPaloAviso, m.radioPaloAviso, m.altoPaloAviso, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        poste.position.y = m.altoPaloAviso / 2;
        poste.castShadow = true;

        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(ancho - 2 * marco, alto - 2 * marco, grosor),
            new THREE.MeshStandardMaterial({ color: this.#colorPanel, roughness: 0.5 })
        );
        panel.position.y = y;
        panel.castShadow = true;

        const borde = new THREE.Mesh(
            new THREE.BoxGeometry(ancho, alto, grosor / 2),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        borde.position.y = y;
        borde.position.z = -(grosor / 2 + grosor / 4 + grosor / 8);   // detrás del panel, sin tocarlo

        grupo.add(poste, panel, borde);
    }
}
