// ================================================================
// CLASE: PruebaObjetosSolidos — PRD 010 (docs/prds/prd_010_objetos_solidos.md)
// En el modelo:
//   RF-01/02/03 medidas del árbol, el poste y la señal en MedidasEscena
//   RF-05 el carro choca al tocar tronco, poste o palo (±0,1 m)
//   RF-06 el tronco del árbol (y su choque) crece con su tamaño propio
//   RF-07 la copa y el cartel quedan por encima del carro más alto
//   RF-08 señales de las 5 pistas y postes de Ciudad a 6,0 m del centro
//   RF-09 ningún carro alineado con la pista los toca con el centro en el asfalto
//   RF-10 la fábrica solo crea sólidos para árbol, poste y señal (y flecha, PRD 011 RF-03; lo demás no)
//   RNF-01 la distancia no se repite en las pistas y se lee al pedir las decoraciones
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaObjetosSolidos {
    static #RAIZ    = path.join(__dirname, '..', '..');
    static #TIPOS   = ['deportivo', 'suv', 'muscle', 'formula', 'pickup', 'clasico'];
    static #PISTAS  = ['ciudad', 'costa', 'desierto', 'montana', 'volcan'];
    static #TOLERANCIA = 0.1;
    #fallos = [];
    #ctx;
    #medidas;
    #Carro; #DetectorChoques; #Ruta; #ArbolSolido; #FabricaObjetosSolidos;

    async ejecutar() {
        const src = p => path.join(PruebaObjetosSolidos.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ DetectorChoques: this.#DetectorChoques } = await import(src('model/choques/detector_choques.js')));
        ({ ArbolSolido: this.#ArbolSolido } = await import(src('model/choques/arbol_solido.js')));
        ({ Ruta: this.#Ruta } = await import(src('model/ruta.js')));
        ({ FabricaObjetosSolidos: this.#FabricaObjetosSolidos } = await import(src('model/choques/fabrica_objetos_solidos.js')));
        this.#cargarClasicos();
        this.#medidas = new this.#ctx.MedidasEscena();

        this.#probarMedidas();
        this.#probarToque();
        this.#probarTamanoPropio();
        this.#probarAlturas();
        this.#probarDistancias();
        this.#probarCarrosAlineados();
        this.#probarSinRepetir();
        this.#probarSoloTresSolidos();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaObjetosSolidos.#RAIZ, relativo), 'utf8'); }
    #cerca(a, b) { return Math.abs(a - b) < 1e-9; }

    // Las pistas se cargan ANTES que MedidasEscena, como en el juego (riesgo de orden de carga)
    #cargarClasicos() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        const pistas = PruebaObjetosSolidos.#PISTAS.map(n => `pistas/config_pista_${n}.js`);
        for (const f of ['registro_pistas.js', 'pistas/config_pista.js', ...pistas, 'medida_carro.js', 'medidas_escena.js']) {
            vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        }
        this.#ok(!(ctx.__modelErrors?.length), 'RNF-01 las pistas cargan antes que MedidasEscena sin errores: ' + ctx.__modelErrors);
        this.#ctx = ctx;
        globalThis.MedidasEscena = ctx.MedidasEscena;   // los objetos sólidos (módulos) leen sus medidas de aquí
    }

    #probarMedidas() {
        const m = this.#medidas;
        this.#ok(m.altoArbol === 7 && m.radioTroncoArbol === 0.3 && m.alturaMinimaCopa === 2.3,
            'PRD 010 RF-01 árbol de 7 m, tronco de 0,3 m y copa desde 2,3 m');
        this.#ok(m.altoPoste === 8 && m.radioPoste === 0.15 && m.largoBrazoPoste === 1.5 && m.radioLampara === 0.25,
            'PRD 010 RF-02 poste de 8 m y 0,15 m, brazo de 1,5 m y lámpara de 0,25 m');
        this.#ok(m.altoPaloSenal === 2.2 && m.radioPaloSenal === 0.05 && m.ladoCartelSenal === 0.7 && m.grosorCartelSenal === 0.03,
            'PRD 010 RF-03 palo de 2,2 m y 0,05 m, cartel de 0,7 × 0,7 m y 3 cm');
        this.#ok(m.distanciaPostesYSenales === 6.0, 'PRD 010 RF-08 postes y señales a 6,0 m del centro');
    }

    // Detector con un solo objeto (decoración) en (x, z)
    #detectorCon(decoracion, x, z, medida) {
        const enPunto = { posicionEn: () => ({ x, z, angle: 0 }) };
        return new this.#DetectorChoques([{ prog: 0, lado: 1, dist: 0, ...decoracion }], enPunto, medida);
    }

    // Distancia a la que el objeto empieza a chocar, acercándolo de a 1 cm
    #umbral(decoracion, medida, direccion) {
        for (let d = 6; d > 0; d -= 0.01) {
            const carro = new this.#Carro(0, 0, 0);
            const det = this.#detectorCon(decoracion, direccion === 'costado' ? d : 0, direccion === 'frente' ? d : 0, medida);
            if (det.resolver(carro, 0, 0)) return d;
        }
        return 0;
    }

    #probarToque() {
        const m = this.#medidas;
        const objetos = [
            [{ tipo: 'arbol' },       m.radioTroncoArbol, 'tronco'],
            [{ tipo: 'poste' },       m.radioPoste,       'poste'],
            [{ tipo: 'senal_curva' }, m.radioPaloSenal,   'palo de la señal'],
        ];
        for (const tipo of PruebaObjetosSolidos.#TIPOS) {
            const medida = m.medidaCarro(tipo);
            for (const [dec, radio, nombre] of objetos) {
                const costado = this.#umbral(dec, medida, 'costado'), frente = this.#umbral(dec, medida, 'frente');
                const eC = medida.ancho / 2 + radio, eF = medida.largo / 2 + radio;
                this.#ok(Math.abs(costado - eC) <= PruebaObjetosSolidos.#TOLERANCIA,
                    `PRD 010 RF-05 ${tipo} toca el ${nombre} de costado a ${costado.toFixed(2)} m (esperado ${eC.toFixed(2)} ±0,1)`);
                this.#ok(Math.abs(frente - eF) <= PruebaObjetosSolidos.#TOLERANCIA,
                    `PRD 010 RF-05 ${tipo} toca el ${nombre} de frente a ${frente.toFixed(2)} m (esperado ${eF.toFixed(2)} ±0,1)`);
            }
        }
    }

    #probarTamanoPropio() {
        const r = this.#medidas.radioTroncoArbol;
        this.#ok(this.#cerca(new this.#ArbolSolido(0, 0).radio, r), 'PRD 010 RF-06 sin tamaño propio el tronco choca con 0,3 m');
        let anterior = 0;
        for (const t of [0.8, 1.0, 1.2, 1.4]) {
            const radio = new this.#ArbolSolido(0, 0, t).radio;
            this.#ok(this.#cerca(radio, r * t) && radio > anterior, `PRD 010 RF-06 tamaño propio ${t}: tronco de ${radio.toFixed(3)} m`);
            anterior = radio;
        }
        // La fábrica pasa la escala de la decoración y el choque crece con ella
        const medida = this.#medidas.medidaCarro('deportivo');
        const chico = this.#umbral({ tipo: 'arbol', escala: 0.8 }, medida, 'costado');
        const grande = this.#umbral({ tipo: 'arbol', escala: 1.4 }, medida, 'costado');
        this.#ok(grande - chico > 0.1, `PRD 010 RF-06 el árbol de 1,4 choca antes que el de 0,8 (${grande.toFixed(2)} > ${chico.toFixed(2)})`);
        const ciudad = this.#ctx.registroPistas.obtener('ciudad');
        const det = new this.#DetectorChoques(ciudad.decoraciones, this.#rutaDe(ciudad));
        const arboles = ciudad.decoraciones.filter(d => d.tipo === 'arbol');
        const solidos = det.objetos.filter(o => o.tipo === 'arbol');
        this.#ok(solidos.length === arboles.length && solidos.every((o, i) => this.#cerca(o.radio, r * arboles[i].escala)),
            'PRD 010 RF-06 en Ciudad cada árbol choca con su tamaño propio');
    }

    #probarAlturas() {
        const m = this.#medidas;
        const altoMaximo = Math.max(...PruebaObjetosSolidos.#TIPOS.map(t => m.medidaCarro(t).alto));
        for (const t of [0.8, 1.0, 1.2, 1.4]) {
            const inicioCopa = m.alturaMinimaCopa;   // lo más bajo que puede empezar la copa, con cualquier tamaño propio
            this.#ok(inicioCopa >= 2.3 && inicioCopa > altoMaximo && m.altoArbol * t > inicioCopa,
                `PRD 010 RF-07 tamaño propio ${t}: la copa empieza a ${inicioCopa} m, sobre el carro más alto (${altoMaximo.toFixed(2)} m) y bajo la punta (${(m.altoArbol * t).toFixed(1)} m)`);
        }
        this.#ok(m.altoPaloSenal > altoMaximo, `PRD 010 RF-07 el cartel (desde ${m.altoPaloSenal} m) queda sobre el carro más alto (${altoMaximo.toFixed(2)} m)`);
    }

    #rutaDe(pista) {
        const ruta = new this.#Ruta();
        ruta.construir(pista.tramos, pista.totalSegs);
        return ruta;
    }

    #probarDistancias() {
        const D = this.#medidas.distanciaPostesYSenales;
        for (const nombre of PruebaObjetosSolidos.#PISTAS) {
            const pista = this.#ctx.registroPistas.obtener(nombre), ruta = this.#rutaDe(pista);
            const decs = pista.decoraciones.filter(d => d.tipo === 'senal_curva' || (nombre === 'ciudad' && d.tipo === 'poste'));
            this.#ok(decs.length > 0 && decs.every(d => d.dist === D), `PRD 010 RF-08 ${nombre}: señales${nombre === 'ciudad' ? ' y postes' : ''} a ${D} m`);
            const solidos = new this.#DetectorChoques(decs, ruta).objetos;
            const malos = solidos.filter((o, i) => {
                const p = ruta.posicionEn(decs[i].prog);
                return Math.abs(Math.hypot(o.x - p.x, o.z - p.z) - D) > 1e-6;
            });
            this.#ok(malos.length === 0, `PRD 010 RF-08 ${nombre}: los objetos sólidos quedan a ${D} m del centro (${malos.length} fuera)`);
        }
    }

    // Carro alineado con la pista, centro en el borde del asfalto, del lado de cada poste o señal
    #probarCarrosAlineados() {
        const m = this.#medidas, M = m.medioAnchoAsfalto, D = m.distanciaPostesYSenales;
        for (const tipo of PruebaObjetosSolidos.#TIPOS) {
            const medida = m.medidaCarro(tipo);
            for (const [radio, nombre] of [[m.radioPoste, 'poste'], [m.radioPaloSenal, 'palo']]) {
                this.#ok(medida.ancho / 2 + radio < D - M,
                    `PRD 010 RF-09 ${tipo}: medio ancho ${(medida.ancho / 2).toFixed(2)} + ${nombre} ${radio} < ${(D - M).toFixed(2)} m libres`);
            }
            for (const nombre of PruebaObjetosSolidos.#PISTAS) {
                const pista = this.#ctx.registroPistas.obtener(nombre), ruta = this.#rutaDe(pista);
                const decs = pista.decoraciones.filter(d => d.tipo === 'senal_curva' || d.tipo === 'poste');
                let toques = 0;
                for (const dec of decs) {
                    const p = ruta.posicionEn(dec.prog);
                    const x = p.x + Math.cos(p.angle) * M * dec.lado, z = p.z - Math.sin(p.angle) * M * dec.lado;
                    const carro = new this.#Carro(x, z, p.angle);
                    if (new this.#DetectorChoques([dec], ruta, medida).resolver(carro, x, z)) toques++;
                }
                this.#ok(toques === 0, `PRD 010 RF-09 ${tipo} en ${nombre}: alineado en el borde del asfalto no toca postes ni señales (${toques} toques)`);
            }
        }
    }

    #probarSinRepetir() {
        for (const nombre of ['config_pista', ...PruebaObjetosSolidos.#PISTAS.map(n => 'config_pista_' + n)]) {
            const texto = this.#leer(`src/model/pistas/${nombre}.js`);
            this.#ok(!/5\.5|6\.0/.test(texto), `PRD 010 RNF-01 ${nombre}.js no repite la distancia de postes y señales`);
        }
        this.#ok(/distanciaPostesYSenales/.test(this.#leer('src/model/pistas/config_pista.js')), 'PRD 010 RNF-01 ConfigPista lee la distancia de MedidasEscena');
        for (const archivo of ['arbol_solido.js', 'poste_solido.js', 'senal_curva_solida.js']) {
            const texto = this.#leer('src/model/choques/' + archivo);
            this.#ok(/MedidasEscena/.test(texto) && !/\b0\.\d+\b/.test(texto), `PRD 010 RNF-01 ${archivo} saca su radio de MedidasEscena`);
        }
    }

    // RF-10: lo que no es árbol, poste ni señal se ve como antes y no se vuelve sólido
    #probarSoloTresSolidos() {
        const enPunto = { posicionEn: () => ({ x: 0, z: 0, angle: 0 }) };
        const fabrica = new this.#FabricaObjetosSolidos();
        for (const tipo of ['meta', 'salida', 'barrera', 'guardarrail', 'aviso']) {
            const solidos = fabrica.crear([{ tipo, prog: 0, lado: 1, dist: 6 }], enPunto);
            this.#ok(solidos.length === 0, `PRD 010 RF-10 FabricaObjetosSolidos no crea un sólido para ${tipo} (${solidos.length})`);
        }
        const tipos = ['arbol', 'poste', 'senal_curva', 'flecha'];   // la flecha, por el PRD 011 (D6)
        const solidos = fabrica.crear(tipos.map(tipo => ({ tipo, prog: 0, lado: 1, dist: 6 })), enPunto);
        this.#ok(solidos.map(s => s.tipo).join() === tipos.join(),
            `PRD 010 RF-10 y PRD 011 RF-03 FabricaObjetosSolidos solo crea sólidos para arbol, poste, senal_curva y flecha (${solidos.map(s => s.tipo).join(', ')})`);
    }
}

new PruebaObjetosSolidos().ejecutar().catch(e => { console.error(e); process.exitCode = 1; });
