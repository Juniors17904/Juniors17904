'use strict';
try {

// ================================================================
// CLASE BASE: PistaConfig — interfaz común para toda configuración de pista
// ================================================================
class ConfigPista {
    get nombre()          { return ''; }
    get totalSegs()       { return 300; }
    get tramos()          { return []; }
    get decoraciones()    { return []; }

    // Metros del centro de la pista a postes y señales de curva (PRD 010, D5 y D7).
    // Se lee de MedidasEscena recién al pedir las decoraciones: las pistas se
    // cargan antes que MedidasEscena, así que no se lee al crearlas.
    _distanciaPostesYSenales() {
        return new window.MedidasEscena().distanciaPostesYSenales;
    }

    // Genera postes de alumbrado cada `cadaSegs` segmentos, alternando lados.
    // Las subclases llaman this._postesEnPista() en su get decoraciones().
    _postesEnPista(cadaSegs = 2) {
        const dist = this._distanciaPostesYSenales();
        const resultado = [];
        let idx = 0;
        for (let i = 0; i < this.totalSegs; i += cadaSegs) {
            const prog   = i / this.totalSegs;
            const lado   = (idx % 2 === 0) ? 1 : -1;
            const conLuz = (Math.floor(idx / 2) % 4 === 0);
            if (conLuz) resultado.push({ tipo: 'poste', prog, lado, dist, conLuz });
            idx++;
        }
        return resultado;
    }

    // Genera entradas de flecha para cada segmento de curva.
    // Las subclases llaman this._flechasEnCurvas() en su get decoraciones().
    _flechasEnCurvas() {
        const paso = 0.30;
        const resultado = [];
        for (const [ini, fin, curva] of this.tramos) {
            if (curva === 0) continue;
            const lado  = curva > 0 ? -1 : 1;
            const largo = fin - ini;
            const desde = ini + largo * 0.125;
            const hasta = fin - largo * 0.125;
            for (let s = desde; s <= hasta; s += paso) {
                resultado.push({ tipo: 'flecha', prog: Math.min(s / this.totalSegs, 0.999), lado, dist: 4.3 });
            }
        }
        return resultado;
    }

    // ── Propiedades visuales del entorno ─────────────────────────
    // Cada subclase sobreescribe estos getters con sus colores propios.
    get tipoCielo()  { return 'nocturno'; }
    get esNocturno() { return this.tipoCielo !== 'soleado'; }
    get cielo()      { return ['#060a14', '#0d1b2a']; }
}

window.ConfigPista = ConfigPista;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pista_config.js] ' + e.message);
    console.error('[pista_config.js]', e);
}
