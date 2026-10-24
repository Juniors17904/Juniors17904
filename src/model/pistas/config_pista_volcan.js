'use strict';
try {

// ================================================================
// MODEL — PistaVolcan: circuito volcánico de alta dificultad
// ================================================================
class ConfigPistaVolcan extends ConfigPista {
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

    get nombre()          { return 'Valle del Volcán'; }
    get totalSegs()       { return 300; }
    get tramos()          { return this.#tramos; }

    get cielo()   { return ['#1a0a00', '#3a1400']; }

    get decoraciones() {
        const dist = this._distanciaPostesYSenales();   // postes y señales (PRD 010, D7)
        return [
            ...this._flechasEnCurvas(),
            { tipo: 'senal_curva', prog: 0.05, lado: 1, dist,      direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.17, lado: 1, dist,      direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.30, lado: 1, dist,      direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.45, lado: 1, dist,      direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.58, lado: 1, dist,      direccion: 'derecha'   },
            { tipo: 'senal_curva', prog: 0.78, lado: 1, dist,      direccion: 'izquierda' },
            { tipo: 'senal_curva', prog: 0.93, lado: 1, dist,      direccion: 'derecha'   },
        ];
    }
}

window.registroPistas.registrar('volcan', new ConfigPistaVolcan());

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/pista_volcan.js] ' + e.message);
    console.error('[pistas/pista_volcan.js]', e);
}
