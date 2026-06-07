'use strict';
import { VisorTestdriveRuta } from './visor_testdrive_ruta.js';

// ================================================================
// CLASS: VisorCarreraUrbana — circuito urbano para la pantalla
//        de selección de pistas (Diseño de Pistas → Entrar).
//        Extiende VisorTestdriveRuta: misma lógica de conducción
//        pero como clase independiente con identidad propia.
// ================================================================
class VisorCarreraUrbana extends VisorTestdriveRuta {
    constructor(canvas, tipoPista) {
        super(canvas, tipoPista);
    }
}

window.VisorCarreraUrbana = VisorCarreraUrbana;
