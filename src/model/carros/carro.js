'use strict';

// ================================================================
// MODEL — Carro 3D (física de movimiento libre)
// Reemplaza MovimientoLibre para los modos 3D (ManejoLibre3D, CircuitoUrbano).
// Misma interfaz pública que MovimientoLibre + turbo.
// ================================================================

export class Carro {
    // Física configurable (pueden sobreescribirse en subclases)
    velMaxAdelante = 0.74;
    velMaxReversa  = 0.28;
    constAceleracion = 0.006;
    constFreno     = 0.026;
    constArrastre  = 0.009;
    constDireccion = 0.010;

    // Turbo
    turboMaximo    = 3;
    turbosLeft     = 3;
    turboActivo    = false;
    turboDuracion  = 3000;
    turboMultiplicador = 1.75;

    // Inputs
    entradaAcel      = 0;
    entradaDireccion = 0;

    #px; #pz; #rotY;
    #velocidad       = 0;
    #aceleracion     = 0;
    #velocidadMax    = 0;
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
    get velocidad()        { return this.#velocidad; }
    get aceleracion()      { return this.#aceleracion; }
    get velocidadMax()     { return this.#velocidadMax; }
    get carLean()          { return this.#carLean; }
    get velocimetroModelo()          { return this.#velocimetroModelo; }
    set velocimetroModelo(v)         { this.#velocimetroModelo = v ?? 2; }

    setPosicion(px, pz) { this.#px = px; this.#pz = pz; }

    activarTurbo() {
        if (this.turbosLeft > 0 && !this.turboActivo) {
            this.turboActivo  = true;
            this.#turboTimer  = this.turboDuracion;
            this.turbosLeft--;
        }
    }

    actualizar(dt = 16) {
        if (this.turboActivo) {
            this.#turboTimer -= dt;
            if (this.#turboTimer <= 0) this.turboActivo = false;
        }
        const turboK = this.turboActivo ? this.turboMultiplicador : 1;
        const maxFwd = this.velMaxAdelante * turboK;
        const prev   = this.#velocidad;

        if (this.entradaAcel === 1)
            this.#velocidad = Math.min(maxFwd, this.#velocidad + this.constAceleracion * turboK);
        else if (this.entradaAcel === -1) {
            if (this.#velocidad > 0.01) this.#velocidad = Math.max(0, this.#velocidad - this.constFreno);
            else                        this.#velocidad = Math.max(-this.velMaxReversa, this.#velocidad - this.constAceleracion * 0.6);
        } else {
            if (this.#velocidad > 0) this.#velocidad = Math.max(0, this.#velocidad - this.constArrastre);
            else                     this.#velocidad = Math.min(0, this.#velocidad + this.constArrastre);
        }

        this.#aceleracion = this.#velocidad - prev;
        if (Math.abs(this.#velocidad) > this.#velocidadMax) this.#velocidadMax = Math.abs(this.#velocidad);

        if (Math.abs(this.#velocidad) > 0.005)
            this.#rotY -= this.entradaDireccion * this.constDireccion * Math.sign(this.#velocidad);

        // Derrape: velAngle sigue a rotY con lag proporcional a velocidad y giro
        const sf = Math.abs(this.#velocidad) / this.velMaxAdelante;
        const grip = 1 - sf * Math.abs(this.entradaDireccion) * 0.92;
        this.#velAngle += (this.#rotY - this.#velAngle) * Math.min(0.10, Math.max(0.04, grip));
        this.#driftAngle = this.#rotY - this.#velAngle;

        this.#px += Math.sin(this.#velAngle) * this.#velocidad;
        this.#pz += Math.cos(this.#velAngle) * this.#velocidad;

        this.#carLean += (-this.entradaDireccion * 0.22 * sf - this.#carLean) * 0.08;
    }
}

// CarroDeportivo → carro_deportivo.js
// CarroSUV       → carro_suv.js
// CarroMusculo   → carro_musculo.js
