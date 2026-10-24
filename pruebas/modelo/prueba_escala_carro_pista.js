// ================================================================
// CLASE: PruebaEscalaCarroPista — PRD 009 (docs/prds/prd_009_escala_carro_y_pista.md)
// En el modelo y con análisis estático:
//   RF-01 largo real de cada carro · RF-02 ancho entre 15 % y 32 % del asfalto
//   RF-03 asfalto de 8 m y piano de 0,7 m · RF-04 bordes de superficie = bordes dibujados
//   RF-05 choque de costado ±0,2 m · RF-06 choque de frente ±0,3 m
//   RF-11 el límite suave y el minimapa usan el mismo ancho · RF-13 documentos
//   RNF-01 sin medidas repetidas fuera de MedidasEscena
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaEscalaCarroPista {
    static #RAIZ = path.join(__dirname, '..', '..');
    static #LARGOS = { deportivo: 4.5, muscle: 4.8, formula: 5.0, suv: 4.5, pickup: 4.5, clasico: 6.0 };
    #fallos = [];
    #ctx;
    #Carro; #DetectorChoques; #PosteSolido;

    async ejecutar() {
        const src = p => path.join(PruebaEscalaCarroPista.#RAIZ, 'src', p);
        ({ Carro: this.#Carro } = await import(src('model/carros/carro.js')));
        ({ DetectorChoques: this.#DetectorChoques } = await import(src('model/choques/detector_choques.js')));
        this.#cargarClasicos();
        const medidas = new this.#ctx.MedidasEscena();

        this.#probarCarros(medidas);
        this.#probarPista(medidas);
        this.#probarChoques(medidas);
        this.#probarSinRepetir();
        this.#probarDocumentos();

        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaEscalaCarroPista.#RAIZ, relativo), 'utf8'); }

    #cargarClasicos() {
        const ctx = { console, Math }; ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['medida_carro.js', 'medidas_escena.js', 'superficies/superficie.js', 'superficies/superficie_asfalto.js',
                         'superficies/superficie_piano.js', 'superficies/superficie_pasto.js', 'superficies/detector_superficie.js']) {
            vm.runInContext(this.#leer('src/model/' + f), ctx, { filename: f });
        }
        this.#ctx = ctx;
    }

    #probarCarros(medidas) {
        for (const [tipo, largo] of Object.entries(PruebaEscalaCarroPista.#LARGOS)) {
            const m = medidas.medidaCarro(tipo);
            this.#ok(Math.abs(m.largo - largo) / largo <= 0.05, `RF-01 ${tipo} mide ${m.largo} m (esperado ${largo})`);
            const fraccion = m.ancho / (2 * medidas.medioAnchoAsfalto);
            this.#ok(fraccion >= 0.15 && fraccion <= 0.32, `RF-02 ancho de ${tipo}: ${(fraccion * 100).toFixed(1)} % del asfalto (15–32 %)`);
            this.#ok(m.alto > 0 && m.alto < m.largo, `RF-02 ${tipo} tiene alto proporcionado`);
        }
        this.#ok(medidas.medidaCarro('tanque') === medidas.medidaCarro('deportivo'), 'RF-01 un tipo desconocido usa las medidas del deportivo');
    }

    #probarPista(medidas) {
        this.#ok(2 * medidas.medioAnchoAsfalto === 8 && medidas.anchoPiano === 0.7, 'RF-03 asfalto de 8 m y piano de 0,7 m');
        const d = new this.#ctx.DetectorSuperficie(), M = medidas.medioAnchoAsfalto, P = medidas.limitePiano;
        this.#ok(d.superficieEn(M - 0.1).nombre === 'asfalto' && d.superficieEn(M + 0.1).nombre === 'piano', 'RF-04 asfalto→piano en el borde del asfalto');
        this.#ok(d.superficieEn(P - 0.1).nombre === 'piano' && d.superficieEn(P + 0.1).nombre === 'pasto', 'RF-04 piano→pasto en el borde del piano');
        this.#ok(medidas.limiteSuave < M && medidas.lineaBorde < M, 'RF-11 límite suave y línea de borde dentro del asfalto');
    }

    // Distancia a la que el objeto empieza a chocar, moviéndolo de a 1 cm
    #umbral(medida, direccion) {
        const objeto = new this.#PosteSolido(0, 0);
        for (let d = 6; d > 0; d -= 0.01) {
            const carro = new this.#Carro(0, 0, 0);
            const x = direccion === 'costado' ? d : 0, z = direccion === 'frente' ? d : 0;
            const enObjeto = { posicionEn: () => ({ x, z, angle: 0 }) };
            const det = new this.#DetectorChoques([{ tipo: 'poste', prog: 0, lado: 1, dist: 0 }], enObjeto, medida);
            if (det.resolver(carro, 0, 0)) return { d, radio: objeto.radio };
        }
        return { d: 0, radio: objeto.radio };
    }

    async #cargarPoste() {
        ({ PosteSolido: this.#PosteSolido } = await import(path.join(PruebaEscalaCarroPista.#RAIZ, 'src/model/choques/poste_solido.js')));
    }

    #probarChoques(medidas) {
        if (!this.#PosteSolido) return;
        for (const tipo of Object.keys(PruebaEscalaCarroPista.#LARGOS)) {
            const m = medidas.medidaCarro(tipo);
            const costado = this.#umbral(m, 'costado'), frente = this.#umbral(m, 'frente');
            const esperadoC = m.ancho / 2 + costado.radio, esperadoF = m.largo / 2 + frente.radio;
            this.#ok(Math.abs(costado.d - esperadoC) <= 0.2, `RF-05 ${tipo} choca de costado a ${costado.d.toFixed(2)} m (costado a ${esperadoC.toFixed(2)})`);
            this.#ok(Math.abs(frente.d - esperadoF) <= 0.3, `RF-06 ${tipo} choca de frente a ${frente.d.toFixed(2)} m (parachoques a ${esperadoF.toFixed(2)})`);
        }
    }

    #probarSinRepetir() {
        const archivos = {
            'src/view/pistas/carrera_solo/constructor_circuito_carrera_solo.js': /#MEDIO_ANCHO|#ANCHO_PIANO/,
            'src/view/pistas/diseno_pista/malla_pista_diseno.js':                 /#ANCHO_PIANO|cinta\(-4, 4/,
            'src/view/pistas/visor_testdrive_recto.js':                          /PlaneGeometry\(8,|3\.9|4\.35|4\.7|9\.5|> 3\.8/,
            'src/view/pistas/visor_testdrive_ruta.js':                           /_ribbon\(-4, 4|curbW *= 0\.7|3\.8/,
            'src/view/minimapas/recorrido_test_drive_recto.js':                  /3\.8/,
            'src/model/superficies/detector_superficie.js':                      /= 4;|= 4\.7/,
            'src/model/choques/detector_choques.js':                             /RADIO_CARRO/,
        };
        for (const [archivo, prohibido] of Object.entries(archivos)) {
            this.#ok(!prohibido.test(this.#leer(archivo)), `RNF-01 ${archivo} no repite medidas de la pista ni del carro`);
        }
        for (const archivo of ['visor_carrera_solo.js', 'visor_testdrive_recto.js', 'visor_testdrive_ruta.js', 'visor_diseno_pista.js']) {
            const texto = this.#leer('src/view/pistas/' + archivo);
            this.#ok(!/centrarGrupo\([^,]+, *2\.6\)/.test(texto) && /medidaCarro\(/.test(texto), `RF-01 ${archivo} dibuja el carro a su largo real`);
            this.#ok(/escala/.test(texto), `RF-07 ${archivo} ajusta la cámara al carro`);
        }
        this.#ok(/medidaCarro\(/.test(this.#leer('src/view/visor3d.js')), 'RF-10 la vista previa usa el largo real');
        for (const archivo of ['src/view/pistas/visor_testdrive_recto.js', 'src/view/pistas/visor_testdrive_ruta.js', 'src/view/minimapas/recorrido_test_drive_recto.js']) {
            this.#ok(/limiteSuave/.test(this.#leer(archivo)), `RF-11 ${archivo} usa el límite de MedidasEscena`);
        }
    }

    #probarDocumentos() {
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/1 unidad = 1 metro/.test(claude), 'RF-13 CLAUDE.md dice "1 unidad = 1 metro"');
        this.#ok(/\| `VisorBase` \|[^\n]*`Visor3D`/.test(claude), 'RF-13 CLAUDE.md suma Visor3D a la fila de VisorBase');
        const carpeta = path.join(PruebaEscalaCarroPista.#RAIZ, 'docs/prds');
        for (const n of ['001', '002', '004', '005', '006', '007', '008']) {
            const archivo = fs.readdirSync(carpeta).find(a => a.startsWith(`prd_${n}_`));
            this.#ok(fs.readFileSync(path.join(carpeta, archivo), 'utf8').includes('PRD 009, D12'), `RF-13 el PRD ${n} tiene la nota de D12`);
        }
        const fila = this.#leer('docs/BACKLOG.md').split('\n').find(l => l.startsWith('| B14 |')) ?? '';
        this.#ok(fila.includes('prds/prd_009_escala_carro_y_pista.md'), 'RF-13 el backlog enlaza B14 con el PRD 009');
    }

    async iniciar() {
        await this.#cargarPoste();
        await this.ejecutar();
    }
}

new PruebaEscalaCarroPista().iniciar().catch(e => { console.error(e); process.exitCode = 1; });
