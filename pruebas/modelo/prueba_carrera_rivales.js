// ================================================================
// CLASE: PruebaCarreraRivales — PRD 013 (docs/prds/prd_013_rivales_pc.md)
// En el modelo, con reloj controlado y semilla fija (RNF-03):
//   RF-01 la grilla da 5 lugares sin tocarse, en el asfalto y detrás de la meta
//   RF-11 dos carros que se tocan se separan y pierden velocidad
//   D5    TablaPosiciones: terminados por tiempo, luego por avance (detrás de la meta = vuelta 0)
//   D4    AjusteRitmo afloja al adelantado y deja arriesgar al atrasado
//   RF-06 un Rival en el pasto frena igual que el jugador (misma superficie)
//   RF-06 un Rival choca contra un árbol igual que el jugador (mismo DetectorChoques)
//   RF-02/RF-03 con los pilotos reales: nombres distintos y los 4 terminan (semilla 42)
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');
const { PilotoFalso } = require('./piloto_falso.cjs');

class PruebaCarreraRivales {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #PASO = 1000 / 60;
    #fallos = [];
    #ctx;
    #m = {};

    async ejecutar() {
        this.#cargarClasicos();
        await this.#importar();

        this.#probarGrilla();
        this.#probarChoqueEntreCarros();
        this.#probarTabla();
        this.#probarAjusteRitmo();
        this.#probarPasto();
        this.#probarChoqueConArbol();
        this.#probarCarreraCompleta();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }

    #cargarClasicos() {
        const ctx = { console, Math, performance }; ctx.window = ctx;
        vm.createContext(ctx);
        const archivos = ['medida_carro.js', 'medidas_escena.js', 'muestra_ruta.js', 'superficies/superficie.js',
            'superficies/superficie_asfalto.js', 'superficies/superficie_piano.js', 'superficies/superficie_pasto.js',
            'superficies/detector_superficie.js', 'carrera_vueltas.js', 'cronometro.js', 'registro_pistas.js',
            'pistas/config_pista.js', 'pistas/config_pista_ciudad.js', 'pistas/config_pista_costa.js',
            'pistas/config_pista_desierto.js', 'pistas/config_pista_montana.js', 'pistas/config_pista_volcan.js'];
        for (const f of archivos) {
            vm.runInContext(fs.readFileSync(path.join(PruebaCarreraRivales.#RAIZ, 'src/model', f), 'utf8'), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);   // la vuelta entera, para Ruta (PRD 014)
        this.#ctx = ctx;
        // Los módulos leen las clases clásicas de globalThis
        for (const c of ['MedidasEscena', 'CarreraVueltas', 'Cronometro', 'MuestraRuta']) globalThis[c] = ctx[c];
    }

    async #importar() {
        const src = p => path.join(PruebaCarreraRivales.#RAIZ, 'src/model', p);
        const modulos = {
            Ruta: 'ruta.js', RegistroCarros: 'carros/registro_carros.js', DetectorChoques: 'choques/detector_choques.js',
            ChoqueEntreCarros: 'choques/choque_entre_carros.js', GrillaSalida: 'grilla_salida.js',
            TablaPosiciones: 'tabla_posiciones.js', ParticipanteCarrera: 'participante_carrera.js',
            MedidorAvance: 'medidor_avance.js', AjusteRitmo: 'ajuste_ritmo.js', Rival: 'pilotos/rival.js',
            RectanguloCarro: 'choques/rectangulo_carro.js', PuntoSalida: 'punto_salida.js',
        };
        for (const [clase, archivo] of Object.entries(modulos)) this.#m[clase] = (await import(src(archivo)))[clase];
        try {
            this.#m.CarreraConRivales = (await import(src('carrera_con_rivales.js'))).CarreraConRivales;
        } catch (e) {
            console.log('ℹ️  CarreraConRivales todavía no carga (faltan los pilotos): ' + e.message);
        }
    }

    #rutaDe(pista) {
        const ruta = new this.#m.Ruta();
        ruta.construir(pista.tramos, pista.totalSegs);
        return ruta;
    }

    // Igual que VisorCarreraSolo.muestrasRuta: por longitud de arco
    #muestrasDe(ruta, n = 1000) {
        return Array.from({ length: n }, (_, i) => {
            const p = ruta.curve.getPointAt(i / n), t = ruta.curve.getTangentAt(i / n);
            return new this.#ctx.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z));
        });
    }

    // Las 4 esquinas y los puntos medios de los lados del carro en un punto
    #bordes(x, z, angulo, medida) {
        const r = new this.#m.RectanguloCarro(x, z, angulo, medida.largo / 2, medida.ancho / 2);
        const puntos = [];
        for (const a of [-1, 0, 1]) for (const c of [-1, 0, 1]) {
            if (a === 0 && c === 0) continue;
            puntos.push([x + r.fx * r.medioLargo * a + r.sx * r.medioAncho * c, z + r.fz * r.medioLargo * a + r.sz * r.medioAncho * c]);
        }
        return { r, puntos };
    }

    #probarGrilla() {
        const medidas = new this.#ctx.MedidasEscena();
        // El más largo (clásico, puede ser el del jugador) y el más ancho (SUV)
        const grande = { largo: medidas.medidaCarro('clasico').largo, ancho: medidas.medidaCarro('suv').ancho };
        const grilla = new this.#m.GrillaSalida(medidas);
        const medidor = new this.#m.MedidorAvance();
        for (const clave of this.#ctx.registroPistas.claves) {
            const ruta = this.#rutaDe(this.#ctx.registroPistas.obtener(clave));
            const muestras = this.#muestrasDe(ruta);
            const puntos = grilla.puntos(ruta.inicio, 5, muestras);
            this.#ok(puntos.length === 5, `RF-01 ${clave}: la grilla da 5 lugares (${puntos.length})`);
            const formas = puntos.map(p => this.#bordes(p.x, p.z, p.angulo, grande));
            for (let i = 0; i < formas.length; i++) {
                for (let j = 0; j < formas.length; j++) {
                    if (i === j) continue;
                    const toca = formas[i].puntos.some(([x, z]) => formas[j].r.distanciaA(x, z) <= 0.1);
                    this.#ok(!toca, `RF-01 ${clave}: los lugares ${i} y ${j} no se tocan`);
                }
                let maxLateral = 0;
                for (const [x, z] of formas[i].puntos) {
                    const carrera = new this.#ctx.CarreraVueltas(muestras, 3);
                    carrera.actualizar(x, z);
                    maxLateral = Math.max(maxLateral, Math.abs(carrera.lateral));
                }
                this.#ok(maxLateral <= medidas.medioAnchoAsfalto,
                    `RF-01 ${clave}: el lugar ${i} queda dentro del asfalto (lateral ${maxLateral.toFixed(2)} m)`);
                const carrera = new this.#ctx.CarreraVueltas(muestras, 3);
                carrera.actualizar(puntos[i].x, puntos[i].z);
                const avance = medidor.avanceDe(carrera);
                this.#ok(avance < 0 && avance > -0.1, `RF-01 ${clave}: el lugar ${i} está detrás de la meta (avance ${avance.toFixed(4)})`);
            }
        }
    }

