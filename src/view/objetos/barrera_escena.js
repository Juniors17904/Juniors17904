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
            const ox = (i - 1.5) * 1.5;

            // Base ancha
            const base = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 0.3, 0.65), matGris);
            base.position.set(ox, 0.15, 0);
            base.castShadow = true;

            // Talud (transición)
            const talud = new THREE.Mesh(
                new THREE.BoxGeometry(1.15, 0.35, 0.5), matGris);
            talud.position.set(ox, 0.48, 0);
            talud.castShadow = true;

            // Cuerpo vertical superior
            const cuerpo = new THREE.Mesh(
                new THREE.BoxGeometry(0.9, 0.5, 0.4), matGris);
            cuerpo.position.set(ox, 0.85, 0);
            cuerpo.castShadow = true;

            grupo.add(base, talud, cuerpo);

            // Franjas diagonales rojo/amarillo en la cara delantera
            if (i % 2 === 0) {
                [-0.22, 0.22].forEach((dy, j) => {
                    const franja = new THREE.Mesh(
                        new THREE.BoxGeometry(0.18, 0.42, 0.02),
                        j % 2 === 0 ? matRojo : matAmaril);
                    franja.rotation.z = Math.PI / 5;
                    franja.position.set(ox + dy * 0.8, 0.75, 0.21);
                    grupo.add(franja);
                });
            }
        }
    }
}
