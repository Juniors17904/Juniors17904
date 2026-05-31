'use strict';

try {

window.PISTAS.testdrive = {
    nombre:      'Test Drive',
    totalSegs:   80,
    distMeta:    Infinity,
    nivelFijo:   { nombre:'Test', cielo:['#0d1b2a','#1b3a4b'], cesped:['#1a5c1a','#174d17'], asfalto:['#484848','#3d3d3d'], borde:'#888' },
    tramos:      [],
    esTestDrive: true,
};

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pistas/testdrive.js] ' + e.message);
}
