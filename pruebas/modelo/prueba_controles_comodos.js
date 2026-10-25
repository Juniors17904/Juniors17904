// ================================================================
// CLASE: PruebaControlesComodos — PRD 016 (docs/prds/prd_016_controles_comodos.md)
// Sin navegador:
//   D4    recorrido de giro: vertical 85 px fijos, horizontal un cuarto del ancho
//   D5    ACEL/FRENO: vertical apilados de 72 px, horizontal lado a lado de 88 px,
//         16 px entre ellos; cada diseño dice cuánto alto ocupan
//   D9    EstiloControlesCarrera lleva las medidas del diseño como variables CSS
//         y quitar() las borra
//   D6    RespuestaToque marca el botón apretado y vibra si se puede (sin error si no)
//   D5    el velocímetro sube en vertical y nunca baja de su altura de antes
//   RF-10 notas en los PRD de D11, CLAUDE.md y backlog B23
//   RNF-03 las clases nuevas no pasan de 400 líneas
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaControlesComodos {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];
    #ctx;

    ejecutar() {
        this.#cargar();
        this.#probarDisenos();
        this.#probarEstilo();
        this.#probarRespuesta();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaControlesComodos.#RAIZ, relativo), 'utf8'); }

    #cargar() {
        const ctx = { console, Math, String, innerWidth: 844, innerHeight: 390, navigator: {} };
        ctx.window = ctx;
        vm.createContext(ctx);
        const archivos = ['src/view/disenos/diseno_carrera.js', 'src/view/disenos/diseno_vertical.js', 'src/view/disenos/diseno_horizontal.js',
            'src/view/controles/respuesta_toque.js', 'src/view/controles/estilo_controles_carrera.js'];
        for (const f of archivos) vm.runInContext(this.#leer(f), ctx, { filename: f });
        this.#ok(!(ctx.__modelErrors?.length), 'las clases cargan sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
    }

    #probarDisenos() {
        const v = new this.#ctx.DisenoVertical(), h = new this.#ctx.DisenoHorizontal();
        this.#ok(v.recorridoGiro(390) === 85 && v.recorridoGiro(480) === 85, 'D4 en vertical el giro máximo pide 85 px fijos');
        this.#ok(h.recorridoGiro(844) === 211 && h.recorridoGiro(1280) === 320, 'D4 en horizontal el giro máximo pide un cuarto del ancho');
        this.#ok(v.ladoPedal >= 72 && v.separacionPedales >= 16 && v.pedalesApilados, 'D5 en vertical ACEL/FRENO apilados de 72 px, a 16 px');
        this.#ok(h.ladoPedal >= 88 && h.separacionPedales >= 16 && !h.pedalesApilados, 'D5 en horizontal lado a lado de 88 px, a 16 px');
        this.#ok(v.altoControles === 2 * 72 + 16 + 6 && h.altoControles === 88 + 6, `D5 cada diseño dice cuánto alto ocupan los controles (${v.altoControles}/${h.altoControles})`);
    }

    #probarEstilo() {
        const props = new Map(), clases = new Set();
        const boton = { classList: { add: c => clases.add(c), remove: c => clases.delete(c) }, addEventListener() {}, removeEventListener() {} };
        const controles = { style: { setProperty: (k, val) => props.set(k, val), removeProperty: k => props.delete(k) } };
        const documento = { getElementById: id => id === 'ctrl-timon' ? controles : boton };
        const estilo = new this.#ctx.EstiloControlesCarrera(documento);
        estilo.aplicar(new this.#ctx.DisenoHorizontal());
        this.#ok(props.get('--carrera-lado-pedal') === '88px' && props.get('--carrera-separacion-pedales') === '16px'
            && props.get('--carrera-direccion-pedales') === 'row-reverse' && props.get('--carrera-recorrido-giro') === '211',
            'D9 en horizontal lleva las medidas del diseño al CSS (FRENO a la izquierda) ' + JSON.stringify([...props]));
        estilo.aplicar(new this.#ctx.DisenoVertical());
        this.#ok(props.get('--carrera-lado-pedal') === '72px' && props.get('--carrera-direccion-pedales') === 'column' && props.get('--carrera-recorrido-giro') === '85',
            'D9 al girar a vertical cambian las medidas');
        estilo.quitar();
        this.#ok(props.size === 0, 'D1 quitar() borra las variables: las otras pantallas quedan como siempre');
    }

    #probarRespuesta() {
        const escuchas = {}, clases = new Set(), vibraciones = [];
        const boton = { classList: { add: c => clases.add(c), remove: c => clases.delete(c) },
            addEventListener: (t, f) => { escuchas[t] = f; }, removeEventListener: t => { delete escuchas[t]; } };
        this.#ctx.navigator.vibrate = ms => vibraciones.push(ms);
        const r = new this.#ctx.RespuestaToque([boton, null]);
        escuchas.touchstart();
        this.#ok(clases.has('apretado') && vibraciones.length === 1 && vibraciones[0] <= 20, 'D6 al apretar se marca el botón y vibra muy corto');
        escuchas.touchend();
        this.#ok(!clases.has('apretado'), 'D6 al soltar vuelve a su aspecto');
        this.#ctx.navigator.vibrate = () => { throw new Error('no permitido'); };
        let error = null;
        try { escuchas.mousedown(); } catch (e) { error = e; }
        this.#ok(!error && clases.has('apretado'), 'RF-07 si el celular no deja vibrar no hay error');
        delete this.#ctx.navigator.vibrate;
        try { escuchas.touchstart(); } catch (e) { error = e; }
        this.#ok(!error, 'RF-07 sin vibración (iPhone) no hay error');
        r.destruir();
        this.#ok(Object.keys(escuchas).length === 0 && !clases.has('apretado'), 'D6 destruir() deja de escuchar');
    }

    #probarDocumentos() {
        const hud = this.#leer('src/view/hud_carrera.js');
        this.#ok(/altoControles/.test(hud) && /ALTURA_MINIMA_VELOCIMETRO = 176/.test(hud), 'D5 el velocímetro se ubica según el alto de los controles, nunca más abajo que antes');
        const prds = fs.readdirSync(path.join(PruebaControlesComodos.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014', '015']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /PRD 016/.test(this.#leer(`docs/prds/${f}`)), `RF-10 el PRD ${n} tiene la nota del PRD 016`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/`DisenoCarrera` \|[^\n]*altoControles[^\n]*recorridoGiro/.test(claude), 'RF-10 CLAUDE.md suma los controles a la interfaz de DisenoCarrera');
        this.#ok(/RespuestaToque/.test(claude) && /EstiloControlesCarrera/.test(claude), 'RF-10 CLAUDE.md nombra las clases nuevas de src/view/controles/');
        this.#ok(/B23[^\n]*prd_016/.test(this.#leer('docs/BACKLOG.md')), 'RF-10 el backlog enlaza B23 con el PRD 016');
        for (const f of ['src/view/controles/respuesta_toque.js', 'src/view/controles/estilo_controles_carrera.js', 'src/view/controles/control_timon.js', 'src/view/hud_carrera.js']) {
            this.#ok(this.#leer(f).split('\n').length <= 400, `RNF-03 ${f} no pasa de 400 líneas`);
        }
    }
}

new PruebaControlesComodos().ejecutar();
