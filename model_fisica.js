'use strict';
import * as THREE from 'three';

// ================================================================
// MODEL — clases de física y trazado reutilizables por cualquier pista
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

export class MovimientoLibre {
    #px; #pz; #rotY;
    #speed    = 0;
    #accel    = 0;
    #maxSpeed = 0;
    #carLean  = 0;

    accelInput = 0;
    steerInput = 0;

    constructor(px = 0, pz = 0, rotY = 0) {
        this.#px = px; this.#pz = pz; this.#rotY = rotY;
    }

    get px()       { return this.#px; }
    get pz()       { return this.#pz; }
    get rotY()     { return this.#rotY; }
    get speed()    { return this.#speed; }
    get accel()    { return this.#accel; }
    get maxSpeed() { return this.#maxSpeed; }
    get carLean()  { return this.#carLean; }

    setPosicion(px, pz) { this.#px = px; this.#pz = pz; }

    actualizar() {
        try {
            const MAX_FWD = 0.74, MAX_REV = 0.28, ACCEL = 0.006, BRAKE = 0.026, DRAG = 0.009;
            const prev = this.#speed;

            if (this.accelInput === 1)
                this.#speed = Math.min(MAX_FWD, this.#speed + ACCEL);
            else if (this.accelInput === -1) {
                if (this.#speed > 0.01) this.#speed = Math.max(0, this.#speed - BRAKE);
                else                    this.#speed = Math.max(-MAX_REV, this.#speed - ACCEL * 0.6);
            } else {
                if (this.#speed > 0) this.#speed = Math.max(0, this.#speed - DRAG);
                else                 this.#speed = Math.min(0, this.#speed + DRAG);
            }
            this.#accel = this.#speed - prev;
            if (Math.abs(this.#speed) > this.#maxSpeed) this.#maxSpeed = Math.abs(this.#speed);

            if (Math.abs(this.#speed) > 0.005)
                this.#rotY -= this.steerInput * 0.010 * Math.sign(this.#speed);

            this.#px += Math.sin(this.#rotY) * this.#speed;
            this.#pz += Math.cos(this.#rotY) * this.#speed;

            const sf = Math.abs(this.#speed) / 0.74;
            this.#carLean += (-this.steerInput * 0.22 * sf - this.#carLean) * 0.08;
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[MovimientoLibre.actualizar] ' + e.message);
            console.error('[MovimientoLibre.actualizar]', e);
        }
    }
}
