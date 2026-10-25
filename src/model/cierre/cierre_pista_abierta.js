'use strict';
try {

// ================================================================
// MODEL — CierrePistaAbierta: el camino de vuelta de una pista abierta
// (PRD 014, D3 a D6). Sale del final de la pista con su rumbo, la rodea
// por fuera (ContornoPista) y entra a la largada con su rumbo, encadenando
// TrayectoDubins con curvas de radio mínimo. Prueba los dos sentidos y se
// queda con el más corto que no se acerca a la pista; si ninguno cumple,
// "valido" es false y TrazadoVuelta lo avisa. Las medidas salen de MedidasEscena.
// ================================================================
class CierrePistaAbierta {
    #poses = [];               // PoseCierre del camino de vuelta, sin la largada
    #largo = 0;
    #distanciaMinima = Infinity;
    #valido = false;

    constructor(puntos, medidas = new window.MedidasEscena()) {
        const N = puntos.length;
        const fin    = this.#pose(puntos, N - 1, N - 2, N - 1);
        const inicio = this.#pose(puntos, 0, 0, 1);
        const contorno = new window.ContornoPista(puntos, medidas.separacionContorno, 0, N - 1);
        let mejor = null;
        for (const sentido of [1, -1]) {
            const intermedias = contorno.recorrido(N - 1, 0, sentido, medidas.margenCierre);
            const camino = this.#encadenar([fin, ...intermedias, inicio], medidas);
            const cerca = this.#distanciaMinimaA(camino, puntos, medidas.distanciaUnionCierre, medidas.largoSegmentoRuta);
            const largo = camino.length * medidas.largoSegmentoRuta;
            const valido = cerca >= medidas.distanciaMinimaCierre;
            if (!mejor || (valido && (!mejor.valido || largo < mejor.largo)) || (!valido && !mejor.valido && cerca > mejor.cerca)) {
                mejor = { camino, largo, cerca, valido };
            }
        }
        this.#poses = mejor.camino.slice(0, -1);   // la última es la largada, que ya está en la pista
        this.#largo = mejor.largo;
        this.#distanciaMinima = mejor.cerca;
        this.#valido = mejor.valido && contorno.tiene(0) && contorno.tiene(N - 1);
    }

    get poses()           { return [...this.#poses]; }
    get largo()           { return this.#largo; }
    get distanciaMinima() { return this.#distanciaMinima; }
    // false si la pista no se puede rodear por fuera (sus puntas no están en el
    // borde de afuera) o si el camino de vuelta pasa demasiado cerca de ella
    get valido()          { return this.#valido; }

    #pose(puntos, i, a, b) {
        return new window.PoseCierre(puntos[i][0], puntos[i][1],
            Math.atan2(puntos[b][0] - puntos[a][0], puntos[b][1] - puntos[a][1]));
    }

    // Une las poses con trayectos de radio mínimo, muestreados cada segmento de ruta
    #encadenar(poses, medidas) {
        const camino = [];
        for (let i = 0; i + 1 < poses.length; i++) {
            const tramo = new window.TrayectoDubins(poses[i], poses[i + 1], medidas.radioMinimoCierre);
            camino.push(...tramo.muestrear(medidas.largoSegmentoRuta));
        }
        return camino;
    }

    // Lo más cerca que el camino pasa de la pista, sin contar las uniones
    #distanciaMinimaA(camino, puntos, union, paso) {
        const saltar = Math.ceil(union / paso);
        let minimo = Infinity;
        for (let k = saltar; k < camino.length - saltar; k++) {
            const p = camino[k];
            for (const q of puntos) {
                const d = Math.hypot(q[0] - p.x, q[1] - p.z);
                if (d < minimo) minimo = d;
            }
        }
        return minimo;
    }
}

window.CierrePistaAbierta = CierrePistaAbierta;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[cierre_pista_abierta.js] ' + e.message);
    console.error('[cierre_pista_abierta.js]', e);
}
