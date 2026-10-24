'use strict';
try {

// ================================================================
// MODEL — PistaCiudad: circuito urbano con curvas y tráfico
// ================================================================
class ConfigPistaCiudad extends ConfigPista {
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
    get tramos()          { return this.#tramos; }

    get cielo()   { return ['#060a14', '#0d1b2a']; }

    // prog: 0..1 a lo largo del trazado | lado: +1 derecha / -1 izquierda | dist: metros desde el centro
    get decoraciones() {
        const dist = this._distanciaPostesYSenales();   // postes y señales (PRD 010, D7)
        return [
            ...this._flechasEnCurvas(),
            ...this._postesEnPista(2),
            { tipo: 'arbol',       prog: 0.04, lado:  1, dist: 7,   escala: 1.1 },
            { tipo: 'arbol',       prog: 0.08, lado: -1, dist: 8,   escala: 0.9 },
            { tipo: 'arbol',       prog: 0.18, lado:  1, dist: 7,   escala: 1.3 },
            { tipo: 'senal_curva', prog: 0.25, lado:  1, dist,      direccion: 'derecha'   },
            { tipo: 'arbol',       prog: 0.30, lado: -1, dist: 8,   escala: 1.0 },
            { tipo: 'senal_curva', prog: 0.43, lado:  1, dist,      direccion: 'derecha'   },
            { tipo: 'arbol',       prog: 0.42, lado:  1, dist: 7,   escala: 1.2 },
            { tipo: 'arbol',       prog: 0.50, lado: -1, dist: 7,   escala: 0.8 },
            { tipo: 'arbol',       prog: 0.68, lado:  1, dist: 8,   escala: 1.1 },
            { tipo: 'senal_curva', prog: 0.75, lado:  1, dist,      direccion: 'derecha'   },
            { tipo: 'arbol',       prog: 0.75, lado: -1, dist: 7,   escala: 1.4 },
            { tipo: 'arbol',       prog: 0.88, lado:  1, dist: 7,   escala: 1.0 },
            { tipo: 'senal_curva', prog: 0.93, lado:  1, dist,      direccion: 'derecha'   },
            { tipo: 'arbol',       prog: 0.93, lado: -1, dist: 8,   escala: 0.9 },
        ];
    }
}

window.registroPistas.registrar('ciudad', new ConfigPistaCiudad());

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/ciudad.js] ' + e.message);
    console.error('[pistas/ciudad.js]', e);
}
