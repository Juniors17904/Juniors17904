'use strict';

// ================================================================
// CONTROLLER — ModoTestDrive2D: prueba libre del carro en 2D (PRD 002 D8)
// ================================================================

try {

class ModoTestDrive2D extends Modo {
    constructor() {
        super('Test Drive', ['btn-test-drive'], ['pantalla-juego']);
    }
}

window.ModoTestDrive2D = ModoTestDrive2D;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_test_drive_2d.js] ' + e.message);
    console.error('[modo_test_drive_2d.js]', e);
}
