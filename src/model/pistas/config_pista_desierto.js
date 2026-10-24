'use strict';
try {

// ================================================================
// MODEL — PistaDesierto: circuito en terreno árido y seco
// ================================================================
class ConfigPistaDesierto extends ConfigPista {
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
    get tramos()          { return this.#tramos; }

    get tipoCielo() { return 'soleado'; }
    get cielo()   { return ['#7c4a1e', '#c47a2b']; }

    get decoraciones() {
        return [
            ...this._flechasEnCurvas(),
            { tipo: 'senal_curva', prog: 0.12, lado: 1, dist: 5.5, direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.32, lado: 1, dist: 5.5, direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.52, lado: 1, dist: 5.5, direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.72, lado: 1, dist: 5.5, direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.92, lado: 1, dist: 5.5, direccion: 'derecha'   },
        ];
    }
}

window.registroPistas.registrar('desierto', new ConfigPistaDesierto());

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_desierto.js] ' + e.message);
    console.error('[pistas/pista_desierto.js]', e);
}
