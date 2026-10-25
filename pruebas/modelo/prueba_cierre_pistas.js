// ================================================================
// CLASE: PruebaCierrePistas — PRD 014 (docs/prds/prd_014_cierre_pistas_abiertas.md)
// En el modelo:
//   RF-01 el camino de vuelta no tiene giros de golpe: curvas de 40 m o más, uniones incluidas
//   RF-02 el trazado propio de la pista y el lugar de sus decoraciones no cambian
//   RF-03 Ciudad queda igual (no tiene camino de vuelta)
//   RF-04 el camino de vuelta no cruza la pista ni pasa a menos de 20 m (salvo 50 m en las uniones)
//   RF-05 el camino de vuelta tiene flechas, del lado de afuera, con distancia y paso de MedidasEscena, sólidas
//   RF-06 CarreraVueltas cuenta la vuelta entera: la meta llega recién después del camino de vuelta
//   RF-09 notas de D11, CLAUDE.md y backlog B19
//   D9    Ruta: posicionEn mide en la pista, posicionVuelta en la vuelta entera, fraccionPista las une
//   PRD 013 los 4 rivales terminan la carrera en Costa pasando por el camino de vuelta
//   RNF-01 las medidas del cierre viven en MedidasEscena y el giro de los tramos en un solo lugar
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');

class PruebaCierrePistas {
    static #RAIZ    = path.join(__dirname, '..', '..');
    static #ABIERTAS = ['costa', 'desierto', 'montana', 'volcan'];
    #fallos = [];
    #ctx;
    #m;
    #THREE; #Ruta; #DetectorChoques; #Carro; #CarreraConRivales; #GrillaSalida;

