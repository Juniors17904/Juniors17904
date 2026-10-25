// ================================================================
// CLASE: PruebaPilotosPC — PRD 013 (docs/prds/prd_013_rivales_pc.md)
// En el modelo, con semilla fija (RNF-03), cada piloto solo con su carro
// en Ciudad, con el pasto de verdad (CarreraVueltas + DetectorSuperficie):
//   RF-02 nombre, carro y color distintos · RF-03 completan 3 vueltas
//   RF-04 Experto más rápido que Novato; Novato pisa más pasto que Prudente
//   RF-05 semillas distintas → tiempos distintos; misma semilla → iguales
//   RNF-01 sin Math.random, una clase por archivo
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');

class PruebaPilotosPC {
    static #RAIZ     = path.join(__dirname, '..', '..');
    static #PASO     = 1000 / 60;
    static #MUESTRAS = 3000;
    static #MAX_PASOS = 60 * 600;
    static #CARRERAS = 10;
    #fallos = [];
    #ctx; #ruta; #muestras;
    #RegistroCarros; #AzarSemilla; #clases;

    async ejecutar() {
        const src = p => path.join(PruebaPilotosPC.#RAIZ, 'src', p);
        ({ RegistroCarros: this.#RegistroCarros } = await import(src('model/carros/registro_carros.js')));
        ({ AzarSemilla: this.#AzarSemilla } = await import(src('model/azar_semilla.js')));
        const { Ruta } = await import(src('model/ruta.js'));
        this.#clases = [
            (await import(src('model/pilotos/piloto_prudente.js'))).PilotoPrudente,
            (await import(src('model/pilotos/piloto_agresivo.js'))).PilotoAgresivo,
            (await import(src('model/pilotos/piloto_novato.js'))).PilotoNovato,
            (await import(src('model/pilotos/piloto_experto.js'))).PilotoExperto,
        ];
        this.#cargarClasicos();
        this.#construirRuta(Ruta);

        this.#probarAzar();
        this.#probarIdentidad();
        const resultados = this.#probarVueltas();
        this.#probarPersonalidades(resultados);
        this.#probarSemillas();
        this.#probarCodigo();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    #cargarClasicos() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        const archivos = ['medida_carro.js', 'medidas_escena.js', 'muestra_ruta.js', 'superficies/superficie.js',
            'superficies/superficie_asfalto.js', 'superficies/superficie_piano.js', 'superficies/superficie_pasto.js',
            'superficies/detector_superficie.js', 'carrera_vueltas.js', 'registro_pistas.js',
            'pistas/config_pista.js', 'pistas/config_pista_ciudad.js'];
        for (const f of archivos) {
            vm.runInContext(fs.readFileSync(path.join(PruebaPilotosPC.#RAIZ, 'src/model', f), 'utf8'), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);   // la vuelta entera, para Ruta (PRD 014)
        this.#ctx = ctx;
    }

    // Igual que VisorCarreraSolo.muestrasRuta: MuestraRuta por longitud de arco
    #construirRuta(Ruta) {
        const ruta = new Ruta();
        const ciudad = this.#ctx.registroPistas.obtener('ciudad');
        ruta.construir(ciudad.tramos, ciudad.totalSegs);
        const n = PruebaPilotosPC.#MUESTRAS, curva = ruta.curve;
        this.#muestras = Array.from({ length: n }, (_, i) => {
            const p = curva.getPointAt(i / n), t = curva.getTangentAt(i / n);
            return new this.#ctx.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z));
        });
        this.#ruta = ruta;
    }

    #piloto(Clase, semilla) {
        return new Clase(this.#muestras, this.#ruta.longitud, new this.#AzarSemilla(semilla));
    }

    // Una carrera de 3 vueltas, solo: pasos hasta la meta (null si se trabó) y veces en el pasto
    #correr(Clase, semilla) {
        const piloto = this.#piloto(Clase, semilla);
        const i = this.#ruta.inicio;
        const carro = new this.#RegistroCarros().crear(piloto.tipoAuto, i.x, i.z, i.angle);
        const carrera = new this.#ctx.CarreraVueltas(this.#muestras, 3);
        piloto.reiniciar(carro);
        let pastos = 0, pasosPasto = 0, antesPasto = false;
        for (let paso = 1; paso <= PruebaPilotosPC.#MAX_PASOS; paso++) {
            piloto.decidir(carro, 1);
            carro.actualizar(PruebaPilotosPC.#PASO);
            piloto.ubicar(carro);
            const evento = carrera.actualizar(carro.px, carro.pz);
            carro.pisar(carrera.superficie);
            const enPasto = carrera.enPasto;
            if (enPasto) pasosPasto++;
            if (enPasto && !antesPasto) pastos++;
            antesPasto = enPasto;
            if (evento === 'meta') return { pasos: paso, pastos, pasosPasto };
        }
        return { pasos: null, pastos, pasosPasto, vuelta: carrera.vueltaActual, progreso: carrera.progreso };
    }

    #probarAzar() {
        const a = new this.#AzarSemilla(7), b = new this.#AzarSemilla(7), c = new this.#AzarSemilla(8);
        const sa = Array.from({ length: 50 }, () => a.siguiente());
        const sb = Array.from({ length: 50 }, () => b.siguiente());
        const sc = Array.from({ length: 50 }, () => c.siguiente());
        this.#ok(sa.every(x => x >= 0 && x < 1), 'RF-05 AzarSemilla.siguiente da números en [0, 1)');
        this.#ok(sa.join() === sb.join(), 'RF-05 la misma semilla repite los números');
        this.#ok(sa.join() !== sc.join(), 'RF-05 otra semilla da otros números');
        const e = new this.#AzarSemilla(3).entre(2, 5);
        this.#ok(e >= 2 && e < 5, 'RF-05 AzarSemilla.entre respeta el rango');
    }

    #probarIdentidad() {
        const pilotos = this.#clases.map(C => this.#piloto(C, 1));
        const distintos = campo => new Set(pilotos.map(p => p[campo])).size === pilotos.length;
        this.#ok(distintos('nombre') && distintos('tipoAuto') && distintos('color'), 'RF-02 nombre, carro y color distintos');
        const tipos = pilotos.map(p => p.tipoAuto).join(',');
        this.#ok(tipos === 'suv,muscle,pickup,formula', 'RF-02 carros de cada personalidad: ' + tipos);
        for (const p of pilotos) {
            this.#ok(/ · (Prudente|Agresivo|Novato|Experto)$/.test(p.nombre), 'RF-02 nombre visible con personalidad: ' + p.nombre);
            this.#ok(Number.isInteger(p.color), 'RF-02 color numérico de ' + p.nombre);
        }
    }

    // RF-03 y datos para RF-04: 10 carreras por piloto
    #probarVueltas() {
        const resultados = new Map();
        for (const Clase of this.#clases) {
            const carreras = [];
            for (let semilla = 1; semilla <= PruebaPilotosPC.#CARRERAS; semilla++) {
                const r = this.#correr(Clase, semilla);
                this.#ok(r.pasos !== null, `RF-03 ${Clase.name} completa 3 vueltas (semilla ${semilla}) ${JSON.stringify(r)}`);
                carreras.push(r);
            }
            resultados.set(Clase.name, carreras);
            if (process.env.DETALLE) {
                const s = carreras.map(r => r.pasos ? (r.pasos / 60).toFixed(1) : 'x').join(' ');
                console.log(Clase.name.padEnd(15), s, '| pasto', carreras.map(r => r.pastos).join(','));
            }
        }
        return resultados;
    }

    #promedio(lista, campo) { return lista.reduce((s, r) => s + (r[campo] ?? Infinity), 0) / lista.length; }

    #probarPersonalidades(resultados) {
        const experto = this.#promedio(resultados.get('PilotoExperto'), 'pasos');
        const novato  = this.#promedio(resultados.get('PilotoNovato'), 'pasos');
        this.#ok(experto < novato, `RF-04 el Experto termina antes que el Novato en promedio (${(experto / 60).toFixed(1)} s < ${(novato / 60).toFixed(1)} s)`);
        const pastoNovato   = this.#promedio(resultados.get('PilotoNovato'), 'pastos');
        const pastoPrudente = this.#promedio(resultados.get('PilotoPrudente'), 'pastos');
        this.#ok(pastoNovato > pastoPrudente, `RF-04 el Novato pisa más pasto que el Prudente (${pastoNovato} > ${pastoPrudente})`);
    }

