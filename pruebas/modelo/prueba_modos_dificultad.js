// ================================================================
// CLASE: PruebaModosDificultad — PRD 018 (docs/prds/prd_018_modos_y_dificultad.md)
// En el modelo, con reloj controlado y semilla fija:
//   D2/RF-03 Contrarreloj no tiene rivales; Contra la PC sí (EleccionCarrera)
//   RF-04  de 1 a 4 rivales, por omisión 4; fuera de rango se acomoda
//   RF-05  con menos de 4: Fácil → Novato y Prudente; Normal y Difícil → Experto y Agresivo
//   RF-06  en el mismo tiempo, Fácil avanza menos que Normal y Difícil más, sin pasar el tope del carro
//   RF-07  el que se escapó: Normal afloja, Fácil afloja más, Difícil no afloja
//   RF-08  Normal es la carrera de siempre: mismo ajuste y misma carrera que sin dificultad
//   RF-09  PreferenciasCarrera recuerda la elección y la pista; un dato roto da la de siempre
//   RF-13  notas en los PRD de D8, CLAUDE.md y backlog B21
//   RNF-03 VisorCarreraSolo no crece y nada pasa de 400 líneas
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');

class PruebaModosDificultad {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    #fallos = [];
    #ctx;
    #m = {};

    async ejecutar() {
        this.#cargarClasicos();
        await this.#importar();
        this.#probarEleccion();
        this.#probarPilotos();
        this.#probarAjuste();
        this.#probarNormalIgual();
        this.#probarRitmoEnCarrera();
        this.#probarPreferencias();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaModosDificultad.#RAIZ, relativo), 'utf8'); }

    #cargarClasicos() {
        const ctx = { console, Math, performance, JSON, Number }; ctx.window = ctx;
        vm.createContext(ctx);
        const archivos = ['medida_carro.js', 'medidas_escena.js', 'muestra_ruta.js', 'superficies/superficie.js',
            'superficies/superficie_asfalto.js', 'superficies/superficie_piano.js', 'superficies/superficie_pasto.js',
            'superficies/detector_superficie.js', 'carrera_vueltas.js', 'cronometro.js', 'registro_pistas.js',
            'pistas/config_pista.js', 'pistas/config_pista_ciudad.js', 'pistas/config_pista_costa.js', 'estado_juego.js',
            'modos_carrera/modo_carrera.js', 'modos_carrera/modo_contra_pc.js', 'modos_carrera/modo_contrarreloj.js',
            'dificultades/dificultad_carrera.js', 'dificultades/dificultad_facil.js', 'dificultades/dificultad_normal.js',
            'dificultades/dificultad_dificil.js', 'eleccion_carrera.js', 'catalogo_carrera.js', 'preferencias_carrera.js'];
        for (const f of archivos) vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        new CargadorTrazadoVuelta().cargar(ctx);
        ctx.EstadoJuego = vm.runInContext('EstadoJuego', ctx);   // clase clásica sin window
        this.#ok(!(ctx.__modelErrors?.length), 'las clases cargan sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
        for (const c of ['MedidasEscena', 'CarreraVueltas', 'Cronometro', 'MuestraRuta']) globalThis[c] = ctx[c];
    }

    async #importar() {
        const src = p => path.join(PruebaModosDificultad.#RAIZ, 'src/model', p);
        for (const [clase, archivo] of Object.entries({ Ruta: 'ruta.js', AjusteRitmo: 'ajuste_ritmo.js',
            CarreraConRivales: 'carrera_con_rivales.js', GrillaSalida: 'grilla_salida.js' })) {
            this.#m[clase] = (await import(src(archivo)))[clase];
        }
    }

    #dificultad(clave) { return new this.#ctx.CatalogoCarrera().dificultad(clave); }

