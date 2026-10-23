'use strict';

import * as THREE from 'three';

// ================================================================
// CLASS: MallaPistaDiseno — construye la malla 3D de la pista de
//        Diseño General a partir de la curva de la ruta:
//        calzada, pianos rojo/blanco, línea central y línea de salida.
// ================================================================
export class MallaPistaDiseno {
    static #DIVISIONES      = 800;
    static #ANCHO_PIANO     = 0.7;
    static #BANDA_PIANO     = 10;
    static #LARGO_RAYA      = 14;
    static #HUECO_RAYA      = 10;

    #puntos;

    constructor(curva) {
        this.#puntos = curva.getPoints(MallaPistaDiseno.#DIVISIONES);
    }

    // Devuelve un THREE.Group con todas las capas de la pista
    construir() {
        const DIV   = MallaPistaDiseno.#DIVISIONES;
        const grupo = new THREE.Group();

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.DoubleSide });
        const road    = new THREE.Mesh(this.#cinta(-4, 4, 0, 0, DIV), roadMat);
        road.receiveShadow = true;
        grupo.add(road);

        const curbW  = MallaPistaDiseno.#ANCHO_PIANO;
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.3, emissive: 0xaa0000, emissiveIntensity: 0.25, side: THREE.DoubleSide });
        const whtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.2,  side: THREE.DoubleSide });
        this.#agregarPianos(grupo, -4 - curbW, -4, redMat, whtMat);
        this.#agregarPianos(grupo, 4, 4 + curbW, redMat, whtMat);

        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffee44 });
        const DASH = MallaPistaDiseno.#LARGO_RAYA, GAP = MallaPistaDiseno.#HUECO_RAYA;
        for (let i = 0; i < DIV; i += DASH + GAP) {
            grupo.add(new THREE.Mesh(this.#cinta(-0.22, 0.22, 0.03, i, Math.min(i+DASH, DIV)), dashMat));
        }
        grupo.add(new THREE.Mesh(this.#cinta(-4, 4, 0.015, 0, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })));

        return grupo;
    }

    // Vector perpendicular (en XZ) a la curva en el punto i
    #perpendicular(i) {
        const cp = this.#puntos;
        const a = cp[i], b = cp[(i + 1) % cp.length];
        let tx = b.x - a.x, tz = b.z - a.z;
        let L  = Math.sqrt(tx*tx + tz*tz);
        if (L < 0.0001) {
            const prev = cp[(i - 1 + cp.length) % cp.length];
            tx = a.x - prev.x; tz = a.z - prev.z;
            L  = Math.sqrt(tx*tx + tz*tz) || 1;
        }
        return { px: -tz / L, pz: tx / L };
    }

    // Cinta plana entre los desplazamientos lo y ro, a la altura y
    #cinta(lo, ro, y, i0, i1) {
        const cp  = this.#puntos;
        const pos = [], nor = [], uv = [], idx = [];
        for (let i = i0; i <= i1; i++) {
            const q = cp[i % cp.length];
            const { px, pz } = this.#perpendicular(i % cp.length);
            const u = (i - i0) / (i1 - i0 || 1);
            pos.push(q.x + px*lo, y, q.z + pz*lo,
                     q.x + px*ro, y, q.z + pz*ro);
            nor.push(0,1,0, 0,1,0);
            uv.push(0,u, 1,u);
        }
        for (let i = 0; i < i1 - i0; i++) {
            const a = i*2, b = a+1, c = a+2, d = a+3;
            idx.push(a,c,b, b,c,d);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx);
        return g;
    }

    // Pianos en bandas alternadas rojo/blanco entre lo y ro
    #agregarPianos(grupo, lo, ro, redMat, whtMat) {
        const cp   = this.#puntos;
        const DIV  = MallaPistaDiseno.#DIVISIONES;
        const BAND = MallaPistaDiseno.#BANDA_PIANO;
        const rPos=[], rNor=[], rIdx=[], wPos=[], wNor=[], wIdx=[];
        for (let b = 0; b * BAND <= DIV; b++) {
            const i0 = b * BAND, i1 = Math.min((b+1)*BAND, DIV);
            const pos = b%2===0 ? rPos : wPos;
            const nor = b%2===0 ? rNor : wNor;
            const idx = b%2===0 ? rIdx : wIdx;
            const v0  = pos.length / 3;
            for (let i = i0; i <= i1; i++) {
                const q = cp[i % cp.length];
                const { px, pz } = this.#perpendicular(i % cp.length);
                pos.push(q.x + px*lo, 0.04, q.z + pz*lo);
                pos.push(q.x + px*ro, 0.04, q.z + pz*ro);
                nor.push(0,1,0, 0,1,0);
            }
            for (let j = 0; j < i1-i0; j++) {
                const a = v0+j*2, b2 = a+1, c = a+2, d = a+3;
                idx.push(a,c,b2, b2,c,d);
            }
        }
        if (rPos.length) grupo.add(new THREE.Mesh(this.#geometria(rPos, rNor, rIdx), redMat));
        if (wPos.length) grupo.add(new THREE.Mesh(this.#geometria(wPos, wNor, wIdx), whtMat));
    }

    #geometria(p, n, i) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute('normal',   new THREE.Float32BufferAttribute(n, 3));
        g.setIndex(i);
        return g;
    }
}
