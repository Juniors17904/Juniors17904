'use strict';

// MODEL — Carro2D: auto de la carrera pseudo-2D
// Depende de model.js (CFG) cargado antes.

try {
var CFG = window.CFG;

class Carro2D {
    #tilt = 0;

    velMaxBase = CFG.VEL_MAX;
    velAcc     = CFG.VEL_ACC;
    velFreno   = CFG.VEL_FRENO;
    turboMaximo        = CFG.TURBO_MAX;
    turboDuracion      = CFG.TURBO_DUR;
    turboMultiplicador = CFG.TURBO_MULT;

    constructor(color, distMeta = CFG.DIST_META) {
        this.color       = color;
        this.distMeta    = distMeta;
        this.velocidad   = 0;
        this.posicion    = 0;
        this.camX        = 0;
        this.giro        = 0;
        this.entradaAcel  = 1;
        this.turbosLeft  = this.turboMaximo;
        this.turboActivo = false;
        this.turboTimer  = 0;
        this.velMax      = 0;
        this.tiempoFin   = null;
    }

    activarTurbo() {
        if (this.turbosLeft <= 0) return;
        this.turbosLeft--;
        this.turboActivo = true;
        this.turboTimer  = this.turboDuracion;
    }

    update(dt, fuera) {
        try {
            if (this.turboActivo) {
                this.turboTimer -= dt;
                if (this.turboTimer <= 0) { this.turboActivo = false; this.turboTimer = 0; }
            }

            const velLimite = this.turboActivo ? this.velMaxBase * this.turboMultiplicador : this.velMaxBase;
            const freno     = fuera ? this.velFreno * 3 : this.velFreno;

            if (this.entradaAcel > 0) {
                if (this.velocidad < velLimite)
                    this.velocidad = Math.min(velLimite, this.velocidad + this.velAcc * dt * 0.06);
                else
                    this.velocidad += (velLimite - this.velocidad) * 0.05;
                if (fuera) this.velocidad = Math.max(0, this.velocidad - freno * dt * 0.06);
            } else if (this.entradaAcel < 0) {
                this.velocidad = Math.max(-(this.velMaxBase * 0.45), this.velocidad - this.velAcc * dt * 0.05);
            } else {
                this.velocidad *= Math.pow(0.97, dt * 0.06 * 10);
                if (Math.abs(this.velocidad) < 0.001) this.velocidad = 0;
            }

            this.camX += this.giro * CFG.GIRO_VEL * Math.abs(this.velocidad) * 8;
            if (this.giro === 0) this.camX *= (1 - CFG.GIRO_RETURN);
            this.camX = Math.max(-CFG.GIRO_MAX * 4, Math.min(CFG.GIRO_MAX * 4, this.camX));

            this.#tilt += (this.giro * 0.3 - this.#tilt) * 0.12;

            this.posicion += this.velocidad * dt * 0.06;
            if (this.velocidad > this.velMax) this.velMax = this.velocidad;
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[Carro2D.update] ' + e.message);
        }
    }

    get progreso() { return Math.min(1, this.posicion / this.distMeta); }
    get tilt()     { return this.#tilt; }
}

window.Carro2D = Carro2D;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[carro.js] ' + e.message);
    console.error('[carro.js]', e);
}
