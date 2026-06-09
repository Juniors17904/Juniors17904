'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: BalizaChevronEscena — señal vial preventiva de chevrón:
//        panel cuadrado amarillo con flecha negra rellena montado
//        sobre un poste metálico individual.
// ================================================================
export class BalizaChevronEscena extends ObjetoEscena {
    #direccion;

    constructor(x, z, rotY = 0, direccion = 'derecha') {
        super(x, z, rotY);
        this.#direccion = direccion;
    }

    _poblar(grupo) {
        // ── Poste metálico ───────────────────────────────────────
        const matPoste = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa, roughness: 0.4, metalness: 0.7
        });
        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.030, 1.05, 8),
            matPoste
        );
        poste.position.set(0, 0.525, 0);
        poste.castShadow = true;
        grupo.add(poste);

        // ── Canvas: panel amarillo con chevrón negro ─────────────
        const lienzo = document.createElement('canvas');
        lienzo.width  = 128;
        lienzo.height = 128;
        const ctx = lienzo.getContext('2d');

        // Fondo amarillo con esquinas redondeadas
        ctx.fillStyle = '#f5c800';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(3, 3, 122, 122, 14);
        } else {
            ctx.rect(3, 3, 122, 122);
        }
        ctx.fill();

        // Borde negro
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 5;
        ctx.stroke();

        // Chevrón negro relleno (trazo grueso con puntas redondeadas)
        ctx.strokeStyle = '#111111';
        ctx.lineWidth   = 32;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(36, 18);
        ctx.lineTo(92, 64);
        ctx.lineTo(36, 110);
        ctx.stroke();

        // Pernos en las esquinas
        const pernos = [[20, 20], [108, 20], [20, 108], [108, 108]];
        for (const [px, py] of pernos) {
            ctx.fillStyle = '#777';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        const textura = new THREE.CanvasTexture(lienzo);

        // ── Panel ────────────────────────────────────────────────
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(0.52, 0.52),
            new THREE.MeshStandardMaterial({
                map:               textura,
                emissiveMap:       textura,
                emissive:          new THREE.Color(0xffffff),
                emissiveIntensity: 0.65,
                side:              THREE.DoubleSide,
            })
        );
        panel.position.set(0, 1.05 + 0.26, 0);
        if (this.#direccion === 'izquierda') panel.scale.x = -1;
        grupo.add(panel);
    }
}
