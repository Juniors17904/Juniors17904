'use strict';
try {

// ================================================================
// MODEL — PistaMontana: circuito de montaña con curvas cerradas
// ================================================================
class ConfigPistaMontana extends ConfigPista {
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

    get nombre()          { return 'Cañón Rojo'; }
    get totalSegs()       { return 300; }
    get tramos()          { return this.#tramos; }

    get cielo()   { return ['#1a2a3a', '#2d4a5a']; }

    get decoraciones() {
        return [
            ...this._flechasEnCurvas(),
            { tipo: 'senal_curva', prog: 0.05, lado: 1, dist: 5.5, direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.22, lado: 1, dist: 5.5, direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.38, lado: 1, dist: 5.5, direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.58, lado: 1, dist: 5.5, direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.78, lado: 1, dist: 5.5, direccion: 'derecha'   },
        ];
    }
}

window.registroPistas.registrar('montana', new ConfigPistaMontana());

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_montana.js] ' + e.message);
    console.error('[pistas/pista_montana.js]', e);
}