    #probarSemillas() {
        for (const Clase of this.#clases) {
            const a = this.#correr(Clase, 101), b = this.#correr(Clase, 202), c = this.#correr(Clase, 101);
            this.#ok(a.pasos !== b.pasos, `RF-05 ${Clase.name}: con semillas distintas cambia el tiempo (${a.pasos} vs ${b.pasos})`);
            this.#ok(a.pasos === c.pasos && a.pastos === c.pastos, `RF-05 ${Clase.name}: la misma semilla repite la carrera`);
        }
    }

    #probarCodigo() {
        const carpeta = path.join(PruebaPilotosPC.#RAIZ, 'src/model/pilotos');
        const archivos = [...fs.readdirSync(carpeta).map(f => path.join(carpeta, f)), path.join(PruebaPilotosPC.#RAIZ, 'src/model/azar_semilla.js')];
        for (const archivo of archivos) {
            const texto = fs.readFileSync(archivo, 'utf8');
            const nombre = path.basename(archivo);
            this.#ok(!/Math\.random/.test(texto), `RNF-01 ${nombre} no usa Math.random (D6)`);
            this.#ok((texto.match(/^export class /gm) || []).length === 1, `RNF-01 ${nombre} tiene una sola clase`);
        }
    }
}

new PruebaPilotosPC().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
