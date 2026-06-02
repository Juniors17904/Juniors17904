'use strict';
// viewer3d.js — re-exporta Visor3D y VisorJuego3D desde sus archivos individuales
// Mantiene compatibilidad con el script tag existente en index.html

import './visor3d.js';
import './visor_juego3d.js';

// window.Visor3D, window.Viewer3D, window.VisorJuego3D
// quedan expuestos por los archivos importados arriba
