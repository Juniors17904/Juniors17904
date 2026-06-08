'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: FlechaCurvaEscena — indicadores de curva tipo chevron >>>
//        Tres postes en fila a lo largo de la pista (eje Z local),
//        cada panel mirando hacia el conductor. El campo #lado
//        controla si la flecha apunta hacia la derecha o izquierda
//        según el sentido de la curva.
// ================================================================
export class FlechaCurvaEscena extends ObjetoEscena {
    #lado;

    constructor(x, z, rotY = 0, lado = -1) {
        super(x, z, rotY);
        this.#lado = lado;
    }

    _poblar(grupo) {
        const matPoste = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
        const geoPoste = new THREE.CylinderGeometry(0.04, 0.05, 0.7, 6);

        const lienzo = document.createElement('canvas');
        lienzo.width  = 64;
        lienzo.height = 96;
        const ctx = lienzo.getContext('2d');
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 64, 96);
        ctx.strokeStyle = '#ee1111';
        ctx.lineWidth   = 18;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(12, 10);
        ctx.lineTo(52, 48);
        ctx.lineTo(12, 86);
        ctx.stroke();
        const textura = new THREE.CanvasTexture(lienzo);

        for (let i = 0; i < 5; i++) {
            const oz = (i - 2) * 0.7;

            const poste = new THREE.Mesh(geoPoste, matPoste);
            poste.position.set(0, 0.35, oz);
            poste.castShadow = true;
            grupo.add(poste);

            const panel = new THREE.Mesh(
                new THREE.PlaneGeometry(0.45, 0.55),
                new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide })
            );
            panel.position.set(0, 0.98, oz);
            // Cada panel gira 90° para mirar hacia adentro de la pista.
            // lado determina si la cara mira a izquierda o derecha del grupo.
            // scale.x = -lado invierte ">" para que apunte en sentido de marcha.
            panel.rotation.y = -this.#lado * Math.PI / 2;
            panel.scale.x    = this.#lado;
            grupo.add(panel);
        }
    }
}
