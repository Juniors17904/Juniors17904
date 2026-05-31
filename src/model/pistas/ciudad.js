'use strict';

try {

window.PISTAS.ciudad = {
    nombre:    'Circuito Urbano',
    totalSegs: 300,
    distMeta:  1800,
    nivelFijo: { nombre:'Ciudad', cielo:['#060a14','#0d1b2a'], cesped:['#0a200a','#081808'], asfalto:['#3a3a3a','#2e2e2e'], borde:'#555' },
    tramos: [
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
    ],
    obstFrecuencia: 0.12,
    obstTipos:      ['carro','carro','carro','bache','turbo'],
    coloresTrafico: ['#ef4444','#3b82f6','#eab308','#6b7280','#f97316'],
};

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/ciudad.js] ' + e.message);
}
