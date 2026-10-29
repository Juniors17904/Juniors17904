// ================================================================
// CLASE: PruebaPantallasEstiloCarreras — PRD 026 (docs/prds/prd_026_pantallas_estilo_carreras.md)
//   RF-03 PortadaCarro dibuja el perfil del tipo pedido con el color pedido
//         (y el deportivo si el tipo no existe)
//   RNF-01 el tema vive en src/tema_carreras.css y se carga después de todos los estilos
//   RF-11 notas en los PRD de D8, CLAUDE.md nombra PortadaCarro y el backlog enlaza B27
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaPantallasEstiloCarreras {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];

    ejecutar() {
        this.#probarPortada();
        this.#probarTema();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaPantallasEstiloCarreras.#RAIZ, relativo), 'utf8'); }

    // Canvas de mentira que anota lo que se dibuja
    #canvas() {
        const pasos = [];
        const ctx = new Proxy({ pasos }, { get: (o, k) => k in o ? o[k] : (...a) => pasos.push([k, ...a]), set: (o, k, v) => { pasos.push(['=' + String(k), v]); return true; } });
        return { clientWidth: 300, clientHeight: 120, width: 0, height: 0, getContext: () => ctx, pasos };
    }

    #probarPortada() {
        const ctx = { console, Math, devicePixelRatio: 2 }; ctx.window = ctx;
        vm.createContext(ctx);
        vm.runInContext(this.#leer('src/view/portada_carro.js'), ctx, { filename: 'portada_carro.js' });
        const dibujados = [];
        const catalogo = { obtener: tipo => ['deportivo', 'suv'].includes(tipo) ? { dibujar: (_, color) => dibujados.push([tipo, color]) } : null };
        const canvas = this.#canvas();
        const portada = new ctx.PortadaCarro(canvas, catalogo);
        portada.dibujar('suv', '#3b82f6');
        this.#ok(JSON.stringify(dibujados) === JSON.stringify([['suv', '#3b82f6']]), 'RF-03 PortadaCarro dibuja el carro elegido con su color');
        this.#ok(canvas.width === 600 && canvas.height === 240, `RF-03 el canvas se ajusta a su tamaño en pantalla (${canvas.width}×${canvas.height})`);
        portada.dibujar('desconocido', '#ef4444');
        this.#ok(dibujados[1]?.[0] === 'deportivo', 'RF-03 un tipo desconocido dibuja el deportivo');
        new ctx.PortadaCarro(null, catalogo).dibujar('suv', '#fff');   // sin canvas no rompe
    }

    #probarTema() {
        const html = this.#leer('index.html');
        const tema = html.indexOf('src/tema_carreras.css'), ultimoEstilo = html.lastIndexOf('</style>');
        this.#ok(tema > html.indexOf('src/style.css') && tema > ultimoEstilo && tema < html.indexOf('</head>'),
            'RNF-01 el tema se carga después de src/style.css y de los estilos de index.html');
        this.#ok(html.indexOf('portada_carro.js') > html.indexOf('catalogo_perfiles_carro.js') && html.indexOf('portada_carro.js') < html.indexOf('controlador_inicio.js'),
            'RNF-01 portada_carro.js se carga después de los perfiles y antes de ControladorInicio');
        const css = this.#leer('src/tema_carreras.css');
        this.#ok(/--neon-v:\s*#FF4D1F/i.test(css) && /--neon-c:\s*#FFC400/i.test(css) && /Saira Condensed/.test(css), 'D2 el tema define el naranja, el amarillo y la letra condensada');
        this.#ok(!/^:root/m.test(css), 'D7 el tema no cambia :root (los controles de la carrera siguen como estaban)');
        const portada = this.#leer('src/view/portada_carro.js');
        this.#ok((portada.match(/^class /gm) || []).length === 1 && portada.split('\n').length <= 400, 'RNF-01/RNF-03 PortadaCarro sola en su archivo');
        this.#ok(!/getContext|PortadaCarro\(/.test(this.#leer('src/controller/aplicacion.js')), 'RNF-02 Aplicacion no dibuja nada');
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaPantallasEstiloCarreras.#RAIZ, 'docs/prds'));
        for (const n of ['002', '004', '005', '006', '008', '009', '010', '011', '012', '014', '015', '016', '017', '018', '019', '020', '021', '022']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /según el PRD 026/.test(this.#leer(`docs/prds/${f}`)), `RF-11 el PRD ${n} tiene la nota del PRD 026`);
        }
        this.#ok(/PortadaCarro/.test(this.#leer('CLAUDE.md')) && /tema_carreras\.css/.test(this.#leer('CLAUDE.md')), 'RF-11 CLAUDE.md nombra PortadaCarro y el tema');
        this.#ok(/B27[^\n]*prd_026/.test(this.#leer('docs/BACKLOG.md')), 'RF-11 el backlog enlaza B27 con el PRD 026');
    }
}

new PruebaPantallasEstiloCarreras().ejecutar();
