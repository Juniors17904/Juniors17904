'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: GuardarrailEscena — barrera de seguridad tipo W-beam:
//        viga de acero galvanizado sobre postes metálicos con
//        reflectores rojos. Segmento de ~8m listo para colocar.
// ================================================================
export class GuardarrailEscena extends ObjetoEscena {

    constructor(x, z, rotY = 0) {
        super(x, z, rotY);
    }

    _poblar(grupo) {
        const largo  = 4.6;
        const nPost  = 5;
        const hPoste = 0.68;

        const matAcero = new THREE.MeshStandardMaterial({
            color: 0xaab4bc, roughness: 0.35, metalness: 0.80,
        });
        const matViga = new THREE.MeshStandardMaterial({
            color: 0xc4cdd3, roughness: 0.25, metalness: 0.90,
        });

        // ── Postes ────────────────────────────────────────────────
        const geoPoste   = new THREE.BoxGeometry(0.05, hPoste, 0.07);
        const geoFlancha = new THREE.BoxGeometry(0.05, 0.04, 0.13);

        for (let i = 0; i < nPost; i++) {
            const oz = (i / (nPost - 1) - 0.5) * largo;

            const poste = new THREE.Mesh(geoPoste, matAcero);
            poste.position.set(0, hPoste / 2, oz);
            poste.castShadow = true;
            grupo.add(poste);

            // Placa de base
            const base = new THREE.Mesh(
                new THREE.BoxGeometry(0.14, 0.03, 0.10), matAcero
            );
            base.position.set(0, 0.015, oz);
            grupo.add(base);

            // Placa de refuerzo bajo la viga
            const flancha = new THREE.Mesh(geoFlancha, matAcero);
            flancha.position.set(0, 0.56, oz);
            grupo.add(flancha);
        }

        // ── Viga tipo C-beam ──────────────────────────────────────
        const viga1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.17, largo + 0.15), matViga
        );
        viga1.position.set(0, 0.60, 0);
        viga1.castShadow = true;
        grupo.add(viga1);

        // Labios superior e inferior (perfil en C abierto hacia la pista)
        for (const dy of [0.085, -0.085]) {
            const labio = new THREE.Mesh(
                new THREE.BoxGeometry(0.09, 0.022, largo + 0.15), matViga
            );
            labio.position.set(0.025, 0.60 + dy, 0);
            grupo.add(labio);
        }

        // ── Reflectores rojos (cara a la pista, al centro de la viga) ──
        const matRef = new THREE.MeshStandardMaterial({
            color: 0xdd1100,
            emissive: new THREE.Color(0xdd1100),
            emissiveIntensity: 0.9,
        });
        const paso = largo / (nPost - 1);
        for (let i = 0; i < nPost - 1; i++) {
            const oz = (-largo / 2) + paso * i + paso / 2;
            const ref = new THREE.Mesh(
                new THREE.BoxGeometry(0.02, 0.08, 0.06), matRef
            );
            ref.position.set(0.06, 0.60, oz);
            grupo.add(ref);
        }
    }
}
