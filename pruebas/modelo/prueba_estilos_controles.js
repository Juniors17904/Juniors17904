// ================================================================
// CLASE: PruebaEstilosControles — PRD 021 (docs/prds/prd_021_estilos_timon_y_pedales.md)
// Sin navegador:
//   RF-08 cada uno de los 6 timones y de los 4 estilos de pedales se recuerda
//         al "recargar" (una PreferenciasControles nueva con el mismo
//         almacenamiento falso); lo roto o desconocido cae en Clásico
//   RF-03 los 4 estilos de pedales (Clásico, Deportivo, F1, Retro) tienen su
//         clase y su clave coincide con la de CatalogoControles (D7)
//   RF-06/RF-07 RenderizadorTimon dibuja 6 timones, en el orden de las
//         claves de CatalogoControles (Rally 4, Camión 5)
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaEstilosControles {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #TIMONES = ['clasico', 'deportivo', 'f1', 'vintage', 'rally', 'camion'];
    static #PEDALES = ['clasicos', 'deportivos', 'f1', 'retro'];
    static #ARCHIVOS_VISTA = ['estilo_pedales.js', 'pedales_clasicos.js', 'pedales_deportivos.js',
        'pedales_f1.js', 'pedales_retro.js', 'registro_estilos_pedales.js',
        'timon.js', 'timon_clasico.js', 'timon_deportivo.js', 'timon_f1.js', 'timon_retro.js',
        'timon_rally.js', 'timon_camion.js', 'renderizador_timon.js'];
    #fallos = 0;
    #ctx;

    ejecutar() {
        this.#cargar();
        this.#probarClaves();
        this.#probarRecuerdoTimones();
        this.#probarRecuerdoPedales();
        this.#probarDatosRotos();
        this.#probarVistaCoincide();
        console.log(this.#fallos ? `\n${this.#fallos} fallo(s)` : '\nTodo OK');
        return this.#fallos;
    }

    #comprobar(condicion, mensaje) {
        console.log(condicion ? 'OK   ' : 'FALLO', mensaje);
        if (!condicion) this.#fallos++;
    }

    #leer(relativo) { return fs.readFileSync(path.join(PruebaEstilosControles.#RAIZ, relativo), 'utf8'); }

    #cargar() {
        const ctx = { console, JSON }; ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['catalogo_controles.js', 'preferencias_controles.js', 'estado_juego.js']) {
            vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        }
        ctx.EstadoJuego = vm.runInContext('EstadoJuego', ctx);   // clase clásica sin window
        for (const f of PruebaEstilosControles.#ARCHIVOS_VISTA) {
            vm.runInContext(this.#leer('src/view/controles/' + f), ctx, { filename: f });
        }
        this.#ctx = ctx;
    }

    #almacen() {
        const datos = new Map();
        return { datos, getItem: k => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, v) };
    }

    // "Recargar": estado y preferencias nuevos con el mismo almacenamiento
    #recargar(almacen) {
        const estado = new this.#ctx.EstadoJuego();
        new this.#ctx.PreferenciasControles(almacen).cargar(estado);
        return estado;
    }

    #probarClaves() {
        const cat = new this.#ctx.CatalogoControles();
        this.#comprobar(cat.timones.join() === PruebaEstilosControles.#TIMONES.join(),
            'PRD 021 RF-08/D7 las claves de los 6 timones, en orden (Rally 4, Camión 5)');
        this.#comprobar(cat.pedales.join() === PruebaEstilosControles.#PEDALES.join(),
            'PRD 021 RF-08/D7 las claves de los 4 estilos de pedales');
        PruebaEstilosControles.#TIMONES.forEach((clave, i) => {
            this.#comprobar(cat.indiceTimon(clave) === i && cat.claveTimon(i) === clave,
                `PRD 021 D7 el timón "${clave}" va y vuelve de su lugar ${i}`);
        });
        this.#comprobar(cat.claveTimon(99) === 'clasico' && cat.indiceTimon(undefined) === 0,
            'PRD 021 RF-08 un lugar o una clave de timón desconocidos dan el Clásico');
    }

    #probarRecuerdoTimones() {
        PruebaEstilosControles.#TIMONES.forEach((clave, i) => {
            const almacen = this.#almacen();
            const estado = new this.#ctx.EstadoJuego();
            const prefs = new this.#ctx.PreferenciasControles(almacen);
            prefs.cargar(estado);
            estado.timon = clave;
            prefs.guardar(estado);
            const otro = this.#recargar(almacen);
            this.#comprobar(otro.timon === clave && otro.timonModelo === i,
                `PRD 021 RF-08 el timón "${clave}" sigue elegido al recargar`);
        });
    }

    #probarRecuerdoPedales() {
        for (const clave of PruebaEstilosControles.#PEDALES) {
            const almacen = this.#almacen();
            const estado = new this.#ctx.EstadoJuego();
            const prefs = new this.#ctx.PreferenciasControles(almacen);
            prefs.cargar(estado);
            estado.estiloPedales = clave;
            prefs.guardar(estado);
            const otro = this.#recargar(almacen);
            this.#comprobar(otro.estiloPedales === clave && otro.timon === 'clasico',
                `PRD 021 RF-08 los pedales "${clave}" siguen elegidos al recargar (el timón no cambia)`);
        }
    }

    #probarDatosRotos() {
        const casos = [
            ['{roto', 'roto'],
            [JSON.stringify({ timon: 'tractor', pedales: 'cohete' }), 'desconocido'],
            [JSON.stringify({ timon: 4, pedales: 2 }), 'por número'],
            [JSON.stringify(['rally', 'retro']), 'con otra forma'],
            ['', 'vacío'],
        ];
        for (const [texto, caso] of casos) {
            const almacen = this.#almacen();
            almacen.datos.set('tr_controles', texto);
            const estado = this.#recargar(almacen);
            this.#comprobar(estado.timon === 'clasico' && estado.timonModelo === 0 && estado.estiloPedales === 'clasicos',
                `PRD 021 RF-08 lo guardado ${caso} cae en Clásico`);
        }
        const mitad = this.#almacen();
        mitad.datos.set('tr_controles', JSON.stringify({ timon: 'camion', pedales: 'nada' }));
        const estado = this.#recargar(mitad);
        this.#comprobar(estado.timon === 'camion' && estado.estiloPedales === 'clasicos',
            'PRD 021 RF-08 si solo los pedales no se conocen, el timón guardado se respeta');
    }

    #probarVistaCoincide() {
        const registro = new this.#ctx.RegistroEstilosPedales();
        const estilos = registro.estilos;
        const catalogo = new this.#ctx.CatalogoControles();
        this.#comprobar(estilos.map(e => e.clave).join() === catalogo.pedales.join(),
            'PRD 021 RF-03/D7 RegistroEstilosPedales tiene las mismas claves que CatalogoControles.pedales, en el mismo orden');
        this.#comprobar(estilos.every(e => e instanceof this.#ctx.EstiloPedales && e.claseCss === 'pedales-' + e.clave),
            'PRD 021 RF-03/D7 cada estilo hereda de EstiloPedales y tiene su clase CSS');
        this.#comprobar(registro.estilo('cohete').clave === 'clasicos',
            'PRD 021 RF-08 una clave de pedales desconocida da el estilo Clásico');
        const modelos = this.#ctx.RenderizadorTimon.MODELOS;
        this.#comprobar(modelos.length === 6, 'PRD 021 RF-06/RF-07 RenderizadorTimon tiene los 6 timones');
        this.#comprobar(modelos[4]?.constructor.name === 'TimonRally' && modelos[5]?.constructor.name === 'TimonCamion',
            'PRD 021 RF-07/D7 Rally va en el lugar 4 y Camión en el 5, como en CatalogoControles');
        this.#comprobar(modelos.every(m => m instanceof this.#ctx.Timon),
            'PRD 021 D7 los 6 timones heredan de Timon');
    }
}

const prueba = new PruebaEstilosControles();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
