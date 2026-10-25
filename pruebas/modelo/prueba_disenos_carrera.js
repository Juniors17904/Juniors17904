// ================================================================
// CLASE: PruebaDisenosCarrera — PRD 015 (docs/prds/prd_015_vertical_y_horizontal.md)
// Sin navegador:
//   D8    más ancha que alta → horizontal; si no, vertical (también en el borde)
//   D4/D5 anchoArea: vertical hasta 480 px, horizontal todo el ancho
//   D9    DisenoVertical y DisenoHorizontal heredan de DisenoCarrera; aplicar() marca la pantalla;
//         cada uno dice qué cámara usa (vertical 78°, horizontal 55°)
//   RF-09 el estilo del aviso de girar ya no está en src/style.css ni en index.html
//   D2    AdaptadorDisenoCarrera sigue el giro y destruir() deja de escuchar
//   RF-10 notas de D12 en los PRD, CLAUDE.md y backlog B20
//   RNF-03 VisorCarreraSolo no crece (376 líneas o menos)
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaDisenosCarrera {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];
    #ctx;
    #escuchas = {};

    ejecutar() {
        this.#cargar();
        this.#probarSelector();
        this.#probarJerarquia();
        this.#probarAdaptador();
        this.#probarEstiloViejo();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaDisenosCarrera.#RAIZ, relativo), 'utf8'); }

    #cargar() {
        const escuchas = this.#escuchas;
        const ctx = { console, Math, innerWidth: 390, innerHeight: 844,
            addEventListener: (t, f) => { escuchas[t] = f; }, removeEventListener: t => { delete escuchas[t]; } };
        ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['diseno_carrera.js', 'diseno_vertical.js', 'diseno_horizontal.js', 'selector_diseno_carrera.js', 'adaptador_diseno_carrera.js']) {
            vm.runInContext(this.#leer('src/view/disenos/' + f), ctx, { filename: f });
        }
        this.#ok(!(ctx.__modelErrors?.length), 'los diseños cargan sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
    }

    #probarSelector() {
        const s = new this.#ctx.SelectorDisenoCarrera();
        this.#ok(s.elegir(390, 844).nombre === 'vertical' && s.elegir(844, 390).nombre === 'horizontal', 'D8 vertical en 390×844 y horizontal en 844×390');
        this.#ok(s.elegir(1280, 960).nombre === 'horizontal', 'D7/D8 PC 1280×960 es horizontal');
        this.#ok(s.elegir(500, 500).nombre === 'vertical', 'D8 una pantalla cuadrada no es más ancha que alta: vertical');
        this.#ok(s.elegir(390, 844).anchoArea(390) === 390 && s.elegir(600, 900).anchoArea(600) === 480, 'D4 en vertical el área mide hasta 480 px');
        this.#ok(s.elegir(844, 390).anchoArea(844) === 844 && s.elegir(1280, 960).anchoArea(1280) === 1280, 'D5 en horizontal el área usa todo el ancho');
    }

    #probarJerarquia() {
        const c = this.#ctx;
        this.#ok(new c.DisenoVertical() instanceof c.DisenoCarrera && new c.DisenoHorizontal() instanceof c.DisenoCarrera, 'D9 los dos diseños heredan de DisenoCarrera');
        const pantalla = { dataset: {} };
        new c.DisenoHorizontal().aplicar(pantalla);
        this.#ok(pantalla.dataset.diseno === 'horizontal', 'D9 aplicar() marca la pantalla con su diseño');
        const v = new c.DisenoVertical(), h = new c.DisenoHorizontal();
        this.#ok(v.camaraVertical && v.fovCamara === 78 && !h.camaraVertical && h.fovCamara === 55, 'D9 cada diseño dice su cámara: vertical 78°, horizontal 55°');
        const visor = this.#leer('src/view/pistas/visor_carrera_solo.js').replace(/\/\/.*$/gm, '');
        this.#ok(!/aspecto < 1/.test(visor) && /camaraVertical/.test(visor) && /fovCamara/.test(visor), 'RNF-02 el visor elige la cámara con la regla del diseño, no con su propia regla');
        // D11: los diseños no conocen ninguna pantalla en particular
        const textos = ['diseno_carrera.js', 'diseno_vertical.js', 'diseno_horizontal.js', 'selector_diseno_carrera.js', 'adaptador_diseno_carrera.js']
            .map(f => this.#leer('src/view/disenos/' + f).replace(/\/\/.*$/gm, ''));
        this.#ok(textos.every(t => !/carrera-solo|getElementById|Solo\b/.test(t)), 'D11 los diseños no nombran Jugar Solo: sirven para cualquier carrera 3D');
    }

    #probarAdaptador() {
        const c = this.#ctx, pantalla = { dataset: {} };
        c.innerWidth = 390; c.innerHeight = 844;
        const adaptador = new c.AdaptadorDisenoCarrera(pantalla);
        this.#ok(pantalla.dataset.diseno === 'vertical', 'D2 al empezar, la pantalla queda en vertical');
        c.innerWidth = 844; c.innerHeight = 390;
        this.#escuchas.orientationchange();
        this.#ok(pantalla.dataset.diseno === 'horizontal', 'D2 al girar el celular, pasa a horizontal');
        c.innerWidth = 390; c.innerHeight = 844;
        this.#escuchas.resize();
        this.#ok(pantalla.dataset.diseno === 'vertical', 'D2 al volver, pasa a vertical');
        adaptador.destruir();
        this.#ok(!this.#escuchas.resize && !this.#escuchas.orientationchange && pantalla.dataset.diseno === undefined, 'D2 destruir() deja de escuchar y quita la marca');
    }

    #probarEstiloViejo() {
        const estilos = this.#leer('src/style.css') + this.#leer('index.html');
        this.#ok(!/pantalla-rotar|rotar-icono|rotar-msg|rotar-titulo|rotar-sub|balanceo/.test(estilos), 'RF-09 no queda nada del estilo del aviso de girar');
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaDisenosCarrera.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /PRD 015/.test(this.#leer(`docs/prds/${f}`)), `RF-10 el PRD ${n} tiene la nota del PRD 015`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/`DisenoCarrera` \|[^\n]*DisenoVertical[^\n]*DisenoHorizontal/.test(claude) && /src\/view\/disenos\//.test(claude),
            'RF-10 CLAUDE.md suma la jerarquía de los diseños y su carpeta');
        this.#ok(!/Jugar Solo \(carrera 3D vertical\)/.test(claude), 'RF-10 la tabla de visores ya no dice que Jugar Solo es solo vertical');
        this.#ok(/B20[^\n]*prd_015/.test(this.#leer('docs/BACKLOG.md')), 'RF-10 el backlog enlaza B20 con el PRD 015');
        const lineas = this.#leer('src/view/pistas/visor_carrera_solo.js').split('\n').length - 1;
        this.#ok(lineas <= 376, `RNF-03 VisorCarreraSolo no crece (${lineas} líneas)`);
    }
}

new PruebaDisenosCarrera().ejecutar();
