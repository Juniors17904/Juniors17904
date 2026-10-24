// ================================================================
// CLASE: PruebaArchivarMotor2D — PRD docs/prds/prd_005_archivar_motor_2d.md
//   RF-01: la rama archivo/v-clasico-2d existe y guarda el código 2D.
//   RNF-01: en main no quedan los archivos, ids ni objetos { } de D1/D5,
//           y RegistroPistas (D4) existe y se carga antes que las pistas.
//   RF-10: notas de D9 en los PRD, CLAUDE.md limpio, B2 hecho y
//          lección 17 cerrada.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

class PruebaArchivarMotor2D {
    #raiz   = path.join(__dirname, '..', '..');
    #fallos = 0;
    static #RAMA     = 'archivo/v-clasico-2d';
    static #REF_RAMA = 'refs/remotes/origin/archivo/v-clasico-2d';
    // Archivos que la rama de archivo debe guardar (RF-01)
    static #ARCHIVADOS = [
        'src/controller/juego.js',
        'src/model/pista.js',
        'src/controller/gestor_orientacion.js',
    ];
    // D1: archivos de las clases borradas y de compatibilidad
    static #BORRADOS = [
        'src/controller/juego.js',
        'src/model/pista.js',
        'src/model/segmento.js',
        'src/model/carros/carro2d.js',
        'src/controller/controles.js',
        'src/view/renderizador_pista.js',
        'src/view/renderizador_auto.js',
        'src/view/pantalla_juego.js',
        'src/view/visor_juego3d.js',
        'src/view/minimapas/minimapa_conductor.js',
        'src/controller/gestor_orientacion.js',
        'src/controller/pantallas/controlador_modo_2d.js',
        'src/model/pistas/config_pista_testdrive.js',
        'src/model/pistas/config_pista_testdrive_libre.js',
        'src/controller/modos/modo_clasico_2d.js',
        'src/controller/modos/modo_test_drive_2d.js',
        'src/controller/app.js',
        'src/controller/game.js',
        'src/controller/garage.js',
        'src/view/minimap.js',
        'src/view/view_pista2d.js',
        'src/view/viewer3d.js',
        'src/model/model.js',
    ];
    // D1: ids borrados de index.html
    static #IDS_BORRADOS = [
        'pantalla-crear', 'pantalla-unirse', 'pantalla-espera', 'pantalla-resultado',
        'pantalla-rotar', 'canvas-juego', 'canvas-carro-3d', 'btn-test-drive', 'btn-clasico-2d',
    ];
    // D1: clases borradas (no se definen ni se instancian)
    static #CLASES_BORRADAS = [
        'Juego', 'Pista', 'Segmento', 'Carro2D', 'Controles', 'RenderizadorPista',
        'RenderizadorAuto', 'PantallaJuego', 'VisorJuego3D', 'MinimapaConductor',
        'GestorOrientacion', 'ControladorModo2D', 'ConfigPistaTestDrive',
        'ConfigPistaTestDriveLibre', 'ModoClasico2D', 'ModoTestDrive2D',
    ];

    ejecutar() {
        this.#revisarRamaArchivo();
        this.#revisarCodigoLimpio();
        this.#revisarRegistroPistas();
        this.#revisarDocumentos();
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

    #git(argumentos) {
        return spawnSync('git', argumentos, { cwd: this.#raiz, encoding: 'utf8', timeout: 60000 });
    }

    // Archivos .js de una carpeta, recursivo
    #archivosJs(relativo) {
        const lista = [];
        const recorrer = (dir) => {
            for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
                const ruta = path.join(dir, entrada.name);
                if (entrada.isDirectory()) recorrer(ruta);
                else if (/\.(m?js)$/.test(entrada.name)) lista.push(ruta);
            }
        };
        recorrer(path.join(this.#raiz, relativo));
        return lista;
    }

    // ── RF-01 ──────────────────────────────────────────────────────
    #revisarRamaArchivo() {
        const rama = PruebaArchivarMotor2D.#RAMA;
        const ref  = PruebaArchivarMotor2D.#REF_RAMA;
        // Con red: actualiza la ref remota local; sin red se usa la que ya existe
        try {
            this.#git(['fetch', '--quiet', 'origin', `${rama}:${ref}`]);
        } catch (error) { /* sin red: se sigue con la ref local */ }
        const remoto = this.#git(['ls-remote', '--heads', 'origin', rama]);
        const enGithub = remoto.status === 0 && remoto.stdout.includes(`refs/heads/${rama}`);
        const local = this.#git(['rev-parse', '--verify', '--quiet', ref]);
        const existe = enGithub || local.status === 0;
        this.#comprobar(existe, `PRD 005 RF-01 existe la rama ${rama}`
            + (enGithub ? ' (en GitHub)' : ' (ref remota local)'));
        if (!existe) return;
        const arbol = this.#git(['ls-tree', '-r', '--name-only', ref]);
        const archivos = new Set((arbol.stdout || '').split('\n'));
        for (const archivo of PruebaArchivarMotor2D.#ARCHIVADOS) {
            this.#comprobar(archivos.has(archivo), `PRD 005 RF-01 la rama guarda ${archivo}`);
        }
    }

    // ── RNF-01 (D1, D5, D7) ───────────────────────────────────────
    #revisarCodigoLimpio() {
        for (const archivo of PruebaArchivarMotor2D.#BORRADOS) {
            this.#comprobar(!fs.existsSync(path.join(this.#raiz, archivo)),
                `PRD 005 RNF-01 main no tiene ${archivo}`);
        }
        const fuentes = [
            ...this.#archivosJs('src'),
            path.join(this.#raiz, 'index.html'),
            path.join(this.#raiz, 'vista_conduccion.js'),
        ].filter(ruta => fs.existsSync(ruta));
        const textos = fuentes.map(ruta => [path.relative(this.#raiz, ruta), fs.readFileSync(ruta, 'utf8')]);
        const buscar = (regex) => textos.filter(([, texto]) => regex.test(texto)).map(([nombre]) => nombre);

        const prohibidos = [
            ['CFG', /\bCFG\b/],
            ['NIVELES', /\bNIVELES\b/],
            ['window.PISTAS', /window\.PISTAS\b/],
        ];
        for (const id of PruebaArchivarMotor2D.#IDS_BORRADOS) {
            prohibidos.push(['id ' + id, new RegExp(`(?<![\\w-])${id}(?![\\w-])`)]);
        }
        for (const clase of PruebaArchivarMotor2D.#CLASES_BORRADAS) {
            prohibidos.push(['clase ' + clase,
                new RegExp(`\\bclass\\s+${clase}\\b|\\bnew\\s+${clase}\\s*\\(|extends\\s+${clase}\\b`)]);
        }
        for (const [nombre, regex] of prohibidos) {
            const encontrados = buscar(regex);
            this.#comprobar(encontrados.length === 0,
                `PRD 005 RNF-01 src/, index.html y vista_conduccion.js no usan ${nombre}`
                + (encontrados.length ? ' → ' + encontrados.join(', ') : ''));
        }
    }

    // ── RNF-01 (D4): RegistroPistas y su orden de carga ───────────
    #revisarRegistroPistas() {
        const registro = this.#leer('src/model/registro_pistas.js');
        this.#comprobar(registro.length > 0, 'PRD 005 RNF-01 existe src/model/registro_pistas.js');
        const clases = registro.match(/^\s*class\s+\w+/gm) || [];
        this.#comprobar(clases.length === 1 && /class\s+RegistroPistas\b/.test(clases[0] || ''),
            'PRD 005 RNF-01 registro_pistas.js tiene una sola clase: RegistroPistas');
        this.#comprobar(/window\.registroPistas\s*=\s*new\s+RegistroPistas\s*\(\s*\)/.test(registro),
            'PRD 005 RNF-01 registro_pistas.js crea la instancia única window.registroPistas');

        const html = this.#leer('index.html');
        const posRegistro = html.search(/<script[^>]+src="src\/model\/registro_pistas\.js"/);
        const posConfig   = html.search(/<script[^>]+src="src\/model\/pistas\/config_pista\.js"/);
        this.#comprobar(posRegistro >= 0, 'PRD 005 RNF-01 index.html carga registro_pistas.js');
        this.#comprobar(posRegistro >= 0 && posConfig >= 0 && posRegistro < posConfig,
            'PRD 005 RNF-01 index.html carga registro_pistas.js antes que config_pista.js');
    }

    // ── RF-10 (D9) ─────────────────────────────────────────────────
    #revisarDocumentos() {
        const prds = fs.readdirSync(path.join(this.#raiz, 'docs', 'prds'));
        for (const numero of ['001', '002', '004']) {
            const archivo = prds.find(nombre => nombre.startsWith(`prd_${numero}_`));
            const texto = archivo ? this.#leer(path.join('docs', 'prds', archivo)) : '';
            this.#comprobar(texto.includes('PRD 005'), `PRD 005 RF-10 el PRD ${numero} cita "PRD 005"`);
        }
        const claude = this.#leer('CLAUDE.md');
        for (const clase of ['ControladorModo2D', 'MinimapaConductor']) {
            this.#comprobar(claude.length > 0 && !claude.includes(clase),
                `PRD 005 RF-10 CLAUDE.md no nombra ${clase}`);
        }
        const filaB2 = this.#leer('docs/BACKLOG.md').split('\n').find(l => /^\|\s*B2\s*\|/.test(l)) || '';
        this.#comprobar(filaB2.includes('✅'), 'PRD 005 RF-10 el BACKLOG marca B2 como hecho');
        const fila17 = this.#leer('docs/LECCIONES_APRENDIDAS.md').split('\n')
            .find(l => /^\|\s*17\s*\|/.test(l)) || '';
        this.#comprobar(/✅\s*cerrada/.test(fila17) && fila17.includes('PRD 005'),
            'PRD 005 RF-10 la lección 17 está cerrada por el PRD 005');
    }
}

const prueba = new PruebaArchivarMotor2D();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
