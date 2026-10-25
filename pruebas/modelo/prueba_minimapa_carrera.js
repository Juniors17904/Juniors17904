// ================================================================
// CLASE: PruebaMinimapaCarrera — PRD 017 (docs/prds/prd_017_minimapa_jugar_solo.md)
// Sin navegador (RNF-04):
//   RF-01 el mapa dibuja la vuelta entera (también el camino de vuelta) y la meta
//   RF-02 un punto por carro, con el color de su auto (número o texto)
//   RF-03 el punto marca el lugar real: el mismo lugar de la pista cae sobre el
//         recorrido dibujado y un carro corrido de costado se mueve en el mapa
//   RF-04 el jugador es más grande, con borde blanco, y se dibuja al final
//   D4    tamaño por diseño: vertical 90×120, horizontal 140×104 (más ancho y bajo)
//   RF-11 notas en los PRD de D8, CLAUDE.md y backlog B22
//   RNF-03 VisorCarreraSolo no crece, HudCarrera no se toca, nada pasa de 400 líneas
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');

class PruebaMinimapaCarrera {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];
    #ctx;

    ejecutar() {
        this.#cargar();
        this.#probarTamano();
        for (const nombre of ['ciudad', 'costa']) this.#probarPista(nombre);
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaMinimapaCarrera.#RAIZ, relativo), 'utf8'); }

    #cargar() {
        const ctx = { console, Math, Number, Boolean, String, innerWidth: 390, innerHeight: 844, devicePixelRatio: 2 };
        ctx.window = ctx;
        vm.createContext(ctx);
        const pistas = ['ciudad', 'costa'].map(n => `src/model/pistas/config_pista_${n}.js`);
        for (const f of ['src/model/registro_pistas.js', 'src/model/pistas/config_pista.js', ...pistas]) {
            vm.runInContext(this.#leer(f), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);
        const vista = ['disenos/diseno_carrera.js', 'disenos/diseno_vertical.js', 'disenos/diseno_horizontal.js', 'disenos/selector_diseno_carrera.js',
            'minimapas/minimapa_base.js', 'minimapas/punto_minimapa.js', 'minimapas/punto_carro_mapa.js', 'minimapas/minimapa_carrera.js'];
        for (const f of vista) vm.runInContext(this.#leer('src/view/' + f), ctx, { filename: f });
        this.#ok(!(ctx.__modelErrors?.length), 'las clases cargan sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
    }

    // Lienzo falso que guarda lo que se dibuja
    #lienzo() {
        const trazos = [];
        let estilo = '';
        const c2d = new Proxy({}, {
            get: (t, k) => {
                if (k === 'arc') return (x, y, r) => trazos.push({ tipo: 'punto', x, y, r, color: estilo });
                if (k === 'fillRect') return (x, y, w, h) => trazos.push({ tipo: 'rect', x, y, w, h, color: estilo });
                if (k === 'stroke') return () => trazos.push({ tipo: 'borde', color: t.strokeStyle });
                if (k === 'quadraticCurveTo') return (cx, cy) => trazos.push({ tipo: 'curva', x: cx, y: cy });
                return k in t ? t[k] : () => {};
            },
            set: (t, k, v) => { t[k] = v; if (k === 'fillStyle') estilo = v; return true; },
        });
        return { lienzo: { width: 0, height: 0, style: {}, getContext: () => c2d }, trazos };
    }

    #probarTamano() {
        const c = this.#ctx;
        const v = new c.DisenoVertical(), h = new c.DisenoHorizontal();
        this.#ok(v.anchoMapa === 90 && v.altoMapa === 120, 'D4 en vertical el mapa mide 90×120');
        this.#ok(h.anchoMapa * h.altoMapa > v.anchoMapa * v.altoMapa && h.anchoMapa > v.anchoMapa && h.altoMapa <= 108,
            `RF-06 en horizontal es más ancho y no más alto que 108 px, para no tocar el velocímetro (${h.anchoMapa}×${h.altoMapa})`);
        const { lienzo } = this.#lienzo();
        const mapa = new c.MinimapaCarrera(lienzo, c.registroPistas.obtener('ciudad'));
        mapa.actualizar();
        this.#ok(lienzo.style.width === '90px' && lienzo.style.height === '120px' && lienzo.width === 180, 'D4 en 390×844 el lienzo toma el tamaño vertical (nítido en pantallas densas)');
        c.innerWidth = 844; c.innerHeight = 390;
        mapa.actualizar();
        this.#ok(lienzo.style.width === '140px' && lienzo.style.height === '104px', 'RF-06 al girar el celular el mapa cambia de tamaño');
        c.innerWidth = 390; c.innerHeight = 844;
    }

    #probarPista(nombre) {
        const c = this.#ctx;
        const pista = c.registroPistas.obtener(nombre);
        const vuelta = new c.TrazadoVuelta(pista.tramos, pista.totalSegs).puntos;
        const { lienzo, trazos } = this.#lienzo();
        const mapa = new c.MinimapaCarrera(lienzo, pista);
        const [x0, z0] = vuelta[0];
        const mitad = vuelta[Math.floor(vuelta.length / 2)];
        mapa.ubicar(0, x0, z0, '#ef4444', true);
        mapa.ubicar(1, mitad[0], mitad[1], 0xe74c3c);
        mapa.ubicar(2, mitad[0] + 60, mitad[1], 0x2ecc71);
        mapa.ubicar(3, x0, z0, 0xf1c40f);
        mapa.ubicar(4, mitad[0], mitad[1] + 60, 0x3498db);
        mapa.actualizar();

        const curvas = trazos.filter(t => t.tipo === 'curva');
        this.#ok(curvas.length >= vuelta.length - 2, `RF-01 (${nombre}) dibuja la vuelta entera (${curvas.length} tramos de ${vuelta.length} puntos)`);
        const puntos = trazos.filter(t => t.tipo === 'punto');
        this.#ok(puntos.length === 5, `RF-02 (${nombre}) hay 5 puntos (${puntos.length})`);
        this.#ok(['#e74c3c', '#2ecc71', '#f1c40f', '#3498db'].every(col => puntos.some(p => p.color === col)) && puntos.some(p => p.color === '#ef4444'),
            `RF-02 (${nombre}) cada punto tiene el color de su auto (${puntos.map(p => p.color)})`);
        const jugador = puntos[puntos.length - 1];
        const ultimoBorde = trazos.slice(trazos.indexOf(jugador)).find(t => t.tipo === 'borde');
        this.#ok(jugador.color === '#ef4444' && puntos.slice(0, -1).every(p => p.r < jugador.r) && ultimoBorde?.color === '#ffffff',
            `RF-04 (${nombre}) el jugador es más grande, con borde blanco, y se dibuja encima`);
        const meta = trazos.find(t => t.tipo === 'rect' && t.w === 10);
        this.#ok(meta && Math.abs(meta.x + 5 - jugador.x) < 0.01 && Math.abs(meta.y + 1.5 - jugador.y) < 0.01,
            `RF-01/RF-03 (${nombre}) el carro en la meta cae justo sobre la línea de meta del mapa`);
        // El rival 1 está en un punto del recorrido: cae justo sobre ese punto del trazado dibujado
        const [r1, r2, , r4] = puntos;
        this.#ok(curvas.some(cu => Math.abs(cu.x - r1.x) < 0.01 && Math.abs(cu.y - r1.y) < 0.01),
            `RF-03 (${nombre}) un carro en la pista cae sobre el recorrido dibujado, con el mismo giro del mapa`);
        this.#ok(Math.hypot(r2.x - r1.x, r2.y - r1.y) > 2 && Math.hypot(r4.x - r1.x, r4.y - r1.y) > 2,
            `RF-03 (${nombre}) un carro 60 m al costado está en otro lugar del mapa, aunque haya avanzado lo mismo`);
        this.#ok(puntos.every(p => p.x >= 0 && p.x <= 90 && p.y >= 0 && p.y <= 120), `RF-01 (${nombre}) todo entra en el mapa`);
        mapa.destruir();
        mapa.actualizar();
        this.#ok(trazos.filter(t => t.tipo === 'punto').length === 5, `(${nombre}) destruir() deja de dibujar`);
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaMinimapaCarrera.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '008', '009', '010', '011', '012', '014', '015', '016']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /según el PRD 017/.test(this.#leer(`docs/prds/${f}`)), `RF-11 el PRD ${n} tiene la nota del PRD 017`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/`MinimapBase` \|[^\n]*MinimapaCarrera/.test(claude), 'RF-11 CLAUDE.md suma MinimapaCarrera a la jerarquía de MinimapBase');
        this.#ok(/`DisenoCarrera` \|[^\n]*anchoMapa[^\n]*altoMapa/.test(claude), 'RF-11 CLAUDE.md suma el tamaño del mapa a la interfaz de DisenoCarrera');
        this.#ok(/B22[^\n]*prd_017/.test(this.#leer('docs/BACKLOG.md')), 'RF-11 el backlog enlaza B22 con el PRD 017');
        const mapa = this.#leer('src/view/minimapas/minimapa_carrera.js').replace(/\/\/.*$/gm, '');
        this.#ok(!/Solo|carrera-solo|getElementById/.test(mapa), 'D7 MinimapaCarrera no nombra Jugar Solo: sirve para cualquier carrera 3D');
        this.#ok(!/mapa|Mapa/.test(this.#leer('src/view/hud_carrera.js')), 'RNF-03 HudCarrera no se toca');
        const visor = this.#leer('src/view/pistas/visor_carrera_solo.js').split('\n').length - 1;
        this.#ok(visor <= 376, `RNF-03 VisorCarreraSolo no crece (${visor} líneas)`);
        for (const f of ['src/controller/controlador_carrera_solo.js', 'src/view/minimapas/minimapa_carrera.js', 'src/view/minimapas/minimapa_base.js']) {
            this.#ok(this.#leer(f).split('\n').length <= 400, `RNF-03 ${f} no pasa de 400 líneas`);
        }
    }
}

new PruebaMinimapaCarrera().ejecutar();
