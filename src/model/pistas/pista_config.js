'use strict';
try {

// ================================================================
// CLASE BASE: PistaConfig — interfaz común para toda configuración de pista
// ================================================================
class PistaConfig {
    get nombre()          { return ''; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get tramos()          { return []; }
    get esTestDrive()     { return false; }
    get obstFrecuencia()  { return 0; }
    get obstTipos()       { return []; }
    get coloresTrafico()  { return []; }

    // ── Propiedades visuales del entorno ─────────────────────────
    // Cada subclase sobreescribe estos getters con sus colores propios.
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

window.PistaConfig = PistaConfig;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pista_config.js] ' + e.message);
    console.error('[pista_config.js]', e);
}
