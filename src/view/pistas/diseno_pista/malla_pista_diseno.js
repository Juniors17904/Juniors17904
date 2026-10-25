'use strict';

import { ConstructorPisoPista } from '../comun/constructor_piso_pista.js';
import { TrazadoPisoCurva }     from '../comun/trazado_piso_curva.js';

// ================================================================
// CLASS: MallaPistaDiseno — piso de la pista de Diseño General.
//        Usa la pieza compartida del PRD 012 (ConstructorPisoPista):
//        asfalto, pianos con relieve, líneas y meta a cuadros, iguales
//        a las de las otras pantallas. Solo fija el color del asfalto
//        de esta pantalla.
// ================================================================
export class MallaPistaDiseno {
    static #COLOR_ASFALTO = 0x333333;

    #piso;

    constructor(curva) {
        this.#piso = new ConstructorPisoPista(new TrazadoPisoCurva(curva), 0, MallaPistaDiseno.#COLOR_ASFALTO);
    }

    // Devuelve un THREE.Group con todo el piso (el visor lo muestra u oculta)
    construir() { return this.#piso.construir(); }

    // Suelta geometrías y materiales y saca el grupo de la escena
    liberar() { this.#piso.liberar(); }
}
