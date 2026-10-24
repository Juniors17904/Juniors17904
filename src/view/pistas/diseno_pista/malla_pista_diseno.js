'use strict';

import * as THREE            from 'three';
import { GeometriaCinta }    from '../geometria_cinta.js';
import { PerpendicularRuta } from '../perpendicular_ruta.js';

// ================================================================
// CLASS: MallaPistaDiseno — construye la malla 3D de la pista de
//        Diseño General a partir de la curva de la ruta:
//        calzada, pianos rojo/blanco, línea central y línea de salida.
//        Las geometrías las arma GeometriaCinta.
// ================================================================
export class MallaPistaDiseno {
    static #DIVISIONES      = 800;
    static #BANDA_PIANO     = 10;
    static #LARGO_RAYA      = 14;
    static #HUECO_RAYA      = 10;

    #cinta;
    #medidas = new window.MedidasEscena();   // anchos de la pista (PRD 009)

    constructor(curva) {
        const puntos = curva.getPoints(MallaPistaDiseno.#DIVISIONES);
        const perpendiculares = puntos.map((_, i) => MallaPistaDiseno.#perpendicular(puntos, i));
        this.#cinta = new GeometriaCinta(puntos, perpendiculares, true);
    }

    // Devuelve un THREE.Group con todas las capas de la pista
    construir() {
        const DIV   = MallaPistaDiseno.#DIVISIONES;
        const cinta = this.#cinta;
        const grupo = new THREE.Group();

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.95, side: THREE.DoubleSide });
        const M       = this.#medidas.medioAnchoAsfalto;
        const road    = new THREE.Mesh(cinta.cinta(-M, M, 0, 0, DIV), roadMat);
        road.receiveShadow = true;
        grupo.add(road);

        const curbW  = this.#medidas.anchoPiano;
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.3, emissive: 0xaa0000, emissiveIntensity: 0.25, side: THREE.DoubleSide });
        const whtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.2,  side: THREE.DoubleSide });
        this.#agregarPianos(grupo, -M - curbW, -M, redMat, whtMat);
        this.#agregarPianos(grupo, M, M + curbW, redMat, whtMat);

        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
        const DASH = MallaPistaDiseno.#LARGO_RAYA, GAP = MallaPistaDiseno.#HUECO_RAYA;
        for (let i = 0; i < DIV; i += DASH + GAP) {
            grupo.add(new THREE.Mesh(cinta.cinta(-0.22, 0.22, 0.03, i, Math.min(i+DASH, DIV)), dashMat));
        }
        grupo.add(new THREE.Mesh(cinta.cinta(-M, M, 0.015, 0, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })));

        return grupo;
    }

    // Perpendicular (en XZ) a la curva en el punto i, según el punto siguiente
    static #perpendicular(cp, i) {
        const a = cp[i], b = cp[(i + 1) % cp.length];
        let tx = b.x - a.x, tz = b.z - a.z;
        let L  = Math.sqrt(tx*tx + tz*tz);
        if (L < 0.0001) {
            const prev = cp[(i - 1 + cp.length) % cp.length];
            tx = a.x - prev.x; tz = a.z - prev.z;
            L  = Math.sqrt(tx*tx + tz*tz) || 1;
        }
        return new PerpendicularRuta(-tz / L, tx / L);
    }

    // Pianos en bandas alternadas rojo/blanco entre izq y der
    #agregarPianos(grupo, izq, der, redMat, whtMat) {
        const DIV  = MallaPistaDiseno.#DIVISIONES;
        const BAND = MallaPistaDiseno.#BANDA_PIANO;
        const rojo   = this.#cinta.piano(izq, der, DIV, BAND, true);
        const blanco = this.#cinta.piano(izq, der, DIV, BAND, false);
        if (rojo)   grupo.add(new THREE.Mesh(rojo,   redMat));
        if (blanco) grupo.add(new THREE.Mesh(blanco, whtMat));
    }
}
