// ================================================================
// CLASE: PruebaSenaletica — PRD 011 (docs/prds/prd_011_senaletica.md)
// En el modelo:
//   RF-01/D4 flecha de 2,4 × 0,8 m, 3 cm de grosor, borde de abajo a 0,9 m
//   RF-02 flechas a 5,4 m del centro, fuera del piano, sin tocarse entre sí
//   RF-03 el carro choca con el tablero al tocarlo (±0,1 m) y no lo atraviesa
//   RF-04 ningún carro alineado toca una flecha con el centro en el asfalto
//   RF-06/D7 arcos con postes a 6,0 m y 5,5 m de altura libre
//   RF-09/D8 cartel de aviso de 3 m de palo y 1,4 × 0,75 m
//   RF-10 la baliza chevron y su botón ya no existen
//   RF-12 nota en los PRD de D11, CLAUDE.md y backlog B17
//   RNF-01 las medidas no se repiten fuera de MedidasEscena; largoSegmentoRuta
//          es el mismo paso con que Ruta arma la pista
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');
const { CargadorTrazadoVuelta } = require('./cargador_trazado_vuelta.cjs');

class PruebaSenaletica {
    static #RAIZ    = path.join(__dirname, '..', '..');
    static #TIPOS   = ['deportivo', 'suv', 'muscle', 'formula', 'pickup', 'clasico'];
    static #PISTAS  = ['ciudad', 'costa', 'desierto', 'montana', 'volcan'];
    static #TOLERANCIA = 0.1;
    static #PASO    = 1000 / 60;
    #fallos = [];
    #ctx;
    #m;
    #Carro; #DetectorChoques; #Ruta; #FabricaObjetosSolidos; #RectanguloCarro;

