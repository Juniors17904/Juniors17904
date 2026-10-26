// ================================================================
// CLASE: PruebaLlegadasNaturales — PRD 013 (docs/prds/prd_013_rivales_pc.md)
// Carreras completas de 3 vueltas en Ciudad con CarreraConRivales y un
// jugador simulado, con semilla fija por carrera (RNF-03):
//   RF-03 los 4 rivales terminan
//   RF-07 con un jugador normal (PilotoAutomatico) los 5 llegan separados
//         entre 2 y 15 s en al menos 8 de 10 carreras
//   RF-08 un jugador muy bueno puede ganar y uno muy lento queda último
//   RF-04 sin ajuste de ritmo el Experto termina en promedio antes que el Novato
//   PRD 019 RF-08 las llegadas siguen igual con el Carro nuevo: los rivales
//         corren con TransferenciaPeso activa (factorPeso cambia al soltar)
//   RNF-02 los choques entre los 5 carros tardan menos de 0,05 ms por paso
//          y un paso entero de los rivales queda muy por debajo de un cuadro
// Con DETALLE=1 muestra los tiempos de cada carrera.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');
const { PilotoAutomatico } = require('./piloto_automatico.cjs');

class PruebaLlegadasNaturales {
    static #RAIZ    = path.join(__dirname, '..', '..');
    static #PASO    = 1000 / 60;
    static #MAX_S   = 600;
    // SEMILLAS=1,2,3 (opcional) prueba con otras semillas
    static #SEMILLAS = process.env.SEMILLAS
        ? process.env.SEMILLAS.split(',').map(Number)
        : [11, 23, 37, 41, 53, 67, 79, 83, 97, 101];
    static #TIPO_JUGADOR = 'deportivo';
    static #TIPO_JUGADOR_BUENO = 'formula';   // el que maneja bien elige el carro más rápido
    #fallos = [];
    #ctx;
    #m = {};
    #detalle = process.env.DETALLE === '1';
    #pista; #ruta; #muestras; #puntos;

