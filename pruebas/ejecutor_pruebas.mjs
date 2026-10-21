// ================================================================
// CLASE: EjecutorPruebas — corre las pruebas del proyecto.
//   node pruebas/ejecutor_pruebas.mjs modelo      → pruebas rápidas (node)
//   node pruebas/ejecutor_pruebas.mjs navegador   → pruebas en Chromium (Xvfb)
//   node pruebas/ejecutor_pruebas.mjs todo        → ambas
// ================================================================
import { spawn, spawnSync } from 'child_process';
import { readdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class EjecutorPruebas {
    #raiz    = join(dirname(fileURLToPath(import.meta.url)), '..');
    #puerto  = 8099;
    #fallos  = [];
    #servidor = null;

    async ejecutar(modo) {
        if (modo === 'modelo'    || modo === 'todo') this.#correrModelo();
        if (modo === 'navegador' || modo === 'todo') await this.#correrNavegador();
        this.#informar();
        return this.#fallos.length ? 1 : 0;
    }

    #archivos(carpeta, extension) {
        const dir = join(this.#raiz, 'pruebas', carpeta);
        return readdirSync(dir).filter(f => f.endsWith(extension)).sort().map(f => join(dir, f));
    }

    #correrModelo() {
        for (const archivo of this.#archivos('modelo', '.js')) {
            this.#correr('node', [archivo], {});
        }
    }

    async #correrNavegador() {
        await this.#levantarServidor();
        try {
            for (const lock of readdirSync('/tmp').filter(f => /^\.X\d+-lock$/.test(f))) {
                rmSync(join('/tmp', lock), { force: true });
            }
            for (const archivo of this.#archivos('navegador', '.mjs')) {
                this.#correr('xvfb-run', ['--auto-servernum', '--server-args=-screen 0 1280x960x24', 'node', archivo], {});
            }
        } finally {
            this.#servidor?.kill();
        }
    }

    async #levantarServidor() {
        this.#servidor = spawn('python3', ['-m', 'http.server', String(this.#puerto)],
            { cwd: this.#raiz, stdio: 'ignore' });
        await new Promise(r => setTimeout(r, 1000));
    }

    #correr(comando, argumentos, entorno) {
        const nombre = argumentos[argumentos.length - 1].replace(this.#raiz + '/', '');
        const r = spawnSync(comando, argumentos, {
            cwd: this.#raiz, encoding: 'utf8', env: { ...process.env, ...entorno }, timeout: 300000,
        });
        const ok = r.status === 0;
        console.log(`${ok ? '✅' : '❌'} ${nombre}`);
        if (!ok) {
            this.#fallos.push(nombre);
            console.log((r.stdout || '') + (r.stderr || '') + (r.error ? String(r.error) : ''));
        }
    }

    #informar() {
        console.log(this.#fallos.length
            ? `\n❌ ${this.#fallos.length} prueba(s) fallaron: ${this.#fallos.join(', ')}`
            : '\n✅ Todas las pruebas pasaron');
    }
}

const ejecutor = new EjecutorPruebas();
process.exitCode = await ejecutor.ejecutar(process.argv[2] || 'modelo');
