'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: FlechaCurvaEscena — tablero horizontal de chevrones (>>>)
//        montado sobre dos postes con base, estilo baliza de curva
//        reglamentaria. Altura total ≈ 70 cm (0.40 u).
// ================================================================
export class FlechaCurvaEscena extends ObjetoEscena {
    #lado;

    constructor(x, z, rotY = 0, lado = -1) {
        super(x, z, rotY);
        this.#lado = lado;
    }

    _poblar(grupo) {
        const ancho  = 2.20;   // ancho del tablero (≈3.80 m)
        const alto   = 0.70;   // alto del tablero  (≈1.21 m)
        const hPoste = 0.36;   // altura poste      (≈0.62 m)
        const yPanel = hPoste + alto / 2;  // centro panel → top ≈ 0.96 u ≈ 1.66 m

        // ── Estructura: dos postes + base ───────────────────────
        const matPoste = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
        const geoPoste = new THREE.CylinderGeometry(0.018, 0.018, hPoste, 6);
        const geoBase  = new THREE.BoxGeometry(0.10, 0.018, 0.10);

        for (const s of [-1, 1]) {
            const oz = s * (ancho / 2 - 0.08);

            const poste = new THREE.Mesh(geoPoste, matPoste);
            poste.position.set(0, hPoste / 2, oz);
            poste.castShadow = true;
            grupo.add(poste);

            const base = new THREE.Mesh(geoBase, matPoste);
            base.position.set(0, 0.009, oz);
            base.castShadow = true;
            grupo.add(base);
        }

        // ── Tablero con tres chevrones ───────────────────────────
        const lienzo = document.createElement('canvas');
        lienzo.width  = 192;
        lienzo.height = 64;
        const ctx = lienzo.getContext('2d');

        ctx.fillStyle = '#f5c800';
        ctx.fillRect(0, 0, 192, 64);

        ctx.strokeStyle = '#cc8800';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 188, 60);

        ctx.strokeStyle = '#111111';
        ctx.lineWidth   = 20;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(72, 8);
        ctx.lineTo(124, 32);
        ctx.lineTo(72, 56);
        ctx.stroke();

        const textura = new THREE.CanvasTexture(lienzo);
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(ancho, alto),
            new THREE.MeshStandardMaterial({
                map:              textura,
                emissiveMap:      textura,
                emissive:         new THREE.Color(0xffffff),
                emissiveIntensity: 0.75,
                side:             THREE.DoubleSide,
            })
        );
        panel.position.set(0, yPanel, 0);
        panel.rotation.y = -this.#lado * Math.PI / 2;
        panel.scale.x    = this.#lado;
        grupo.add(panel);
    }
}
