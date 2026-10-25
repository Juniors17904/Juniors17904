// ================================================================
// CLASE: PruebaDividirMonolitos — PRD docs/prds/prd_004_dividir_monolitos.md
//   RF-01: Aplicacion solo navega y guarda un controlador por pantalla
//          (no dibuja, no usa Three.js ni crea visores).
//   RF-02: cada pantalla tiene su controlador (D6), cada uno en su archivo;
//          los de pantalla extienden ControladorPantalla. ControladorModo2D
//          ya no existe: lo borró el PRD 005 (D9).
//   RF-07: Garaje es instanciable y ni él ni sus partes usan `static`.
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');

class PruebaDividirMonolitos {
    #raiz   = path.join(__dirname, '..', '..');
    #fallos = 0;
    // D6: controladores de pantalla que extienden ControladorPantalla, con su archivo
    static #CONTROLADORES = [
        ['ControladorInicio',          'src/controller/pantallas/controlador_inicio.js'],
        ['ControladorAjustes',         'src/controller/pantallas/controlador_ajustes.js'],
        ['ControladorGaraje',          'src/controller/pantallas/controlador_garaje.js'],
        ['ControladorGiroscopio',      'src/controller/pantallas/controlador_giroscopio.js'],
        ['ControladorPistas',          'src/controller/pantallas/controlador_pistas.js'],
        ['ControladorDisenoPistas',    'src/controller/pantallas/controlador_diseno_pistas.js'],
        ['ControladorTestDrive3D',     'src/controller/pantallas/controlador_test_drive_3d.js'],
        ['ControladorControles',       'src/controller/pantallas/controlador_controles.js'],
        ['ControladorVelocimetro',     'src/controller/pantallas/controlador_velocimetro.js'],
        ['ControladorVistaConduccion', 'src/controller/pantallas/controlador_vista_conduccion.js'],
        ['ControladorDisenoGeneral',   'src/controller/pantallas/controlador_diseno_general.js'],
        ['ControladorDisenoObjetos',   'src/controller/pantallas/controlador_diseno_objetos.js'],
    ];
    // RF-07: Garaje y las partes que crea
    static #PARTES_GARAJE = [
        'src/controller/garaje.js',
        'src/view/perfiles_carro/catalogo_perfiles_carro.js',
        'src/view/galeria_miniaturas_carro.js',
        'src/view/vista_previa_carro.js',
        'src/view/barras_carro.js',
    ];

    ejecutar() {
        this.#revisarAplicacion();
        this.#revisarControladores();
        this.#revisarGaraje();
        console.log(this.#fallos ? `\n${this.#fallos} fallo(s)` : '\nTodo OK');
        return this.#fallos;
    }

    #comprobar(condicion, mensaje) {
        console.log(condicion ? 'OK   ' : 'FALLO', mensaje);
        if (!condicion) this.#fallos++;
    }

    #leer(relativo) {
        const ruta = path.join(this.#raiz, relativo);
        return fs.existsSync(ruta) ? fs.readFileSync(ruta, 'utf8') : '';
    }

    // Código sin comentarios, para no contar palabras que solo aparecen en ellos
    #sinComentarios(codigo) {
        return codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    }

    #revisarAplicacion() {
        const fuente = this.#leer('src/controller/aplicacion.js');
        const app = this.#sinComentarios(fuente);
        this.#comprobar(app.length > 0, 'PRD 004 RF-01 existe src/controller/aplicacion.js');
        this.#comprobar(fuente.split('\n').length <= 400, 'PRD 004 RF-01 aplicacion.js tiene 400 líneas o menos');
        const prohibidos = [
            ['THREE', 'no usa Three.js'],
            ['getContext(', 'no dibuja en un lienzo'],
            ['requestAnimationFrame', 'no tiene bucle de dibujo'],
            ['new Visor', 'no crea visores (los crea cada controlador)'],
        ];
        for (const [texto, que] of prohibidos) {
            this.#comprobar(!app.includes(texto), `PRD 004 RF-01 Aplicacion ${que}`);
        }
        for (const [clase] of PruebaDividirMonolitos.#CONTROLADORES) {
            this.#comprobar(new RegExp(`this\\.#\\w+\\s*=\\s*new ${clase}\\(`).test(app),
                `PRD 004 RF-01 Aplicacion guarda ${clase} en un campo privado`);
        }
        this.#comprobar(app.includes('new ControladorCarreraSolo('),
            'PRD 004 RF-01 Aplicacion crea ControladorCarreraSolo para Jugar Solo');
        this.#comprobar(!app.includes('ControladorModo2D'),
            'PRD 004 RF-02 ControladorModo2D ya no se usa (PRD 005, D9)');
    }

    #revisarControladores() {
        for (const [clase, archivo] of PruebaDividirMonolitos.#CONTROLADORES) {
            const codigo = this.#sinComentarios(this.#leer(archivo));
            this.#comprobar(new RegExp(`class ${clase} extends (ControladorPantalla|ControladorPantallaJuego)\\b`).test(codigo),
                `PRD 004 RF-02 ${clase} vive en ${archivo} y extiende ControladorPantalla`);
            const clases = codigo.match(/^\s*(export\s+)?class\s+\w+/gm) || [];
            this.#comprobar(clases.length === 1, `PRD 004 RF-02 ${archivo} tiene una sola clase`);
        }
        const solo = this.#sinComentarios(this.#leer('src/controller/controlador_carrera_solo.js'));
        this.#comprobar(/class ControladorCarreraSolo\b/.test(solo),
            'PRD 004 RF-02 Jugar Solo tiene su controlador ControladorCarreraSolo');
        const juego = this.#sinComentarios(this.#leer('src/controller/pantallas/controlador_pantalla_juego.js'));
        this.#comprobar(/class ControladorPantallaJuego extends ControladorPantalla\b/.test(juego),
            'PRD 004 RF-02 ControladorPantallaJuego extiende ControladorPantalla');
    }

    #revisarGaraje() {
        for (const archivo of PruebaDividirMonolitos.#PARTES_GARAJE) {
            const codigo = this.#sinComentarios(this.#leer(archivo));
            this.#comprobar(codigo.length > 0, `PRD 004 RF-07 existe ${archivo}`);
            this.#comprobar(!/\bstatic\b/.test(codigo), `PRD 004 RF-07 ${archivo} no usa static`);
        }
        const controlador = this.#sinComentarios(this.#leer('src/controller/pantallas/controlador_garaje.js'));
        this.#comprobar(/new Garaje\(/.test(controlador), 'PRD 004 RF-07 ControladorGaraje crea una instancia de Garaje');
    }
}

const prueba = new PruebaDividirMonolitos();
const fallos = prueba.ejecutar();
process.exitCode = fallos ? 1 : 0;