    #carro(tipo, x, z, rotY, velocidad) {
        const carro = new this.#m.RegistroCarros().crear(tipo, x, z, rotY);
        carro.entradaAcel = 1;
        while (carro.velocidad < velocidad) carro.actualizar(PruebaCarreraRivales.#PASO);
        carro.setPosicion(x, z);
        carro.entradaAcel = 0;
        return carro;
    }

    #probarChoqueEntreCarros() {
        const medidas = new this.#ctx.MedidasEscena();
        const m = medidas.medidaCarro('deportivo');
        const choque = new this.#m.ChoqueEntreCarros();

        // Lado a lado, superpuestos 0,8 m
        const a = this.#carro('deportivo', 0, 0, 0, 0.5), b = this.#carro('deportivo', m.ancho - 0.8, 0.5, 0, 0.5);
        const va = a.velocidad, vb = b.velocidad;
        this.#ok(choque.resolver(a, m, b, m), 'RF-11 dos carros superpuestos chocan');
        this.#ok(!choque.resolver(a, m, b, m), 'RF-11 después del choque ya no se tocan');
        this.#ok(b.px - a.px >= m.ancho, `RF-11 quedan separados de costado (${(b.px - a.px).toFixed(2)} ≥ ${m.ancho.toFixed(2)})`);
        this.#ok(a.velocidad < va && b.velocidad < vb, 'RF-11 los dos pierden algo de velocidad');
        this.#ok(a.velocidad > 0.4 && b.velocidad > 0.4, 'RF-11 de costado pierden poco y siguen');

