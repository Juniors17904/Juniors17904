// ================================================================
// CLASE: PruebaArquitectura — RNF-02 del PRD docs/prds/prd_001_carrera_solo_vertical.md
//                              y RF-07/RF-08 del PRD docs/prds/prd_003_regla_anti_monolito.md
// Análisis estático (node, sin DOM):
//   1) La vista (VisorCarreraSolo y HudCarrera) no contiene reglas del modelo
//      (vueltas, puntos de control, fracciones de vuelta, reloj propio).
//   2) Cada archivo nuevo de la carrera define una sola clase y su nombre
//      coincide con la clase en snake_case (ModoClasico2D → modo_clasico_2d).
//   3) Anti-monolito: ningún .js/.mjs de src/, la raíz o pruebas/ pasa de
//      400 líneas salvo los de scripts/archivos_grandes_aceptados.txt.
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

    static #LIMITE_LINEAS = 400;
    static #LISTA_ACEPTADOS = 'scripts/archivos_grandes_aceptados.txt';

    #fallos = 0;

    get fallos() { return this.#fallos; }

    ejecutar() {
        this.#revisarVista();
        this.#revisarUnaClasePorArchivo();
        this.#revisarSnakeCase();
        this.#revisarLimiteLineas();
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

    // PascalCase → snake_case. Un número abre su propia parte y la letra que
    // lo sigue queda pegada: ModoClasico2D → modo_clasico_2d (PRD 003 RF-08)
    #aSnakeCase(nombre) {
        return nombre
            .replace(/([a-z])([A-Z0-9])/g, '$1_$2')
            .replace(/([0-9])([A-Z][a-z])/g, '$1_$2')
            .toLowerCase();
    }

    #revisarSnakeCase() {
        const casos = [
            ['ModoClasico2D',          'modo_clasico_2d'],
            ['ModoTestDrive3D',        'modo_test_drive_3d'],
            ['ControladorCarreraSolo', 'controlador_carrera_solo'],
            ['HudCarrera',             'hud_carrera'],
        ];
        for (const [clase, esperado] of casos) {
            const obtenido = this.#aSnakeCase(clase);
            this.#comprobar(obtenido === esperado,
                'PRD 003 RF-08 ' + clase + ' → ' + esperado + ' (obtenido ' + obtenido + ')');
        }
    }

    // Lee la lista única de archivos grandes aceptados (lección 4: no se copia)
    #leerAceptados() {
        const ruta = path.join(PruebaArquitectura.#RAIZ, PruebaArquitectura.#LISTA_ACEPTADOS);
        if (!fs.existsSync(ruta)) return null;
        const aceptados = new Map();
        for (const linea of fs.readFileSync(ruta, 'utf8').split('\n')) {
            const [archivo, lineas] = linea.trim().split(/\s+/);
            if (archivo && /^\d+$/.test(lineas || '')) aceptados.set(archivo, Number(lineas));
        }
        return aceptados;
    }

    // Archivos .js/.mjs de src/ y pruebas/ (recursivo) y de la raíz (sin node_modules)
    #archivosJs() {
        const raiz = PruebaArquitectura.#RAIZ;
        const esJs = n => /\.(js|mjs)$/.test(n);
        const encontrados = fs.readdirSync(raiz, { withFileTypes: true })
            .filter(e => e.isFile() && esJs(e.name)).map(e => e.name);
        const recorrer = relativo => {
            for (const e of fs.readdirSync(path.join(raiz, relativo), { withFileTypes: true })) {
                if (e.name === 'node_modules') continue;
                const hijo = relativo + '/' + e.name;
                if (e.isDirectory()) recorrer(hijo);
                else if (e.isFile() && esJs(e.name)) encontrados.push(hijo);
            }
        };
        for (const carpeta of ['src', 'pruebas']) {
            if (fs.existsSync(path.join(raiz, carpeta))) recorrer(carpeta);
        }
        return encontrados.sort();
    }

    // Cuenta líneas como "wc -l" (igual que verificar_arquitectura.sh)
    #contarLineas(relativo) {
        const texto = fs.readFileSync(path.join(PruebaArquitectura.#RAIZ, relativo), 'utf8');
        return (texto.match(/\n/g) || []).length;
    }

    #revisarLimiteLineas() {
        const limite    = PruebaArquitectura.#LIMITE_LINEAS;
        // La lista debe existir; puede quedar vacía cuando termine B10
        const leida     = this.#leerAceptados();
        this.#comprobar(leida !== null,
            'PRD 003 RF-07 se lee la lista ' + PruebaArquitectura.#LISTA_ACEPTADOS +
            ' (' + (leida ? leida.size : 0) + ' archivo(s))');
        const aceptados = leida || new Map();
        const archivos = this.#archivosJs();
        this.#comprobar(archivos.length > 0, 'PRD 003 RF-07 hay archivos .js/.mjs que revisar');
        let grandes = 0;
        for (const archivo of archivos) {
            const lineas = this.#contarLineas(archivo);
            if (lineas <= limite) continue;
            grandes++;
            if (aceptados.has(archivo)) {
                console.log('AVISO', 'PRD 003 RF-07 ' + archivo + ' tiene ' + lineas +
                    ' líneas (aceptado hasta B10 con ' + aceptados.get(archivo) + ')');
                continue;
            }
            this.#comprobar(false, 'PRD 003 RF-07 ' + archivo + ' tiene ' + lineas +
                ' líneas (límite ' + limite + ') y no está en la lista de aceptados');
        }
        console.log('INFO ', 'PRD 003 RF-07 revisados ' + archivos.length +
            ' archivos; ' + grandes + ' pasan de ' + limite + ' líneas');
    }
}

const prueba = new PruebaArquitectura();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
