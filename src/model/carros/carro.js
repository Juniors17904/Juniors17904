'use strict';

import { ConstantesFisica } from './constantes_fisica.js';
import { TransferenciaPeso } from './transferencia_peso.js';

// ================================================================
// MODEL — Carro 3D: física de manejo con tiempo real (PRD 006)
//   - El giro depende de la velocidad: detenido no gira, lento gira
//     cerrado y rápido da una curva más abierta.
//   - Al soltar el pedal frena la rodadura más el aire (crece con v²).
//   - La aceleración baja al acercarse al tope.
//   - La superficie que pisa frena con su rozamiento (PRD 008).
//   - Soltar o frenar pasa peso adelante y cierra el giro; acelerar lo
//     abre un poco (TransferenciaPeso, PRD 019).
//   - actualizar(dtMs) escala todo por el tiempo real del paso.
//   Los números viven en ConstantesFisica (uno por tipo de carro).
// ================================================================
export class Carro {
    static #MS_REFERENCIA = 1000 / 60;
    static #EMPUJE_EN_TOPE = 0.7;   // la aceleración cae un 70 % cerca del tope

    // Turbo (sin uso en 3D; fuera de alcance hasta B9)
    turboMaximo    = 3;
    turbosLeft     = 3;
    turboActivo    = false;
    turboDuracion  = 3000;
    turboMultiplicador = 1.75;

    // Entradas
    entradaAcel      = 0;
    entradaDireccion = 0;

    #constantes;
    #px; #pz; #rotY;
    #velocidad       = 0;
    #aceleracion     = 0;
    #velocidadMax    = 0;
    #carLean         = 0;
    #velAngle        = 0;
    #driftAngle      = 0;
    #turboTimer      = 0;
    #superficie      = null;   // Superficie del modelo (sin rozamiento = asfalto)
    #velocimetroModelo = 2;  // F1 por defecto
    #peso;                   // TransferenciaPeso (PRD 019)

    constructor(px = 0, pz = 0, rotY = 0, constantes = new ConstantesFisica(), transferencia = null) {
        this.#px = px; this.#pz = pz; this.#rotY = rotY;
        this.#velAngle   = rotY;
        this.#constantes = constantes instanceof ConstantesFisica ? constantes : new ConstantesFisica();
        this.#peso       = transferencia instanceof TransferenciaPeso ? transferencia : new TransferenciaPeso(this.#constantes);
    }

