'use strict';
try {

// ================================================================
// MODEL — PistaCiudad: circuito urbano con curvas y tráfico
// ================================================================
class PistaCiudad extends PistaConfig {
    #nivelFijo = {
        nombre: 'Ciudad',
        cielo:  ['#060a14', '#0d1b2a'],
        cesped: ['#0a200a', '#081808'],
        asfalto:['#3a3a3a', '#2e2e2e'],
        borde:  '#555',
    };
    #tramos = [
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
    ];

    get nombre()          { return 'Circuito Urbano'; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get nivelFijo()       { return this.#nivelFijo; }
    get tramos()          { return this.#tramos; }
    get obstFrecuencia()  { return 0.12; }
    get obstTipos()       { return ['carro','carro','carro','bache','turbo']; }
    get coloresTrafico()  { return ['#ef4444','#3b82f6','#eab308','#6b7280','#f97316']; }
}

window.PISTAS.ciudad = new PistaCiudad();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/ciudad.js] ' + e.message);
    console.error('[pistas/ciudad.js]', e);
}