    async ejecutar() {
        const src = p => path.join(PruebaSenaletica.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ DetectorChoques: this.#DetectorChoques } = await import(src('model/choques/detector_choques.js')));
        ({ Ruta: this.#Ruta } = await import(src('model/ruta.js')));
        ({ FabricaObjetosSolidos: this.#FabricaObjetosSolidos } = await import(src('model/choques/fabrica_objetos_solidos.js')));
        ({ RectanguloCarro: this.#RectanguloCarro } = await import(src('model/choques/rectangulo_carro.js')));
        this.#cargarClasicos();
        this.#m = new this.#ctx.MedidasEscena();

        this.#probarMedidas();
        this.#probarDistancias();
        this.#probarToque();
        this.#probarSinAtravesar();
        this.#probarCarrosAlineados();
        this.#probarBalizaBorrada();
        this.#probarSinRepetir();
        this.#probarSegmentoRuta();
        this.#probarDocumentos();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaSenaletica.#RAIZ, relativo), 'utf8'); }

    // Las pistas se cargan ANTES que MedidasEscena, como en el juego (PRD 011, riesgo de orden de carga)
    #cargarClasicos() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        const pistas = PruebaSenaletica.#PISTAS.map(n => `pistas/config_pista_${n}.js`);
        for (const f of ['registro_pistas.js', 'pistas/config_pista.js', ...pistas, 'medida_carro.js', 'medidas_escena.js']) {
            vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        }
        new CargadorTrazadoVuelta().cargar(ctx);   // la vuelta entera, para Ruta (PRD 014)
        this.#ok(!(ctx.__modelErrors?.length), 'las pistas cargan antes que MedidasEscena sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
        globalThis.MedidasEscena = ctx.MedidasEscena;   // los objetos sólidos (módulos) leen sus medidas de aquí
    }

    #pista(nombre) { return this.#ctx.registroPistas.obtener(nombre); }

    #rutaDe(pista) {
        const ruta = new this.#Ruta();
        ruta.construir(pista.tramos, pista.totalSegs);
        return ruta;
    }

    #probarMedidas() {
        const m = this.#m;
        this.#ok(m.anchoTableroFlecha === 2.4 && m.altoTableroFlecha === 0.8 && m.grosorTableroFlecha === 0.03
            && m.bordeInferiorFlecha === 0.9 && m.radioPaloFlecha === 0.05,
            'RF-01 flecha de 2,4 × 0,8 m, 3 cm de grosor, borde de abajo a 0,9 m y palos de 0,05 m');
        this.#ok(m.distanciaFlechas === 5.4 && m.pasoFlechas === 3, 'RF-02 flechas a 5,4 m, una cada 3 m');
        this.#ok(m.distanciaPostesArco === 6.0 && m.alturaLibreArco === 5.5, 'RF-06 arcos con postes a 6,0 m y 5,5 m de altura libre');
        this.#ok(m.altoPaloAviso === 3 && m.anchoCartelAviso === 1.4 && m.altoCartelAviso === 0.75 && m.grosorCartelAviso > 0,
            'RF-09 aviso de 3 m de palo y 1,4 × 0,75 m, con grosor');
        // El tablero queda a la altura de todos los carros: por eso choca (D6)
        const bajo = Math.min(...PruebaSenaletica.#TIPOS.map(t => m.medidaCarro(t).alto));
        this.#ok(m.bordeInferiorFlecha < bajo, `RF-03 el tablero (desde 0,9 m) queda a la altura del carro más bajo (${bajo.toFixed(2)} m)`);
    }

    // Puntos (x, z) del tablero de una flecha sólida, de punta a punta
    #puntosTablero(flecha, n = 25) {
        const medio = this.#m.anchoTableroFlecha / 2, puntos = [];
        const d = { x: 0, z: 0 };
        // Dirección del tablero: dos puntos cercanos dados por el propio objeto
        const lejos = new this.#RectanguloCarro(flecha.x + 1000, flecha.z, 0, 0.001, 0.001);
        const p = flecha.puntoCercano(lejos);
        const largo = Math.hypot(p.x - flecha.x, p.z - flecha.z);
        if (largo > 1e-9) { d.x = (p.x - flecha.x) / largo; d.z = (p.z - flecha.z) / largo; }
        for (let i = 0; i <= n; i++) {
            const t = -medio + 2 * medio * i / n;
            puntos.push([flecha.x + d.x * t, flecha.z + d.z * t]);
        }
        return puntos;
    }

    #probarDistancias() {
        const m = this.#m, borde = m.limitePiano;
        for (const nombre of PruebaSenaletica.#PISTAS) {
            const pista = this.#pista(nombre), ruta = this.#rutaDe(pista);
            // Con las flechas del camino de vuelta de las pistas abiertas (PRD 014, RF-05)
            const flechas = ruta.decoracionesCon(pista.decoraciones).filter(d => d.tipo === 'flecha');
            this.#ok(flechas.length > 0 && flechas.every(f => f.dist === m.distanciaFlechas),
                `RF-02 ${nombre}: sus ${flechas.length} flechas están a 5,4 m del centro`);
            const solidas = new this.#FabricaObjetosSolidos().crear(flechas, ruta);
            // Fuera del piano: ningún punto del tablero entra al piano
            const centro = ruta.muestras(6000);
            let minimo = Infinity;
            for (const f of solidas) for (const [x, z] of this.#puntosTablero(f, 6)) {
                let dMin = Infinity;
                for (const c of centro) { const dd = Math.hypot(c.x - x, c.z - z); if (dd < dMin) dMin = dd; }
                minimo = Math.min(minimo, dMin - f.radio);
            }
            this.#ok(minimo > borde, `RF-02 ${nombre}: los tableros quedan fuera del piano (más cerca ${minimo.toFixed(2)} m > ${borde} m)`);
            // Ningún tablero toca a otro
            let separacion = Infinity;
            for (let i = 0; i < solidas.length; i++) {
                const a = this.#puntosTablero(solidas[i]);
                for (let j = i + 1; j < solidas.length; j++) {
                    const b = solidas[j];
                    if (Math.hypot(b.x - solidas[i].x, b.z - solidas[i].z) > m.anchoTableroFlecha + 1) continue;
                    for (const [ax, az] of a) for (const [bx, bz] of this.#puntosTablero(b)) {
                        separacion = Math.min(separacion, Math.hypot(ax - bx, az - bz) - 2 * b.radio);
                    }
                }
            }
            this.#ok(separacion > 0, `RF-02 ${nombre}: ningún tablero toca a otro (separación mínima ${separacion.toFixed(2)} m)`);
        }
    }

    // Detector con una sola flecha cuyo tablero va a lo largo del eje z, en (x, 0)
    #detectorFlecha(x, medida) {
        const enPunto = { posicionEn: () => ({ x, z: 0, angle: 0 }) };
        return new this.#DetectorChoques([{ tipo: 'flecha', prog: 0, lado: 1, dist: 0 }], enPunto, medida);
    }

    // Distancia a la que el tablero empieza a chocar, acercándolo de a 1 cm
    #umbral(medida, rotY) {
        for (let d = 6; d > 0; d -= 0.01) {
            const carro = new this.#Carro(0, 0, rotY);
            if (this.#detectorFlecha(d, medida).resolver(carro, 0, 0)) return d;
        }
        return 0;
    }

