// ================================================================
// CLASE: PruebaCarrosPersonalidad — PRD 007 (docs/prds/prd_007_carros_con_personalidad.md)
// En el modelo, con reloj controlado (RNF-03, lección 9):
//   RF-01 cada modelo del garaje tiene su física · RF-03 modelo sin física → básico + error
//   RF-04 más masa tarda más en llegar al tope y en frenar · RF-05 menos agarre derrapa más
//   RF-06 en Ciudad el más lento tarda menos de 15 % más que el más rápido
//   RF-07 todos completan 3 vueltas sin trabarse · RNF-01 sin campos públicos de física
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');
const { PilotoAutomatico } = require('./piloto_automatico.cjs');

class PruebaCarrosPersonalidad {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    static #TIPOS = ['deportivo', 'suv', 'muscle', 'formula', 'pickup', 'clasico'];
    #fallos = [];
    #Carro; #ConstantesFisica; #RegistroCarros; #Ruta;

    async ejecutar() {
        const src = p => path.join(PruebaCarrosPersonalidad.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ ConstantesFisica: this.#ConstantesFisica } = await import(src('model/carros/constantes_fisica.js')));
        ({ RegistroCarros: this.#RegistroCarros } = await import(src('model/carros/registro_carros.js')));
        ({ Ruta: this.#Ruta } = await import(src('model/ruta.js')));

        this.#probarRegistro();
        this.#probarMasa();
        this.#probarAgarre();
        this.#probarVueltas();
        this.#probarEncapsulamiento();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    #probarRegistro() {
        const registro = new this.#RegistroCarros();
        this.#ok(JSON.stringify(registro.tipos) === JSON.stringify(PruebaCarrosPersonalidad.#TIPOS), 'RF-01 los 6 modelos: ' + registro.tipos);
        const firmas = new Set();
        for (const tipo of PruebaCarrosPersonalidad.#TIPOS) {
            const carro = registro.crear(tipo, 1, 2, 0.5);
            this.#ok(carro instanceof this.#Carro && carro.constructor !== this.#Carro, 'RF-01 ' + tipo + ' tiene su propia clase');
            this.#ok(carro.px === 1 && carro.pz === 2 && carro.rotY === 0.5, 'RF-01 ' + tipo + ' respeta la posición');
            const c = carro.constantes;
            firmas.add([c.velMaxAdelante, c.aceleracion, c.masa, c.agarre, c.direccion].join('|'));
        }
        this.#ok(firmas.size === 6, 'RF-01 las 6 físicas son distintas');

        globalThis.__modelErrors = [];
        const errorConsola = console.error; console.error = () => {};
        const raro = registro.crear('tanque', 0, 0, 0);
        console.error = errorConsola;
        this.#ok(raro.constructor === this.#Carro, 'RF-03 modelo sin física usa el carro básico');
        this.#ok(globalThis.__modelErrors.some(e => e.includes('tanque')), 'RF-03 registra el error');
        globalThis.__modelErrors = [];
        registro.crear(null, 0, 0, 0);
        this.#ok(globalThis.__modelErrors.length === 0, 'RF-03 sin modelo todavía (null) no es error');
    }

    // Pasos hasta el 90 % del tope y pasos de frenado hasta 0
    #medirMasa(masa) {
        const carro = new this.#Carro(0, 0, 0, new this.#ConstantesFisica({ masa }));
        carro.entradaAcel = 1;
        let subir = 0;
        while (carro.velocidad < carro.velMaxAdelante * 0.9 && subir < 5000) { carro.actualizar(PruebaCarrosPersonalidad.#PASO); subir++; }
        carro.entradaAcel = -1;
        let frenar = 0;
        while (carro.velocidad > 0 && frenar < 5000) { carro.actualizar(PruebaCarrosPersonalidad.#PASO); frenar++; }
        return { subir, frenar };
    }

    #probarMasa() {
        const liviano = this.#medirMasa(0.8), pesado = this.#medirMasa(1.4);
        this.#ok(pesado.subir > liviano.subir, `RF-04 el pesado tarda más en llegar al tope (${pesado.subir} > ${liviano.subir})`);
        this.#ok(pesado.frenar > liviano.frenar, `RF-04 el pesado tarda más en frenar (${pesado.frenar} > ${liviano.frenar})`);
    }

    #derrape(agarre) {
        const carro = new this.#Carro(0, 0, 0, new this.#ConstantesFisica({ agarre }));
        carro.entradaAcel = 1;
        for (let i = 0; i < 300; i++) carro.actualizar(PruebaCarrosPersonalidad.#PASO);
        carro.entradaDireccion = 1;
        let maximo = 0;
        for (let i = 0; i < 40; i++) { carro.actualizar(PruebaCarrosPersonalidad.#PASO); maximo = Math.max(maximo, Math.abs(carro.driftAngle)); }
        return maximo;
    }

    #probarAgarre() {
        const poco = this.#derrape(0.8), mucho = this.#derrape(1.3);
        this.#ok(poco > mucho, `RF-05 menos agarre derrapa más (${poco.toFixed(3)} > ${mucho.toFixed(3)})`);
    }

    #rutaCiudad() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['../registro_pistas.js', 'config_pista.js', 'config_pista_ciudad.js']) {
            const archivo = path.join(PruebaCarrosPersonalidad.#RAIZ, 'src/model/pistas', f);
            vm.runInContext(fs.readFileSync(archivo, 'utf8'), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);   // la vuelta entera, para Ruta (PRD 014)
        const ruta = new this.#Ruta();
        const ciudad = ctx.registroPistas.obtener('ciudad');
        ruta.construir(ciudad.tramos, ciudad.totalSegs);
        return ruta;
    }

    #probarVueltas() {
        const ruta = this.#rutaCiudad(), i = ruta.inicio, registro = new this.#RegistroCarros();
        const tiempos = {};
        for (const tipo of PruebaCarrosPersonalidad.#TIPOS) {
            const carro = registro.crear(tipo, i.x, i.z, i.angle);
            const piloto = new PilotoAutomatico(ruta);
            const vueltas = [piloto.darVuelta(carro), piloto.darVuelta(carro), piloto.darVuelta(carro)];
            this.#ok(vueltas.every(v => v !== null), `RF-07 ${tipo} completa las 3 vueltas (${vueltas})`);
            tiempos[tipo] = vueltas[0];
        }
        const valores = Object.values(tiempos).filter(Boolean);
        const razon = Math.max(...valores) / Math.min(...valores);
        this.#ok(razon < 1.15, `RF-06 el más lento tarda menos de 15 % más (${razon.toFixed(3)}) ${JSON.stringify(tiempos)}`);
    }

    #probarEncapsulamiento() {
        const base = Object.keys(new this.#Carro()).sort().join(',');
        const registro = new this.#RegistroCarros();
        for (const tipo of PruebaCarrosPersonalidad.#TIPOS) {
            const campos = Object.keys(registro.crear(tipo)).sort().join(',');
            this.#ok(campos === base, `RNF-01 ${tipo} no agrega campos públicos (${campos})`);
        }
        const carpeta = path.join(PruebaCarrosPersonalidad.#RAIZ, 'src/model/carros');
        for (const archivo of fs.readdirSync(carpeta).filter(f => /^carro_\w+\.js$/.test(f))) {
            const texto = fs.readFileSync(path.join(carpeta, archivo), 'utf8');
            this.#ok(!/turbo/i.test(texto), `RNF-01 ${archivo} no tiene diferencias de turbo (D7)`);
            this.#ok(!/this\.\w+\s*=/.test(texto), `RNF-01 ${archivo} no escribe campos públicos`);
        }
    }
}

new PruebaCarrosPersonalidad().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
