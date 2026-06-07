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
    get distMeta()        { return 1800; }
    get tramos()          { return this.#tramos; }
    get obstFrecuencia()  { return 0.12; }
    get obstTipos()       { return ['carro','carro','carro','bache','turbo']; }
    get coloresTrafico()  { return ['#ef4444','#3b82f6','#eab308','#6b7280','#f97316']; }

    get cielo()   { return ['#060a14', '#0d1b2a']; }
    get cesped()  { return ['#0a200a', '#081808']; }
    get asfalto() { return ['#3a3a3a', '#2e2e2e']; }
    get borde()   { return '#555'; }

    // prog: 0..1 a lo largo del trazado | lado: +1 derecha / -1 izquierda | dist: metros desde el centro
    get decoraciones() {
        return [
            { tipo: 'arbol', prog: 0.04, lado:  1, dist: 7,   escala: 1.1 },
            { tipo: 'arbol', prog: 0.08, lado: -1, dist: 8,   escala: 0.9 },
            { tipo: 'poste', prog: 0.11, lado:  1, dist: 5.5              },
            { tipo: 'arbol', prog: 0.18, lado:  1, dist: 7,   escala: 1.3 },
            { tipo: 'aviso', prog: 0.22, lado: -1, dist: 6,   texto: 'CURVA' },
            { tipo: 'arbol', prog: 0.30, lado: -1, dist: 8,   escala: 1.0 },
            { tipo: 'poste', prog: 0.35, lado:  1, dist: 5.5              },
            { tipo: 'arbol', prog: 0.42, lado:  1, dist: 7,   escala: 1.2 },
            { tipo: 'arbol', prog: 0.50, lado: -1, dist: 7,   escala: 0.8 },
            { tipo: 'aviso', prog: 0.55, lado:  1, dist: 6,   texto: 'RECTA' },
            { tipo: 'poste', prog: 0.60, lado: -1, dist: 5.5              },
            { tipo: 'arbol', prog: 0.68, lado:  1, dist: 8,   escala: 1.1 },
            { tipo: 'arbol', prog: 0.75, lado: -1, dist: 7,   escala: 1.4 },
            { tipo: 'poste', prog: 0.82, lado:  1, dist: 5.5              },
            { tipo: 'arbol', prog: 0.88, lado:  1, dist: 7,   escala: 1.0 },
            { tipo: 'arbol', prog: 0.93, lado: -1, dist: 8,   escala: 0.9 },
        ];
    }
}

window.PISTAS.ciudad = new ConfigPistaCiudad();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/ciudad.js] ' + e.message);
    console.error('[pistas/ciudad.js]', e);
}
