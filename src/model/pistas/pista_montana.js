'use strict';
try {

// ================================================================
// MODEL — PistaMontana: circuito de montaña con curvas cerradas
// ================================================================
class PistaMontana extends PistaConfig {
    #nivelFijo = {
        nombre: 'Montaña',
        cielo:  ['#1a2a3a', '#2d4a5a'],
        cesped: ['#1a3a1a', '#2d5a2d'],
        asfalto:['#5a5a5a', '#4a4a4a'],
        borde:  '#888',
    };
    #tramos = [
        [0,   20,  0      ],
        [20,  40,  2.8    ],
        [40,  70,  0      ],
        [70,  90,  -2.8   ],
        [90,  120, 0      ],
        [120, 140, 2.3271 ],
        [140, 180, 0      ],
        [180, 200, -2.3271],
        [200, 240, 0      ],
        [240, 260, 2.8    ],
        [260, 300, 0      ],
    ];

    get nombre()          { return 'Montaña'; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get nivelFijo()       { return this.#nivelFijo; }
    get tramos()          { return this.#tramos; }
    get obstFrecuencia()  { return 0.08; }
    get obstTipos()       { return ['bache','carro','turbo']; }
    get coloresTrafico()  { return ['#6b7280','#4a5568','#718096']; }
}

window.PISTAS.montana = new PistaMontana();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_montana.js] ' + e.message);
    console.error('[pistas/pista_montana.js]', e);
}