    async ejecutar() {
        const src = p => path.join(PruebaCierrePistas.#RAIZ, 'src', p);
        this.#THREE = await import('three');
        ({ Ruta: this.#Ruta } = await import(src('model/ruta.js')));
        ({ DetectorChoques: this.#DetectorChoques } = await import(src('model/choques/detector_choques.js')));
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ CarreraConRivales: this.#CarreraConRivales } = await import(src('model/carrera_con_rivales.js')));
        ({ GrillaSalida: this.#GrillaSalida } = await import(src('model/grilla_salida.js')));
        this.#cargarClasicos();
        this.#m = new this.#ctx.MedidasEscena();

        this.#probarMedidas();
        for (const nombre of PruebaCierrePistas.#ABIERTAS) this.#probarPistaAbierta(nombre);
        this.#probarCiudad();
        this.#probarVueltaCompleta();
        this.#probarRutaVuelta();
        this.#probarRivales();
        this.#probarDocumentos();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaCierrePistas.#RAIZ, relativo), 'utf8'); }

    #cargarClasicos() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        const pistas = ['ciudad', ...PruebaCierrePistas.#ABIERTAS].map(n => `pistas/config_pista_${n}.js`);
        const carrera = ['muestra_ruta.js', 'superficies/superficie.js', 'superficies/superficie_asfalto.js', 'superficies/superficie_piano.js',
            'superficies/superficie_pasto.js', 'superficies/detector_superficie.js', 'carrera_vueltas.js', 'cronometro.js'];
        for (const f of ['registro_pistas.js', 'pistas/config_pista.js', ...pistas, 'medida_carro.js', 'medidas_escena.js', ...carrera]) {
            vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);
        this.#ok(!(ctx.__modelErrors?.length), 'las clases del cierre cargan sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
        for (const c of ['MedidasEscena', 'CarreraVueltas', 'Cronometro', 'MuestraRuta']) globalThis[c] = ctx[c];
    }

    #pista(nombre) { return this.#ctx.registroPistas.obtener(nombre); }

    #rutaDe(pista) {
        const ruta = new this.#Ruta();
        ruta.construir(pista.tramos, pista.totalSegs);
        return ruta;
    }

    // El trazado propio de la pista, armado como antes del PRD 014 (para comparar)
    #trazadoViejo(pista) {
        const puntos = [];
        let x = 0, z = 0, angulo = 0;
        for (let i = 0; i < pista.totalSegs; i++) {
            const tramo = pista.tramos.find(([d, h]) => i >= d && i < h);
            angulo += (tramo ? tramo[2] : 0) * 0.045;
            x += Math.sin(angulo) * 4;
            z += Math.cos(angulo) * 4;
            puntos.push([x, z]);
        }
        return puntos;
    }

    #probarMedidas() {
        const m = this.#m;
        this.#ok(m.radioMinimoCierre === 40 && m.distanciaPistaAbierta === 50 && m.distanciaMinimaCierre === 20 && m.distanciaUnionCierre === 50,
            'RNF-01 radio mínimo 40 m, pista abierta a más de 50 m, distancia mínima 20 m y uniones de 50 m en MedidasEscena');
        // El giro por unidad de curva (0.045) vive solo en TrazadoVuelta: los mapas ya no lo repiten
        const repetidos = ['src/model/ruta.js', 'src/view/minimapas/minimapa_base.js', 'src/view/minimapas/minimapa_circuito_3d.js',
            'src/view/minimapas/mapa_detalle_pista.js'].filter(f => /0\.045/.test(this.#leer(f)));
        this.#ok(repetidos.length === 0, 'RNF-01 nadie más arma el trazado con sus tramos: ' + repetidos);
    }

    #probarPistaAbierta(nombre) {
        const m = this.#m, pista = this.#pista(nombre);
        const trazado = new this.#ctx.TrazadoVuelta(pista.tramos, pista.totalSegs);
        const puntos = trazado.puntos, N = trazado.puntosPista;
        this.#ok(trazado.abierta && puntos.length > N, `RF-01 ${nombre} es abierta y tiene camino de vuelta (${puntos.length - N} puntos)`);

        // RF-02: los puntos de la pista no cambian
        const viejo = this.#trazadoViejo(pista);
        const corrido = Math.max(...viejo.map((p, i) => Math.hypot(p[0] - puntos[i][0], p[1] - puntos[i][1])));
        this.#ok(N === viejo.length && corrido < 1e-9, `RF-02 ${nombre}: el trazado propio no cambia (${corrido})`);

        // RF-01: sin giros de golpe en el camino de vuelta ni en sus uniones
        const tramo = [puntos[N - 2], ...puntos.slice(N - 1), puntos[0], puntos[1]];
        let radioMinimo = Infinity, pasoMaximo = 0;
        for (let i = 1; i + 1 < tramo.length; i++) {
            const a = tramo[i - 1], b = tramo[i], c = tramo[i + 1];
            let giro = Math.atan2(c[0] - b[0], c[1] - b[1]) - Math.atan2(b[0] - a[0], b[1] - a[1]);
            giro = Math.abs(Math.atan2(Math.sin(giro), Math.cos(giro)));
            const largo = Math.hypot(c[0] - b[0], c[1] - b[1]);
            pasoMaximo = Math.max(pasoMaximo, largo);
            if (giro > 1e-9) radioMinimo = Math.min(radioMinimo, largo / giro);
        }
        this.#ok(radioMinimo >= m.radioMinimoCierre * 0.97 && pasoMaximo < m.largoSegmentoRuta * 1.05,
            `RF-01 ${nombre}: curvas del camino de vuelta de ${radioMinimo.toFixed(1)} m o más (40) y puntos cada ${pasoMaximo.toFixed(2)} m`);

        // RF-04: lejos de la pista, salvo en las uniones
        const saltar = Math.ceil(m.distanciaUnionCierre / m.largoSegmentoRuta);
        let cerca = Infinity;
        for (let k = N + saltar; k < puntos.length - saltar; k++) {
            for (let i = 0; i < N; i++) cerca = Math.min(cerca, Math.hypot(puntos[k][0] - puntos[i][0], puntos[k][1] - puntos[i][1]));
        }
        this.#ok(cerca >= m.distanciaMinimaCierre, `RF-04 ${nombre}: el camino de vuelta pasa a ${cerca.toFixed(1)} m o más de la pista (20)`);

        const ruta = this.#rutaDe(pista);
        // RF-02: cada decoración queda en el mismo lugar que con la ruta de antes
        const T = this.#THREE;
        const curvaVieja = new T.CatmullRomCurve3(viejo.map(([x, z]) => new T.Vector3(x, 0, z)), true);
        const ultimoTramo = (N - 1) / N;
        let peor = 0;
        for (const dec of pista.decoraciones.filter(d => d.prog < ultimoTramo - 1 / N)) {
            const nuevo = ruta.posicionEn(dec.prog), antes = curvaVieja.getPoint(dec.prog);
            peor = Math.max(peor, Math.hypot(nuevo.x - antes.x, nuevo.z - antes.z));
        }
        this.#ok(peor < 0.05, `RF-02 ${nombre}: las decoraciones quedan en su lugar (se corren hasta ${peor.toFixed(3)} m)`);

        // RF-05: flechas en las curvas del camino de vuelta, del lado de afuera
        const flechas = trazado.flechasCierre;
        this.#ok(flechas.length > 0 && flechas.every(f => f.tipo === 'flecha' && f.dist === m.distanciaFlechas && f.prog > 1),
            `RF-05 ${nombre}: ${flechas.length} flechas en el camino de vuelta, a 5,4 m`);
        const afuera = flechas.every(f => {
            const p = ruta.posicionEn(f.prog), q = ruta.posicionEn(f.prog + 2 / N);
            let giro = q.angle - p.angle;
            giro = Math.atan2(Math.sin(giro), Math.cos(giro));
            return Math.abs(giro) < 1e-6 || f.lado === (giro > 0 ? -1 : 1);
        });
        this.#ok(afuera, `RF-05 ${nombre}: las flechas del camino de vuelta van del lado de afuera de la curva`);
        const separacion = flechas.slice(1).map((f, i) => (f.prog - flechas[i].prog) * N * m.largoSegmentoRuta);
        this.#ok(separacion.filter(d => d < m.pasoFlechas * 1.5).every(d => Math.abs(d - m.pasoFlechas) < 0.01),
            `RF-05 ${nombre}: dentro de cada curva las flechas van cada 3 m`);
        const solidas = new this.#DetectorChoques(ruta.decoracionesCon(pista.decoraciones), ruta).objetos.filter(o => o.tipo === 'flecha').length;
        const enDatos = pista.decoraciones.filter(d => d.tipo === 'flecha').length;
        this.#ok(solidas === enDatos + flechas.length, `RF-05 ${nombre}: las flechas del camino de vuelta son sólidas (${solidas} = ${enDatos} + ${flechas.length})`);
    }

    // RF-03: Ciudad es cerrada: sin camino de vuelta, sin flechas nuevas, igual que antes
    #probarCiudad() {
        const ciudad = this.#pista('ciudad');
        const trazado = new this.#ctx.TrazadoVuelta(ciudad.tramos, ciudad.totalSegs);
        const viejo = this.#trazadoViejo(ciudad);
        const corrido = Math.max(...viejo.map((p, i) => Math.hypot(p[0] - trazado.puntos[i][0], p[1] - trazado.puntos[i][1])));
        this.#ok(!trazado.abierta && trazado.puntos.length === viejo.length && corrido < 1e-9 && trazado.flechasCierre.length === 0,
            'RF-03 Ciudad queda igual: cerrada, sin camino de vuelta ni flechas nuevas');
    }

