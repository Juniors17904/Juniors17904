'use strict';
try {

// ================================================================
// MODEL — PistaCosta: circuito costero con curvas suaves
// ================================================================
class ConfigPistaCosta extends ConfigPista {
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

    get nombre()          { return 'Costa Neón'; }
    get totalSegs()       { return 300; }
    get tramos()          { return this.#tramos; }

    get tipoCielo() { return 'soleado'; }
    get cielo()   { return ['#0a3a6a', '#1a6aaa']; }

    get decoraciones() {
        return [
            ...this._flechasEnCurvas(),
            { tipo: 'senal_curva', prog: 0.08, lado: 1, dist: 5.5, direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.28, lado: 1, dist: 5.5, direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.48, lado: 1, dist: 5.5, direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.68, lado: 1, dist: 5.5, direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.88, lado: 1, dist: 5.5, direccion: 'derecha'   },
        ];
    }
}

window.registroPistas.registrar('costa', new ConfigPistaCosta());

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_costa.js] ' + e.message);
    console.error('[pistas/pista_costa.js]', e);
}
