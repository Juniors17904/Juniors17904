'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: FlechaCurvaEscena — indicadores de curva tipo chevron >>>
//        Tres postes con panel de textura canvas mostrando ">" rojo
// ================================================================
export class FlechaCurvaEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        const matPoste = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.8 });
        const geoPoste = new THREE.CylinderGeometry(0.05, 0.06, 1.8, 6);

        for (let i = 0; i < 3; i++) {
            const ox = (i - 1) * 1.0;

            const poste = new THREE.Mesh(geoPoste, matPoste);
            poste.position.set(ox, 0.9, 0);
            poste.castShadow = true;
            grupo.add(poste);

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
            const panel = new THREE.Mesh(
                new THREE.PlaneGeometry(0.9, 1.1),
                new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide })
            );
            panel.position.set(ox, 2.35, 0);
            grupo.add(panel);
        }
    }
}