    // RF-06: con las muestras de la vuelta entera (como VisorCarreraSolo.muestrasRuta),
    // un carro que va por el centro marca los 2 puntos de control y la meta, y la
    // meta llega recién después de recorrer el camino de vuelta
    #probarVueltaCompleta() {
        const MUESTRAS = 3000;
        for (const nombre of PruebaCierrePistas.#ABIERTAS) {
            const pista = this.#pista(nombre), ruta = this.#rutaDe(pista), curva = ruta.curve;
            const muestras = [];
            for (let i = 0; i < MUESTRAS; i++) {
                const p = curva.getPointAt(i / MUESTRAS), t = curva.getTangentAt(i / MUESTRAS);
                muestras.push(new this.#ctx.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z)));
            }
            const carrera = new this.#ctx.CarreraVueltas(muestras, 1);
            const finPista = (pista.totalSegs - 1) * this.#m.largoSegmentoRuta / ruta.longitud;   // dónde empieza el camino de vuelta
            const eventos = [];
            let enMeta = null;
            const pasos = Math.ceil(ruta.longitud / 0.5);
            for (let k = 1; k <= pasos + 20; k++) {
                const u = (k / pasos) % 1, p = curva.getPointAt(u);
                const ev = carrera.actualizar(p.x, p.z);
                if (ev !== 'nada') { eventos.push(ev); if (ev === 'meta' && enMeta === null) enMeta = k / pasos; }
            }
            this.#ok(JSON.stringify(eventos) === JSON.stringify(['puntoControl', 'puntoControl', 'meta']) && enMeta > finPista,
                `RF-06 ${nombre}: eventos ${eventos}; la meta llega al ${(100 * enMeta).toFixed(0)} % de la vuelta, después del camino de vuelta (desde el ${(100 * finPista).toFixed(0)} %)`);
            this.#ok(ruta.longitud > pista.totalSegs * this.#m.largoSegmentoRuta,
                `RF-06 ${nombre}: la vuelta (${ruta.longitud.toFixed(0)} m) incluye el camino de vuelta`);
        }
    }

    // D9: posicionEn(prog) es la pista, posicionVuelta(f) la vuelta entera; a 95 % de la
    // vuelta de Costa se está en el camino de vuelta, lejos de la pista
    #probarRutaVuelta() {
        const pista = this.#pista('costa'), ruta = this.#rutaDe(pista);
        const trazado = new this.#ctx.TrazadoVuelta(pista.tramos, pista.totalSegs);
        const N = trazado.puntosPista, M = trazado.puntos.length;
        const enVuelta = ruta.posicionVuelta(0.95);
        const cerca = Math.min(...trazado.puntos.slice(0, N).map(([x, z]) => Math.hypot(x - enVuelta.x, z - enVuelta.z)));
        this.#ok(cerca > this.#m.distanciaMinimaCierre, `D9 a 95 % de la vuelta de Costa se está en el camino de vuelta (${cerca.toFixed(1)} m de la pista)`);
        const igual = ruta.posicionEn(ruta.fraccionPista(0.95));
        this.#ok(Math.hypot(igual.x - enVuelta.x, igual.z - enVuelta.z) < 1e-6 && Math.abs(ruta.fraccionPista(N / M) - 1) < 1e-9,
            'D9 fraccionPista pasa de la vuelta a la pista (el camino de vuelta empieza en 1)');
    }

    // PRD 013 con el cierre: en Costa los 4 rivales terminan la carrera, con las
    // flechas del camino de vuelta sólidas (sin jugador, sin ajuste de ritmo)
    #probarRivales() {
        const pista = this.#pista('costa'), ruta = this.#rutaDe(pista);
        const muestras = Array.from({ length: 1000 }, (_, i) => {
            const p = ruta.curve.getPointAt(i / 1000), t = ruta.curve.getTangentAt(i / 1000);
            return new this.#ctx.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z));
        });
        let ahora = 0;
        const carrera = new this.#CarreraConRivales(ruta, ruta.decoracionesCon(pista.decoraciones), muestras, 7, () => ahora);
        carrera.colocarEnGrilla(new this.#GrillaSalida(this.#m).puntos(ruta.inicio, 5, muestras).slice(0, 4));
        carrera.iniciar();
        for (let paso = 0; paso < 60 * 900 && !carrera.todosTerminaron; paso++) {
            ahora += 1000 / 60;
            carrera.paso(null, null);
        }
        const tiempos = carrera.rivales.map(r => r.terminado ? (r.tiempoTotalMs / 1000).toFixed(0) + ' s' : 'no terminó');
        this.#ok(carrera.todosTerminaron, `PRD 013 en Costa los 4 rivales terminan por el camino de vuelta (${tiempos.join(', ')})`);
    }

    // RF-09: notas de D11, CLAUDE.md y backlog
    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaCierrePistas.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '008', '011', '013']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /PRD 014/.test(this.#leer(`docs/prds/${f}`)), `RF-09 el PRD ${n} tiene la nota del PRD 014`);
        }
        this.#ok(/medidas del cierre de las pistas abiertas[^\n]*PRD 014/.test(this.#leer('CLAUDE.md')), 'RF-09 CLAUDE.md dice que las medidas del cierre viven en MedidasEscena');
        this.#ok(/B19[^\n]*prd_014/.test(this.#leer('docs/BACKLOG.md')), 'RF-09 el backlog enlaza B19 con el PRD 014');
    }
}

new PruebaCierrePistas().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