    #probarToque() {
        const m = this.#m, radio = m.grosorTableroFlecha / 2;
        for (const tipo of PruebaSenaletica.#TIPOS) {
            const medida = m.medidaCarro(tipo);
            const frente = this.#umbral(medida, Math.PI / 2), costado = this.#umbral(medida, 0);
            const eF = medida.largo / 2 + radio, eC = medida.ancho / 2 + radio;
            this.#ok(Math.abs(frente - eF) <= PruebaSenaletica.#TOLERANCIA,
                `RF-03 ${tipo} toca el tablero de frente a ${frente.toFixed(2)} m (esperado ${eF.toFixed(2)} ±0,1)`);
            this.#ok(Math.abs(costado - eC) <= PruebaSenaletica.#TOLERANCIA,
                `RF-03 ${tipo} toca el tablero de costado a ${costado.toFixed(2)} m (esperado ${eC.toFixed(2)} ±0,1)`);
        }
    }

    // RF-03: en cada pista, el carro sale de la pista de frente contra una flecha y no la atraviesa
    #probarSinAtravesar() {
        for (const nombre of PruebaSenaletica.#PISTAS) {
            const pista = this.#pista(nombre), ruta = this.#rutaDe(pista);
            const dec = pista.decoraciones.find(d => d.tipo === 'flecha');
            const detector = new this.#DetectorChoques([dec], ruta);
            const flecha = detector.objetos[0];
            const pos = ruta.posicionEn(dec.prog);
            const hx = Math.cos(pos.angle) * dec.lado, hz = -Math.sin(pos.angle) * dec.lado;   // hacia la flecha
            const rotY = Math.atan2(hx, hz);
            const carro = new this.#Carro(pos.x, pos.z, rotY);
            carro.entradaAcel = 1;
            for (let i = 0; i < 2000 && carro.velocidad < 0.7; i++) carro.actualizar(PruebaSenaletica.#PASO);
            carro.setPosicion(pos.x, pos.z);
            let choco = false, mas = -Infinity, dentro = false;
            const medida = this.#m.medidaCarro();
            for (let i = 0; i < 180; i++) {
                const px = carro.px, pz = carro.pz;
                carro.actualizar(PruebaSenaletica.#PASO);
                choco = detector.resolver(carro, px, pz) || choco;
                // Cuánto avanzó el centro del carro hacia la flecha (no puede pasar el tablero)
                mas = Math.max(mas, (carro.px - pos.x) * hx + (carro.pz - pos.z) * hz);
                const rect = new this.#RectanguloCarro(carro.px, carro.pz, carro.rotY, medida.largo / 2, medida.ancho / 2);
                const p = flecha.puntoCercano(rect);
                if (rect.distanciaA(p.x, p.z) < -PruebaSenaletica.#TOLERANCIA) dentro = true;   // más de 0,1 m adentro
            }
            this.#ok(choco && !dentro && mas < dec.dist,
                `RF-03 ${nombre}: a toda velocidad el carro choca con la flecha y no la atraviesa (choca ${choco}, dentro ${dentro}, llega a ${mas.toFixed(2)} m de ${dec.dist})`);
        }
    }

    // RF-04: carro alineado con la pista, centro en el asfalto → no toca ninguna flecha.
    // Toda la vuelta, con el camino de vuelta de las pistas abiertas y sus flechas,
    // sin excepciones (PRD 014, RF-08: ya no hay quiebre de cierre).
    #probarCarrosAlineados() {
        const m = this.#m, M = m.medioAnchoAsfalto;
        for (const nombre of PruebaSenaletica.#PISTAS) {
            const pista = this.#pista(nombre), ruta = this.#rutaDe(pista);
            const flechas = new this.#FabricaObjetosSolidos().crear(ruta.decoracionesCon(pista.decoraciones).filter(d => d.tipo === 'flecha'), ruta);
            const muestras = ruta.muestras(Math.ceil(ruta.longitud));
            for (const tipo of PruebaSenaletica.#TIPOS) {
                const medida = m.medidaCarro(tipo);
                let peor = Infinity;
                for (const pos of muestras) {
                    for (const lateral of [-M, -M / 2, 0, M / 2, M]) {
                        const x = pos.x + Math.cos(pos.angle) * lateral, z = pos.z - Math.sin(pos.angle) * lateral;
                        const rect = new this.#RectanguloCarro(x, z, pos.angle, medida.largo / 2, medida.ancho / 2);
                        for (const f of flechas) {
                            if (Math.hypot(f.x - x, f.z - z) > rect.alcance + f.alcance) continue;
                            const p = f.puntoCercano(rect);
                            peor = Math.min(peor, rect.distanciaA(p.x, p.z) - f.radio);
                        }
                    }
                }
                this.#ok(peor > 0, `RF-04 ${nombre}: el ${tipo} alineado no toca ninguna flecha con el centro en el asfalto (margen ${peor === Infinity ? 'lejos' : peor.toFixed(2) + ' m'})`);
            }
        }
    }

    #probarBalizaBorrada() {
        this.#ok(!fs.existsSync(path.join(PruebaSenaletica.#RAIZ, 'src/view/objetos/baliza_chevron_escena.js')), 'RF-10 el archivo de la baliza chevron no existe');
        this.#ok(!/baliza/i.test(this.#leer('index.html')), 'RF-10 el botón "Chevrón" ya no está en index.html');
        this.#ok(!/BalizaChevron|baliza_chevron/.test(this.#leer('src/view/objetos/fabrica_objeto_escena.js')), 'RF-10 la fábrica no nombra la baliza');
    }

    // RNF-01: las medidas de la señalética están solo en MedidasEscena
    #probarSinRepetir() {
        const sinColores = t => t.replace(/0x[0-9a-f]+/gi, '').replace(/'#[0-9a-f]+'/gi, '');
        const vistas = {
            'flecha_curva_escena.js': /\b(2\.2|2\.4|0\.8|0\.9|0\.70?|0\.36|0\.03|0\.018|0\.05)\b/,
            'meta_escena.js':         /\b(4\.5|5\.0|9\.2|8\.8|0\.12|0\.15|0\.09|0\.8)\b/,
            'salida_escena.js':       /\b(4\.5|5\.0|9\.2|4\.58|0\.12|0\.15|0\.28|0\.55)\b/,
            'aviso_escena.js':        /\b(3\.0|3\.3|1\.5|1\.2|1\.4|0\.55|0\.75|0\.08|0\.04|0\.05)\b/,
        };
        for (const [archivo, numeros] of Object.entries(vistas)) {
            const texto = sinColores(this.#leer('src/view/objetos/' + archivo)).replace(/\/\/.*$/gm, '');
            this.#ok(/MedidasEscena/.test(texto) && !numeros.test(texto), `RNF-01 ${archivo} saca sus medidas de MedidasEscena`);
        }
        const config = this.#leer('src/model/pistas/config_pista.js').replace(/\/\/.*$/gm, '');
        this.#ok(!/4\.3|0\.30/.test(config) && /distanciaFlechas/.test(config) && /pasoFlechas/.test(config),
            'RNF-01 ConfigPista lee la distancia y el paso de las flechas de MedidasEscena');
        const solida = this.#leer('src/model/choques/flecha_curva_solida.js').replace(/\/\/.*$/gm, '');
        this.#ok(/MedidasEscena/.test(solida) && !/\b0\.\d+\b|2\.4/.test(solida), 'RNF-01 FlechaCurvaSolida saca sus medidas de MedidasEscena');
    }

    // RNF-01: el paso de las flechas se pasa a segmentos con el mismo largo de
    // segmento que usa Ruta (si alguien cambia uno, esta prueba falla)
    #probarSegmentoRuta() {
        const pista = this.#pista('ciudad'), ruta = this.#rutaDe(pista), p = ruta.curve.points;
        const largos = p.slice(1).map((q, i) => Math.hypot(q.x - p[i].x, q.z - p[i].z));
        this.#ok(largos.every(l => Math.abs(l - this.#m.largoSegmentoRuta) < 1e-9),
            `RNF-01 Ruta arma la pista con segmentos de largoSegmentoRuta (${this.#m.largoSegmentoRuta} m)`);
    }

    // RF-12: notas de D11, CLAUDE.md y backlog
    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaSenaletica.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '008', '009', '010']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /PRD 011/.test(this.#leer(`docs/prds/${f}`)), `RF-12 el PRD ${n} tiene la nota del PRD 011`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/`ObjetoSolido` \|[^\n]*FlechaCurvaSolida[^\n]*puntoCercano/.test(claude), 'RF-12 CLAUDE.md suma la flecha sólida y la nueva interfaz de ObjetoSolido');
        this.#ok(/B17[^\n]*prd_011/.test(this.#leer('docs/BACKLOG.md')), 'RF-12 el backlog enlaza B17 con el PRD 011');
    }
}

new PruebaSenaletica().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
