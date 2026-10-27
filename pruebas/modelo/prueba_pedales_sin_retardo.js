// ================================================================
// CLASE: PruebaPedalesSinRetardo — PRD 024 (docs/prds/prd_024_pedales_sin_retardo.md)
// En el modelo, comparando con lo medido antes de este PRD (tabla fija):
//   RF-05 cada carro llega a la mitad de su velocidad en 0,5-0,7 s y su tope no cambia
//   Lista D8: la marcha atrás tarda lo mismo que antes
//   RF-06 el orden de rapidez al arrancar es el de antes
//   RF-07 al soltar pierde la mitad de la velocidad más rápido que antes
//   RF-08 frenar a fondo tarda lo mismo que antes
//   RF-08b en el pasto todos siguen cerca del 40 % de su velocidad
//   RF-01..RF-03/RF-12 DeslizadorPedales (con botones de mentira): cambia de
//         pedal al deslizar, se ve apretado el de abajo, suelta al levantar,
//         y fuera de Jugar Solo no hace nada
//   RF-11 notas en los PRD de D8, CLAUDE.md y backlog B26
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaPedalesSinRetardo {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    // Medido antes del PRD 024: mitad de la velocidad, perder la mitad al soltar y frenar a 0 (s),
    // tope (unidades por paso) y pasos de marcha atrás hasta la mitad de su tope
    static #ANTES = {
        formula:   [0.83, 0.60, 0.42, 0.82, 27], deportivo: [0.92, 0.68, 0.48, 0.80, 30], muscle: [1.00, 0.92, 0.65, 0.84, 32],
        clasico:   [1.02, 0.73, 0.52, 0.74, 36], suv:       [1.05, 0.83, 0.58, 0.68, 41], pickup: [1.07, 0.88, 0.63, 0.70, 40],
    };
    #fallos = [];
    #RegistroCarros;

    async ejecutar() {
        ({ RegistroCarros: this.#RegistroCarros } = await import(path.join(PruebaPedalesSinRetardo.#RAIZ, 'src/model/carros/registro_carros.js')));
        this.#probarFisica();
        this.#probarPasto();
        this.#probarDeslizador();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaPedalesSinRetardo.#RAIZ, relativo), 'utf8'); }

    // Segundos (interpolados entre pasos) hasta que se cumple la condición
    #tiempoHasta(carro, acel, condicion, maxPasos = 60 * 20) {
        let antes = carro.velocidad;
        for (let paso = 1; paso <= maxPasos; paso++) {
            carro.entradaAcel = acel; carro.entradaDireccion = 0;
            carro.actualizar(PruebaPedalesSinRetardo.#PASO);
            const r = condicion(antes, carro.velocidad);
            if (r !== null) return (paso - 1 + r) / 60;
            antes = carro.velocidad;
        }
        return null;
    }

    #probarFisica() {
        const reg = new this.#RegistroCarros();
        const fraccionA = {};
        for (const [tipo, [mitad0, soltar0, frenar0, tope0, reversa0]] of Object.entries(PruebaPedalesSinRetardo.#ANTES)) {
            const carro = reg.crear(tipo, 0, 0, 0), max = carro.velMaxAdelante;
            const cruza = objetivo => (a, b) => (a < objetivo && b >= objetivo) || (a > objetivo && b <= objetivo) ? (objetivo - a) / (b - a) : null;
            const mitad = this.#tiempoHasta(carro, 1, cruza(max / 2));
            this.#ok(mitad >= 0.5 && mitad <= 0.7, `RF-05 ${tipo} llega a la mitad en ${mitad?.toFixed(2)} s (antes ${mitad0})`);
            for (let i = 0; i < 600; i++) { carro.entradaAcel = 1; carro.actualizar(PruebaPedalesSinRetardo.#PASO); }
            this.#ok(Math.abs(max - tope0) < 1e-9 && Math.abs(carro.velocidad - max) < 1e-6, `RF-05 ${tipo} su tope no cambia (${carro.velocidad.toFixed(3)}, antes ${tope0})`);
            const soltar = this.#tiempoHasta(carro, 0, cruza(max / 2));
            this.#ok(soltar !== null && soltar < soltar0 - 0.05, `RF-07 ${tipo} al soltar pierde la mitad en ${soltar?.toFixed(2)} s (antes ${soltar0})`);
            for (let i = 0; i < 600; i++) { carro.entradaAcel = 1; carro.actualizar(PruebaPedalesSinRetardo.#PASO); }
            const frenar = this.#tiempoHasta(carro, -1, (a, b) => b <= 0.01 ? 1 : null);
            this.#ok(frenar !== null && Math.abs(frenar - frenar0) <= 0.03, `RF-08 ${tipo} frena a 0 en ${frenar?.toFixed(2)} s, como antes (${frenar0})`);
            // Para el orden: fracción del tope a los 0,4 s
            const otro = reg.crear(tipo, 0, 0, 0);
            for (let i = 0; i < 24; i++) { otro.entradaAcel = 1; otro.actualizar(PruebaPedalesSinRetardo.#PASO); }
            fraccionA[tipo] = otro.velocidad / otro.velMaxAdelante;
            // La marcha atrás no cambia (lista de lo que NO se modifica)
            const atras = reg.crear(tipo, 0, 0, 0), mitadAtras = -atras.constantes.velMaxReversa / 2;
            let pasos = 0;
            while (atras.velocidad > mitadAtras && pasos < 600) { atras.entradaAcel = -1; atras.actualizar(PruebaPedalesSinRetardo.#PASO); pasos++; }
            this.#ok(pasos === reversa0, `D8 ${tipo} la marcha atrás tarda lo mismo que antes (${pasos} pasos, antes ${reversa0})`);
        }
        const ordenAntes = Object.keys(PruebaPedalesSinRetardo.#ANTES);   // del más rápido al más lento al arrancar
        const ordenAhora = Object.keys(fraccionA).sort((a, b) => fraccionA[b] - fraccionA[a]);
        this.#ok(ordenAhora.join() === ordenAntes.join(), `RF-06 el orden al arrancar es el de antes (${ordenAhora})`);
    }

    #probarPasto() {
        const reg = new this.#RegistroCarros();
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['superficies/superficie.js', 'superficies/superficie_pasto.js']) vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        const pasto = new ctx.SuperficiePasto();
        for (const tipo of Object.keys(PruebaPedalesSinRetardo.#ANTES)) {
            const carro = reg.crear(tipo, 0, 0, 0);
            carro.pisar(pasto);
            for (let i = 0; i < 60 * 15; i++) { carro.entradaAcel = 1; carro.actualizar(PruebaPedalesSinRetardo.#PASO); }
            const f = carro.velocidad / carro.velMaxAdelante;
            this.#ok(f > 0.33 && f < 0.47, `RF-08b ${tipo} en el pasto sigue cerca del 40 % (${(f * 100).toFixed(0)} %)`);
        }
    }

    // Botones de mentira: caja fija, clases y escuchas
    #boton(x0) {
        const clases = new Set(), escuchas = {};
        return { clases, escuchas, offsetWidth: 80, offsetHeight: 80,
            getBoundingClientRect: () => ({ left: x0, top: 0, width: 80, height: 80 }),
            classList: { toggle: (c, v) => (v ? clases.add(c) : clases.delete(c)), remove: c => clases.delete(c) },
            addEventListener: (t, f) => { escuchas[t] = f; }, removeEventListener: t => { delete escuchas[t]; } };
    }

    #probarDeslizador() {
        const ctx = { console, Math, Array, navigator: { vibrate: () => { ctx.vibro = (ctx.vibro ?? 0) + 1; } } }; ctx.window = ctx;
        vm.createContext(ctx);
        vm.runInContext(this.#leer('src/view/controles/deslizador_pedales.js'), ctx, { filename: 'deslizador_pedales.js' });
        const acel = this.#boton(200), freno = this.#boton(100), destino = { entradaAcel: 1 };
        let enJugarSolo = true;
        const d = new ctx.DeslizadorPedales(acel, freno, destino, () => enJugarSolo);
        const toque = (id, x) => ({ changedTouches: [{ identifier: id, clientX: x, clientY: 40 }] });
        acel.escuchas.touchstart(toque(1, 240));
        acel.escuchas.touchmove(toque(1, 190));                          // en el hueco: sigue ACEL
        this.#ok(destino.entradaAcel === 1, 'RF-01 en el hueco entre pedales se queda el pedal que estaba');
        acel.escuchas.touchmove(toque(1, 140));                          // sobre FRENO
        this.#ok(destino.entradaAcel === -1 && freno.clases.has('apretado') && !acel.clases.has('apretado') && ctx.vibro === 1,
            'RF-01/RF-02 deslizar a FRENO frena, lo muestra apretado y vibra');
        acel.escuchas.touchmove(toque(2, 240));                          // otro dedo no cuenta
        this.#ok(destino.entradaAcel === -1, 'RF-04 otro dedo no cambia el pedal');
        acel.escuchas.touchmove(toque(1, 250));
        this.#ok(destino.entradaAcel === 1 && acel.clases.has('apretado') && !freno.clases.has('apretado'), 'RF-01 deslizar de vuelta acelera');
        acel.escuchas.touchend(toque(1, 250));
        this.#ok(!acel.clases.has('apretado') && !freno.clases.has('apretado'), 'RF-03 al levantar el dedo los dos se ven sueltos');
        enJugarSolo = false; destino.entradaAcel = 1;
        acel.escuchas.touchstart(toque(3, 240)); acel.escuchas.touchmove(toque(3, 140));
        this.#ok(destino.entradaAcel === 1, 'RF-12 fuera de Jugar Solo deslizar no cambia de pedal');
        d.destruir();
        this.#ok(Object.keys(acel.escuchas).length === 0 && Object.keys(freno.escuchas).length === 0, 'destruir() deja de escuchar');
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaPedalesSinRetardo.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016', '017', '018', '019', '020', '021', '022']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /según el PRD 024/.test(this.#leer(`docs/prds/${f}`)), `RF-11 el PRD ${n} tiene la nota del PRD 024`);
        }
        this.#ok(/DeslizadorPedales/.test(this.#leer('CLAUDE.md')), 'RF-11 CLAUDE.md nombra DeslizadorPedales');
        this.#ok(/B26[^\n]*prd_024/.test(this.#leer('docs/BACKLOG.md')), 'RF-11 el backlog enlaza B26 con el PRD 024');
        const cf = this.#leer('src/model/carros/constantes_fisica.js');
        this.#ok(/#FACTOR_ARRANQUE/.test(cf) && /#PARTE_FRENO_MOTOR/.test(cf) && !/FACTOR_ARRANQUE|FRENO_MOTOR/.test(this.#leer('src/model/carros/carro.js')),
            'RNF-01 los números del arranque y del freno de motor viven solo en ConstantesFisica');
        const visor = this.#leer('src/view/pistas/visor_carrera_solo.js');
        this.#ok(visor.split('\n').length - 1 <= 376, 'RNF-03 VisorCarreraSolo no crece');
    }
}

new PruebaPedalesSinRetardo().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
