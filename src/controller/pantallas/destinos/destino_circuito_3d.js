'use strict';

// ================================================================
// CLASE: DestinoCircuito3D — superclase de los circuitos 3D que se
// abren en la pantalla de juego (#cir3d). Cada subclase dice qué visor
// se crea, qué título se ve y a qué pantalla vuelve el botón de salir,
// así ControladorDisenoPistas no decide el tipo con un if (CLAUDE.md).
// ================================================================
class DestinoCircuito3D {
    // Clase del visor (módulo ES cargado en window); null si aún no cargó
    get claseVisor() { return null; }

    // Texto de #titulo-cir3d
    get titulo() { return ''; }

    // Pantalla a la que vuelve #btn-exit-cir3d
    get origen() { return 'pantalla-inicio'; }
}
