'use strict';
import * as THREE from 'three';

// ================================================================
// MODEL — Ruta: trazado CatmullRom para pistas 3D
// ================================================================

export class Ruta {
    #curve        = null;
    #longitud     = 0;
    #anguloInicio = 0;

    get longitud() { return this.#longitud; }
    get curve()    { return this.#curve; }
    get inicio() {
        const p = this.#curve.getPoint(0);
        return { x: p.x, z: p.z, angle: this.#anguloInicio };
    }

    construir(tramos, totalSegs) {
        try {
            const paso = 4;
            let x = 0, z = 0, angle = 0;
            const pts = [];
            for (let i = 0; i < totalSegs; i++) {
                const tr = tramos.find(([d, h]) => i >= d && i < h);
                angle += (tr ? tr[2] : 0) * 0.045;
                x += Math.sin(angle) * paso;
                z += Math.cos(angle) * paso;
                pts.push(new THREE.Vector3(x, 0, z));
                if (i === 0) this.#anguloInicio = angle;
            }
            this.#curve    = new THREE.CatmullRomCurve3(pts, true);
            this.#longitud = this.#curve.getLength();
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[Ruta.construir] ' + e.message);
            console.error('[Ruta.construir]', e);
        }
    }

    posicionEn(prog) {
        try {
            const t = ((prog % 1) + 1) % 1;
            const p = this.#curve.getPoint(t);
            const d = this.#curve.getTangent(t);
            return { x: p.x, z: p.z, angle: Math.atan2(d.x, d.z) };
        } catch (e) {
            return { x: 0, z: 0, angle: 0 };
        }
    }

    muestras(n) {
        return Array.from({ length: n }, (_, i) => this.posicionEn(i / n));
    }
}
