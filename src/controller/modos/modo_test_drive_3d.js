'use strict';

// ================================================================
// CONTROLLER — ModoTestDrive3D: prueba libre del carro en 3D (PRD 002 D8)
// ================================================================

try {

class ModoTestDrive3D extends Modo {
    constructor() {
        super('Test Drive 3D', ['btn-test-drive-3d'], ['pantalla-td3d-selector', 'pantalla-juego']);
    }
}

window.ModoTestDrive3D = ModoTestDrive3D;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[modo_test_drive_3d.js] ' + e.message);
    console.error('[modo_test_drive_3d.js]', e);
}