    #probarEleccion() {
        const c = this.#ctx, catalogo = new c.CatalogoCarrera();
        const e = catalogo.eleccionPorOmision();
        this.#ok(e.modo.clave === 'contra-pc' && e.dificultad.clave === 'normal' && e.rivales === 4 && e.cantidadRivales === 4,
            'RF-04 por omisión: Contra la PC, Normal y 4 rivales');
        e.rivales = 0; const bajo = e.rivales; e.rivales = 9; const alto = e.rivales; e.rivales = 2;
        this.#ok(bajo === 1 && alto === 4 && e.cantidadRivales === 2, `RF-04 los rivales van de 1 a 4 (${bajo}, ${alto})`);
        e.modo = catalogo.modo('contrarreloj');
        this.#ok(!e.hayRivales && e.cantidadRivales === 0 && e.rivales === 2, 'RF-03 en Contrarreloj no corre ningún rival (y se recuerda cuántos había)');
        this.#ok(catalogo.modos.every(m => m instanceof c.ModoCarrera) && catalogo.dificultades.every(d => d instanceof c.DificultadCarrera),
            'D7 los modos heredan de ModoCarrera y las dificultades de DificultadCarrera');
        this.#ok(!/extends\s+(window\.)?Modo\b/.test(this.#leer('src/model/modos_carrera/modo_contra_pc.js') + this.#leer('src/model/modos_carrera/modo_contrarreloj.js')),
            'D7 los modos de carrera no heredan de Modo (los de Inicio)');
    }

    #carrera(dificultad, cantidad, semilla = 42) {
        const pista = this.#ctx.registroPistas.obtener('ciudad');
        const ruta = new this.#m.Ruta(); ruta.construir(pista.tramos, pista.totalSegs);
        const muestras = Array.from({ length: 1000 }, (_, i) => {
            const p = ruta.curve.getPointAt(i / 1000), t = ruta.curve.getTangentAt(i / 1000);
            return new this.#ctx.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z));
        });
        let ahora = 0;
        const reloj = () => ahora;
        const carrera = dificultad === undefined
            ? new this.#m.CarreraConRivales(ruta, pista.decoraciones, muestras, semilla, reloj)
            : new this.#m.CarreraConRivales(ruta, pista.decoraciones, muestras, semilla, reloj, dificultad, cantidad);
        const puntos = new this.#m.GrillaSalida(new this.#ctx.MedidasEscena()).puntos(ruta.inicio, carrera.rivales.length + 1, muestras);
        carrera.colocarEnGrilla(puntos);
        carrera.iniciar();
        return { carrera, avanzar: pasos => { for (let i = 0; i < pasos; i++) { ahora += PruebaModosDificultad.#PASO; carrera.paso(); } } };
    }

    #probarPilotos() {
        const nombres = (clave, n) => this.#carrera(this.#dificultad(clave), n).carrera.rivales.map(r => r.nombre.split(' · ')[1]);
        const facil2 = nombres('facil', 2), normal2 = nombres('normal', 2), dificil2 = nombres('dificil', 2), facil1 = nombres('facil', 1);
        this.#ok(facil2.join() === 'Prudente,Novato' && facil1.join() === 'Novato', `RF-05 en Fácil corren primero el Novato y el Prudente (${facil2}; ${facil1})`);
        this.#ok(normal2.join() === 'Experto,Agresivo' && dificil2.join() === 'Experto,Agresivo', `RF-05 en Normal y Difícil, el Experto y el Agresivo (${normal2}; ${dificil2})`);
        const cuatro = this.#carrera(this.#dificultad('normal'), 4).carrera;
        this.#ok(cuatro.rivales.length === 4 && cuatro.posiciones('Jugador').length === 5, 'RF-04/RF-10 con 4 rivales la tabla tiene 5 puestos');
        const uno = this.#carrera(this.#dificultad('dificil'), 1).carrera;
        this.#ok(uno.rivales.length === 1 && uno.posiciones('Jugador').length === 2, 'RF-10 con 1 rival la tabla tiene 2 puestos');
    }

    #probarAjuste() {
        const { AjusteRitmo } = this.#m;
        const normal = new AjusteRitmo(this.#dificultad('normal')), facil = new AjusteRitmo(this.#dificultad('facil')),
            dificil = new AjusteRitmo(this.#dificultad('dificil'));
        // El rival 0 se escapó: media vuelta delante del jugador y del resto
        const [rn] = normal.ritmos(0, [0.6, 0.05]), [rf] = facil.ritmos(0, [0.6, 0.05]), [rd] = dificil.ritmos(0, [0.6, 0.05]);
        this.#ok(rn < 1 && rf < rn && rd >= 1.1, `RF-07 el que se escapó: Normal afloja (${rn.toFixed(2)}), Fácil más (${rf.toFixed(2)}), Difícil no (${rd.toFixed(2)})`);
        const sinJugador = [facil, normal, dificil].map(a => a.ritmos(null, [0.1])[0]);
        this.#ok(sinJugador[0] < 1 && sinJugador[1] === 1 && sinJugador[2] > 1, `RF-06 sin nadie que los apure: Fácil < Normal < Difícil (${sinJugador})`);
        const pegados = dificil.ritmos(0.5, [0.51, 0.5, 0.2]);
        this.#ok(pegados.every(r => r >= dificil.base), 'RF-07 en Difícil nunca baja de su ritmo, ni pegado a otro');
    }

    #probarNormalIgual() {
        const { AjusteRitmo } = this.#m;
        const viejo = new AjusteRitmo(), normal = new AjusteRitmo(this.#dificultad('normal'));
        let iguales = true;
        for (let j = 0; j <= 1; j += 0.05) {
            const avances = [j + 0.3, j - 0.1, j + 0.02, j - 0.4];
            const a = viejo.ritmos(j, avances), b = normal.ritmos(j, avances);
            if (a.some((r, i) => r !== b[i])) iguales = false;
        }
        this.#ok(iguales, 'RF-08 en Normal el ajuste de ritmo es el de siempre');
        // Valores fijos de la carrera de siempre (PRD 013): ritmo 1, entre 0,85 y 1,1, y espera de fuerza 1
        const n = this.#dificultad('normal');
        this.#ok(n.ritmoBase === 1 && n.ritmoMinimo === 0.85 && n.ritmoMaximo === 1.1 && n.fuerzaEsperar === 1,
            'RF-08 Normal usa los valores de siempre (1; 0,85 a 1,1; espera 1)');
        const [atrasado] = normal.ritmos(1, [0]), [escapado] = normal.ritmos(0, [2, 0.01]);
        this.#ok(atrasado === 1.1 && escapado === 0.85, `RF-08 en Normal los topes siguen en 1,1 y 0,85 (${atrasado}, ${escapado})`);
        const antes = this.#carrera(undefined), ahora = this.#carrera(this.#dificultad('normal'), 4);
        antes.avanzar(1800); ahora.avanzar(1800);
        const igual = antes.carrera.rivales.every((r, i) => {
            const o = ahora.carrera.rivales[i];
            return r.nombre === o.nombre && r.carro.px === o.carro.px && r.carro.pz === o.carro.pz;
        });
        this.#ok(igual, 'RF-08 con 4 rivales en Normal, la carrera es idéntica a la de siempre (30 s, semilla 42)');
    }

    #probarRitmoEnCarrera() {
        const avance = clave => {
            const { carrera, avanzar } = this.#carrera(this.#dificultad(clave), 4);
            let tope = true;
            for (let s = 0; s < 45; s++) {
                avanzar(60);
                for (const r of carrera.rivales) if (r.carro.velocidad > r.carro.velMaxAdelante + 1e-6) tope = false;
            }
            return { suma: carrera.rivales.reduce((t, r) => t + r.avance, 0), tope };
        };
        const f = avance('facil'), n = avance('normal'), d = avance('dificil');
        this.#ok(f.suma < n.suma && n.suma < d.suma, `RF-06 en 45 s: Fácil avanza menos que Normal y Difícil más (${f.suma.toFixed(2)} < ${n.suma.toFixed(2)} < ${d.suma.toFixed(2)})`);
        this.#ok(f.tope && n.tope && d.tope, 'RF-06/D4 ningún rival pasa el tope de su carro, en ninguna dificultad');
    }

    #probarPreferencias() {
        const c = this.#ctx;
        const datos = new Map();
        const almacen = { getItem: k => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) };
        const estado = new c.EstadoJuego();
        const prefs = new c.PreferenciasCarrera(almacen);
        prefs.cargar(estado);
        this.#ok(estado.eleccion.dificultad.clave === 'normal' && estado.pista === 'ciudad', 'RF-09 sin nada guardado, la carrera de siempre');
        estado.eleccion.modo = prefs.catalogo.modo('contrarreloj');
        estado.eleccion.dificultad = prefs.catalogo.dificultad('dificil');
        estado.eleccion.rivales = 2;
        estado.pista = 'costa';
        prefs.guardar(estado);
        const otro = new c.EstadoJuego();
        new c.PreferenciasCarrera(almacen).cargar(otro);
        this.#ok(otro.eleccion.modo.clave === 'contrarreloj' && otro.eleccion.dificultad.clave === 'dificil' && otro.eleccion.rivales === 2 && otro.pista === 'costa',
            'RF-09 al volver (también tras recargar) aparece la última elección y la pista');
        datos.set('tr_carrera', '{roto');
        const roto = new c.EstadoJuego();
        new c.PreferenciasCarrera(almacen).cargar(roto);
        this.#ok(roto.eleccion.modo.clave === 'contra-pc' && roto.eleccion.rivales === 4, 'RF-09 un dato guardado roto da la carrera de siempre');
        datos.set('tr_carrera', JSON.stringify({ rivales: null }));
        const nulo = new c.EstadoJuego();
        new c.PreferenciasCarrera(almacen).cargar(nulo);
        this.#ok(nulo.eleccion.rivales === 4, `RF-09 rivales vacíos guardados dan los 4 de siempre (${nulo.eleccion.rivales})`);
        datos.set('tr_carrera', JSON.stringify({ modo: 'x', dificultad: 'y', rivales: 'z', pista: 'nada' }));
        const raro = new c.EstadoJuego();
        new c.PreferenciasCarrera(almacen).cargar(raro);
        this.#ok(raro.eleccion.modo.clave === 'contra-pc' && raro.eleccion.dificultad.clave === 'normal' && raro.eleccion.rivales === 4 && raro.pista === 'ciudad',
            'RF-09 valores desconocidos quedan en los de siempre');
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaModosDificultad.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '008', '009', '010', '011', '012', '013', '014', '015', '016', '017']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /según el PRD 018/.test(this.#leer(`docs/prds/${f}`)), `RF-13 el PRD ${n} tiene la nota del PRD 018`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/`ModoCarrera` \|[^\n]*ModoContrarreloj/.test(claude) && /`DificultadCarrera` \|[^\n]*DificultadDificil/.test(claude),
            'RF-13 CLAUDE.md suma las jerarquías del modo y la dificultad');
        this.#ok(/ControladorPrepararCarrera/.test(claude), 'RF-13 CLAUDE.md nombra el controlador de "Preparar carrera"');
        this.#ok(/B21[^\n]*prd_018/.test(this.#leer('docs/BACKLOG.md')), 'RF-13 el backlog enlaza B21 con el PRD 018');
        const visor = this.#leer('src/view/pistas/visor_carrera_solo.js').split('\n').length - 1;
        this.#ok(visor <= 376, `RNF-03 VisorCarreraSolo no crece (${visor} líneas)`);
        for (const f of ['src/controller/controlador_carrera_solo.js', 'src/controller/aplicacion.js', 'src/controller/pantallas/controlador_preparar_carrera.js',
            'src/model/carrera_con_rivales.js', 'src/model/ajuste_ritmo.js']) {
            this.#ok(this.#leer(f).split('\n').length <= 400, `RNF-03 ${f} no pasa de 400 líneas`);
        }
    }
}

new PruebaModosDificultad().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
