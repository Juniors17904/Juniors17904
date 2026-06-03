'use strict';

// ================================================================
// MODEL — Carro 3D (física de movimiento libre)
// Reemplaza MovimientoLibre para los modos 3D (ManejoLibre3D, CircuitoUrbano).
// Misma interfaz pública que MovimientoLibre + turbo.
// ================================================================

export class Carro {
    // Física configurable (pueden sobreescribirse en subclases)
    maxFwd     = 0.74;
    maxRev     = 0.28;
    accelConst = 0.006;
    brakeConst = 0.026;
    dragConst  = 0.009;
    steerConst = 0.010;

    // Turbo
    turboMax    = 3;
    turbosLeft  = 3;
    turboActivo = false;
    turboDur    = 3000;
    turboMult   = 1.75;

    // Inputs
    accelInput = 0;
    steerInput = 0;

    #px; #pz; #rotY;
    #speed           = 0;
    #accelVal        = 0;
    #maxSpeed        = 0;
    #carLean         = 0;
    #velAngle        = 0;
    #driftAngle      = 0;
    #turboTimer      = 0;
    #velocimetroModelo = 2;  // F1 por defecto

    constructor(px = 0, pz = 0, rotY = 0) {
        this.#px = px; this.#pz = pz; this.#rotY = rotY;
        this.#velAngle = rotY;
    }

    get px()               { return this.#px; }
    get pz()               { return this.#pz; }
    get rotY()             { return this.#rotY; }
    get velAngle()         { return this.#velAngle; }
    get driftAngle()       { return this.#driftAngle; }
    get speed()            { return this.#speed; }
    get accel()            { return this.#accelVal; }
    get maxSpeed()         { return this.#maxSpeed; }
    get carLean()          { return this.#carLean; }
    get velocimetroModelo()          { return this.#velocimetroModelo; }
    set velocimetroModelo(v)         { this.#velocimetroModelo = v ?? 2; }

    setPosicion(px, pz) { this.#px = px; this.#pz = pz; }

    activarTurbo() {
        if (this.turbosLeft > 0 && !this.turboActivo) {
            this.turboActivo  = true;
            this.#turboTimer  = this.turboDur;
            this.turbosLeft--;
        }
    }

    actualizar(dt = 16) {
        if (this.turboActivo) {
            this.#turboTimer -= dt;
            if (this.#turboTimer <= 0) this.turboActivo = false;
        }
        const turboK = this.turboActivo ? this.turboMult : 1;
        const maxFwd = this.maxFwd * turboK;
        const prev   = this.#speed;

        if (this.accelInput === 1)
            this.#speed = Math.min(maxFwd, this.#speed + this.accelConst * turboK);
        else if (this.accelInput === -1) {
            if (this.#speed > 0.01) this.#speed = Math.max(0, this.#speed - this.brakeConst);
            else                    this.#speed = Math.max(-this.maxRev, this.#speed - this.accelConst * 0.6);
        } else {
            if (this.#speed > 0) this.#speed = Math.max(0, this.#speed - this.dragConst);
            else                 this.#speed = Math.min(0, this.#speed + this.dragConst);
        }

        this.#accelVal = this.#speed - prev;
        if (Math.abs(this.#speed) > this.#maxSpeed) this.#maxSpeed = Math.abs(this.#speed);

        if (Math.abs(this.#speed) > 0.005)
            this.#rotY -= this.steerInput * this.steerConst * Math.sign(this.#speed);

        // Derrape: velAngle sigue a rotY con lag proporcional a velocidad y giro
        const sf = Math.abs(this.#speed) / this.maxFwd;
        const grip = 1 - sf * Math.abs(this.steerInput) * 0.92;
        this.#velAngle += (this.#rotY - this.#velAngle) * Math.min(0.10, Math.max(0.04, grip));
        this.#driftAngle = this.#rotY - this.#velAngle;

        this.#px += Math.sin(this.#velAngle) * this.#speed;
        this.#pz += Math.cos(this.#velAngle) * this.#speed;

        this.#carLean += (-this.steerInput * 0.22 * sf - this.#carLean) * 0.08;
    }
}

export class CarroDeportivo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.maxFwd    = 0.92;
        this.accelConst = 0.007;
        this.steerConst = 0.012;
        this.turboMax    = 2;
        this.turbosLeft  = 2;
    }
}

export class CarroSUV extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.maxFwd    = 0.60;
        this.accelConst = 0.005;
        this.dragConst  = 0.010;
        this.turboMax    = 4;
        this.turbosLeft  = 4;
    }
}

export class CarroMusculo extends Carro {
    constructor(px = 0, pz = 0, rotY = 0) {
        super(px, pz, rotY);
        this.maxFwd    = 1.00;
        this.accelConst = 0.009;
        this.steerConst = 0.007;
        this.turboMax    = 2;
        this.turbosLeft  = 2;
    }
}
