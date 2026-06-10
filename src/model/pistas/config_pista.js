'use strict';
try {

// ================================================================
// CLASE BASE: PistaConfig — interfaz común para toda configuración de pista
// ================================================================
class ConfigPista {
    get nombre()          { return ''; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get tramos()          { return []; }
    get esTestDrive()     { return false; }
    get obstFrecuencia()  { return 0; }
    get obstTipos()       { return []; }
    get coloresTrafico()  { return []; }
    get decoraciones()    { return []; }

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
    get tipoCielo() { return 'nocturno'; }
    get cielo()   { return ['#060a14', '#0d1b2a']; }
    get cesped()  { return ['#1a5c1a', '#174d17']; }
    get asfalto() { return ['#484848', '#3d3d3d']; }
    get borde()   { return '#888'; }

    // Compatibilidad con pista.js — construido desde los getters individuales
    get nivelFijo() {
        return {
            nombre:  this.nombre,
            cielo:   this.cielo,
            cesped:  this.cesped,
            asfalto: this.asfalto,
            borde:   this.borde,
        };
    }
}

window.ConfigPista = ConfigPista;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pista_config.js] ' + e.message);
    console.error('[pista_config.js]', e);
}
