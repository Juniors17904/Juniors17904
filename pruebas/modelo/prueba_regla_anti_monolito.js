// ================================================================
// CLASE: PruebaReglaAntiMonolito — PRD docs/prds/prd_003_regla_anti_monolito.md
//   RF-01..RF-03 y RF-10: los textos de la regla existen en CLAUDE.md,
//   docs/PRD_CREATOR.md y docs/BACKLOG.md.
//   RF-04..RF-08 (RNF-02): en un repo git temporal (os.tmpdir) se copian
//   scripts/verificar_arquitectura.sh y scripts/pre-commit, se escribe una
//   lista de aceptados propia (así la prueba sigue valiendo cuando B10 vacíe
//   la real), se instala el hook con el "prepare" de package.json y se hacen
//   commits reales. El repo real no se toca.
// ================================================================
'use strict';
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

class PruebaReglaAntiMonolito {
    #raizReal = path.join(__dirname, '..', '..');
    #repo     = null;
    #fallos   = 0;
    #aceptados = new Map();
    // Archivo aceptado ficticio del repo temporal (no depende de la lista real)
    static #ACEPTADO_PRUEBA = 'src/controller/aceptado_prueba.js';
    static #LINEAS_ACEPTADO = 450;

    ejecutar() {
        this.#aceptados = this.#leerAceptados();
        this.#revisarDocumentos();
        try {
            this.#crearRepoTemporal();
            this.#revisarCommits();
        } catch (error) {
            this.#comprobar(false, 'PRD 003 error en el repo temporal: ' + error.message);
        } finally {
            if (this.#repo) fs.rmSync(this.#repo, { recursive: true, force: true });
        }
        this.#comprobar(!this.#repo || !fs.existsSync(this.#repo),
            'PRD 003 RNF-02 el repo temporal se borró al terminar');
        console.log(this.#fallos ? `\n${this.#fallos} fallo(s)` : '\nTodo OK');
        return this.#fallos;
    }

    #comprobar(condicion, mensaje) {
        console.log(condicion ? 'OK   ' : 'FALLO', mensaje);
        if (!condicion) this.#fallos++;
    }

    #leerReal(relativo) {
        const ruta = path.join(this.#raizReal, relativo);
        return fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
    }

