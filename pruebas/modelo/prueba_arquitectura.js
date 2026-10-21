// ================================================================
// CLASE: PruebaArquitectura — RNF-02 del PRD docs/prds/prd_carrera_solo_vertical.md
// Análisis estático (node, sin DOM):
//   1) La vista (VisorCarreraSolo y HudCarrera) no contiene reglas del modelo
//      (vueltas, puntos de control, fracciones de vuelta, reloj propio).
//   2) Cada archivo nuevo de la carrera define una sola clase y su nombre
//      coincide con la clase en snake_case.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaArquitectura {
    static #RAIZ = path.join(__dirname, '..', '..');

    // Archivos de vista que solo aplican lo que el modelo calcula
    static #ARCHIVOS_VISTA = [
        'src/view/pistas/visor_carrera_solo.js',
        'src/view/hud_carrera.js',
    ];

    // Reglas del modelo prohibidas en la vista (texto, motivo)
    static #PATRONES_MODELO = [
        [/\bvueltaActual\s*=(?!=)/, 'asigna vueltaActual (lo cuenta CarreraVueltas)'],
        [/puntoControl/,            'maneja puntos de control (CarreraVueltas)'],
        [/marcarVuelta/,            'marca vueltas (Cronometro)'],
        [/\b0?\.33\b/,              'usa la fracción 0.33 de la vuelta (CarreraVueltas)'],
        [/\b0?\.66\b/,              'usa la fracción 0.66 de la vuelta (CarreraVueltas)'],
        [/Date\.now/,               'mide el tiempo con Date.now (Cronometro)'],
    ];

    // Archivos nuevos de la carrera: archivo → clase que debe contener
    static #ARCHIVOS_CARRERA = [
        'src/view/pistas/visor_carrera_solo.js',
        'src/view/hud_carrera.js',
        'src/model/carrera_vueltas.js',
        'src/model/cronometro.js',
        'src/model/muestra_ruta.js',
        'src/controller/controlador_carrera_solo.js',
    ];

    #fallos = 0;

    get fallos() { return this.#fallos; }

    ejecutar() {
        this.#revisarVista();
        this.#revisarUnaClasePorArchivo();
        console.log(this.#fallos ? `\n${this.#fallos} fallo(s)` : '\nTodo OK');
        return this.#fallos;
    }

    #comprobar(condicion, mensaje) {
        console.log(condicion ? 'OK   ' : 'FALLO', mensaje);
        if (!condicion) this.#fallos++;
    }

    #leer(relativo) {
        const ruta = path.join(PruebaArquitectura.#RAIZ, relativo);
        if (!fs.existsSync(ruta)) return null;
        return this.#quitarComentarios(fs.readFileSync(ruta, 'utf8'));
    }

    // Los comentarios pueden nombrar el modelo ("lo calcula CarreraVueltas");
    // solo cuenta el código
    #quitarComentarios(codigo) {
        return codigo
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
    }

    #revisarVista() {
        for (const archivo of PruebaArquitectura.#ARCHIVOS_VISTA) {
            const codigo = this.#leer(archivo);
            this.#comprobar(codigo !== null, 'RNF-02 existe ' + archivo);
            if (codigo === null) continue;
            for (const [patron, motivo] of PruebaArquitectura.#PATRONES_MODELO) {
                const lineas = codigo.split('\n')
                    .map((l, i) => [l, i + 1])
                    .filter(([l]) => patron.test(l))
                    .map(([, n]) => n);
                this.#comprobar(lineas.length === 0,
                    'RNF-02 ' + archivo + ' no ' + motivo +
                    (lineas.length ? ' (líneas ' + lineas.join(', ') + ')' : ''));
            }
        }
    }

    #revisarUnaClasePorArchivo() {
        for (const archivo of PruebaArquitectura.#ARCHIVOS_CARRERA) {
            const codigo = this.#leer(archivo);
            this.#comprobar(codigo !== null, 'RNF-02 existe ' + archivo);
            if (codigo === null) continue;
            const clases = [...codigo.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]);
            const anonimas = (codigo.match(/=\s*class\b\s*(extends\b|\{)/g) || []).length;
            this.#comprobar(clases.length === 1 && anonimas === 0,
                'RNF-02 ' + archivo + ' tiene una sola clase (' + (clases.join(', ') || 'ninguna') +
                (anonimas ? ' + ' + anonimas + ' anónima(s)' : '') + ')');
            if (clases.length === 1) {
                const esperado = this.#aSnakeCase(clases[0]) + '.js';
                this.#comprobar(path.basename(archivo) === esperado,
                    'RNF-02 el archivo de ' + clases[0] + ' se llama ' + esperado);
            }
        }
    }

    #aSnakeCase(nombre) {
        return nombre.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
    }
}

const prueba = new PruebaArquitectura();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
