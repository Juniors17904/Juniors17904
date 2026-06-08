'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: BarreraEscena — muro de contención estilo Jersey barrier
//        Muestra 4 bloques en línea como sección de barrera de pista
// ================================================================
export class BarreraEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        const matGris   = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
        const matRojo   = new THREE.MeshStandardMaterial({ color: 0xee2222 });
        const matAmaril = new THREE.MeshStandardMaterial({ color: 0xf5c400 });

        for (let i = 0; i < 4; i++) {
            const ox = (i - 1.5) * 1.0;

            // Base ancha — 0.18u alto ≈ 0.31m real
            const base = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.18, 0.4), matGris);
            base.position.set(ox, 0.09, 0);
            base.castShadow = true;

            // Talud (transición) — 0.21u alto
            const talud = new THREE.Mesh(
                new THREE.BoxGeometry(0.75, 0.21, 0.3), matGris);
            talud.position.set(ox, 0.285, 0);
            talud.castShadow = true;

            // Cuerpo vertical superior — 0.28u alto → total ≈ 0.67u ≈ 1.14m real
            const cuerpo = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.28, 0.22), matGris);
            cuerpo.position.set(ox, 0.53, 0);
            cuerpo.castShadow = true;

            grupo.add(base, talud, cuerpo);

            // Franjas diagonales rojo/amarillo en la cara delantera
            if (i % 2 === 0) {
                [-0.13, 0.13].forEach((dy, j) => {
                    const franja = new THREE.Mesh(
                        new THREE.BoxGeometry(0.11, 0.25, 0.02),
                        j % 2 === 0 ? matRojo : matAmaril);
                    franja.rotation.z = Math.PI / 5;
                    franja.position.set(ox + dy, 0.48, 0.12);
                    grupo.add(franja);
                });
            }
        }
    }
}
