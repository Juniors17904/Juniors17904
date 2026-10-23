'use strict';

// ================================================================
// CLASE: DestinoCarreraUrbana — Diseño de Pistas → Entrar: abre el
// circuito con VisorCarreraUrbana y vuelve al detalle de la pista.
// ================================================================
class DestinoCarreraUrbana extends DestinoCircuito3D {
    get claseVisor() { return window.VisorCarreraUrbana ?? null; }
    get titulo()     { return 'CIRCUITO URBANO'; }
    get origen()     { return 'pantalla-detalle-pista'; }
}
