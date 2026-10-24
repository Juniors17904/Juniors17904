// ================================================================
// CLASE: PruebaSuperficieChoques — PRD 008 (docs/prds/prd_008_superficie_y_choques.md)
// En el modelo, con reloj controlado (RNF-04, lección 9):
//   RF-01 el pasto frena aunque se acelere · RF-02 se estabiliza entre 35 % y 45 %
//   RF-03 al volver al asfalto acelera normal · RF-04 el piano frena poco
//   RF-05 no atraviesa árboles, postes ni señales (también a máxima velocidad)
//   RF-06 las flechas no son sólidas · RF-07 rebota y pierde más si va más rápido
//   RF-08 nunca queda atrapado · RF-10 los otros visores no usan choques ni superficie
//   RNF-01 una clase por tipo · RNF-03 detectar choques es barato
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaSuperficieChoques {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    static #RADIO_CARRO = 0.8;
    #fallos = [];
    #clases;
    #ctx;

    constructor(clases) { this.#clases = clases; }
    #Carro; #RegistroCarros; #DetectorChoques; #Ruta;

    async ejecutar() {
        const src = p => path.join(PruebaSuperficieChoques.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ RegistroCarros: this.#RegistroCarros } = await import(src('model/carros/registro_carros.js')));
        ({ DetectorChoques: this.#DetectorChoques } = await import(src('model/choques/detector_choques.js')));
        ({ Ruta: this.#Ruta } = await import(src('model/ruta.js')));
        this.#cargarClasicos();

        this.#probarPasto();
        this.#probarVueltaAlAsfalto();
        this.#probarPiano();
        this.#probarObjetosDePista();
        this.#probarChoques();
        this.#probarNoAtrapado();
        this.#probarSoloJugarSolo();
        this.#probarRendimiento();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    #cargarClasicos() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        const archivos = ['superficies/superficie.js', 'superficies/superficie_asfalto.js', 'superficies/superficie_piano.js',
            'superficies/superficie_pasto.js', 'superficies/detector_superficie.js',
            'registro_pistas.js', 'pistas/config_pista.js', 'pistas/config_pista_ciudad.js', 'pistas/config_pista_costa.js'];
        for (const f of archivos) {
            vm.runInContext(fs.readFileSync(path.join(PruebaSuperficieChoques.#RAIZ, 'src/model', f), 'utf8'), ctx, { filename: f });
        }
        this.#ctx = ctx;
    }

    #superficie(nombre) {
        const d = new this.#ctx.DetectorSuperficie();
        return { asfalto: d.superficieEn(0), piano: d.superficieEn(4.4), pasto: d.superficieEn(6) }[nombre];
    }

    #pasos(carro, n) { for (let i = 0; i < n; i++) carro.actualizar(PruebaSuperficieChoques.#PASO); }

    #probarPasto() {
        const registro = new this.#RegistroCarros();
        const carros = [new this.#Carro(), ...registro.tipos.map(t => registro.crear(t))];
        for (const carro of carros) {
            const nombre = carro.constructor.name;
            carro.entradaAcel = 1;
            this.#pasos(carro, 600);
            const enAsfalto = carro.velocidad;
            carro.pisar(this.#superficie('pasto'));
            carro.actualizar(PruebaSuperficieChoques.#PASO);
            this.#ok(carro.velocidad < enAsfalto, `RF-01 ${nombre} pierde velocidad en el pasto aunque acelere`);
            this.#pasos(carro, 900);
            const fraccion = carro.velocidad / carro.velMaxAdelante;
            this.#ok(fraccion >= 0.35 && fraccion <= 0.45, `RF-02 ${nombre} se estabiliza en ${(fraccion * 100).toFixed(1)} % (35–45 %)`);

            const lento = new this.#Carro(0, 0, 0, carro.constantes);
            lento.pisar(this.#superficie('pasto')); lento.entradaAcel = 1;
            this.#pasos(lento, 900);
            const fLento = lento.velocidad / lento.velMaxAdelante;
            this.#ok(fLento >= 0.35 && fLento <= 0.45, `RF-02 ${nombre} entrando lento también llega cerca del 40 % (${(fLento * 100).toFixed(1)} %)`);
        }
    }

    #probarVueltaAlAsfalto() {
        const nuevo = new this.#Carro();
        nuevo.entradaAcel = 1;
        while (nuevo.velocidad < 0.3) nuevo.actualizar(PruebaSuperficieChoques.#PASO);
        const v0 = nuevo.velocidad; nuevo.actualizar(PruebaSuperficieChoques.#PASO);
        const normal = nuevo.velocidad - v0;

        const vuelve = new this.#Carro();
        vuelve.pisar(this.#superficie('pasto')); vuelve.entradaAcel = 1;
        this.#pasos(vuelve, 900);
        vuelve.pisar(this.#superficie('asfalto'));
        while (vuelve.velocidad < v0) vuelve.actualizar(PruebaSuperficieChoques.#PASO);
        const w0 = vuelve.velocidad; vuelve.actualizar(PruebaSuperficieChoques.#PASO);
        const despues = vuelve.velocidad - w0;
        this.#ok(Math.abs(despues - normal) < 2e-4, `RF-03 en el asfalto acelera normal (${despues.toFixed(5)} ≈ ${normal.toFixed(5)})`);
    }

    // Velocidad perdida en 30 pasos sin pedal desde 0.6
    #perdida(nombre) {
        const carro = new this.#Carro();
        carro.entradaAcel = 1;
        while (carro.velocidad < 0.6) carro.actualizar(PruebaSuperficieChoques.#PASO);
        carro.entradaAcel = 0; carro.pisar(this.#superficie(nombre));
        const antes = carro.velocidad; this.#pasos(carro, 30);
        return antes - carro.velocidad;
    }

    #probarPiano() {
        const [a, p, s] = ['asfalto', 'piano', 'pasto'].map(n => this.#perdida(n));
        this.#ok(a < p && p < s, `RF-04 el piano frena más que el asfalto y menos que el pasto (${a.toFixed(3)} < ${p.toFixed(3)} < ${s.toFixed(3)})`);
    }

    #rutaDe(pista) {
        const ruta = new this.#Ruta();
        ruta.construir(pista.tramos, pista.totalSegs);
        return ruta;
    }

    #probarObjetosDePista() {
        const ciudad = this.#ctx.registroPistas.obtener('ciudad');
        const detector = new this.#DetectorChoques(ciudad.decoraciones, this.#rutaDe(ciudad));
        const tipos = new Set(detector.objetos.map(o => o.tipo));
        const esperados = ciudad.decoraciones.filter(d => ['arbol', 'poste', 'senal_curva'].includes(d.tipo)).length;
        this.#ok(detector.objetos.length === esperados, `RF-05 un objeto sólido por árbol, poste y señal (${detector.objetos.length}/${esperados})`);
        this.#ok(tipos.has('arbol') && tipos.has('poste') && tipos.has('senal_curva') && !tipos.has('flecha'),
            'RF-05/RF-06 sólidos: árbol, poste y señal; flechas no: ' + [...tipos]);
        const costa = this.#ctx.registroPistas.obtener('costa');
        const enCosta = new this.#DetectorChoques(costa.decoraciones, this.#rutaDe(costa)).objetos;
        this.#ok(enCosta.length > 0 && enCosta.every(o => o.tipo === 'senal_curva'), 'RF-05 en Costa solo hay señales sólidas');

        // RF-06: pasar por donde está una flecha no detiene al carro
        const flecha = ciudad.decoraciones.find(d => d.tipo === 'flecha');
        const ruta = this.#rutaDe(ciudad), pos = ruta.posicionEn(flecha.prog);
        const fx = pos.x + Math.cos(pos.angle) * flecha.dist * flecha.lado;
        const fz = pos.z - Math.sin(pos.angle) * flecha.dist * flecha.lado;
        const soloFlecha = new this.#DetectorChoques([flecha], ruta);
        const carro = new this.#Carro(fx - 3, fz, Math.PI / 2);
        carro.entradaAcel = 1; this.#pasos(carro, 60);
        carro.setPosicion(fx - 1, fz);
        const v = carro.velocidad, px = carro.px, pz = carro.pz;
        carro.setPosicion(fx + 1, fz);
        this.#ok(!soloFlecha.resolver(carro, px, pz) && carro.velocidad === v, 'RF-06 las flechas no detienen al carro');
    }

    // Lanza el carro contra un objeto desde un ángulo y velocidad dados
    #lanzar(ClaseObjeto, angulo, velocidadObjetivo, pasos = 120) {
        const objeto = new ClaseObjeto(0, 0);
        const dist = 12;
        const carro = new this.#Carro(-Math.sin(angulo) * dist, -Math.cos(angulo) * dist, angulo);
        carro.entradaAcel = 1;
        while (carro.velocidad < velocidadObjetivo) carro.actualizar(PruebaSuperficieChoques.#PASO);
        carro.setPosicion(-Math.sin(angulo) * dist, -Math.cos(angulo) * dist);
        const vAntes = carro.velocidad;
        let dentro = false, choco = false, vDespues = vAntes;
        for (let i = 0; i < pasos; i++) {
            const px = carro.px, pz = carro.pz;
            carro.actualizar(PruebaSuperficieChoques.#PASO);
            if (this.#resolverContra(carro, objeto, px, pz)) { if (!choco) vDespues = carro.velocidad; choco = true; }
            if (Math.hypot(carro.px, carro.pz) < objeto.radio + PruebaSuperficieChoques.#RADIO_CARRO - 1e-6) dentro = true;
        }
        return { dentro, choco, vAntes, vDespues, carro };
    }

    #resolverContra(carro, objeto, px, pz) {
        const detector = new this.#DetectorChoques([], null);
        return detector.resolverObjeto(carro, objeto, px, pz);
    }

    #probarChoques() {
        const clases = this.#clasesSolidas();
        for (const Clase of clases) {
            for (let a = 0; a < 8; a++) {
                const angulo = a * Math.PI / 4 + 0.1;
                const r = this.#lanzar(Clase, angulo, 0.74);
                this.#ok(r.choco && !r.dentro, `RF-05 ${Clase.name} a máxima velocidad desde ${angulo.toFixed(2)} rad: no lo atraviesa`);
            }
        }
        const [Arbol] = clases;
        const rapido = this.#lanzar(Arbol, 0, 0.7), lento = this.#lanzar(Arbol, 0, 0.2);
        this.#ok(rapido.vDespues <= 0, `RF-07 de frente rebota hacia atrás (${rapido.vDespues.toFixed(3)})`);
        this.#ok(rapido.vAntes - rapido.vDespues > lento.vAntes - lento.vDespues, 'RF-07 más rápido = más pérdida');
        this.#ok(rapido.carro.velocidad <= 0 || Math.hypot(rapido.carro.px, rapido.carro.pz) > 1.7, 'RF-07 queda fuera del árbol');
    }

    #clasesSolidas() {
        const carpeta = path.join(PruebaSuperficieChoques.#RAIZ, 'src/model/choques');
        const nombres = { 'arbol_solido.js': 'ArbolSolido', 'poste_solido.js': 'PosteSolido', 'senal_curva_solida.js': 'SenalCurvaSolida' };
        return Object.entries(nombres).map(([archivo, clase]) => {
            const texto = fs.readFileSync(path.join(carpeta, archivo), 'utf8');
            this.#ok(new RegExp(`class ${clase} extends ObjetoSolido`).test(texto), `RNF-01 ${archivo} define ${clase} (subclase de ObjetoSolido)`);
            return this.#importadas[clase];
        });
    }

    get #importadas() { return this.#clases; }

    #probarNoAtrapado() {
        for (let a = 0; a < 8; a++) {
            const angulo = a * Math.PI / 4;
            const r = this.#lanzar(this.#importadas.ArbolSolido, angulo, 0.74, 200);
            const carro = r.carro, objeto = new this.#importadas.ArbolSolido(0, 0);
            const d0 = Math.hypot(carro.px, carro.pz);
            carro.entradaAcel = -1; carro.entradaDireccion = 0.5;
            for (let i = 0; i < 120; i++) {
                const px = carro.px, pz = carro.pz;
                carro.actualizar(PruebaSuperficieChoques.#PASO);
                this.#resolverContra(carro, objeto, px, pz);
            }
            const d1 = Math.hypot(carro.px, carro.pz);
            this.#ok(d1 > d0 + 2, `RF-08 tras chocar desde ${angulo.toFixed(2)} rad puede alejarse (${d0.toFixed(1)} → ${d1.toFixed(1)})`);
        }
    }

    #probarSoloJugarSolo() {
        const carpeta = path.join(PruebaSuperficieChoques.#RAIZ, 'src/view/pistas');
        for (const archivo of ['visor_testdrive_recto.js', 'visor_testdrive_ruta.js', 'visor_carrera_urbana.js', 'visor_diseno_pista.js']) {
            const texto = fs.readFileSync(path.join(carpeta, archivo), 'utf8');
            this.#ok(!/DetectorChoques|pisar\(|Superficie/.test(texto), `RF-10 ${archivo} no usa choques ni superficie`);
        }
        const solo = fs.readFileSync(path.join(carpeta, 'visor_carrera_solo.js'), 'utf8');
        this.#ok(/DetectorChoques/.test(solo) && /pisar\(/.test(solo), 'D7 Jugar Solo usa choques y superficie');
    }

    #probarRendimiento() {
        const ciudad = this.#ctx.registroPistas.obtener('ciudad');
        const detector = new this.#DetectorChoques(ciudad.decoraciones, this.#rutaDe(ciudad));
        const carro = new this.#Carro(0, 0, 0);
        const inicio = process.hrtime.bigint();
        for (let i = 0; i < 20000; i++) detector.resolver(carro, 0, -0.5);
        const msPorPaso = Number(process.hrtime.bigint() - inicio) / 1e6 / 20000;
        this.#ok(msPorPaso < 0.05, `RNF-03 detectar choques cuesta ${msPorPaso.toFixed(4)} ms por paso (< 0.05)`);
    }
}

(async () => {
    const dir = path.join(__dirname, '..', '..', 'src/model/choques');
    const clases = {
        ArbolSolido:      (await import(path.join(dir, 'arbol_solido.js'))).ArbolSolido,
        PosteSolido:      (await import(path.join(dir, 'poste_solido.js'))).PosteSolido,
        SenalCurvaSolida: (await import(path.join(dir, 'senal_curva_solida.js'))).SenalCurvaSolida,
    };
    await new PruebaSuperficieChoques(clases).ejecutar();
})().catch(e => { console.error(e); process.exitCode = 1; });
