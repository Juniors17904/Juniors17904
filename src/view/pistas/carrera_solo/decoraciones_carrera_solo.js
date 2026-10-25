'use strict';

import { FabricaObjetoEscena } from '../../objetos/fabrica_objeto_escena.js';

// ================================================================
// VIEW — DecoracionesCarreraSolo: los objetos de la pista de Jugar Solo
// (árboles, postes, señales, flechas…). Salió de VisorCarreraSolo para
// hacerle espacio a los rivales (PRD 013, D8), sin cambiar nada de lo
// que se ve.
//   - Ubica cada decoración a un lado de la ruta y la construye.
//   - Si un poste cae dentro de un poste del arco de meta, no lo dibuja
//     (PRD 011): lo pregunta al ConstructorCircuitoCarreraSolo.
//   - Los quita de la escena en destruir().
// ================================================================
export class DecoracionesCarreraSolo {
    #escena;
    #ruta;
    #fabrica = new FabricaObjetoEscena();
    #objetos = [];

    constructor(escena, ruta) {
        this.#escena = escena;
        this.#ruta   = ruta;
    }

    construir(decoraciones, circuito) {
        for (const dec of decoraciones ?? []) {
            try {
                const obj = this.#crearObjeto(dec);
                if (!obj || (dec.tipo === 'poste' && circuito?.tapaArco(obj))) continue;   // PRD 011: el arco ya tiene poste ahí
                obj.construir(this.#escena);
                obj.setVisible?.(true);
                this.#objetos.push(obj);
            } catch (e) {
                console.error('[DecoracionesCarreraSolo]', e);
            }
        }
    }

    destruir() {
        for (const obj of this.#objetos) obj.destruir(this.#escena);
        this.#objetos = [];
    }

    #crearObjeto({ tipo, prog, lado, dist, escala = 1, texto = '', direccion = 'derecha', conLuz = true }) {
        const pos = this.#ruta.posicionEn(prog);
        const wx  = pos.x + Math.cos(pos.angle) * dist * lado;
        const wz  = pos.z - Math.sin(pos.angle) * dist * lado;
        return this.#fabrica.crear(tipo, wx, wz, { escala, texto, direccion, rotY: pos.angle, lado, conLuz });
    }
}
