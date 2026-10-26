// ================================================================
// CLASE: PruebaDocumentosPeso — PRD 019 (docs/prds/prd_019_peso_al_girar.md)
//   RF-10: los PRD que reemplaza la D9 tienen su nota, CLAUDE.md nombra
//          TransferenciaPeso en src/model/carros/ y en la fila Carro, y el
//          backlog enlaza B24 con este PRD.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaDocumentosPeso {
    #raiz   = path.join(__dirname, '..', '..');
    #fallos = 0;
    static #NOTA = 'según el PRD 019, D9';
    // D9 del PRD 019: PRD que llevan la nota
    static #PRD_CON_NOTA = ['002', '004', '005', '006', '007', '008', '009', '010',
        '011', '012', '013', '014', '015', '016', '017', '018'];
    // Puntos concretos que la D9 nombra: [PRD, inicio de la línea]
    static #PUNTOS = [
        ['006', '- **RF-01 (D1):**'],
        ['006', '| D4 |'],
        ['006', '- **RF-08 (D4):**'],
        ['007', '- Las reglas de física del PRD 006'],
        ['008', '- Las reglas de física del PRD 006'],
        ['013', '| D6 |'],
        ['013', '- **RF-04 (D2, D3):**'],
        ['013', '- **RF-07 (D4):**'],
        ['013', '- **RF-12 (D1):**'],
        ['018', '- Las personalidades de los rivales'],
        ['018', '- **RF-08 (D4):**'],
    ];

    ejecutar() {
        this.#revisarNotas();
        this.#revisarPuntos();
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

    #textoPrd(numero) {
        const carpeta = path.join(this.#raiz, 'docs/prds');
        const archivos = fs.existsSync(carpeta) ? fs.readdirSync(carpeta) : [];
        const archivo = archivos.find(a => a.startsWith(`prd_${numero}_`));
        return archivo ? this.#leer(`docs/prds/${archivo}`) : '';
    }

    #revisarNotas() {
        for (const numero of PruebaDocumentosPeso.#PRD_CON_NOTA) {
            const texto = this.#textoPrd(numero);
            this.#comprobar(texto.includes(PruebaDocumentosPeso.#NOTA),
                `PRD 019 RF-10 el PRD ${numero} tiene la nota del PRD 019`);
        }
    }

    #revisarPuntos() {
        for (const [numero, inicio] of PruebaDocumentosPeso.#PUNTOS) {
            const linea = this.#textoPrd(numero).split('\n').find(l => l.startsWith(inicio)) || '';
            this.#comprobar(linea.includes(PruebaDocumentosPeso.#NOTA),
                `PRD 019 RF-10 el PRD ${numero} "${inicio}" lleva la nota`);
        }
    }

    #revisarClaude() {
        const claude = this.#leer('CLAUDE.md');
        const carpeta = claude.split('\n').find(l => l.includes('`src/model/carros/` →')) || '';
        this.#comprobar(carpeta.includes('TransferenciaPeso'),
            'PRD 019 RF-10 CLAUDE.md nombra TransferenciaPeso en src/model/carros/');
        const fila = claude.split('\n').find(l => /^\|\s*`Carro`\s*\|/.test(l)) || '';
        this.#comprobar(fila.includes('TransferenciaPeso'),
            'PRD 019 RF-10 la fila Carro de la tabla de jerarquías nombra TransferenciaPeso');
    }

    #revisarBacklog() {
        const fila = this.#leer('docs/BACKLOG.md').split('\n').find(l => /^\|\s*B24\s*\|/.test(l)) || '';
        this.#comprobar(fila.includes('prd_019_peso_al_girar.md'), 'PRD 019 RF-10 el backlog enlaza B24 con el PRD 019');
    }
}

const prueba = new PruebaDocumentosPeso();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
