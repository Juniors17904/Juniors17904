// ================================================================
// CLASE: CarroReferenciaV1 — copia de la física de Carro ANTES del PRD 006
// (valores fijos por paso). Solo sirve para comparar en las pruebas que la
// velocidad máxima y el tiempo de vuelta del carro básico quedan dentro de
// ±10 % (PRD 006, RF-05 y RF-06).
// ================================================================
class CarroReferenciaV1 {
    entradaAcel = 0;
    entradaDireccion = 0;
    #px; #pz; #rotY; #velAngle; #velocidad = 0;

    constructor(px, pz, rotY) { this.#px = px; this.#pz = pz; this.#rotY = rotY; this.#velAngle = rotY; }

    get px()        { return this.#px; }
    get pz()        { return this.#pz; }
    get rotY()      { return this.#rotY; }
    get velocidad() { return this.#velocidad; }

    actualizar() {
        const maxFwd = 0.74;
        if (this.entradaAcel === 1) this.#velocidad = Math.min(maxFwd, this.#velocidad + 0.006);
        else if (this.entradaAcel === -1) {
            if (this.#velocidad > 0.01) this.#velocidad = Math.max(0, this.#velocidad - 0.026);
            else this.#velocidad = Math.max(-0.28, this.#velocidad - 0.006 * 0.6);
        } else if (this.#velocidad > 0) this.#velocidad = Math.max(0, this.#velocidad - 0.009);
        else this.#velocidad = Math.min(0, this.#velocidad + 0.009);

        if (Math.abs(this.#velocidad) > 0.005)
            this.#rotY -= this.entradaDireccion * 0.010 * Math.sign(this.#velocidad);
        const sf = Math.abs(this.#velocidad) / 0.74;
        const grip = 1 - sf * Math.abs(this.entradaDireccion) * 0.92;
        this.#velAngle += (this.#rotY - this.#velAngle) * Math.min(0.10, Math.max(0.04, grip));
        this.#px += Math.sin(this.#velAngle) * this.#velocidad;
        this.#pz += Math.cos(this.#velAngle) * this.#velocidad;
    }
}

module.exports = { CarroReferenciaV1 };