    get constantes()       { return this.#constantes; }
    get velMaxAdelante()   { return this.#constantes.velMaxAdelante; }
    get px()               { return this.#px; }
    get pz()               { return this.#pz; }
    get rotY()             { return this.#rotY; }
    get velAngle()         { return this.#velAngle; }
    get driftAngle()       { return this.#driftAngle; }
    get velocidad()        { return this.#velocidad; }
    get aceleracion()      { return this.#aceleracion; }
    get velocidadMax()     { return this.#velocidadMax; }
    get carLean()          { return this.#carLean; }
    // Cuánto multiplica el peso al giro ahora (solo lectura, PRD 019)
    get factorPeso()       { return this.#peso.factorGiro; }
    get velocimetroModelo()          { return this.#velocimetroModelo; }
    set velocimetroModelo(v)         { this.#velocimetroModelo = v ?? 2; }

    setPosicion(px, pz) { this.#px = px; this.#pz = pz; }

    // Superficie que calcula el modelo de la carrera (asfalto, piano o pasto)
    pisar(superficie) { this.#superficie = superficie ?? null; }

    // Choque: el modelo deja el carro fuera del objeto y le cambia la velocidad
    rebotar(px, pz, factorVelocidad) {
        this.#px = px; this.#pz = pz;
        this.#velocidad *= factorVelocidad;
    }

    activarTurbo() {
        if (this.turbosLeft > 0 && !this.turboActivo) {
            this.turboActivo  = true;
            this.#turboTimer  = this.turboDuracion;
            this.turbosLeft--;
        }
    }

    actualizar(dtMs = Carro.#MS_REFERENCIA) {
        const k = Math.min(5, Math.max(0, (Number(dtMs) || 0) / Carro.#MS_REFERENCIA));
        if (k === 0) return;
        this.#actualizarTurbo(dtMs);

        const prev = this.#velocidad;
        this.#peso.actualizar(this.entradaAcel, prev, k);
        this.#velocidad = this.#frenarPorSuperficie(this.#nuevaVelocidad(k), k);
        this.#aceleracion = this.#velocidad - prev;
        if (Math.abs(this.#velocidad) > this.#velocidadMax) this.#velocidadMax = Math.abs(this.#velocidad);

        this.#rotY -= this.#giro() * k;
        this.#seguirDerrape(k);

        this.#px += Math.sin(this.#velAngle) * this.#velocidad * k;
        this.#pz += Math.cos(this.#velAngle) * this.#velocidad * k;

        const sf = Math.abs(this.#velocidad) / this.#constantes.velMaxAdelante;
        this.#carLean += (-this.entradaDireccion * 0.22 * sf - this.#carLean) * (1 - Math.pow(0.92, k));
    }

    #actualizarTurbo(dtMs) {
        if (!this.turboActivo) return;
        this.#turboTimer -= dtMs;
        if (this.#turboTimer <= 0) this.turboActivo = false;
    }

    #nuevaVelocidad(k) {
        const c      = this.#constantes;
        const turboK = this.turboActivo ? this.turboMultiplicador : 1;
        const vMax   = c.velMaxAdelante * turboK;
        const v      = this.#velocidad;

        if (this.entradaAcel === 1) {
            const u      = Math.max(0, v) / vMax;
            const empuje = c.aceleracion * turboK / c.masa * (1 - Carro.#EMPUJE_EN_TOPE * u * u);
            return Math.min(vMax, v + empuje * k);
        }
        if (this.entradaAcel === -1) {
            if (v > 0.01) return Math.max(0, v - c.freno / c.masa * k);
            return Math.max(-c.velMaxReversa, v - c.aceleracion * 0.6 / c.masa * k);
        }
        const u = v / c.velMaxAdelante;
        const arrastre = (c.rodadura + c.aire * u * u) / c.masa * k;
        return v > 0 ? Math.max(0, v - arrastre) : Math.min(0, v + arrastre);
    }

    // Rozamiento de la superficie: proporcional al motor del carro y a su
    // velocidad, así en el pasto todos se estabilizan cerca del 40 %
    #frenarPorSuperficie(v, k) {
        const r = this.#superficie?.rozamiento ?? 0;
        if (!(r > 0) || v === 0) return v;
        const c = this.#constantes;
        const freno = r * c.aceleracion / c.masa * Math.abs(v) / c.velMaxAdelante * k;
        return v > 0 ? Math.max(0, v - freno) : Math.min(0, v + freno);
    }

    // Velocidad angular: 0 detenido, crece hasta velGiroPleno y luego
    // baja con el subviraje a alta velocidad
    #giro() {
        const c = this.#constantes;
        const v = Math.abs(this.#velocidad);
        if (v <= 0.005) return 0;
        const arranque  = Math.min(1, v / c.velGiroPleno);
        const u         = v / c.velMaxAdelante;
        const subviraje = 1 / (1 + c.subviraje * u * u);
        return this.entradaDireccion * c.direccion * arranque * subviraje * this.#peso.factorGiro * Math.sign(this.#velocidad);
    }

    // Derrape: velAngle sigue a rotY con un retraso que crece con la
    // velocidad y el giro, y baja con el agarre; frenando en curva el
    // peso adelante lo sube un poco (PRD 019)
    #seguirDerrape(k) {
        const c     = this.#constantes;
        const sf    = Math.abs(this.#velocidad) / c.velMaxAdelante;
        const grip  = 1 - sf * Math.abs(this.entradaDireccion) * 0.92 * this.#peso.factorDerrape / c.agarre;
        const f     = Math.min(0.10, Math.max(0.04, grip));
        this.#velAngle  += (this.#rotY - this.#velAngle) * (1 - Math.pow(1 - f, k));
        this.#driftAngle = this.#rotY - this.#velAngle;
    }
}
