'use strict';
try {

// ================================================================
// MODEL — PistaVolcan: circuito volcánico de alta dificultad
// ================================================================
class PistaVolcan extends PistaConfig {
    #nivelFijo = {
        nombre: 'Volcán',
        cielo:  ['#1a0a00', '#3a1400'],
        cesped: ['#2a0a00', '#1a0800'],
        asfalto:['#3a2a2a', '#2a1a1a'],
        borde:  '#ef4444',
    };
    #tramos = [
        [0,   20,  0      ],
        [20,  35,  2.3271 ],
        [35,  55,  0      ],
        [55,  70,  -2.3271],
        [70,  95,  0      ],
        [95,  110, 2.8    ],
        [110, 140, 0      ],
        [140, 155, -2.8   ],
        [155, 180, 0      ],
        [180, 200, 2.3271 ],
        [200, 240, 0      ],
        [240, 260, -2.3271],
        [260, 285, 0      ],
        [285, 300, 2.3271 ],
    ];

    get nombre()          { return 'Volcán'; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get nivelFijo()       { return this.#nivelFijo; }
    get tramos()          { return this.#tramos; }
    get obstFrecuencia()  { return 0.15; }
    get obstTipos()       { return ['bache','bache','carro','carro','turbo']; }
    get coloresTrafico()  { return ['#ef4444','#dc2626','#f97316','#6b7280']; }
}

window.PISTAS.volcan = new PistaVolcan();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_volcan.js] ' + e.message);
    console.error('[pistas/pista_volcan.js]', e);
}
