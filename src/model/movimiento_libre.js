'use strict';

// ================================================================
// MODEL — MovimientoLibre: física de movimiento libre en 3D
// ================================================================

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
