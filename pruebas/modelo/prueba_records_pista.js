// ================================================================
// CLASE: PruebaRecordsPista — PRD 020 (docs/prds/prd_020_records_por_pista.md)
// Sin navegador:
//   RF-01 al terminar, un tiempo total mejor queda como récord (el primero también)
//   RF-02 la mejor vuelta se guarda aunque el tiempo total no mejore
//   RF-04 una carrera sin todas sus vueltas (o con tiempos raros) no cambia nada
//   RF-05 los récords siguen después de "recargar" y cada pista tiene el suyo
//   RF-06/RF-07 el texto: "Récord 1:23.45 · Mejor vuelta 0:27.10" o "Sin récord todavía"
//   RF-08 registrar dice si hubo récord nuevo
//   RF-10 un dato guardado roto deja esa pista sin récord, sin romper las otras
//   D5    AvisoRecord muestra y oculta "¡Nuevo récord!"
//   RF-11 notas en los PRD de D7, CLAUDE.md y backlog B7; RNF-03 400 líneas
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaRecordsPista {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];
    #ctx;

    ejecutar() {
        this.#cargar();
        this.#probarRegistro();
        this.#probarDatosRotos();
        this.#probarTexto();
        this.#probarAviso();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaRecordsPista.#RAIZ, relativo), 'utf8'); }

    #cargar() {
        const ctx = { console, Math, JSON, Number, Date, performance };
        ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['src/model/cronometro.js', 'src/model/record_pista.js', 'src/model/registro_records.js',
            'src/view/texto_record_pista.js', 'src/view/aviso_record.js']) {
            vm.runInContext(this.#leer(f), ctx, { filename: f });
        }
        if (!ctx.Cronometro) ctx.Cronometro = vm.runInContext('Cronometro', ctx);
        this.#ok(!(ctx.__modelErrors?.length), 'las clases cargan sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
    }

    #almacen() {
        const datos = new Map();
        return { datos, getItem: k => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) };
    }

    #probarRegistro() {
        const c = this.#ctx, almacen = this.#almacen();
        const r = new c.RegistroRecords(almacen);
        this.#ok(!r.obtener('ciudad').tieneRecord, 'sin carreras, la pista no tiene récord');
        this.#ok(r.registrar('ciudad', 90000, 29000, 3, 3) === true, 'RF-01/RF-08 la primera carrera terminada es récord nuevo');
        const primero = r.obtener('ciudad');
        this.#ok(primero.totalMs === 90000 && primero.vueltaMs === 29000, 'RF-01 se guardan el tiempo total y la mejor vuelta');
        this.#ok(r.registrar('ciudad', 95000, 30000, 3, 3) === false && r.obtener('ciudad').totalMs === 90000, 'RF-08 un tiempo peor no es récord y no cambia nada');
        this.#ok(r.registrar('ciudad', 92000, 28000, 3, 3) === true, 'RF-02/RF-08 una vuelta mejor es récord aunque el total no mejore');
        const vuelta = r.obtener('ciudad');
        this.#ok(vuelta.totalMs === 90000 && vuelta.vueltaMs === 28000, 'RF-02 el total se queda y la vuelta mejora');
        this.#ok(r.registrar('ciudad', 85000, 30000, 3, 3) === true && r.obtener('ciudad').totalMs === 85000 && r.obtener('ciudad').vueltaMs === 28000,
            'RF-01 un total mejor se guarda y la mejor vuelta se conserva');
        this.#ok(r.registrar('ciudad', 1000, 900, 1, 3) === false && r.registrar('ciudad', 1000, 900, 2, 3) === false && r.obtener('ciudad').totalMs === 85000,
            'RF-04 una carrera sin todas sus vueltas (salir antes o una meta forzada) no cambia el récord');
        this.#ok(r.registrar('ciudad', NaN, -1, 3, 3) === false && r.registrar('', 1000, 900, 3, 3) === false, 'RF-04 tiempos raros o sin pista no se guardan');
        r.registrar('costa', 120000, 40000, 3, 3);
        const otra = new c.RegistroRecords(almacen);
        this.#ok(otra.obtener('ciudad').totalMs === 85000 && otra.obtener('costa').totalMs === 120000 && !otra.obtener('volcan').tieneRecord,
            'RF-05 tras recargar siguen los récords y cada pista tiene el suyo');
        this.#ok(almacen.datos.has('tr_records') && !almacen.datos.has('tr_carrera'), 'D7 usa su propia clave de guardado');
    }

    #probarDatosRotos() {
        const c = this.#ctx, almacen = this.#almacen();
        almacen.datos.set('tr_records', '{roto');
        this.#ok(!new c.RegistroRecords(almacen).obtener('ciudad').tieneRecord, 'RF-10 un dato roto deja la pista sin récord');
        almacen.datos.set('tr_records', JSON.stringify({ ciudad: { total: 'x', vuelta: -5 }, costa: { total: 99000, vuelta: 33000 }, desierto: 7 }));
        const r = new c.RegistroRecords(almacen);
        this.#ok(!r.obtener('ciudad').tieneRecord && !r.obtener('desierto').tieneRecord && r.obtener('costa').totalMs === 99000,
            'RF-10 un dato raro solo deja sin récord a esa pista; las otras siguen');
        this.#ok(r.registrar('ciudad', 91000, 30000, 3, 3) === true, 'RF-10 sobre un dato raro se puede guardar un récord nuevo');
        const sinAlmacen = new c.RegistroRecords({ getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } });
        let error = null;
        try { sinAlmacen.registrar('ciudad', 90000, 29000, 3, 3); sinAlmacen.obtener('ciudad'); } catch (e) { error = e; }
        this.#ok(!error, 'RF-10 sin almacenamiento del navegador no hay error');
    }

    #probarTexto() {
        const c = this.#ctx, t = new c.TextoRecordPista();
        this.#ok(t.texto(new c.RecordPista()) === 'Sin récord todavía', 'RF-06 sin récord: "Sin récord todavía"');
        this.#ok(t.texto(new c.RecordPista(83450, 27100)) === 'Récord 1:23.45 · Mejor vuelta 0:27.10', `RF-06/RF-07 el texto del récord (${t.texto(new c.RecordPista(83450, 27100))})`);
    }

    #probarAviso() {
        const c = this.#ctx;
        const crear = () => { const el = { style: {}, textContent: '', className: '' }; return el; };
        const hijos = [];
        const contenedor = { querySelector: q => hijos.find(h => '.' + h.className === q) ?? null, appendChild: h => hijos.push(h), insertBefore: h => hijos.push(h) };
        c.document = { createElement: crear };
        vm.runInContext('globalThis.document = window.document', c);
        const aviso = new c.AvisoRecord(contenedor);
        const nuevo = hijos.find(h => h.className === 'resultado-carrera-nuevo-record'), linea = hijos.find(h => h.className === 'resultado-carrera-record');
        aviso.mostrar('Récord 1:23.45', true);
        this.#ok(nuevo.textContent === '¡Nuevo récord!' && nuevo.style.display !== 'none' && linea.textContent === 'Récord 1:23.45', 'RF-08 con récord nuevo se ve "¡Nuevo récord!"');
        aviso.mostrar('Récord 1:23.45', false);
        this.#ok(nuevo.style.display === 'none' && linea.style.display !== 'none', 'RF-08 sin récord nuevo no aparece el aviso, pero sí el récord');
        aviso.ocultar();
        this.#ok(nuevo.style.display === 'none' && linea.style.display === 'none' && linea.textContent === '', 'D5 ocultar() limpia el aviso (Revancha no muestra el viejo)');
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaRecordsPista.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '008', '009', '010', '011', '012', '013', '014', '016', '017', '018', '019']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /según el PRD 020/.test(this.#leer(`docs/prds/${f}`)), `RF-11 el PRD ${n} tiene la nota del PRD 020`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(['RecordPista', 'RegistroRecords', 'TextoRecordPista', 'AvisoRecord'].every(c => claude.includes('`' + c + '`')), 'RF-11 CLAUDE.md nombra las clases nuevas');
        this.#ok(/B7[^\n]*prd_020/.test(this.#leer('docs/BACKLOG.md')), 'RF-11 el backlog enlaza B7 con el PRD 020');
        this.#ok(!this.#leer('src/style.css').includes('record'), 'D7 src/style.css no cambia');
        for (const f of ['src/controller/controlador_carrera_solo.js', 'src/view/hud_carrera.js', 'src/controller/pantallas/controlador_preparar_carrera.js']) {
            this.#ok(this.#leer(f).split('\n').length <= 400, `RNF-03 ${f} no pasa de 400 líneas`);
        }
    }
}

new PruebaRecordsPista().ejecutar();
