'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: FlechaCurvaEscena — tablero de chevrones (>>>) de pista de
//        carreras, a lo largo de la pista y mirando hacia ella, sobre dos
//        palos. Tiene grosor: se ve también de costado (PRD 011, RF-01).
//        Todas las medidas salen de MedidasEscena (PRD 011, D4).
// ================================================================
export class FlechaCurvaEscena extends ObjetoEscena {
    #lado;

    constructor(x, z, rotY = 0, lado = -1) {
        super(x, z, rotY);
        this.#lado = lado;
    }

    _poblar(grupo) {
        const m = new window.MedidasEscena();
        const ancho  = m.anchoTableroFlecha;
        const alto   = m.altoTableroFlecha;
        const grosor = m.grosorTableroFlecha;
        const radio  = m.radioPaloFlecha;
        const yPanel = m.bordeInferiorFlecha + alto / 2;
        const altoPalo = m.bordeInferiorFlecha + alto;

        // ── Dos palos detrás del tablero (del lado del pasto) ───
        const matPalo = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
        const geoPalo = new THREE.CylinderGeometry(radio, radio, altoPalo, 8);
        const atras   = this.#lado * (grosor / 2 + radio);
        for (const s of [-1, 1]) {
            const palo = new THREE.Mesh(geoPalo, matPalo);
            palo.position.set(atras, altoPalo / 2, s * (ancho / 2 - m.margenPalosFlecha));
            palo.castShadow = true;
            grupo.add(palo);
        }

        // ── Tablero con tres chevrones, con grosor ───────────────
        const textura = new THREE.CanvasTexture(this.#dibujarChevrones());
        const matCara = new THREE.MeshStandardMaterial({
            map:               textura,
            emissiveMap:       textura,
            emissive:          new THREE.Color(0xffffff),
            emissiveIntensity: 0.75,
        });
        const matCanto = new THREE.MeshStandardMaterial({ color: 0xcc8800, roughness: 0.6 });
        // Caras de la caja: +x, -x, +y, -y, +z (frente), -z (dorso)
        const tablero = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, grosor),
            [matCanto, matCanto, matCanto, matCanto, matCara, matCara]);
        tablero.position.set(0, yPanel, 0);
        tablero.rotation.y = -this.#lado * Math.PI / 2;
        tablero.scale.x    = this.#lado;
        tablero.castShadow = true;
        grupo.add(tablero);
    }

    #dibujarChevrones() {
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
        ctx.lineWidth   = 14;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        for (const x0 of [40, 82, 124]) {
            ctx.beginPath();
            ctx.moveTo(x0, 10);
            ctx.lineTo(x0 + 26, 32);
            ctx.lineTo(x0, 54);
            ctx.stroke();
        }
        return lienzo;
    }
}
