'use strict';
try {

// ================================================================
// MODEL — FlechasCierre: las flechas de las curvas del camino de vuelta
// (PRD 014, D5). Busca los tramos que doblan, y en cada uno pone flechas
// del lado de afuera, con la distancia y el paso de MedidasEscena, en el
// 75 % del medio de la curva (como ConfigPista._flechasEnCurvas).
// Devuelve decoraciones con el mismo formato que las de las pistas
// (excepción del PRD 010, D7, ampliada por el PRD 014, D5). Su "prog" es
// el índice de punto dividido por los puntos de la pista: pasa de 1.
// ================================================================
class FlechasCierre {
    static #VECINOS = 2;   // puntos a cada lado para medir el giro

    #decoraciones = [];

    // poses: PoseCierre del camino de vuelta; puntosPista: cuántos puntos tiene la pista
    constructor(poses, puntosPista, medidas = new window.MedidasEscena()) {
        const paso = medidas.largoSegmentoRuta;
        const giro = poses.map((_, i) => this.#giroEn(poses, i, paso, medidas.radioCurvaFlechas));
        let i = 0;
        while (i < poses.length) {
            if (giro[i] === 0) { i++; continue; }
            const lado = giro[i] > 0 ? -1 : 1;   // dobla a la derecha → flechas a la izquierda (afuera)
            let j = i;
            while (j < poses.length && giro[j] === giro[i]) j++;
            this.#ponerFlechas(i, j, lado, puntosPista, medidas);
            i = j;
        }
    }

    get decoraciones() { return this.#decoraciones.map(d => ({ ...d })); }

    // +1 si en el punto i el camino dobla a la derecha, -1 a la izquierda, 0 si va derecho
    #giroEn(poses, i, paso, radioCurva) {
        const v = FlechasCierre.#VECINOS;
        const a = poses[Math.max(0, i - v)], b = poses[Math.min(poses.length - 1, i + v)];
        let d = b.rumbo - a.rumbo;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        const largo = (Math.min(poses.length - 1, i + v) - Math.max(0, i - v)) * paso;
        if (Math.abs(d) < 1e-9 || largo / Math.abs(d) > radioCurva) return 0;
        return Math.sign(d);
    }

    #ponerFlechas(desde, hasta, lado, puntosPista, medidas) {
        const paso = medidas.largoSegmentoRuta;
        if ((hasta - desde) * paso < medidas.largoMinimoCurva) return;
        const largo = hasta - desde;
        const inicio = desde + largo * 0.125, fin = hasta - 1 - largo * 0.125;
        const pasoPuntos = medidas.pasoFlechas / paso;
        for (let k = inicio; k <= fin; k += pasoPuntos) {
            // El punto k del camino de vuelta es el punto (puntosPista + k) de la vuelta
            this.#decoraciones.push({ tipo: 'flecha', prog: (puntosPista + k) / puntosPista, lado, dist: medidas.distanciaFlechas });
        }
    }
}

window.FlechasCierre = FlechasCierre;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[flechas_cierre.js] ' + e.message);
    console.error('[flechas_cierre.js]', e);
}