        // Uno alcanza al otro por detrás: el de atrás pierde más
        const atras = this.#carro('suv', 0, 0, 0, 0.6), delante = this.#carro('deportivo', 0, 4.0, 0, 0.3);
        const ms = medidas.medidaCarro('suv');
        const v1 = atras.velocidad, v2 = delante.velocidad;
        this.#ok(choque.resolver(atras, ms, delante, m), 'RF-11 el de atrás choca con el de adelante');
        this.#ok(delante.pz - atras.pz >= (ms.largo + m.largo) / 2, 'RF-11 quedan separados de frente');
        this.#ok(v1 - atras.velocidad > v2 - delante.velocidad, 'RF-11 el que golpea de frente pierde más');

        // Lejos: no hace nada
        const c = this.#carro('deportivo', 0, 0, 0, 0.5), d = this.#carro('deportivo', 30, 30, 1, 0.5);
        this.#ok(!choque.resolver(c, m, d, m) && c.px === 0 && d.px === 30, 'RF-11 carros lejos no se tocan');

        // Rendimiento: los 10 pares de 5 carros (RNF-02)
        const carros = [0, 1, 2, 3, 4].map(i => this.#carro('deportivo', i * 3, i * 7, 0, 0.3));
        const inicio = process.hrtime.bigint(), veces = 20000;
        for (let k = 0; k < veces; k++) {
            for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) choque.resolver(carros[i], m, carros[j], m);
        }
        const ms5 = Number(process.hrtime.bigint() - inicio) / 1e6 / veces;
        this.#ok(ms5 < 0.05, `RNF-02 choques entre los 5 carros: ${ms5.toFixed(4)} ms por paso (< 0.05)`);
    }

    #probarTabla() {
        const P = this.#m.ParticipanteCarrera;
        const filas = new this.#m.TablaPosiciones().ordenar([
            new P('Lento', false, true, 100000, 3),
            new P('Rápido', false, true, 90000, 3),
            new P('Jugador', true, false, 0, 2.5),
            new P('Detrás de la meta', false, false, 0, -0.01),
            new P('Primera vuelta', false, false, 0, 0.3),
        ]);
        const orden = filas.map(f => f.nombre).join(', ');
        this.#ok(orden === 'Rápido, Lento, Jugador, Primera vuelta, Detrás de la meta', `D5 la tabla ordena por tiempo y luego por avance: ${orden}`);
        this.#ok(filas.map(f => f.puesto).join() === '1,2,3,4,5', 'D5 puestos 1 a 5');
        this.#ok(filas[0].tiempoMs === 90000 && filas[2].tiempoMs === null, 'D5 tiempo solo de los que terminaron');
        this.#ok(filas[2].esJugador && !filas[0].esJugador, 'D5 la fila del jugador está marcada');

        // Un carro detrás de la meta cuenta como vuelta 0 (avance negativo pequeño)
        const ruta = this.#rutaDe(this.#ctx.registroPistas.obtener('ciudad'));
        const muestras = this.#muestrasDe(ruta, 400);
        const medidor = new this.#m.MedidorAvance();
        const atras = new this.#ctx.CarreraVueltas(muestras, 3), adelante = new this.#ctx.CarreraVueltas(muestras, 3);
        atras.actualizar(muestras[395].x, muestras[395].z);
        adelante.actualizar(muestras[5].x, muestras[5].z);
        const a1 = medidor.avanceDe(atras), a2 = medidor.avanceDe(adelante);
        this.#ok(a1 < 0 && a1 > -0.05 && a2 > 0 && a2 < 0.05, `D5 detrás de la meta = vuelta 0 (${a1.toFixed(4)} < 0 < ${a2.toFixed(4)})`);
    }

    #probarAjusteRitmo() {
        const ajuste = new this.#m.AjusteRitmo();
        const [adelantado, atrasado, cerca] = ajuste.ritmos(1.0, [1.5, 0.5, 1.05]);
        this.#ok(adelantado < 1, `D4 el rival muy adelante afloja (${adelantado.toFixed(3)})`);
        this.#ok(atrasado > 1, `D4 el rival muy atrás arriesga (${atrasado.toFixed(3)})`);
        this.#ok(cerca === 1, `D4 el rival cerca del jugador maneja normal (${cerca})`);
        const extremos = ajuste.ritmos(0, [3, -3]);
        this.#ok(extremos[0] >= 0.85 && extremos[1] <= 1.1, `D4 el ritmo no pasa de 0,85 a 1,1 (${extremos.map(r => r.toFixed(3))})`);
        this.#ok(ajuste.ritmos(null, [1, 2]).every(r => r === 1), 'D4 sin jugador todos van a ritmo 1');
        const pegados = ajuste.ritmos(0.95, [1.0, 1.01]);
        this.#ok(pegados[0] < pegados[1], `D4 el que va pegado al de adelante afloja un poco (${pegados.map(r => r.toFixed(3))})`);
    }

    // RF-06: un Rival en el pasto (con un piloto falso que acelera derecho)
    // termina con la misma velocidad que el jugador manejado como en el visor
    #probarPasto() {
        const pista = this.#ctx.registroPistas.obtener('ciudad'), ruta = this.#rutaDe(pista);
        const muestras = this.#muestrasDe(ruta, 400);
        const medidas = new this.#ctx.MedidasEscena(), medida = medidas.medidaCarro('suv');
        const p = ruta.posicionEn(0.01), lado = 8;
        const x = p.x + Math.cos(p.angle) * lado, z = p.z - Math.sin(p.angle) * lado;
        const crear = () => new this.#m.RegistroCarros().crear('suv', x, z, p.angle);
        const pasos = 150;

        const piloto = new PilotoFalso('suv');
        const rival = new this.#m.Rival(piloto, crear(), new this.#ctx.CarreraVueltas(muestras, 3),
            new this.#ctx.Cronometro(() => 0), new this.#m.DetectorChoques([], ruta, medida), medida);
        rival.reiniciar(new this.#m.PuntoSalida(x, z, p.angle));
        for (let i = 0; i < pasos; i++) rival.paso(1);

        // El jugador, como lo mueve el visor: actualizar, choques, vueltas, pisar
        const jugador = crear(), carrera = new this.#ctx.CarreraVueltas(muestras, 3);
        const detector = new this.#m.DetectorChoques([], ruta, medida);
        carrera.actualizar(jugador.px, jugador.pz); jugador.pisar(carrera.superficie);
        let pisoPasto = false;
        for (let i = 0; i < pasos; i++) {
            const px = jugador.px, pz = jugador.pz;
            jugador.entradaAcel = 1; jugador.entradaDireccion = 0;
            jugador.actualizar(PruebaCarreraRivales.#PASO);
            detector.resolver(jugador, px, pz);
            carrera.actualizar(jugador.px, jugador.pz);
            jugador.pisar(carrera.superficie);
            pisoPasto ||= carrera.enPasto;
        }
        // Y el mismo carro en el asfalto
        const enAsfalto = new this.#m.RegistroCarros().crear('suv', p.x, p.z, p.angle);
        enAsfalto.entradaAcel = 1;
        for (let i = 0; i < pasos; i++) enAsfalto.actualizar(PruebaCarreraRivales.#PASO);

        this.#ok(pisoPasto && rival.carrera.enPasto, 'RF-06 el rival y el jugador están en el pasto');
        this.#ok(Math.abs(rival.carro.velocidad - jugador.velocidad) < 1e-9,
            `RF-06 el rival frena en el pasto igual que el jugador (${rival.carro.velocidad.toFixed(4)} = ${jugador.velocidad.toFixed(4)})`);
        this.#ok(rival.carro.velocidad < enAsfalto.velocidad * 0.6,
            `RF-06 el pasto frena al rival (${rival.carro.velocidad.toFixed(3)} < ${enAsfalto.velocidad.toFixed(3)} en asfalto)`);
        this.#ok(piloto.decisiones === pasos, `D6 el piloto decide en cada paso (${piloto.decisiones}/${pasos})`);
    }

    // RF-06: un Rival que va derecho contra un árbol choca igual que el jugador
    // movido como en el visor (mismo DetectorChoques, mismos rebotes)
    #probarChoqueConArbol() {
        const pista = this.#ctx.registroPistas.obtener('ciudad'), ruta = this.#rutaDe(pista);
        const muestras = this.#muestrasDe(ruta, 400);
        const medida = new this.#ctx.MedidasEscena().medidaCarro('suv');
        const arbol = new this.#m.DetectorChoques(pista.decoraciones, ruta, medida).objetos.find(o => o.tipo === 'arbol');
        const angulo = Math.atan2(arbol.x - (arbol.x - 8), 0);   // apunta en +x hacia el árbol
        const x = arbol.x - 8, z = arbol.z, pasos = 120;
        const crear = () => new this.#m.RegistroCarros().crear('suv', x, z, angulo);

        const rival = new this.#m.Rival(new PilotoFalso('suv'), crear(), new this.#ctx.CarreraVueltas(muestras, 3),
            new this.#ctx.Cronometro(() => 0), new this.#m.DetectorChoques(pista.decoraciones, ruta, medida), medida);
        rival.reiniciar(new this.#m.PuntoSalida(x, z, angulo));
        let rebotesRival = 0;
        const rebotar = rival.carro.rebotar.bind(rival.carro);
        rival.carro.rebotar = (...a) => { rebotesRival++; rebotar(...a); };
        for (let i = 0; i < pasos; i++) rival.paso(1);

        const jugador = crear(), carrera = new this.#ctx.CarreraVueltas(muestras, 3);
        const detector = new this.#m.DetectorChoques(pista.decoraciones, ruta, medida);
        carrera.actualizar(jugador.px, jugador.pz); jugador.pisar(carrera.superficie);
        let rebotesJugador = 0;
        for (let i = 0; i < pasos; i++) {
            const px = jugador.px, pz = jugador.pz;
            jugador.entradaAcel = 1; jugador.entradaDireccion = 0;
            jugador.actualizar(PruebaCarreraRivales.#PASO);
            if (detector.resolver(jugador, px, pz)) rebotesJugador++;
            carrera.actualizar(jugador.px, jugador.pz);
            jugador.pisar(carrera.superficie);
        }
        const r = rival.carro;
        this.#ok(rebotesRival > 0, `RF-06 el rival choca con el árbol (${rebotesRival} choques)`);
        this.#ok(rebotesRival === rebotesJugador, `RF-06 el rival choca tantas veces como el jugador (${rebotesRival} = ${rebotesJugador})`);
        this.#ok(Math.hypot(r.px - jugador.px, r.pz - jugador.pz) < 1e-9 && Math.abs(r.velocidad - jugador.velocidad) < 1e-9,
            'RF-06 el rival termina en el mismo lugar y a la misma velocidad que el jugador');
        this.#ok(Math.hypot(r.px - arbol.x, r.pz - arbol.z) > arbol.radio, 'RF-06 el rival no atraviesa el árbol');
    }

    // Con los pilotos reales (fase 2 si todavía no están): la carrera completa
    #probarCarreraCompleta() {
        if (!this.#m.CarreraConRivales) return;
        const pista = this.#ctx.registroPistas.obtener('ciudad'), ruta = this.#rutaDe(pista);
        const muestras = this.#muestrasDe(ruta, 1000);
        let ahora = 0;
        const carrera = new this.#m.CarreraConRivales(ruta, pista.decoraciones, muestras, 42, () => ahora);
        const puntos = new this.#m.GrillaSalida(new this.#ctx.MedidasEscena()).puntos(ruta.inicio, 5, muestras);
        carrera.colocarEnGrilla(puntos.slice(0, 4));
        const nombres = new Set(carrera.rivales.map(r => r.nombre));
        const tipos = new Set(carrera.rivales.map(r => r.piloto.tipoAuto));
        const colores = new Set(carrera.rivales.map(r => r.piloto.color));
        this.#ok(nombres.size === 4 && tipos.size === 4 && colores.size === 4, 'RF-02 cada rival tiene nombre, carro y color distintos');
        const antes = carrera.posiciones('Jugador');
        this.#ok(antes.length === 5 && antes.filter(f => f.esJugador).length === 1, 'D5 la tabla tiene 5 puestos con el jugador');

        carrera.iniciar();
        const maxPasos = 60 * 600;
        let paso = 0;
        for (; paso < maxPasos && !carrera.todosTerminaron; paso++) {
            ahora += PruebaCarreraRivales.#PASO;
            carrera.paso();
        }
        const tiempos = carrera.rivales.map(r => `${r.nombre}: ${r.terminado ? (r.tiempoTotalMs / 1000).toFixed(1) + ' s' : 'avance ' + r.avance.toFixed(2)}`);
        console.log('ℹ️  ' + tiempos.join(' · '));
        const terminaron = carrera.rivales.filter(r => r.terminado).length;
        this.#ok(carrera.todosTerminaron, `RF-03 los 4 rivales terminan las 3 vueltas (${tiempos.join('; ')})`);
        const final = carrera.posiciones('Jugador', false, 0);
        const conTiempo = final.filter(f => f.terminado);
        this.#ok(conTiempo.length === terminaron && conTiempo.every(f => f.tiempoMs > 0 && f.puesto <= terminaron),
            'D5 los rivales que terminaron van primero con su tiempo');
        this.#ok(final.findIndex(f => f.esJugador) >= terminaron, 'D5 el jugador sin terminar va detrás de los que terminaron');
    }
}

new PruebaCarreraRivales().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
