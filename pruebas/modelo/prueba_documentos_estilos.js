// ================================================================
// CLASE: PruebaDocumentosEstilos — PRD 021 (docs/prds/prd_021_estilos_timon_y_pedales.md)
//   RF-10: los PRD que reemplaza la D9 tienen su nota; CLAUDE.md suma la
//          familia EstiloPedales (con su carpeta), TimonRally y TimonCamion
//          en la fila Timon, ControladorPedales en la fila ControladorPantalla
//          y PreferenciasControles; el backlog enlaza B25 con este PRD.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaDocumentosEstilos {
    #raiz   = path.join(__dirname, '..', '..');
    #fallos = 0;
    static #NOTA = 'según el PRD 021, D9';
    // D9 del PRD 021: PRD que llevan la nota
    static #PRD_CON_NOTA = ['001', '002', '004', '005', '006', '007', '008', '009', '010',
        '011', '012', '013', '014', '015', '016', '017', '018', '019', '020'];
    // Puntos concretos que la D9 nombra: [PRD, inicio de la línea]
    static #PUNTOS = [
        ['001', '| D4 |'],
        ['001', '**No se modifican:**'],
        ['002', '- Cambiar los elementos dibujados en 2D'],
        ['002', '**Lista única de lo que NO se modifica:**'],
        ['004', '- El comportamiento y el aspecto del juego.'],
        ['005', '- El comportamiento y el aspecto del juego 3D.'],
        ['005', '- `MultiJugador`, los timones y los velocímetros.'],
        ['006', '- `ControlTimon`'],
        ['007', '- `ControlTimon`'],
        ['008', '- `ControlTimon`'],
        ['009', '- `ControlTimon`'],
        ['013', '- La cámara, los controles del jugador'],
        ['015', '| D1 |'],
        ['015', '**Out of scope:**'],
        ['016', '| D1 |'],
        ['016', '**Out of scope:**'],
        ['016', '- `VistaConduccion` y `ControladorCarreraSolo`'],
        ['016', '- Los dibujos de los timones'],
        ['017', '- Los controles de Jugar Solo'],
        ['018', '- **Pista elegida en dos lugares:**'],
        ['019', '- La cámara, los controles'],
        ['020', '- Las pistas, los controles'],
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
        for (const numero of PruebaDocumentosEstilos.#PRD_CON_NOTA) {
            const texto = this.#textoPrd(numero);
            this.#comprobar(texto.includes(PruebaDocumentosEstilos.#NOTA),
                `PRD 021 RF-10 el PRD ${numero} tiene la nota del PRD 021`);
        }
    }

    #revisarPuntos() {
        for (const [numero, inicio] of PruebaDocumentosEstilos.#PUNTOS) {
            const linea = this.#textoPrd(numero).split('\n').find(l => l.startsWith(inicio)) || '';
            this.#comprobar(linea.includes(PruebaDocumentosEstilos.#NOTA),
                `PRD 021 RF-10 el PRD ${numero} "${inicio}" lleva la nota`);
        }
    }

    #fila(lineas, clase) {
        const patron = new RegExp('^\\|\\s*`' + clase + '`\\s*\\|');
        return lineas.find(l => patron.test(l)) || '';
    }

    #revisarClaude() {
        const lineas = this.#leer('CLAUDE.md').split('\n');
        const timon = this.#fila(lineas, 'Timon');
        this.#comprobar(timon.includes('TimonRally') && timon.includes('TimonCamion'),
            'PRD 021 RF-10 la fila Timon nombra TimonRally y TimonCamion');
        const pedales = this.#fila(lineas, 'EstiloPedales');
        this.#comprobar(['PedalesClasicos', 'PedalesDeportivos', 'PedalesF1', 'PedalesRetro'].every(c => pedales.includes(c)),
            'PRD 021 RF-10 CLAUDE.md tiene la fila EstiloPedales con sus 4 subclases');
        const pantalla = this.#fila(lineas, 'ControladorPantalla');
        this.#comprobar(pantalla.includes('ControladorPedales'),
            'PRD 021 RF-10 la fila ControladorPantalla nombra ControladorPedales');
        const carpeta = lineas.find(l => l.includes('`src/view/controles/` →')) || '';
        this.#comprobar(carpeta.includes('EstiloPedales'),
            'PRD 021 RF-10 CLAUDE.md pone EstiloPedales en la carpeta src/view/controles/');
        const preferencias = lineas.find(l => l.startsWith('- ') && l.includes('PreferenciasControles')) || '';
        this.#comprobar(preferencias.includes('src/model/'),
            'PRD 021 RF-10 CLAUDE.md nombra PreferenciasControles en src/model/');
    }

    #revisarBacklog() {
        const fila = this.#leer('docs/BACKLOG.md').split('\n').find(l => /^\|\s*B25\s*\|/.test(l)) || '';
        this.#comprobar(fila.includes('prd_021_estilos_timon_y_pedales.md'),
            'PRD 021 RF-10 el backlog enlaza B25 con el PRD 021');
    }
}

const prueba = new PruebaDocumentosEstilos();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
