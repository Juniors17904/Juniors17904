'use strict';
try {

// ================================================================
// MODEL — PistaCosta: circuito costero con curvas suaves
// ================================================================
class PistaCosta extends PistaConfig {
    #nivelFijo = {
        nombre: 'Costa',
        cielo:  ['#0a3a6a', '#1a6aaa'],
        cesped: ['#0a4a2a', '#0a6a3a'],
        asfalto:['#4a6a8a', '#3a5a7a'],
        borde:  '#6ab4e8',
    };
    #tramos = [
        [0,   30,  0      ],
        [30,  50,  1.2    ],
        [50,  90,  0      ],
        [90,  110, -1.2   ],
        [110, 150, 0      ],
        [150, 170, 1.8    ],
        [170, 210, 0      ],
        [210, 230, -1.8   ],
        [230, 270, 0      ],
        [270, 290, 1.2    ],
        [290, 300, 0      ],
    ];

    get nombre()          { return 'Costa'; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get nivelFijo()       { return this.#nivelFijo; }
    get tramos()          { return this.#tramos; }
    get obstFrecuencia()  { return 0.09; }
    get obstTipos()       { return ['carro','carro','turbo','bache']; }
    get coloresTrafico()  { return ['#3b82f6','#0ea5e9','#06b6d4','#6b7280']; }
}

window.PISTAS.costa = new PistaCosta();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_costa.js] ' + e.message);
    console.error('[pistas/pista_costa.js]', e);
}
