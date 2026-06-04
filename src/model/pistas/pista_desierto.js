'use strict';
try {

// ================================================================
// MODEL — PistaDesierto: circuito en terreno árido y seco
// ================================================================
class PistaDesierto extends PistaConfig {
    #tramos = [
        [0,   40,  0      ],
        [40,  60,  1.8    ],
        [60,  100, 0      ],
        [100, 120, -1.8   ],
        [120, 160, 0      ],
        [160, 180, 2.3271 ],
        [180, 220, 0      ],
        [220, 240, -2.3271],
        [240, 280, 0      ],
        [280, 300, 1.5    ],
    ];

    get nombre()          { return 'Autopista Solar'; }
    get totalSegs()       { return 300; }
    get distMeta()        { return 1800; }
    get tramos()          { return this.#tramos; }
    get obstFrecuencia()  { return 0.10; }
    get obstTipos()       { return ['bache','bache','carro','turbo']; }
    get coloresTrafico()  { return ['#d4a050','#c47a2b','#8b6914']; }

    get cielo()   { return ['#7c4a1e', '#c47a2b']; }
    get cesped()  { return ['#8b6914', '#7a5c10']; }
    get asfalto() { return ['#c4a44a', '#b8943a']; }
    get borde()   { return '#d4a050'; }
}

window.PISTAS.desierto = new PistaDesierto();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_desierto.js] ' + e.message);
    console.error('[pistas/pista_desierto.js]', e);
}
