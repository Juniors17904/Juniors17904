// ================================================================
// CLASE: PruebaPisoPista — PRD 012 (docs/prds/prd_012_relieves_y_espesores.md),
// fase 1: medidas del piso en MedidasEscena y la pieza compartida
// ConstructorPisoPista (geometría, sin navegador):
//   RF-01 piano 0,7 m, 8 cm sobre el asfalto, franjas de 1 m iguales
//   RF-02 asfalto 8 cm sobre el pasto, pared del piano hasta el pasto
//   RF-04 línea central 0,15 m, trazos 3 m y huecos 6 m
//   RF-05 líneas de borde 0,15 m a todo el largo
//   RF-06 meta a cuadros de 1 m y todo el ancho del asfalto
//   RF-08 cambiar una medida cambia el dibujo · recta abierta sin unir extremos
//   RNF-01 la pieza no repite medidas · liberar() suelta geometrías y materiales
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaPisoPista {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #EPS  = 1e-4;
    #fallos = [];
    #THREE; #Constructor; #Curva; #Recto;
    #m;

    async ejecutar() {
        globalThis.window = globalThis;
        for (const f of ['medida_carro.js', 'medidas_escena.js']) {
            vm.runInThisContext(fs.readFileSync(path.join(PruebaPisoPista.#RAIZ, 'src/model', f), 'utf8'), { filename: f });
        }
        const comun = p => path.join(PruebaPisoPista.#RAIZ, 'src/view/pistas/comun', p);
        this.#THREE = await import('three');
        ({ ConstructorPisoPista: this.#Constructor } = await import(comun('constructor_piso_pista.js')));
        ({ TrazadoPisoCurva: this.#Curva } = await import(comun('trazado_piso_curva.js')));
        ({ TrazadoPisoRecto: this.#Recto } = await import(comun('trazado_piso_recto.js')));
        this.#m = new globalThis.MedidasEscena();

        this.#probarRecta();
        this.#probarCurva();
        this.#probarCambioDeMedida();
        this.#probarLiberar();
        this.#probarSinNumerosRepetidos();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(c, msg) { if (!c) this.#fallos.push(msg); }

    // Vértices de una malla del grupo como lista de [x, y, z]
    #vertices(grupo, nombre) {
        const malla = grupo.getObjectByName(nombre);
        if (!malla) return [];
        const p = malla.geometry.getAttribute('position'), r = [];
        for (let i = 0; i < p.count; i++) r.push([p.getX(i), p.getY(i), p.getZ(i)]);
        return r;
    }

    // Cuadros (de a 4 vértices seguidos) de una malla
    #cuadros(grupo, nombre) {
        const v = this.#vertices(grupo, nombre), r = [];
        for (let i = 0; i + 3 < v.length; i += 4) r.push(v.slice(i, i + 4));
        return r;
    }

    #probarRecta() {
        const m = this.#m, M = m.medioAnchoAsfalto, E = m.limitePiano;
        const hA = m.alturaAsfalto, hP = hA + m.alturaPiano, eps = PruebaPisoPista.#EPS;
        const L = 30;
        const grupo = new this.#Constructor(new this.#Recto(L), 10).construir();
        this.#ok(grupo.children.length === 7, 'una malla por material (7): ' + grupo.children.length);

        const asf = this.#vertices(grupo, 'asfalto');
        this.#ok(asf.length > 0 && asf.every(([x, y, z]) => Math.abs(y - hA) < eps && Math.abs(x) <= M + eps && z >= -eps && z <= L + eps),
            'RF-02 asfalto a 8 cm sobre el pasto y 8 m de ancho');
        // Recta abierta: ningún cuadro une el final con el inicio
        const saltos = this.#cuadros(grupo, 'asfalto').map(q => Math.max(...q.map(v => v[2])) - Math.min(...q.map(v => v[2])));
        this.#ok(Math.max(...saltos) <= 0.5 + eps, 'recta abierta: ningún cuadro mide más de 0,5 m ' + Math.max(...saltos));

        for (const nombre of ['pianoRojo', 'pianoBlanco']) {
            const v = this.#vertices(grupo, nombre);
            this.#ok(v.every(([x]) => Math.abs(x) >= M - eps && Math.abs(x) <= E + eps), `RF-01 ${nombre} entre 4 y 4,7 m del centro`);
            this.#ok(Math.abs(Math.max(...v.map(p => p[1])) - hP) < eps, `RF-01 ${nombre} sube a 8 cm sobre el asfalto`);
            this.#ok(v.some(([x, y]) => Math.abs(Math.abs(x) - E) < eps && Math.abs(y) < eps), `RF-02 ${nombre} baja en pared hasta el pasto`);
            this.#ok(v.filter(([x]) => Math.abs(Math.abs(x) - M) < eps).every(([, y]) => Math.abs(y - hA) < eps), `RF-01 ${nombre} arranca al nivel del asfalto`);
        }
        // Franjas de 1 m: rojas en [2k, 2k+1], blancas en [2k+1, 2k+2]
        const franja = (nombre, par) => this.#cuadros(grupo, nombre).every(q => {
            const zc = q.reduce((a, v) => a + v[2], 0) / 4;
            return Math.floor(zc / m.largoFranjaPiano) % 2 === (par ? 0 : 1);
        });
        this.#ok(franja('pianoRojo', true) && franja('pianoBlanco', false), 'RF-01 franjas rojas y blancas de 1 m alternas');

        const cen = this.#vertices(grupo, 'lineaCentral');
        const a = m.anchoLineaCentral / 2, paso = m.trazoLineaCentral + m.huecoLineaCentral;
        this.#ok(cen.every(([x]) => Math.abs(x) <= a + eps) && cen.some(([x]) => Math.abs(Math.abs(x) - a) < eps), 'RF-04 línea central de 0,15 m');
        this.#ok(cen.every(([, , z]) => (z % paso) <= m.trazoLineaCentral + eps || (paso - (z % paso)) < eps), 'RF-04 trazos de 3 m y huecos de 6 m');
        this.#ok(cen.some(([, , z]) => Math.abs(z - m.trazoLineaCentral) < eps) && cen.some(([, , z]) => Math.abs(z - paso) < eps), 'RF-04 el trazo termina a los 3 m y vuelve a los 9 m');

        const bor = this.#vertices(grupo, 'lineasBorde'), b = m.anchoLineaBorde / 2;
        this.#ok(bor.every(([x]) => Math.abs(Math.abs(x) - m.lineaBorde) <= b + eps), 'RF-05 líneas de borde de 0,15 m');
        this.#ok(Math.min(...bor.map(v => v[2])) < eps && Math.max(...bor.map(v => v[2])) > L - eps, 'RF-05 líneas de borde a todo el largo');

        const meta = [...this.#cuadros(grupo, 'metaBlanca'), ...this.#cuadros(grupo, 'metaNegra')];
        const vm = meta.flat();
        this.#ok(Math.abs(Math.min(...vm.map(v => v[0])) + M) < eps && Math.abs(Math.max(...vm.map(v => v[0])) - M) < eps, 'RF-06 meta a todo el ancho del asfalto');
        this.#ok(Math.abs(Math.max(...vm.map(v => v[2])) - Math.min(...vm.map(v => v[2])) - m.largoMeta) < eps, 'RF-06 meta de 1 m de largo');
        this.#ok(Math.abs(Math.min(...vm.map(v => v[2])) - (10 - m.largoMeta / 2)) < eps, 'RF-06 meta centrada donde se pide');
        this.#ok(this.#cuadros(grupo, 'metaBlanca').length > 0 && this.#cuadros(grupo, 'metaNegra').length > 0, 'RF-06 meta a cuadros blancos y negros');
    }

    #probarCurva() {
        const T = this.#THREE, m = this.#m, R = 50, pts = [];
        for (let i = 0; i < 64; i++) { const t = 2 * Math.PI * i / 64; pts.push(new T.Vector3(R * Math.sin(t), 0, R * Math.cos(t))); }
        const curva = new T.CatmullRomCurve3(pts, true);
        const trazado = new this.#Curva(curva);
        this.#ok(trazado.cerrado && Math.abs(trazado.largo - curva.getLength()) < 0.5, 'curva cerrada con su largo');
        const grupo = new this.#Constructor(trazado).construir();
        // Cada cuadro rojo queda en una franja par; todas las franjas miden lo mismo (≈1 m)
        const n = Math.round(trazado.largo / m.largoFranjaPiano), arco = 2 * Math.PI / n;
        const indices = new Set();
        let pares = true;
        for (const q of this.#cuadros(grupo, 'pianoRojo')) {
            const x = q.reduce((a, v) => a + v[0], 0) / 4, z = q.reduce((a, v) => a + v[2], 0) / 4;
            const th = (Math.atan2(x, z) + 2 * Math.PI) % (2 * Math.PI);
            const k = Math.floor(th / arco + 1e-6) % n;
            if (k % 2 !== 0) pares = false;
            indices.add(k);
        }
        this.#ok(pares && indices.size === n / 2, `RF-01 en la curva, ${n / 2} franjas rojas iguales (${indices.size})`);
        this.#ok(Math.abs(trazado.largo / n - m.largoFranjaPiano) < 0.05, 'RF-01 franjas de 1 m (±5 %)');
        // Asfalto cerrado: el recorrido de sus cuadros suma el largo completo
        const asf = this.#cuadros(grupo, 'asfalto');
        this.#ok(Math.abs(asf.length - Math.ceil(curva.getLength() / 0.5)) <= 1, 'curva cerrada sin hueco al final');
    }

    // RF-08: con otra medida, el dibujo cambia (una sola pieza para las 5 pantallas)
    #probarCambioDeMedida() {
        class MedidasPianoAlto extends globalThis.MedidasEscena { get alturaPiano() { return 0.2; } }
        const medidas = new MedidasPianoAlto();
        const grupo = new this.#Constructor(new this.#Recto(10), 0, 0x404040, medidas).construir();
        const alto = Math.max(...this.#vertices(grupo, 'pianoRojo').map(v => v[1]));
        this.#ok(Math.abs(alto - (medidas.alturaAsfalto + 0.2)) < PruebaPisoPista.#EPS, 'RF-08 cambiar la altura del piano cambia el dibujo ' + alto);
    }

    #probarLiberar() {
        const piso = new this.#Constructor(new this.#Recto(10));
        const grupo = piso.construir();
        let liberadas = 0;
        grupo.traverse(o => { if (o.isMesh) { const d = o.geometry.dispose.bind(o.geometry); o.geometry.dispose = () => { liberadas++; d(); }; } });
        piso.liberar();
        this.#ok(liberadas === 7 && piso.grupo === null, 'liberar() suelta las 7 geometrías ' + liberadas);
    }

    #probarSinNumerosRepetidos() {
        const texto = fs.readFileSync(path.join(PruebaPisoPista.#RAIZ, 'src/view/pistas/comun/constructor_piso_pista.js'), 'utf8');
        this.#ok(!/\b(0\.08|0\.15|0\.7|4\.7|4\.0|[^.\d]4\b|3\b|6\b)\s*[,;)]/.test(texto.replace(/0x[0-9a-f]+/gi, '')), 'RNF-01 la pieza no repite medidas del piso');
    }
}

new PruebaPisoPista().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
