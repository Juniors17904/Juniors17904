'use strict';

// ================================================================
// CLASS: ControlEntrada — superclase abstracta de controles
//        Todo control del circuito extiende esta clase.
//        Interfaz obligatoria: activar(circuito) y destruir()
// ================================================================
class ControlEntrada {
    activar(circuito)  {}
    destruir()         {}
    mostrarOverlay()   {}
    ocultarOverlay()   {}
}

window.ControlEntrada = ControlEntrada;
