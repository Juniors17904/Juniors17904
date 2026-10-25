// ================================================================
// CLASE: CargadorTrazadoVuelta — carga en el contexto de una prueba las
// clases clásicas que arman la vuelta entera de una pista (PRD 014):
// el cierre de las pistas abiertas y TrazadoVuelta. Ruta (módulo) lee
// TrazadoVuelta de globalThis, como en el juego lee window.
// Si el contexto todavía no tiene MedidasEscena, la carga primero.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class CargadorTrazadoVuelta {
    static #RAIZ = path.join(__dirname, '..', '..', 'src', 'model');
    static #ARCHIVOS = ['cierre/pose_cierre.js', 'cierre/trayecto_dubins.js', 'cierre/contorno_pista.js',
        'cierre/cierre_pista_abierta.js', 'cierre/flechas_cierre.js', 'trazado_vuelta.js'];

    cargar(ctx) {
        const previos = ctx.MedidasEscena ? [] : ['medida_carro.js', 'medidas_escena.js'];
        for (const f of [...previos, ...CargadorTrazadoVuelta.#ARCHIVOS]) {
            vm.runInContext(fs.readFileSync(path.join(CargadorTrazadoVuelta.#RAIZ, f), 'utf8'), ctx, { filename: f });
        }
        globalThis.TrazadoVuelta = ctx.TrazadoVuelta;
        return ctx;
    }
}

module.exports = { CargadorTrazadoVuelta };
