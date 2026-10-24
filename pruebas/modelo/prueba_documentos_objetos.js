// ================================================================
// CLASE: PruebaDocumentosObjetos — PRD docs/prds/prd_010_objetos_solidos.md
//   RF-11 (D9): los PRD 001, 002, 004, 005, 008 y 009 tienen su nota
//          que cita "PRD 010"; CLAUDE.md dice que en MedidasEscena viven
//          las medidas de los objetos (árbol, poste, señal) y que los
//          objetos sólidos los crea FabricaObjetosSolidos; el BACKLOG
//          enlaza B15 con este PRD y agrega B16.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaDocumentosObjetos {
    #raiz   = path.join(__dirname, '..', '..');
    #fallos = 0;
    static #PRDS_CON_NOTA = ['001', '002', '004', '005', '008', '009'];

    ejecutar() {
        this.#revisarPrds();
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

    #revisarPrds() {
        const prds = fs.readdirSync(path.join(this.#raiz, 'docs', 'prds'));
        for (const numero of PruebaDocumentosObjetos.#PRDS_CON_NOTA) {
            const archivo = prds.find(nombre => nombre.startsWith(`prd_${numero}_`));
            const texto = archivo ? this.#leer(path.join('docs', 'prds', archivo)) : '';
            this.#comprobar(texto.includes('PRD 010'), `PRD 010 RF-11 el PRD ${numero} cita "PRD 010"`);
        }
    }

    #revisarClaude() {
        const lineas = this.#leer('CLAUDE.md').split('\n');
        const medidas = lineas.find(l => l.includes('MedidasEscena') && /árbol/.test(l)
            && /poste/.test(l) && /señal/.test(l)) || '';
        this.#comprobar(medidas.length > 0 && medidas.includes('PRD 010'),
            'PRD 010 RF-11 CLAUDE.md dice que en MedidasEscena viven las medidas del árbol, el poste y la señal');
        const fabrica = lineas.find(l => /ObjetoSolido/.test(l)
            && /los crea\s+`?FabricaObjetosSolidos`?/.test(l)) || '';
        this.#comprobar(fabrica.length > 0,
            'PRD 010 RF-11 CLAUDE.md dice que los objetos sólidos los crea FabricaObjetosSolidos');
    }

    #revisarBacklog() {
        const lineas = this.#leer('docs/BACKLOG.md').split('\n');
        const filaB15 = lineas.find(l => /^\|\s*B15\s*\|/.test(l)) || '';
        this.#comprobar(filaB15.includes('prd_010_objetos_solidos.md'),
            'PRD 010 RF-11 el BACKLOG enlaza B15 con prd_010_objetos_solidos.md');
        const filaB16 = lineas.find(l => /^\|\s*B16\s*\|/.test(l)) || '';
        this.#comprobar(filaB16.length > 0 && /decoraciones/.test(filaB16),
            'PRD 010 RF-11 el BACKLOG agrega B16 (decoraciones de las pistas a clases)');
    }
}

const prueba = new PruebaDocumentosObjetos();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