    async ejecutar() {
        this.#cargarClasicos();
        await this.#importar();
        this.#prepararPista();

        this.#probarPesoActivo();
        this.#probarLlegadas();
        this.#probarJugadorBueno();
        this.#probarJugadorLento();
        this.#probarSinAjuste();
        this.#probarRendimiento();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #log(texto) { if (this.#detalle) console.log('ℹ️  ' + texto); }

    #cargarClasicos() {
        const ctx = { console, Math, performance }; ctx.window = ctx;
        vm.createContext(ctx);
        const archivos = ['medida_carro.js', 'medidas_escena.js', 'muestra_ruta.js', 'superficies/superficie.js',
            'superficies/superficie_asfalto.js', 'superficies/superficie_piano.js', 'superficies/superficie_pasto.js',
            'superficies/detector_superficie.js', 'carrera_vueltas.js', 'cronometro.js', 'registro_pistas.js',
            'pistas/config_pista.js', 'pistas/config_pista_ciudad.js', 'pistas/config_pista_costa.js',
            'pistas/config_pista_desierto.js', 'pistas/config_pista_montana.js', 'pistas/config_pista_volcan.js'];
        for (const f of archivos) {
            vm.runInContext(fs.readFileSync(path.join(PruebaLlegadasNaturales.#RAIZ, 'src/model', f), 'utf8'), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);   // la vuelta entera, para Ruta (PRD 014)
        this.#ctx = ctx;
        for (const c of ['MedidasEscena', 'CarreraVueltas', 'Cronometro', 'MuestraRuta']) globalThis[c] = ctx[c];
    }

    async #importar() {
        const src = p => path.join(PruebaLlegadasNaturales.#RAIZ, 'src/model', p);
        const modulos = {
            Ruta: 'ruta.js', RegistroCarros: 'carros/registro_carros.js', DetectorChoques: 'choques/detector_choques.js',
            GrillaSalida: 'grilla_salida.js', CarreraConRivales: 'carrera_con_rivales.js',
            PilotoExperto: 'pilotos/piloto_experto.js', PilotoPrudente: 'pilotos/piloto_prudente.js',
            AzarSemilla: 'azar_semilla.js', ChoqueEntreCarros: 'choques/choque_entre_carros.js',
        };
        for (const [clase, archivo] of Object.entries(modulos)) this.#m[clase] = (await import(src(archivo)))[clase];
    }

    // Ciudad, con las muestras por longitud de arco que usa el visor
    #prepararPista() {
        this.#pista = this.#ctx.registroPistas.obtener('ciudad');
        this.#ruta  = new this.#m.Ruta();
        this.#ruta.construir(this.#pista.tramos, this.#pista.totalSegs);
        this.#muestras = Array.from({ length: 1000 }, (_, i) => {
            const p = this.#ruta.curve.getPointAt(i / 1000), t = this.#ruta.curve.getTangentAt(i / 1000);
            return new this.#ctx.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z));
        });
        this.#puntos = new this.#m.GrillaSalida(new this.#ctx.MedidasEscena()).puntos(this.#ruta.inicio, 5, this.#muestras);
    }

    // Una carrera completa. modo: 'normal' (PilotoAutomatico), 'bueno'
    // (PilotoExperto arriesgando), 'lento' (PilotoPrudente aflojando) o null
    // (sin jugador: sin ajuste de ritmo). Devuelve tiempos en segundos.
    #simular(semilla, modo) {
        let ahora = 0;
        const carrera = new this.#m.CarreraConRivales(this.#ruta, this.#pista.decoraciones, this.#muestras, semilla, () => ahora);
        carrera.colocarEnGrilla(this.#puntos.slice(0, 4));
        const jugador = modo ? this.#crearJugador(semilla, modo) : null;
        if (jugador) carrera.seguirJugador(jugador.carrera);
        carrera.iniciar();
        let tiempoJugador = null;
        const maxPasos = 60 * PruebaLlegadasNaturales.#MAX_S;
        for (let paso = 1; paso <= maxPasos; paso++) {
            ahora += PruebaLlegadasNaturales.#PASO;
            if (jugador && tiempoJugador === null && this.#pasoJugador(jugador) === 'meta') tiempoJugador = ahora / 1000;
            carrera.paso(jugador?.carro ?? null, jugador?.medida ?? null);
            const listoJugador = !jugador || tiempoJugador !== null || modo === 'lento';
            if (carrera.todosTerminaron && listoJugador) break;
        }
        const rivales = carrera.rivales.map(r => ({
            nombre: r.nombre, terminado: r.terminado,
            tiempo: r.terminado ? r.tiempoTotalMs / 1000 : null, avance: r.avance,
        }));
        const filas = jugador ? carrera.posiciones('Jugador', tiempoJugador !== null, (tiempoJugador ?? 0) * 1000) : [];
        return { rivales, tiempoJugador, filas, avanceJugador: jugador ? jugador.carrera.vueltaActual : null };
    }

    #crearJugador(semilla, modo) {
        const p = this.#puntos[4];
        const tipo = modo === 'bueno' ? PruebaLlegadasNaturales.#TIPO_JUGADOR_BUENO : PruebaLlegadasNaturales.#TIPO_JUGADOR;
        const carro = new this.#m.RegistroCarros().crear(tipo, p.x, p.z, p.angulo);
        const medida = new this.#ctx.MedidasEscena().medidaCarro(tipo);
        const carrera = new this.#ctx.CarreraVueltas(this.#muestras, 3);
        const detector = new this.#m.DetectorChoques(this.#pista.decoraciones, this.#ruta, medida);
        carrera.actualizar(carro.px, carro.pz);
        carro.pisar(carrera.superficie);
        let piloto, ritmo = 1;
        if (modo === 'normal') {
            piloto = new PilotoAutomatico(this.#ruta);
            for (let k = 0; k < 20; k++) piloto.reubicar(carro);
        } else {
            const Clase = modo === 'bueno' ? this.#m.PilotoExperto : this.#m.PilotoPrudente;
            piloto = new Clase(this.#muestras, this.#ruta.longitud, new this.#m.AzarSemilla(semilla * 31 + 5));
            piloto.reiniciar(carro);
            ritmo = modo === 'bueno' ? 1.5 : 0.5;
        }
        return { modo, carro, medida, carrera, detector, piloto, ritmo };
    }

    // El jugador se mueve como en el visor: entradas, física, choques, vueltas y superficie
    #pasoJugador(j) {
        const carro = j.carro;
        if (j.modo === 'normal') {
            j.piloto.pasoAutomatico(carro, (c, px, pz) => j.detector.resolver(c, px, pz));
        } else {
            const px = carro.px, pz = carro.pz;
            j.piloto.decidir(carro, j.ritmo);
            carro.actualizar(PruebaLlegadasNaturales.#PASO);
            j.detector.resolver(carro, px, pz);
            j.piloto.ubicar(carro);
        }
        const evento = j.carrera.actualizar(carro.px, carro.pz);
        carro.pisar(j.carrera.superficie);
        return evento;
    }

    #texto(r) {
        const rivales = r.rivales.map(x => `${x.nombre.split(' ')[0]} ${x.tiempo === null ? 'avance ' + x.avance.toFixed(2) : x.tiempo.toFixed(1)}`);
        const jug = r.tiempoJugador === null ? '' : ` · Jugador ${r.tiempoJugador.toFixed(1)}`;
        return rivales.join(' · ') + jug;
    }

    // RF-03 y RF-07: jugador normal, 10 carreras
    #probarLlegadas() {
        let separadas = 0;
        for (const semilla of PruebaLlegadasNaturales.#SEMILLAS) {
            const r = this.#simular(semilla, 'normal');
            const todos = r.rivales.every(x => x.terminado);
            this.#ok(todos, `PRD 013 RF-03 / PRD 019 RF-08 semilla ${semilla}: los 4 rivales terminan (${this.#texto(r)})`);
            this.#ok(r.tiempoJugador !== null, `PRD 013 RF-07 / PRD 019 RF-08 semilla ${semilla}: el jugador simulado termina`);
            const tiempos = [...r.rivales.map(x => x.tiempo), r.tiempoJugador].filter(t => t !== null).sort((a, b) => a - b);
            const huecos = tiempos.slice(1).map((t, i) => t - tiempos[i]);
            const ok = tiempos.length === 5 && huecos.every(h => h >= 2 && h <= 15);
            if (ok) separadas++;
            this.#log(`semilla ${semilla} ${ok ? '✓' : '✗'} ${this.#texto(r)} | huecos ${huecos.map(h => h.toFixed(1)).join(', ')}`);
        }
        const total = PruebaLlegadasNaturales.#SEMILLAS.length;
        this.#ok(separadas >= total * 0.8, `PRD 013 RF-07 / PRD 019 RF-08 los 5 llegan separados de 2 a 15 s en ${separadas} de ${total} carreras (al menos el 80 %)`);
    }

    // PRD 019 RF-08: el Carro de estas carreras (jugador y rivales) tiene la
    // transferencia de peso activa: acelerando factorPeso baja de 1 y al soltar sube
    #probarPesoActivo() {
        const p = this.#puntos[4];
        const carro = new this.#m.RegistroCarros().crear(PruebaLlegadasNaturales.#TIPO_JUGADOR, p.x, p.z, p.angulo);
        carro.entradaAcel = 1;
        for (let k = 0; k < 60; k++) carro.actualizar(PruebaLlegadasNaturales.#PASO);
        const acelerando = carro.factorPeso;
        carro.entradaAcel = 0; carro.entradaDireccion = 1;
        for (let k = 0; k < 30; k++) carro.actualizar(PruebaLlegadasNaturales.#PASO);
        const soltando = carro.factorPeso;
        this.#ok(acelerando < 1 && soltando > 1,
            `PRD 019 RF-08 el Carro de la carrera tiene TransferenciaPeso activa (acelerando ${acelerando.toFixed(3)}, al soltar ${soltando.toFixed(3)})`);
        let ahora = 0;
        const carrera = new this.#m.CarreraConRivales(this.#ruta, this.#pista.decoraciones, this.#muestras, 11, () => ahora);
        carrera.colocarEnGrilla(this.#puntos.slice(0, 4));
        carrera.iniciar();
        const rango = carrera.rivales.map(r => [r.carro.factorPeso, r.carro.factorPeso]);
        for (let k = 0; k < 60 * 40; k++) {
            ahora += PruebaLlegadasNaturales.#PASO;
            carrera.paso(null, null);
            carrera.rivales.forEach((r, i) => { rango[i][0] = Math.min(rango[i][0], r.carro.factorPeso); rango[i][1] = Math.max(rango[i][1], r.carro.factorPeso); });
        }
        this.#ok(rango.every(([min, max]) => min < 1 && max > 1),
            `PRD 019 RF-08 los rivales corren con la física nueva: su factorPeso baja y sube de 1 (${rango.map(([a, b]) => `${a.toFixed(3)}..${b.toFixed(3)}`).join(' · ')})`);
    }

    // RF-08: un jugador muy bueno puede ganar
    #probarJugadorBueno() {
        const ganadas = [];
        for (const semilla of PruebaLlegadasNaturales.#SEMILLAS.slice(0, 5)) {
            const r = this.#simular(semilla, 'bueno');
            const puesto = r.filas.find(f => f.esJugador)?.puesto;
            ganadas.push(puesto === 1);
            this.#log(`bueno semilla ${semilla}: puesto ${puesto} · ${this.#texto(r)}`);
        }
        this.#ok(ganadas.some(g => g), `PRD 013 RF-08 un jugador muy bueno puede ganar (ganó ${ganadas.filter(g => g).length} de ${ganadas.length})`);
    }

