// ================================================================
// CLASE: PruebaDocumentosFisica — requerimientos de documentación de los PRD
// 006 (RF-13), 007 (RF-10) y 008 (RF-12):
//   - los PRD que cada uno reemplaza llevan la nota de su D8
//   - CLAUDE.md tiene las familias Carro, Superficie y ObjetoSolido
//   - el backlog enlaza B11, B12 y B13 con su PRD
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaDocumentosFisica {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];

    ejecutar() {
        this.#notas('006', 'RF-13', ['001', '002', '004', '005']);
        this.#notas('007', 'RF-10', ['001', '002', '004', '005', '006']);
        this.#notas('008', 'RF-12', ['001', '002', '004', '005']);

        const claude = this.#leer('CLAUDE.md');
        this.#ok(/\| `Carro` \| `CarroDeportivo`, `CarroSUV`, `CarroMusculo`, `CarroFormula`, `CarroPickup`, `CarroClasico`/.test(claude),
            'PRD 007 RF-10 CLAUDE.md tiene la familia Carro con sus 6 subclases');
        this.#ok(/\| `Superficie` \| `SuperficieAsfalto`, `SuperficiePiano`, `SuperficiePasto`/.test(claude),
            'PRD 008 RF-12 CLAUDE.md tiene la familia Superficie');
        this.#ok(/\| `ObjetoSolido` \| `ArbolSolido`, `PosteSolido`, `SenalCurvaSolida`/.test(claude),
            'PRD 008 RF-12 CLAUDE.md tiene la familia ObjetoSolido');
        this.#ok(!/\bMovimientoLibre\b/.test(claude), 'PRD 006 RNF-02 CLAUDE.md ya no nombra MovimientoLibre');

        const backlog = this.#leer('docs/BACKLOG.md');
        for (const [fila, prd, rf] of [['B11', 'prd_006_fisica_de_manejo.md', 'PRD 006 RF-13'],
                                       ['B12', 'prd_007_carros_con_personalidad.md', 'PRD 007 RF-10'],
                                       ['B13', 'prd_008_superficie_y_choques.md', 'PRD 008 RF-12']]) {
            const linea = backlog.split('\n').find(l => l.startsWith(`| ${fila} |`)) ?? '';
            this.#ok(linea.includes(`prds/${prd}`), `${rf} el backlog enlaza ${fila} con ${prd}`);
        }

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    #leer(relativo) { return fs.readFileSync(path.join(PruebaDocumentosFisica.#RAIZ, relativo), 'utf8'); }

    // Cada PRD reemplazado debe citar "PRD NNN, D8" del PRD que lo reemplaza
    #notas(prd, rf, reemplazados) {
        const carpeta = path.join(PruebaDocumentosFisica.#RAIZ, 'docs/prds');
        const archivos = fs.readdirSync(carpeta);
        for (const otro of reemplazados) {
            const archivo = archivos.find(a => a.startsWith(`prd_${otro}_`));
            const texto = archivo ? fs.readFileSync(path.join(carpeta, archivo), 'utf8') : '';
            this.#ok(new RegExp(`PRD ${prd}(,| \\(| y)[^)]*D8`).test(texto) || texto.includes(`PRD ${prd}, D8`),
                `PRD ${prd} ${rf} el PRD ${otro} tiene la nota de su D8`);
        }
    }
}

new PruebaDocumentosFisica().ejecutar();
