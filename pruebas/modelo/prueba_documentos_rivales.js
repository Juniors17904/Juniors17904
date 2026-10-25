// ================================================================
// CLASE: PruebaDocumentosRivales — PRD 013 (docs/prds/prd_013_rivales_pc.md)
//   RF-13: los PRD que reemplaza la D9 tienen su nota, CLAUDE.md agrega la
//          jerarquía PilotoPC y su carpeta src/model/pilotos/, y el
//          backlog enlaza B5 con este PRD.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaDocumentosRivales {
    #raiz   = path.join(__dirname, '..', '..');
    #fallos = 0;
    // D9 del PRD 013: PRD que llevan la nota
    static #PRD_CON_NOTA = ['001', '002', '004', '005', '006', '008', '009', '010', '011', '012'];

    ejecutar() {
        this.#revisarNotas();
        this.#revisarClaude();
        this.#revisarBacklog();
        console.log(this.#fallos ? `\n${this.#fallos} fallo(s)` : '\nTodo OK');
        return this.#fallos;
    }

    #comprobar(condicion, mensaje) {
        console.log(condicion ? 'OK   ' : 'FALLO', mensaje);
        if (!condicion) this.#fallos++;
    }

    #leer(relativo) {
        const ruta = path.join(this.#raiz, relativo);
        return fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
    }

    #revisarNotas() {
        const carpeta = path.join(this.#raiz, 'docs/prds');
        const archivos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta) : [];
        for (const numero of PruebaDocumentosRivales.#PRD_CON_NOTA) {
            const archivo = archivos.find(a => a.startsWith(`prd_${numero}_`));
            const texto = archivo ? this.#leer(`docs/prds/${archivo}`) : '';
            this.#comprobar(texto.includes('PRD 013'), `PRD 013 RF-13 el PRD ${numero} tiene la nota del PRD 013`);
        }
    }

    #revisarClaude() {
        const claude = this.#leer('CLAUDE.md');
        const fila = claude.split('\n').find(l => /^\|\s*`PilotoPC`\s*\|/.test(l)) || '';
        this.#comprobar(fila.length > 0, 'PRD 013 RF-13 CLAUDE.md tiene la jerarquía PilotoPC');
        for (const sub of ['PilotoPrudente', 'PilotoAgresivo', 'PilotoNovato', 'PilotoExperto']) {
            this.#comprobar(fila.includes(sub), `PRD 013 RF-13 la fila PilotoPC nombra ${sub}`);
        }
        this.#comprobar(claude.includes('src/model/pilotos/'), 'PRD 013 RF-13 CLAUDE.md nombra la carpeta src/model/pilotos/');
    }

    #revisarBacklog() {
        const fila = this.#leer('docs/BACKLOG.md').split('\n').find(l => /^\|\s*B5\s*\|/.test(l)) || '';
        this.#comprobar(fila.includes('prd_013_rivales_pc.md'), 'PRD 013 RF-13 el backlog enlaza B5 con el PRD 013');
    }
}

const prueba = new PruebaDocumentosRivales();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
