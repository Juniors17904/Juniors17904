'use strict';

// ================================================================
// CLASE: DestinoTestDriveRuta — Test Drive 3D → Con Ruta: abre el
// circuito con VisorTestdriveRuta y vuelve al selector de Test Drive.
// ================================================================
class DestinoTestDriveRuta extends DestinoCircuito3D {
    get claseVisor() { return window.VisorTestdriveRuta ?? null; }
    get titulo()     { return 'TEST DRIVE 3D · CON RUTA'; }
    get origen()     { return 'pantalla-td3d-selector'; }
}
