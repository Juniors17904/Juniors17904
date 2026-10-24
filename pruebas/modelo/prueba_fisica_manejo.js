// ================================================================
// CLASE: PruebaFisicaManejo — PRD 006 (docs/prds/prd_006_fisica_de_manejo.md)
// Física del Carro en el modelo con reloj controlado (RNF-03, lección 9):
//   RF-01 giro según velocidad · RF-02 detenido no gira · RF-03 aire
//   RF-04 aceleración decreciente · RF-05/06 ±10 % frente a la física v1
//   RF-07 freno y reversa · RF-08 derrape e inclinación
//   RF-09 mismo lugar a 30, 60 y 120 Hz (ConductorPasoFijo)
//   RNF-02 sin MovimientoLibre
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { PilotoAutomatico }  = require('./piloto_automatico.cjs');
const { CarroReferenciaV1 } = require('./carro_referencia_v1.cjs');

class PruebaFisicaManejo {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    #fallos = [];
    #Carro; #Ruta; #ConductorPasoFijo;

    async ejecutar() {
        const src = p => path.join(PruebaFisicaManejo.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ Ruta:  this.#Ruta }  = await import(src('model/ruta.js')));
        ({ ConductorPasoFijo: this.#ConductorPasoFijo } = await import(src('view/pistas/comun/conductor_paso_fijo.js')));

        this.#probarGiro();
        this.#probarAire();
        this.#probarAceleracion();
        this.#probarFrenoYReversa();
        this.#probarDerrape();
        this.#probarComparacionV1();
        this.#probarFrecuencias();
        this.#probarSinMovimientoLibre();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    #pasos(carro, n) { for (let i = 0; i < n; i++) carro.actualizar(PruebaFisicaManejo.#PASO); }

    // Lleva el carro a una velocidad y mide el radio de giro con el timón al máximo
    #radioGiro(velocidad) {
        const carro = new this.#Carro(0, 0, 0);
        carro.entradaAcel = 1;
        while (carro.velocidad < velocidad) carro.actualizar(PruebaFisicaManejo.#PASO);
        carro.entradaAcel = 0;
        const v = carro.velocidad, r0 = carro.rotY;
        carro.entradaDireccion = 1;
        carro.actualizar(PruebaFisicaManejo.#PASO);
        const omega = Math.abs(carro.rotY - r0);
        return v / omega;
    }

    #probarGiro() {
        const lento = this.#radioGiro(0.1), rapido = this.#radioGiro(0.7);
        this.#ok(lento < rapido, `RF-01 radio lento ${lento.toFixed(1)} < rápido ${rapido.toFixed(1)}`);
        const quieto = new this.#Carro(0, 0, 0);
        quieto.entradaDireccion = 1;
        this.#pasos(quieto, 60);
        this.#ok(quieto.rotY === 0, 'RF-02 detenido no gira ' + quieto.rotY);
    }

    // Pérdida de velocidad en un paso sin pedal, desde una velocidad dada
    #perdidaSinPedal(velocidad) {
        const carro = new this.#Carro(0, 0, 0);
        carro.entradaAcel = 1;
        while (carro.velocidad < velocidad) carro.actualizar(PruebaFisicaManejo.#PASO);
        carro.entradaAcel = 0;
        const antes = carro.velocidad;
        carro.actualizar(PruebaFisicaManejo.#PASO);
        return antes - carro.velocidad;
    }

    #probarAire() {
        const rapido = this.#perdidaSinPedal(0.7), lento = this.#perdidaSinPedal(0.15);
        this.#ok(rapido > lento, `RF-03 frena más rápido (${rapido.toFixed(4)}) que lento (${lento.toFixed(4)})`);
        const carro = new this.#Carro(0, 0, 0);
        carro.entradaAcel = 1; this.#pasos(carro, 300);
        carro.entradaAcel = 0; this.#pasos(carro, 1200);
        this.#ok(carro.velocidad === 0, 'RF-03 termina detenido ' + carro.velocidad);
    }

    #probarAceleracion() {
        const carro = new this.#Carro(0, 0, 0);
        carro.entradaAcel = 1;
        carro.actualizar(PruebaFisicaManejo.#PASO);
        const alPrincipio = carro.velocidad;
        while (carro.velocidad < 0.65) carro.actualizar(PruebaFisicaManejo.#PASO);
        const v0 = carro.velocidad;
        carro.actualizar(PruebaFisicaManejo.#PASO);
        const cercaTope = carro.velocidad - v0;
        this.#ok(alPrincipio > cercaTope, `RF-04 gana más al principio (${alPrincipio.toFixed(4)}) que cerca del tope (${cercaTope.toFixed(4)})`);
    }

    #probarFrenoYReversa() {
        const carro = new this.#Carro(0, 0, 0);
        carro.entradaAcel = 1; this.#pasos(carro, 120);
        carro.entradaAcel = -1; this.#pasos(carro, 60);
        this.#ok(carro.velocidad <= 0, 'RF-07 el freno detiene el carro ' + carro.velocidad);
        this.#pasos(carro, 600);
        this.#ok(carro.velocidad < 0 && carro.velocidad >= -carro.constantes.velMaxReversa,
            'RF-07 reversa con tope menor ' + carro.velocidad);
        this.#ok(carro.constantes.velMaxReversa < carro.constantes.velMaxAdelante, 'RF-07 tope de reversa menor');
    }

    #probarDerrape() {
        const carro = new this.#Carro(0, 0, 0);
        carro.entradaAcel = 1; this.#pasos(carro, 300);
        carro.entradaDireccion = 1; this.#pasos(carro, 20);
        this.#ok(Math.abs(carro.driftAngle) > 0.02, 'RF-08 derrapa en curva rápida ' + carro.driftAngle);
        this.#ok(carro.carLean < 0, 'RF-08 se inclina hacia afuera ' + carro.carLean);
    }

    #rutaCiudad() {
        const ctx = { console, Math }; ctx.window = ctx; ctx.PISTAS = {};
        vm.createContext(ctx);
        for (const f of ['config_pista.js', 'config_pista_ciudad.js']) {
            const archivo = path.join(PruebaFisicaManejo.#RAIZ, 'src/model/pistas', f);
            vm.runInContext(fs.readFileSync(archivo, 'utf8'), ctx, { filename: f });
        }
        const ruta = new this.#Ruta();
        ruta.construir(ctx.PISTAS.ciudad.tramos, ctx.PISTAS.ciudad.totalSegs);
        return ruta;
    }

    #probarComparacionV1() {
        const v1 = new CarroReferenciaV1(0, 0, 0), v2 = new this.#Carro(0, 0, 0);
        v1.entradaAcel = v2.entradaAcel = 1;
        for (let i = 0; i < 1200; i++) { v1.actualizar(); v2.actualizar(PruebaFisicaManejo.#PASO); }
        const razonTope = v2.velocidad / v1.velocidad;
        this.#ok(razonTope >= 0.9 && razonTope <= 1.1, 'RF-05 tope dentro de ±10 %: ' + razonTope.toFixed(3));

        const ruta = this.#rutaCiudad(), i = ruta.inicio;
        const t1 = new PilotoAutomatico(ruta).darVuelta(new CarroReferenciaV1(i.x, i.z, i.angle));
        const t2 = new PilotoAutomatico(ruta).darVuelta(new this.#Carro(i.x, i.z, i.angle));
        this.#ok(t1 && t2, `RF-06 ambos completan la vuelta (${t1}, ${t2})`);
        const razon = t2 / t1;
        this.#ok(razon >= 0.9 && razon <= 1.1, `RF-06 vuelta en Ciudad dentro de ±10 %: ${t2} vs ${t1} pasos (${razon.toFixed(3)})`);
    }

    // Maneja 3 s con el mismo recorrido a una frecuencia de pantalla dada
    #recorrido(hz) {
        const conductor = new this.#ConductorPasoFijo();
        conductor.carro = new this.#Carro(0, 0, 0);
        const cuadro = 1000 / hz;
        for (let t = 0; t <= 3000 + 1e-6; t += cuadro) {
            conductor.avanzar(t, 1, t > 1000 ? 0.6 : 0);
        }
        return conductor.carro;
    }

    #probarFrecuencias() {
        const a = this.#recorrido(30), b = this.#recorrido(60), c = this.#recorrido(120);
        const maxDif = Math.max(Math.hypot(a.px - b.px, a.pz - b.pz), Math.hypot(c.px - b.px, c.pz - b.pz));
        this.#ok(maxDif < 1.5, 'RF-09 mismo lugar a 30/60/120 Hz, diferencia ' + maxDif.toFixed(3));
    }

    #probarSinMovimientoLibre() {
        const raiz = PruebaFisicaManejo.#RAIZ;
        this.#ok(!fs.existsSync(path.join(raiz, 'src/model/movimiento_libre.js')), 'RNF-02 sin movimiento_libre.js');
        const textos = ['CLAUDE.md', 'src/model/model_fisica.js', 'src/model/carros/carro.js'];
        for (const t of textos) {
            const contenido = fs.readFileSync(path.join(raiz, t), 'utf8');
            this.#ok(!/\bMovimientoLibre\b/.test(contenido), 'RNF-02 ' + t + ' todavía nombra la clase MovimientoLibre');
        }
        const visor = fs.readFileSync(path.join(raiz, 'src/view/pistas/visor_testdrive_ruta.js'), 'utf8');
        this.#ok(!/toggleMovimientoLibre/.test(visor) && /alternarMovimientoLibre/.test(visor), 'RNF-02 método del modo movimiento libre en español');
    }
}

new PruebaFisicaManejo().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
