'use strict';
import { ArbolEscena }       from './arbol_escena.js';
import { PosteEscena }       from './poste_escena.js';
import { AvisoEscena }       from './aviso_escena.js';
import { MetaEscena }        from './meta_escena.js';
import { SalidaEscena }      from './salida_escena.js';
import { BarreraEscena }     from './barrera_escena.js';
import { FlechaCurvaEscena } from './flecha_curva_escena.js';

// ================================================================
// CLASS: FabricaObjetoEscena — crea instancias de ObjetoEscena
//        según el tipo string. Encapsula la decisión de qué
//        subclase instanciar; los visores no necesitan conocerlas.
// ================================================================
export class FabricaObjetoEscena {
    crear(tipo, x = 0, z = 0, opciones = {}) {
        const { escala = 1, texto = '' } = opciones;
        switch (tipo) {
            case 'arbol':   return new ArbolEscena(x, z, escala);
            case 'poste':   return new PosteEscena(x, z);
            case 'aviso':   return new AvisoEscena(x, z, texto);
            case 'meta':    return new MetaEscena(x, z);
            case 'salida':  return new SalidaEscena(x, z);
            case 'barrera': return new BarreraEscena(x, z);
            case 'flecha':  return new FlechaCurvaEscena(x, z);
            default:        return null;
        }
    }
}
