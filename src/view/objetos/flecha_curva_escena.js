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
        const ancho  = 0.85;   // ancho del tablero (≈1.47 m)
        const alto   = 0.22;   // alto del tablero  (≈0.38 m)
        const hPoste = 0.36;   // altura poste      (≈0.62 m)
        const yPanel = hPoste + alto / 2;  // centro panel → top ≈ 0.58 u ≈ 1.0 m

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

        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 192, 64);

        ctx.strokeStyle = '#cc0000';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 188, 60);

        ctx.strokeStyle = '#ee1111';
        ctx.lineWidth   = 14;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        for (let i = 0; i < 3; i++) {
            const cx = 32 + i * 64;
            ctx.beginPath();
            ctx.moveTo(cx - 16, 10);
            ctx.lineTo(cx + 16, 32);
            ctx.lineTo(cx - 16, 54);
            ctx.stroke();
        }

        const textura = new THREE.CanvasTexture(lienzo);
        const panel = new THREE.Mesh(
            new THREE.PlaneGeometry(ancho, alto),
            new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide })
        );
        panel.position.set(0, yPanel, 0);
        panel.rotation.y = -this.#lado * Math.PI / 2;
        panel.scale.x    = this.#lado;
        grupo.add(panel);
    }
}
