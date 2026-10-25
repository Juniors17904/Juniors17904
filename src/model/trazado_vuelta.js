'use strict';
try {

// ================================================================
// MODEL — TrazadoVuelta: los puntos de una vuelta entera de una pista,
// separados un segmento de ruta (PRD 014, D9). Primero el trazado propio
// de la pista, armado con sus tramos; si la pista es abierta (termina
// lejos de la largada), después el camino de vuelta (CierrePistaAbierta)
// con sus flechas (FlechasCierre). Lo usan Ruta y los minimapas, así
// todas las pantallas dibujan el mismo recorrido.
// ================================================================
class TrazadoVuelta {
    static #GIRO_POR_CURVA = 0.045;   // radianes que gira cada segmento por unidad de curva

    #puntos = [];          // [x, z] de toda la vuelta
    #puntosPista = 0;      // los primeros, que son la pista
    #anguloInicio = 0;
    #flechas = [];

    constructor(tramos, totalSegs, medidas = new window.MedidasEscena()) {
        const paso = medidas.largoSegmentoRuta;
        let x = 0, z = 0, angulo = 0;
        for (let i = 0; i < totalSegs; i++) {
            const tramo = tramos.find(([desde, hasta]) => i >= desde && i < hasta);
            angulo += (tramo ? tramo[2] : 0) * TrazadoVuelta.#GIRO_POR_CURVA;
            x += Math.sin(angulo) * paso;
            z += Math.cos(angulo) * paso;
            this.#puntos.push([x, z]);
            if (i === 0) this.#anguloInicio = angulo;
        }
        this.#puntosPista = this.#puntos.length;
        if (this.#puntos.length < 3) return;
        const [fx, fz] = this.#puntos[this.#puntos.length - 1], [ix, iz] = this.#puntos[0];
        if (Math.hypot(fx - ix, fz - iz) <= medidas.distanciaPistaAbierta) return;   // pista cerrada (Ciudad)

        const cierre = new window.CierrePistaAbierta(this.#puntos, medidas);
        if (!cierre.valido) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[TrazadoVuelta] el camino de vuelta no puede rodear la pista sin acercarse a ella');
            console.warn('[TrazadoVuelta] el camino de vuelta no puede rodear la pista sin acercarse a ella');
        }
        const poses = cierre.poses;
        this.#puntos.push(...poses.map(p => [p.x, p.z]));
        this.#flechas = new window.FlechasCierre(poses, this.#puntosPista, medidas).decoraciones;
    }

    get puntos()       { return this.#puntos.map(p => [...p]); }
    get puntosPista()  { return this.#puntosPista; }
    get abierta()      { return this.#puntos.length > this.#puntosPista; }
    get anguloInicio() { return this.#anguloInicio; }
    // Flechas del camino de vuelta, con el formato de las decoraciones de las pistas
    get flechasCierre() { return this.#flechas.map(d => ({ ...d })); }
}

window.TrazadoVuelta = TrazadoVuelta;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[trazado_vuelta.js] ' + e.message);
    console.error('[trazado_vuelta.js]', e);
}
