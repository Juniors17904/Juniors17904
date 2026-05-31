'use strict';

// ================================================================
// MODEL — datos globales del juego (PARTE 1 de migración MVC)
// CFG, NIVELES y PISTAS se exponen en window para compatibilidad
// con game.js, app.js y pista_ciudad.js durante la transición.
// ================================================================

try {

    const CFG = {
        HORIZONTE:      0.40,
        ROAD_W:         0.86,
        STRIPS:         140,
        SEG_LARGO:      0.5,
        TOTAL_SEGS:     400,
        VEL_MAX:        0.10,
        VEL_ACC:        0.0012,
        VEL_FRENO:      0.006,
        VEL_FRICCION:   0.0015,
        GIRO_VEL:       0.06,
        GIRO_RETURN:    0.05,
        GIRO_MAX:       0.12,
        TURBO_DUR:      3000,
        TURBO_MULT:     1.75,
        TURBO_MAX:      3,
        DIST_META:      2000,
        SYNC_MS:        80,
    };

    const NIVELES = [
        { nombre: 'Ciudad',    desde: 0,    cielo: ['#0d1b2a','#1b3a4b'], cesped: ['#1a5c1a','#174d17'], asfalto: ['#484848','#3d3d3d'], borde: '#888' },
        { nombre: 'Atardecer', desde: 400,  cielo: ['#b34700','#e8762a'], cesped: ['#8a6010','#7a5210'], asfalto: ['#585040','#4a4030'], borde: '#aa9060' },
        { nombre: 'Desierto',  desde: 800,  cielo: ['#c97d00','#f5d060'], cesped: ['#c8881a','#b07010'], asfalto: ['#b0906a','#9a7a55'], borde: '#d4b080' },
        { nombre: 'Montaña',   desde: 1200, cielo: ['#1a2c40','#253c55'], cesped: ['#255a20','#1d4a18'], asfalto: ['#404040','#353535'], borde: '#707070' },
        { nombre: 'Noche',     desde: 1600, cielo: ['#060610','#0a0a20'], cesped: ['#0a1f0a','#080f08'], asfalto: ['#282828','#202020'], borde: '#404040' },
    ];

    window.CFG    = CFG;
    window.NIVELES = NIVELES;
    window.PISTAS  = {};  // cada pista se registra en src/model/pistas/

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[model.js] ' + e.message);
    console.error('[model.js]', e);
}
