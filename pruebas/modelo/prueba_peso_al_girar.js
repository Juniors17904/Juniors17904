// ================================================================
// CLASE: PruebaPesoAlGirar — PRD 019 (docs/prds/prd_019_peso_al_girar.md)
// Transferencia de peso en el modelo, con reloj controlado (pasos de 60 Hz):
//   RF-01 sin pedal gira 10-15 % más cerrado · RF-02 entra en ~0,3 s sin saltos
//   RF-03 acelerando ~5 % menos · RF-04 frenando 20-25 % más cerrado
//   RF-05 sin trompos al frenar y girar · RF-06 masa y agarre
//   RF-07 vueltas en Ciudad y balance del PRD 007 · RNF-02 igual a 30/60/120 Hz
//   La base es el mismo Carro con una TransferenciaPeso de intensidad 0.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');
const { PilotoAutomatico } = require('./piloto_automatico.cjs');

class PruebaPesoAlGirar {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    static #TIPOS = ['deportivo', 'suv', 'muscle', 'formula', 'pickup', 'clasico'];
    #fallos = [];
    #Carro; #ConstantesFisica; #RegistroCarros; #TransferenciaPeso; #Ruta; #ConductorPasoFijo;

    async ejecutar() {
        const src = p => path.join(PruebaPesoAlGirar.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ ConstantesFisica: this.#ConstantesFisica } = await import(src('model/carros/constantes_fisica.js')));
        ({ RegistroCarros: this.#RegistroCarros } = await import(src('model/carros/registro_carros.js')));
        ({ TransferenciaPeso: this.#TransferenciaPeso } = await import(src('model/carros/transferencia_peso.js')));
        ({ Ruta: this.#Ruta } = await import(src('model/ruta.js')));
        ({ ConductorPasoFijo: this.#ConductorPasoFijo } = await import(src('view/pistas/comun/conductor_paso_fijo.js')));

        this.#probarSoltar();
        this.#probarEntradaSuave();
        this.#probarAcelerar();
        this.#probarFrenar();
        this.#probarSinTrompos();
        this.#probarMasaYAgarre();
        this.#probarVueltas();
        this.#probarFrecuencias();
        this.#probarReglas();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    // El mismo carro con la transferencia de peso (o la base, sin ella)
    #par(constantes) {
        const T = this.#TransferenciaPeso;
        return [new this.#Carro(0, 0, 0, constantes, new T(constantes, 1)),
                new this.#Carro(0, 0, 0, constantes, new T(constantes, 0))];
    }

    #constantesDe(tipo) { return new this.#RegistroCarros().crear(tipo).constantes; }

    // Mueve los dos carros con el mismo plan: [pasos, acel, dirección]
    #manejar(carros, plan) {
        for (const [pasos, acel, dir] of plan) {
            for (let i = 0; i < pasos; i++) {
                for (const c of carros) { c.entradaAcel = acel; c.entradaDireccion = dir; c.actualizar(PruebaPesoAlGirar.#PASO); }
            }
        }
    }

    // Tras el plan, un paso con el volante a fondo: cuánto más cerrado gira
    // que la base a la misma velocidad (curvatura / curvatura base - 1)
    #cierre(constantes, plan, acelFinal) {
        const [carro, base] = this.#par(constantes);
        this.#manejar([carro, base], plan);
        const r0 = carro.rotY, b0 = base.rotY, v = carro.velocidad;
        this.#manejar([carro, base], [[1, acelFinal, 1]]);
        const igual = Math.abs(carro.velocidad - base.velocidad) < 1e-12 && v > 0.05;
        return { cierre: Math.abs(carro.rotY - r0) / Math.abs(base.rotY - b0) - 1, igual, v };
    }

    // RF-01: sin pedal, cuando el efecto ya entró (1 s)
    #probarSoltar() {
        for (const tipo of PruebaPesoAlGirar.#TIPOS) {
            const { cierre, igual } = this.#cierre(this.#constantesDe(tipo), [[150, 1, 0], [60, 0, 0]], 0);
            this.#ok(igual, `PRD 019 RF-01 ${tipo}: misma velocidad que la base`);
            this.#ok(cierre >= 0.10 && cierre <= 0.15, `PRD 019 RF-01 ${tipo} sin pedal gira 10-15 % más cerrado (${(cierre * 100).toFixed(1)} %)`);
        }
    }

    // RF-02: el efecto de soltar entra en ~0,3 s, sale de a poco y sin saltos
    #probarEntradaSuave() {
        const [carro] = this.#par(this.#constantesDe('deportivo'));
        this.#manejar([carro], [[150, 1, 0]]);
        const inicio = carro.factorPeso, serie = [inicio];
        for (let i = 0; i < 90; i++) { this.#manejar([carro], [[1, 0, 0]]); serie.push(carro.factorPeso); }
        const total = serie[90] - inicio;
        const avance = n => (serie[n] - inicio) / total;
        this.#ok(total > 0.1, 'PRD 019 RF-02 soltar cierra el giro ' + total.toFixed(3));
        this.#ok(avance(6) < 0.8, `PRD 019 RF-02 a 0,1 s todavía no entró del todo (${avance(6).toFixed(2)})`);
        this.#ok(avance(18) >= 0.9, `PRD 019 RF-02 a 0,3 s ya entró (${avance(18).toFixed(2)})`);
        const saltoEntrada = Math.max(...serie.slice(1).map((f, i) => Math.abs(f - serie[i])));
        this.#ok(saltoEntrada < total * 0.25, `PRD 019 RF-02 sin saltos al entrar (${saltoEntrada.toFixed(4)})`);

        const vuelta = [carro.factorPeso];
        for (let i = 0; i < 60; i++) { this.#manejar([carro], [[1, 1, 0]]); vuelta.push(carro.factorPeso); }
        const bajaSiempre = vuelta.slice(1).every((f, i) => f <= vuelta[i] + 1e-12);
        const saltoSalida = Math.max(...vuelta.slice(1).map((f, i) => Math.abs(f - vuelta[i])));
        this.#ok(bajaSiempre && vuelta[60] < 1, 'PRD 019 RF-02 al volver a acelerar se va de a poco ' + vuelta[60].toFixed(3));
        this.#ok(saltoSalida < total * 0.25, `PRD 019 RF-02 sin saltos al salir (${saltoSalida.toFixed(4)})`);
        this.#ok(vuelta[3] > 1, 'PRD 019 RF-02 no se va de golpe ' + vuelta[3].toFixed(3));
    }

    // RF-03: con el acelerador a fondo gira ~5 % menos
    #probarAcelerar() {
        for (const tipo of PruebaPesoAlGirar.#TIPOS) {
            const { cierre, igual } = this.#cierre(this.#constantesDe(tipo), [[120, 1, 0]], 1);
            this.#ok(igual, `PRD 019 RF-03 ${tipo}: misma velocidad que la base`);
            this.#ok(cierre <= -0.03 && cierre >= -0.07, `PRD 019 RF-03 ${tipo} acelerando gira ~5 % menos (${(cierre * 100).toFixed(1)} %)`);
        }
    }

    // RF-04: frenando, medido a 0,15 s de una frenada corta
    #probarFrenar() {
        for (const tipo of PruebaPesoAlGirar.#TIPOS) {
            const { cierre, igual, v } = this.#cierre(this.#constantesDe(tipo), [[150, 1, 0], [9, -1, 0]], -1);
            this.#ok(igual, `PRD 019 RF-04 ${tipo}: sigue frenando a la misma velocidad que la base (${v.toFixed(3)})`);
            this.#ok(cierre >= 0.20 && cierre <= 0.25, `PRD 019 RF-04 ${tipo} frenando gira 20-25 % más cerrado (${(cierre * 100).toFixed(1)} %)`);
        }
        // En reversa no hay transferencia
        const [carro] = this.#par(this.#constantesDe('deportivo'));
        this.#manejar([carro], [[300, -1, 0]]);
        this.#ok(carro.velocidad < 0 && Math.abs(carro.factorPeso - 1) < 1e-6, 'PRD 019 RF-04 en reversa no hay transferencia ' + carro.factorPeso);
    }

    // Derrape máximo frenando con el volante a fondo desde alta velocidad
    #derrapeFrenando(carro) {
        this.#manejar([carro], [[300, 1, 0]]);
        let maximo = 0, pasos = 0;
        while (carro.velocidad > 0.05 && pasos++ < 120) {
            this.#manejar([carro], [[1, -1, 1]]);
            maximo = Math.max(maximo, Math.abs(carro.driftAngle));
        }
        return maximo;
    }

    // RF-05: frenando y girando a fondo ningún carro da un trompo
    #probarSinTrompos() {
        for (const tipo of PruebaPesoAlGirar.#TIPOS) {
            const [carro] = this.#par(this.#constantesDe(tipo));
            const maximo = this.#derrapeFrenando(carro);
            this.#ok(maximo < 0.5, `PRD 019 RF-05 ${tipo} sin trompo, derrape máximo ${maximo.toFixed(3)} rad`);
            this.#ok(carro.velocidad >= 0, `PRD 019 RF-05 ${tipo} sigue yendo hacia adelante`);
            this.#manejar([carro], [[60, 1, 0]]);
            this.#ok(Math.abs(carro.driftAngle) < 0.05, `PRD 019 RF-05 ${tipo} se endereza (${carro.driftAngle.toFixed(3)})`);
        }
    }

    // RF-06: el pesado nota menos; el de menos agarre derrapa más al frenar
    #probarMasaYAgarre() {
        const C = this.#ConstantesFisica;
        const liviano = new C({ masa: 0.8 }), pesado = new C({ masa: 1.4 });
        for (const [nombre, plan, acel] of [['sin pedal', [[150, 1, 0], [60, 0, 0]], 0], ['frenando', [[150, 1, 0], [9, -1, 0]], -1]]) {
            const l = this.#cierre(liviano, plan, acel).cierre, p = this.#cierre(pesado, plan, acel).cierre;
            this.#ok(p < l, `PRD 019 RF-06 ${nombre}: el pesado nota menos (${(p * 100).toFixed(1)} % < ${(l * 100).toFixed(1)} %)`);
        }
        const poco = new C({ agarre: 0.8 }), mucho = new C({ agarre: 1.3 });
        const T = this.#TransferenciaPeso;
        const derrape = (c, intensidad) => this.#derrapeFrenando(new this.#Carro(0, 0, 0, c, new T(c, intensidad)));
        const extraPoco = derrape(poco, 1) / derrape(poco, 0), extraMucho = derrape(mucho, 1) / derrape(mucho, 0);
        this.#ok(derrape(poco, 1) > derrape(mucho, 1), 'PRD 019 RF-06 el de menos agarre derrapa más al frenar en curva');
        this.#ok(extraPoco > 1 && extraPoco > extraMucho,
            `PRD 019 RF-06 frenar suma más derrape al de menos agarre (${extraPoco.toFixed(3)} > ${extraMucho.toFixed(3)})`);
    }

    #rutaCiudad() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['../registro_pistas.js', 'config_pista.js', 'config_pista_ciudad.js']) {
            const archivo = path.join(PruebaPesoAlGirar.#RAIZ, 'src/model/pistas', f);
            vm.runInContext(fs.readFileSync(archivo, 'utf8'), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);
        const ruta = new this.#Ruta();
        const ciudad = ctx.registroPistas.obtener('ciudad');
        ruta.construir(ciudad.tramos, ciudad.totalSegs);
        return ruta;
    }

    // Promedio de 3 vueltas con el piloto automático (null si se traba)
    #promedio(ruta, carro) {
        const piloto = new PilotoAutomatico(ruta);
        const vueltas = [piloto.darVuelta(carro), piloto.darVuelta(carro), piloto.darVuelta(carro)];
        return vueltas.every(v => v !== null) ? vueltas.reduce((a, b) => a + b, 0) / 3 : null;
    }

    // RF-07: cada carro cambia menos de 5 % y el balance del PRD 007 sigue
    #probarVueltas() {
        const ruta = this.#rutaCiudad(), i = ruta.inicio, registro = new this.#RegistroCarros();
        const tiempos = {};
        for (const tipo of PruebaPesoAlGirar.#TIPOS) {
            const carro = registro.crear(tipo, i.x, i.z, i.angle), c = carro.constantes;
            const base = new this.#Carro(i.x, i.z, i.angle, c, new this.#TransferenciaPeso(c, 0));
            const t = this.#promedio(ruta, carro), tb = this.#promedio(ruta, base);
            this.#ok(t !== null && tb !== null, `PRD 019 RF-07 ${tipo} completa las 3 vueltas (${t}, ${tb})`);
            if (t === null || tb === null) continue;
            const cambio = t / tb - 1;
            this.#ok(Math.abs(cambio) < 0.05, `PRD 019 RF-07 ${tipo} cambia menos de 5 % (${(cambio * 100).toFixed(2)} %)`);
            tiempos[tipo] = t;
        }
        const valores = Object.values(tiempos);
        const razon = Math.max(...valores) / Math.min(...valores);
        this.#ok(valores.length === 6 && razon < 1.15, `PRD 019 RF-07 balance del PRD 007 < 15 % (${razon.toFixed(3)})`);
    }

    // Maneja 3 s a una frecuencia de pantalla: acelera, suelta girando y frena
    #recorrido(hz) {
        const conductor = new this.#ConductorPasoFijo();
        conductor.carro = new this.#Carro(0, 0, 0);
        const cuadro = 1000 / hz, factores = [];
        for (let t = 0; t <= 3000 + 1e-6; t += cuadro) {
            const acel = t < 1500 ? 1 : t < 2500 ? 0 : -1;
            conductor.avanzar(t, acel, t > 1500 ? 0.8 : 0);
            if (Math.abs(t - 2000) < cuadro / 2) factores.push(conductor.carro.factorPeso);
        }
        return { carro: conductor.carro, factor: factores[0] };
    }

    // RNF-02: mismo resultado a 30, 60 y 120 Hz
    #probarFrecuencias() {
        const a = this.#recorrido(30), b = this.#recorrido(60), c = this.#recorrido(120);
        const dif = Math.max(Math.abs(a.factor - b.factor), Math.abs(c.factor - b.factor));
        this.#ok(dif < 0.01, 'PRD 019 RNF-02 mismo factor a 30/60/120 Hz, diferencia ' + dif.toFixed(4));
        const lugar = Math.max(Math.hypot(a.carro.px - b.carro.px, a.carro.pz - b.carro.pz),
                               Math.hypot(c.carro.px - b.carro.px, c.carro.pz - b.carro.pz));
        this.#ok(lugar < 1.5, 'PRD 019 RNF-02 mismo lugar a 30/60/120 Hz, diferencia ' + lugar.toFixed(3));

        // La transferencia sola: el mismo tiempo con pasos de distinto tamaño
        const T = this.#TransferenciaPeso, factores = [];
        for (const k of [2, 1, 0.5]) {
            const t = new T(new this.#ConstantesFisica());
            for (let n = 0; n < 30 / k; n++) t.actualizar(1, 0.5, k);
            for (let n = 0; n < 12 / k; n++) t.actualizar(0, 0.5, k);
            factores.push(t.factorGiro);
        }
        const difK = Math.max(...factores) - Math.min(...factores);
        this.#ok(difK < 1e-9, 'PRD 019 RNF-02 la transferencia no depende del tamaño del paso ' + difK);
    }

    // RNF-01 y riesgos: clase propia, números solo ahí, PilotoPC lee el factor
    #probarReglas() {
        const leer = r => fs.readFileSync(path.join(PruebaPesoAlGirar.#RAIZ, r), 'utf8');
        const clase = leer('src/model/carros/transferencia_peso.js');
        this.#ok(/export class TransferenciaPeso\b/.test(clase) && (clase.match(/\bclass\s/g) || []).length === 1,
            'PRD 019 RNF-01 TransferenciaPeso en su propio archivo');
        this.#ok(!/this\.\w+\s*=/.test(clase), 'PRD 019 RNF-01 TransferenciaPeso sin campos públicos');
        this.#ok(clase.split('\n').length <= 400, 'PRD 019 RNF-01 menos de 400 líneas');
        const carro = leer('src/model/carros/carro.js');
        this.#ok(/new TransferenciaPeso\(/.test(carro) && /get factorPeso\(\)/.test(carro), 'PRD 019 D6 Carro usa TransferenciaPeso y expone factorPeso');
        this.#ok(!/factorPeso\s*\(\s*[^)]/.test(carro) && !/set factorPeso/.test(carro), 'PRD 019 D6 factorPeso es de solo lectura');
        const piloto = leer('src/model/pilotos/piloto_pc.js');
        this.#ok(/carro\.factorPeso/.test(piloto), 'PRD 019 Riesgos PilotoPC lee el factor del peso desde el carro');
        this.#ok(!/TransferenciaPeso/.test(piloto), 'PRD 019 D6 PilotoPC no repite la transferencia');
    }
}

new PruebaPesoAlGirar().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
