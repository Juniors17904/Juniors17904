'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: SenalCurvaEscena — señal de tráfico de curva montada sobre
//        un poste. Acepta direccion 'derecha' | 'izquierda' para
//        mostrar la flecha correcta. Extiende ObjetoEscena como
//        todos los objetos decorativos de la pista.
// ================================================================
export class SenalCurvaEscena extends ObjetoEscena {
    #direccion;

    constructor(x, z, direccion = 'derecha', rotY = 0) {
        super(x, z, rotY);
        this.#direccion = direccion;
    }

    _poblar(grupo) {
        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 1.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888 })
        );
        poste.position.set(0, 0.9, 0);
        poste.castShadow = true;
        grupo.add(poste);

        const lienzo = document.createElement('canvas');
        lienzo.width  = 128;
        lienzo.height = 128;
        const ctx = lienzo.getContext('2d');

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(0, 0, 128, 128);

        ctx.strokeStyle = '#111';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 120, 120);

        ctx.strokeStyle = '#111';
        ctx.lineWidth   = 10;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        if (this.#direccion === 'derecha') {
            ctx.moveTo(50, 22);
            ctx.bezierCurveTo(50, 58, 50, 72, 95, 76);
        } else {
            ctx.moveTo(78, 22);
            ctx.bezierCurveTo(78, 58, 78, 72, 33, 76);
        }
        ctx.stroke();

        ctx.beginPath();
        if (this.#direccion === 'derecha') {
            ctx.moveTo(103, 68); ctx.lineTo(103, 84); ctx.lineTo(87, 76);
        } else {
            ctx.moveTo(25, 68); ctx.lineTo(25, 84); ctx.lineTo(41, 76);
        }
        ctx.closePath();
        ctx.fillStyle = '#111';
        ctx.fill();

        ctx.fillStyle      = '#111';
        ctx.font           = 'bold 19px Arial';
        ctx.textAlign      = 'center';
        ctx.textBaseline   = 'middle';
        ctx.fillText('CURVA', 64, 108);

        const textura = new THREE.CanvasTexture(lienzo);
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(0.5, 0.5),
            new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide })
        );
        panel.position.set(0, 2.05, 0);
        grupo.add(panel);
    }
}
