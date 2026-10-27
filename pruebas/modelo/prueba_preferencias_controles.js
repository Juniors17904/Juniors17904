// ================================================================
// CLASE: PruebaPreferenciasControles — PRD 021 (docs/prds/prd_021_estilos_timon_y_pedales.md)
// Sin navegador:
//   RF-08 el timón y los pedales elegidos se recuerdan al "recargar", por su clave;
//         sin nada guardado, roto o desconocido → Clásico
//   RF-09 elegir una pista no cambia el timón ni el velocímetro (ControladorPistas)
//   D7    la clave del timón se traduce a su lugar en un solo lugar (CatalogoControles)
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaPreferenciasControles {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];
    #ctx;

    ejecutar() {
        this.#cargar();
        this.#probarCatalogo();
        this.#probarRecuerdo();
        this.#probarDatosRotos();
        this.#probarPistaNoCambia();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaPreferenciasControles.#RAIZ, relativo), 'utf8'); }

    #cargar() {
        const ctx = { console, JSON }; ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['catalogo_controles.js', 'preferencias_controles.js', 'estado_juego.js']) {
            vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        }
        ctx.EstadoJuego = vm.runInContext('EstadoJuego', ctx);   // clase clásica sin window
        this.#ctx = ctx;
    }

    #almacen() {
        const datos = new Map();
        return { datos, getItem: k => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) };
    }

    #probarCatalogo() {
        const cat = new this.#ctx.CatalogoControles();
        this.#ok(cat.timones.join() === 'clasico,deportivo,f1,vintage,rally,camion', 'D7 los 6 timones en orden (Rally 4, Camión 5)');
        this.#ok(cat.pedales.join() === 'clasicos,deportivos,f1,retro', 'D7 los 4 estilos de pedales');
        this.#ok(cat.indiceTimon('rally') === 4 && cat.indiceTimon('camion') === 5 && cat.indiceTimon('nada') === 0,
            'D7 la clave del timón se traduce a su lugar; una desconocida da el Clásico');
        const estado = new this.#ctx.EstadoJuego();
        this.#ok(estado.timon === 'clasico' && estado.timonModelo === 0 && estado.estiloPedales === 'clasicos',
            'RF-02/RF-08 de fábrica: timón y pedales Clásicos');
        estado.timonModelo = 3;
        this.#ok(estado.timon === 'vintage' && estado.timonModelo === 3, 'D7 elegir por número guarda la clave');
    }

    #probarRecuerdo() {
        const almacen = this.#almacen();
        const estado = new this.#ctx.EstadoJuego();
        const prefs = new this.#ctx.PreferenciasControles(almacen);
        prefs.cargar(estado);
        this.#ok(estado.timon === 'clasico' && estado.estiloPedales === 'clasicos', 'RF-08 sin nada guardado: Clásico');
        estado.timon = 'rally';
        estado.estiloPedales = 'retro';
        prefs.guardar(estado);
        const guardado = JSON.parse(almacen.datos.get('tr_controles'));
        this.#ok(guardado.timon === 'rally' && guardado.pedales === 'retro', 'D7 se guarda por clave, con su propia clave de guardado');
        this.#ok(!almacen.datos.has('vc_preferencias') && !almacen.datos.has('tr_carrera'), 'D7 no usa la clave de otras preferencias');
        const otro = new this.#ctx.EstadoJuego();
        new this.#ctx.PreferenciasControles(almacen).cargar(otro);
        this.#ok(otro.timon === 'rally' && otro.timonModelo === 4 && otro.estiloPedales === 'retro',
            'RF-08 al recargar, el timón y los pedales siguen siendo los mismos');
    }

    #probarDatosRotos() {
        for (const [texto, caso] of [['{roto', 'roto'], [JSON.stringify({ timon: 'x', pedales: 7 }), 'desconocido'], ['null', 'vacío']]) {
            const almacen = this.#almacen();
            almacen.datos.set('tr_controles', texto);
            const estado = new this.#ctx.EstadoJuego();
            estado.timon = 'camion';
            new this.#ctx.PreferenciasControles(almacen).cargar(estado);
            this.#ok(estado.timon === 'clasico' && estado.estiloPedales === 'clasicos', `RF-08 lo guardado ${caso} cae en Clásico`);
        }
        const sinAlmacen = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
        const estado = new this.#ctx.EstadoJuego();
        const prefs = new this.#ctx.PreferenciasControles(sinAlmacen);
        prefs.cargar(estado);
        prefs.guardar(estado);
        this.#ok(estado.timon === 'clasico', 'RF-08 sin almacenamiento el juego sigue con el Clásico');
    }

    #probarPistaNoCambia() {
        const codigo = this.#leer('src/controller/pantallas/controlador_pistas.js');
        this.#ok(!/timonModelo|velocimetroModelo|timonDePista|velocimetroDePista/.test(codigo),
            'RF-09 ControladorPistas ya no cambia el timón ni el velocímetro');
    }
}

new PruebaPreferenciasControles().ejecutar();