    // Lista única de archivos grandes aceptados (lección 4: se lee, no se copia)
    #leerAceptados() {
        const aceptados = new Map();
        for (const linea of this.#leerReal('scripts/archivos_grandes_aceptados.txt').split('\n')) {
            const [archivo, lineas] = linea.trim().split(/\s+/);
            if (archivo && /^\d+$/.test(lineas || '')) aceptados.set(archivo, Number(lineas));
        }
        return aceptados;
    }

    // Texto de una sección "## ..." de un markdown, hasta la siguiente "## "
    #seccion(texto, titulo) {
        const inicio = texto.indexOf(titulo);
        if (inicio < 0) return '';
        const fin = texto.indexOf('\n## ', inicio + titulo.length);
        return texto.slice(inicio, fin < 0 ? undefined : fin);
    }

    // ── RF-01, RF-02, RF-03, RF-10 ─────────────────────────────────
    #revisarDocumentos() {
        const claude = this.#leerReal('CLAUDE.md');
        const regla  = this.#seccion(claude, 'ANTI-MONOLITO');
        this.#comprobar(regla.length > 0, 'PRD 003 RF-01 CLAUDE.md tiene la sección Anti-monolito');
        for (const texto of ['400 líneas', 'Responsabilidad única', 'propio controlador',
                             'Excepciones temporales hasta B10']) {
            this.#comprobar(regla.includes(texto), 'PRD 003 RF-01 la sección dice "' + texto + '"');
        }
        // D4: como mucho los 4 de §5; B10 la irá vaciando (lección 4: la sección
        // nombra los archivos y remite a la lista, sin copiar las líneas)
        this.#comprobar(this.#aceptados.size <= 4,
            'PRD 003 RF-01 la lista de aceptados no pasa de 4 archivos (' + this.#aceptados.size + ')');
        this.#comprobar(regla.includes('scripts/archivos_grandes_aceptados.txt'),
            'PRD 003 RF-01 la sección remite a la lista única');
        for (const archivo of this.#aceptados.keys()) {
            const nombre = '`' + path.basename(archivo) + '`';
            this.#comprobar(regla.includes(nombre), 'PRD 003 RF-01 la sección nombra ' + nombre);
        }
        for (const pantalla of ['Test Drive 3D', 'Diseño de Pistas', 'Diseño General', 'Diseño de Objetos']) {
            this.#comprobar(regla.includes(pantalla), 'PRD 003 RF-01 la sección nombra la pantalla ' + pantalla);
        }
        this.#comprobar(regla.includes('MVC sigue igual'), 'PRD 003 RF-02 la sección dice que MVC sigue igual');
        const visores = this.#seccion(claude, 'Visores de pista');
        this.#comprobar(visores.includes('Regla: cada pantalla tiene su propio controlador'),
            'PRD 003 RF-02 "Visores de pista" presenta el controlador por pantalla como regla');
        this.#comprobar(!/Excepción:\*\*\s*cuando una pantalla tiene su propio controlador/.test(claude),
            'PRD 003 RF-02 ya no figura el controlador por pantalla como excepción');
        this.#comprobar(visores.includes('excepciones temporales hasta B10'),
            'PRD 003 RF-02 "Visores de pista" remite a las excepciones temporales');

        const creador = this.#leerReal('docs/PRD_CREATOR.md');
        for (const texto of ['anti-monolito', '400 líneas', 'responsabilidad única']) {
            this.#comprobar(creador.includes(texto), 'PRD 003 RF-03 PRD_CREATOR.md dice "' + texto + '"');
        }

        const backlog = this.#leerReal('docs/BACKLOG.md');
        for (let n = 5; n <= 10; n++) {
            this.#comprobar(new RegExp('^\\| B' + n + ' \\|', 'm').test(backlog),
                'PRD 003 RF-10 BACKLOG.md tiene la fila B' + n);
        }
        const b10 = (backlog.match(/^\| B10 \|.*$/m) || [''])[0];
        this.#comprobar(b10.includes('aplicacion.js') && b10.includes('Diseño de Objetos'),
            'PRD 003 RF-10 B10 incluye los archivos grandes y las pantallas sin controlador');
    }

    // ── Repo temporal ──────────────────────────────────────────────
    #git(...argumentos) {
        const r = spawnSync('git', argumentos, { cwd: this.#repo, encoding: 'utf8' });
        // Sin colores para buscar textos en la salida del hook
        const salida = ((r.stdout || '') + (r.stderr || '')).replace(/\x1b\[[0-9;]*m/g, '');
        return { estado: r.status, salida };
    }

    #crearRepoTemporal() {
        this.#repo = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-anti-monolito-'));
        fs.mkdirSync(path.join(this.#repo, 'scripts'));
        for (const archivo of ['verificar_arquitectura.sh', 'pre-commit']) {
            fs.copyFileSync(path.join(this.#raizReal, 'scripts', archivo), path.join(this.#repo, 'scripts', archivo));
        }
        fs.writeFileSync(path.join(this.#repo, 'scripts', 'archivos_grandes_aceptados.txt'),
            PruebaReglaAntiMonolito.#ACEPTADO_PRUEBA + ' ' + PruebaReglaAntiMonolito.#LINEAS_ACEPTADO + '\n');
        fs.chmodSync(path.join(this.#repo, 'scripts', 'pre-commit'), 0o755);
        this.#git('init', '-q');
        this.#git('config', 'user.name', 'Prueba Anti Monolito');
        this.#git('config', 'user.email', 'prueba@turbo-race.local');
        this.#git('config', 'commit.gpgsign', 'false');

        // RF-04: el hook se instala con el "prepare" que corre "npm install"
        const paquete = JSON.parse(this.#leerReal('package.json') || '{}');
        const preparar = (paquete.scripts || {}).prepare || '';
        this.#comprobar(preparar.includes('git config core.hooksPath scripts'),
            'PRD 003 RF-04 package.json instala el hook ("prepare": "' + preparar + '")');
        // Fuera de un repo git (por ejemplo un deploy sin .git) "npm install" no debe fallar
        const sinGit = fs.mkdtempSync(path.join(os.tmpdir(), 'prueba-sin-git-'));
        const fuera = spawnSync('sh', ['-c', preparar || 'false'], { cwd: sinGit, encoding: 'utf8',
            env: { ...process.env, GIT_DIR: '', GIT_CEILING_DIRECTORIES: path.dirname(sinGit) } });
        fs.rmSync(sinGit, { recursive: true, force: true });
        this.#comprobar(fuera.status === 0, 'PRD 003 RF-04 "prepare" no falla fuera de un repo git');
        const r = spawnSync('sh', ['-c', preparar || 'false'], { cwd: this.#repo, encoding: 'utf8' });
        this.#comprobar(r.status === 0 && this.#git('config', 'core.hooksPath').salida.trim() === 'scripts',
            'PRD 003 RF-04 tras "prepare" core.hooksPath = scripts en el repo temporal');
        const modo = fs.statSync(path.join(this.#raizReal, 'scripts', 'pre-commit')).mode;
        this.#comprobar((modo & 0o111) !== 0, 'PRD 003 RF-04 scripts/pre-commit es ejecutable');

        this.#git('add', 'scripts');
        const base = this.#git('commit', '-q', '-m', 'base');
        this.#comprobar(base.estado === 0, 'PRD 003 RNF-02 commit base del repo temporal');
    }

    // Archivo con "lineas" líneas; si se da la clase, la primera la define
    #escribir(relativo, lineas, clase = null) {
        const ruta = path.join(this.#repo, relativo);
        fs.mkdirSync(path.dirname(ruta), { recursive: true });
        const cuerpo = [];
        if (clase) cuerpo.push('class ' + clase + ' {}');
        while (cuerpo.length < lineas) cuerpo.push('// línea ' + (cuerpo.length + 1));
        fs.writeFileSync(ruta, cuerpo.join('\n') + '\n');
    }

    #commitear(relativo, mensaje) {
        this.#git('add', relativo);
        return this.#git('commit', '-m', mensaje);
    }

    #estaEnHead(relativo) {
        return this.#git('cat-file', '-e', 'HEAD:' + relativo).estado === 0;
    }

    // Deshace un commit bloqueado: saca el archivo del staging y lo vuelve a HEAD
    #limpiar(relativo) {
        this.#git('reset', '-q', '--', relativo);
        if (this.#estaEnHead(relativo)) this.#git('checkout', '-q', '--', relativo);
        else fs.rmSync(path.join(this.#repo, relativo), { force: true });
    }

    #esperarBloqueo(relativo, lineas, rf) {
        const antes = this.#git('rev-parse', 'HEAD').salida;
        const r = this.#commitear(relativo, 'bloqueado ' + relativo);
        this.#comprobar(r.estado !== 0 && this.#git('rev-parse', 'HEAD').salida === antes &&
            r.salida.includes('Commit BLOQUEADO'),
            'PRD 003 ' + rf + ' ' + relativo + ' de ' + lineas + ' líneas: commit bloqueado');
        this.#comprobar(r.salida.includes('[R4] ' + relativo) &&
            r.salida.includes('Tiene ' + lineas + ' líneas') && r.salida.includes('límite es 400'),
            'PRD 003 ' + rf + ' el mensaje nombra ' + relativo + ' y el límite de 400');
        this.#limpiar(relativo);
    }

    #esperarPermitido(relativo, rf, descripcion) {
        const r = this.#commitear(relativo, 'permitido ' + relativo);
        this.#comprobar(r.estado === 0 && !r.salida.includes('Commit BLOQUEADO'),
            'PRD 003 ' + rf + ' ' + descripcion + ': commit permitido');
        return r.salida;
    }

    // ── RF-05, RF-06, RF-08 ───────────────────────────────────────
    #revisarCommits() {
        // RF-05: archivos nuevos de 401 líneas (juego, prueba y raíz)
        this.#escribir('src/view/vista_larga.js', 401, 'VistaLarga');
        this.#esperarBloqueo('src/view/vista_larga.js', 401, 'RF-05');
        this.#escribir('pruebas/modelo/prueba_larga.js', 401);
        this.#esperarBloqueo('pruebas/modelo/prueba_larga.js', 401, 'RF-05');
        this.#escribir('raiz_larga.mjs', 401);
        this.#esperarBloqueo('raiz_larga.mjs', 401, 'RF-05');

        // El límite es "más de 400": 400 líneas justas pasan
        this.#escribir('src/view/vista_justa.js', 400, 'VistaJusta');
        this.#esperarPermitido('src/view/vista_justa.js', 'RF-05', 'archivo nuevo de 400 líneas');

        // RF-05: archivo existente que crece de 380 a 420
        this.#escribir('pruebas/modelo/existente.js', 380);
        this.#esperarPermitido('pruebas/modelo/existente.js', 'RF-05', 'archivo de 380 líneas');
        this.#escribir('pruebas/modelo/existente.js', 420);
        this.#esperarBloqueo('pruebas/modelo/existente.js', 420, 'RF-05');
        this.#comprobar(this.#git('show', 'HEAD:pruebas/modelo/existente.js').salida.split('\n').length - 1 === 380,
            'PRD 003 RF-05 en HEAD sigue la versión de 380 líneas');

        // RF-05: renombrar y hacer crecer (git lo marca como R) también se bloquea
        this.#escribir('pruebas/modelo/existente.js', 420);
        this.#git('mv', 'pruebas/modelo/existente.js', 'pruebas/modelo/renombrado.js');
        this.#escribir('pruebas/modelo/renombrado.js', 420);
        this.#git('add', 'pruebas/modelo/renombrado.js');
        this.#comprobar(/^R/m.test(this.#git('diff', '--cached', '--name-status', '-M').salida),
            'PRD 003 RF-05 git ve el cambio como renombrado');
        let r = this.#git('commit', '-m', 'renombrado');
        this.#comprobar(r.estado !== 0 && r.salida.includes('[R4] pruebas/modelo/renombrado.js') &&
            r.salida.includes('Tiene 420 líneas'), 'PRD 003 RF-05 archivo renombrado de 420 líneas: commit bloqueado');
        this.#git('reset', '-q', '--hard');

        // RF-05: ruta con espacios
        this.#escribir('pruebas/modelo/con espacio.js', 401);
        this.#esperarBloqueo('pruebas/modelo/con espacio.js', 401, 'RF-05');

        // RF-05: un archivo grande que ya está en el repo (entró con --no-verify)
        // bloquea cualquier commit, aunque no se toque
        this.#escribir('src/view/colado.js', 401, 'Colado');
        this.#git('add', 'src/view/colado.js');
        this.#git('commit', '-q', '--no-verify', '-m', 'colado');
        this.#escribir('src/view/pequeno.js', 10, 'Pequeno');
        const antes = this.#git('rev-parse', 'HEAD').salida;
        r = this.#commitear('src/view/pequeno.js', 'pequeño');
        this.#comprobar(r.estado !== 0 && this.#git('rev-parse', 'HEAD').salida === antes &&
            r.salida.includes('[R4] src/view/colado.js'),
            'PRD 003 RF-05 un archivo grande existente no tocado también bloquea');
        this.#git('rm', '-q', '--cached', 'src/view/colado.js');
        fs.rmSync(path.join(this.#repo, 'src/view/colado.js'), { force: true });
        this.#esperarPermitido('src/view/pequeno.js', 'RF-05', 'commit tras quitar el archivo grande');

        // RF-06: un archivo aceptado solo da aviso, y si crece el aviso lo dice
        const aplicacion = PruebaReglaAntiMonolito.#ACEPTADO_PRUEBA;
        const medida = PruebaReglaAntiMonolito.#LINEAS_ACEPTADO;
        {
            this.#escribir(aplicacion, medida, 'AceptadoPrueba');
            let salida = this.#esperarPermitido(aplicacion, 'RF-06', aplicacion + ' de ' + medida + ' líneas');
            this.#comprobar(this.#estaEnHead(aplicacion), 'PRD 003 RF-06 ' + aplicacion + ' quedó commiteado');
            this.#comprobar(salida.includes('⚠  [R4] ' + aplicacion) &&
                salida.includes('tiene ' + medida + ' líneas'),
                'PRD 003 RF-06 aviso de archivo grande aceptado con ' + medida + ' líneas');
            this.#escribir(aplicacion, medida + 1, 'AceptadoPrueba');
            salida = this.#esperarPermitido(aplicacion, 'RF-06', aplicacion + ' que crece a ' + (medida + 1));
            this.#comprobar(salida.includes('creció de ' + medida + ' a ' + (medida + 1) + ' líneas'),
                'PRD 003 RF-06 el aviso dice que creció de ' + medida + ' a ' + (medida + 1));
        }

        // RF-08: sin aviso falso de R3 con números en el nombre
        for (const [archivo, clase] of [['src/model/modo_clasico_2d.js', 'ModoClasico2D'],
                                        ['src/model/modo_test_drive_3d.js', 'ModoTestDrive3D']]) {
            this.#escribir(archivo, 10, clase);
            const salida = this.#esperarPermitido(archivo, 'RF-08', archivo);
            this.#comprobar(!salida.includes('[R3]'), 'PRD 003 RF-08 ' + archivo + ' con class ' + clase + ' no da aviso R3');
        }
        // Control: R3 sigue avisando cuando el nombre no coincide
        this.#escribir('src/model/modo_raro_2d.js', 10, 'OtraClase');
        const salida = this.#esperarPermitido('src/model/modo_raro_2d.js', 'RF-08', 'archivo con clase distinta');
        this.#comprobar(salida.includes('[R3] src/model/modo_raro_2d.js') && salida.includes('class ModoRaro2D'),
            'PRD 003 RF-08 R3 sigue avisando si la clase no coincide (espera ModoRaro2D)');
    }
}

const prueba = new PruebaReglaAntiMonolito();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
