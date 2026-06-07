'use strict';

// ================================================================
// MODEL — MovimientoLibre: física de movimiento libre en 3D
// ================================================================

export class MovimientoLibre {
    #px; #pz; #rotY;
    #velInterna    = 0;
    #acelInterna   = 0;
    #velMaxInterna = 0;
    #carLean  = 0;

    entradaAcel      = 0;
    entradaDireccion = 0;

    constructor(px = 0, pz = 0, rotY = 0) {
        this.#px = px; this.#pz = pz; this.#rotY = rotY;
    }

    get px()       { return this.#px; }
    get pz()       { return this.#pz; }
    get rotY()     { return this.#rotY; }
    get velocidad()    { return this.#velInterna; }
    get aceleracion()  { return this.#acelInterna; }
    get velocidadMax() { return this.#velMaxInterna; }
    get carLean()  { return this.#carLean; }

    setPosicion(px, pz) { this.#px = px; this.#pz = pz; }

    actualizar() {
        try {
            const MAX_FWD = 0.74, MAX_REV = 0.28, ACCEL = 0.006, BRAKE = 0.026, DRAG = 0.009;
            const prev = this.#velInterna;

            if (this.entradaAcel === 1)
                this.#velInterna = Math.min(MAX_FWD, this.#velInterna + ACCEL);
            else if (this.entradaAcel === -1) {
                if (this.#velInterna > 0.01) this.#velInterna = Math.max(0, this.#velInterna - BRAKE);
                else                    this.#velInterna = Math.max(-MAX_REV, this.#velInterna - ACCEL * 0.6);
            } else {
                if (this.#velInterna > 0) this.#velInterna = Math.max(0, this.#velInterna - DRAG);
                else                 this.#velInterna = Math.min(0, this.#velInterna + DRAG);
            }
            this.#acelInterna = this.#velInterna - prev;
            if (Math.abs(this.#velInterna) > this.#velMaxInterna) this.#velMaxInterna = Math.abs(this.#velInterna);

            if (Math.abs(this.#velInterna) > 0.005)
                this.#rotY -= this.entradaDireccion * 0.010 * Math.sign(this.#velInterna);

            this.#px += Math.sin(this.#rotY) * this.#velInterna;
            this.#pz += Math.cos(this.#rotY) * this.#velInterna;

            const sf = Math.abs(this.#velInterna) / 0.74;
            this.#carLean += (-this.entradaDireccion * 0.22 * sf - this.#carLean) * 0.08;
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[MovimientoLibre.actualizar] ' + e.message);
            console.error('[MovimientoLibre.actualizar]', e);
        }
    }
}
