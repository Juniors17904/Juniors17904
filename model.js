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

    const PISTAS = {
        ciudad: {
            nombre:    'Circuito Urbano',
            totalSegs: 300,
            distMeta:  1800,
            nivelFijo: { nombre:'Ciudad', cielo:['#060a14','#0d1b2a'], cesped:['#0a200a','#081808'], asfalto:['#3a3a3a','#2e2e2e'], borde:'#555' },
            tramos: [
                [0,   25,  0      ],
                [25,  40,  -1.5   ],
                [40,  55,  1.5    ],
                [55,  80,  0      ],
                [80,  95,  2.3271 ],
                [95,  135, 0      ],
                [135, 150, 2.3271 ],
                [150, 175, 0      ],
                [175, 190, -1.5   ],
                [190, 205, 1.5    ],
                [205, 230, 0      ],
                [230, 245, 2.3271 ],
                [245, 285, 0      ],
                [285, 300, 2.3271 ],
            ],
            obstFrecuencia: 0.12,
            obstTipos: ['carro','carro','carro','bache','turbo'],
            coloresTrafico: ['#ef4444','#3b82f6','#eab308','#6b7280','#f97316'],
        },
        testdrive: {
            nombre:    'Test Drive',
            totalSegs: 80,
            distMeta:  Infinity,
            nivelFijo: { nombre:'Test', cielo:['#0d1b2a','#1b3a4b'], cesped:['#1a5c1a','#174d17'], asfalto:['#484848','#3d3d3d'], borde:'#888' },
            tramos:    [],
            esTestDrive: true,
        },
    };

    window.CFG    = CFG;
    window.NIVELES = NIVELES;
    window.PISTAS  = PISTAS;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[model.js] ' + e.message);
    console.error('[model.js]', e);
}