    // RF-08: un jugador muy lento queda último
    #probarJugadorLento() {
        const semilla = PruebaLlegadasNaturales.#SEMILLAS[0];
        const r = this.#simular(semilla, 'lento');
        const puesto = r.filas.find(f => f.esJugador)?.puesto;
        this.#log(`lento semilla ${semilla}: puesto ${puesto} · ${this.#texto(r)}`);
        this.#ok(puesto === 5, `PRD 013 RF-08 un jugador muy lento queda último (puesto ${puesto})`);
        this.#ok(r.rivales.every(x => x.terminado), 'PRD 013 RF-03 con un jugador lento los 4 rivales igual terminan');
    }

    // RF-04: sin ajuste de ritmo, el Experto termina antes que el Novato en promedio
    #probarSinAjuste() {
        const suma = new Map();
        for (const semilla of PruebaLlegadasNaturales.#SEMILLAS) {
            const r = this.#simular(semilla, null);
            for (const x of r.rivales) suma.set(x.nombre, (suma.get(x.nombre) ?? 0) + (x.tiempo ?? PruebaLlegadasNaturales.#MAX_S));
            this.#log(`sin ajuste semilla ${semilla}: ${this.#texto(r)}`);
        }
        const veces = PruebaLlegadasNaturales.#SEMILLAS.length;
        const promedio = nombre => [...suma].find(([k]) => k.includes(nombre))[1] / veces;
        const experto = promedio('Experto'), novato = promedio('Novato');
        this.#log(`promedios sin ajuste: ${[...suma].map(([k, v]) => `${k} ${(v / veces).toFixed(1)}`).join(' · ')}`);
        this.#ok(experto < novato, `PRD 013 RF-04 sin ajuste el Experto (${experto.toFixed(1)} s) termina antes que el Novato (${novato.toFixed(1)} s)`);
    }

    // RNF-02: lo que cuesta un paso de los rivales y los choques de los 5 carros
    #probarRendimiento() {
        let ahora = 0;
        const carrera = new this.#m.CarreraConRivales(this.#ruta, this.#pista.decoraciones, this.#muestras, 7, () => ahora);
        carrera.colocarEnGrilla(this.#puntos.slice(0, 4));
        const jugador = this.#crearJugador(7, 'bueno');
        carrera.seguirJugador(jugador.carrera);
        carrera.iniciar();
        const pasos = 60 * 60;
        for (let k = 0; k < 600; k++) { ahora += 16; this.#pasoJugador(jugador); carrera.paso(jugador.carro, jugador.medida); }
        const inicio = process.hrtime.bigint();
        for (let k = 0; k < pasos; k++) { ahora += 16; carrera.paso(jugador.carro, jugador.medida); }
        const ms = Number(process.hrtime.bigint() - inicio) / 1e6 / pasos;
        this.#log(`un paso de los rivales y los choques: ${ms.toFixed(4)} ms`);
        // Los choques entre los 5 carros, en sus lugares de carrera (solo lo cercano)
        const choque = new this.#m.ChoqueEntreCarros();
        const carros = [...carrera.rivales.map(r => [r.carro, r.medida]), [jugador.carro, jugador.medida]];
        const inicioChoques = process.hrtime.bigint();
        for (let k = 0; k < pasos; k++) {
            for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) choque.resolver(carros[i][0], carros[i][1], carros[j][0], carros[j][1]);
        }
        const msChoques = Number(process.hrtime.bigint() - inicioChoques) / 1e6 / pasos;
        this.#log(`choques entre los 5 carros: ${msChoques.toFixed(4)} ms`);
        this.#ok(msChoques < 0.05, `PRD 013 RNF-02 los choques entre los 5 carros tardan ${msChoques.toFixed(4)} ms por paso (< 0.05)`);
        // 4 rivales con su física, pilotos, choques con objetos y entre los 5 carros:
        // muy por debajo de un cuadro (16,7 ms) para sostener 30 cuadros por segundo
        this.#ok(ms < 0.5, `PRD 013 RNF-02 un paso de los rivales (pilotos, física y choques) tarda ${ms.toFixed(4)} ms (< 0.5)`);
    }
}

new PruebaLlegadasNaturales().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
