'use strict';

import * as THREE              from 'three';
import { Ruta }                from '../../model/ruta.js';
import { Carro }               from '../../model/carros/carro.js';
import { VisorBase }           from '../visor_base.js';
import { CamaraSeguimiento }   from '../camaras/camara_seguimiento.js';
import { FabricaObjetoEscena } from '../objetos/fabrica_objeto_escena.js';
import { CieloSoleado }        from '../cielo_soleado.js';
import { CieloNocturno }       from '../cielo_nocturno.js';
import { BuclePasoFijo }       from './carrera_solo/bucle_paso_fijo.js';
import { ConstructorCircuitoCarreraSolo } from './carrera_solo/constructor_circuito_carrera_solo.js';

// ================================================================
// VIEW — VisorCarreraSolo: escena 3D de la carrera "Jugar Solo" en vertical.
//   - La superficie de la pista la arma ConstructorCircuitoCarreraSolo.
//   - Mueve el Carro existente con pasos fijos de 60 Hz (BuclePasoFijo).
//   - NO decide reglas de carrera: solo copia el tope que le pasa el
//     controlador (aplicarTope).
// ================================================================
class VisorCarreraSolo extends VisorBase {
    // ── Constantes internas de la vista ──────────────────────────
    static #ANCHO_COLUMNA   = 480;
    static #FOV_VERTICAL    = 78;
    static #DIST_VERTICAL   = 9;
    static #ALTURA_VERTICAL = 3.6;

    #canvas;
    #pista;
    #renderer     = null;
    #escena       = null;
    #camara       = null;
    #esVertical   = false;
    #cielo        = null;
    #sol          = null;
    #ruta         = new Ruta();
    #carro        = null;
    #fabrica      = new FabricaObjetoEscena();
    #objetos      = [];
    #circuito     = null;   // ConstructorCircuitoCarreraSolo

    #grupoCarro   = null;
    #grupoInclina = null;

    #idAnimacion  = 0;
    #funcionAnimacion = marca => this.#avanzarCuadro(marca);
    #alRedimensionar  = () => this.#redimensionar();
    #observador   = null;
    #detenido     = false;

    #bucle            = new BuclePasoFijo();
    #pasosUltimoFrame = 0;
    #congelado        = false;
    #callbackFrame    = null;

    #velocidadMaxBase = 0;
    #arrastreBase     = 0;
    #fraccionTope     = 1;
    #factorArrastre   = 1;
    #alturaPreferida  = 2.8;

    #entradaAcel      = 0;
    #entradaDireccion = 0;

    // Interfaz de entrada exigida por ControlEntrada / VistaConduccion
    get entradaAcel()        { return this.#entradaAcel; }
    set entradaAcel(v)       { this.#entradaAcel = Number(v) || 0; }
    get entradaDireccion()   { return this.#entradaDireccion; }
    set entradaDireccion(v)  { this.#entradaDireccion = Number(v) || 0; }

    constructor(canvas, pista) {
        super();
        this.#canvas = this.#canvasLimpio(canvas);
        this.#pista  = pista;
        this.#dimensionarCanvas();
        this.#iniciarEscena();
        this.#construirCircuito();
    }

    // ── Compatibilidad con VistaConduccion ───────────────────────
    set alturaCamara(v) {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        this.#alturaPreferida = n;
        this.#aplicarAlturaCamara();
    }
    get camAereaActiva() { return false; }
    toggleCamaraAerea()  { return false; }

    // ── Lectura de pose (solo lectura) ───────────────────────────
    get px()               { return this.#carro?.px        ?? 0; }
    get pz()               { return this.#carro?.pz        ?? 0; }
    get velocidad()        { return this.#carro?.velocidad ?? 0; }
    get velocidadMaxBase() { return this.#velocidadMaxBase; }
    get pasosUltimoFrame() { return this.#pasosUltimoFrame; }

    // ── Muestras por longitud de arco para CarreraVueltas ────────
    muestrasRuta(n) {
        const curva = this.#ruta.curve;
        const total = Math.max(0, Math.floor(n) || 0);
        if (!curva || total === 0) return [];
        const muestras = [];
        for (let i = 0; i < total; i++) {
            const u = i / total;
            const p = curva.getPointAt(u);
            const t = curva.getTangentAt(u);
            muestras.push(new window.MuestraRuta(p.x, p.z, Math.atan2(t.x, t.z)));
        }
        return muestras;
    }

    // ── Un único callback por frame (después de los pasos, antes del render)
    alActualizar(fn) {
        this.#callbackFrame = typeof fn === 'function' ? fn : null;
    }

    // ── Copia el tope calculado por el modelo (sin decidir la regla)
    aplicarTope(fraccion, factorArrastre) {
        if (Number.isFinite(fraccion))       this.#fraccionTope   = fraccion;
        if (Number.isFinite(factorArrastre)) this.#factorArrastre = factorArrastre;
        this.#copiarTopeAlCarro();
    }

    congelar(valor) {
        this.#congelado = !!valor;
        if (this.#congelado) {
            this.#bucle.vaciar();
            if (this.#carro) {
                this.#carro.entradaAcel      = 0;
                this.#carro.entradaDireccion = 0;
            }
        }
    }

    reiniciarCarro() {
        const inicio = this.#ruta.curve ? this.#ruta.inicio : { x: 0, z: 0, angle: 0 };
        this.#carro = new Carro(inicio.x, inicio.z, inicio.angle);
        this.#velocidadMaxBase = this.#carro.velMaxAdelante;
        this.#arrastreBase     = this.#carro.constArrastre;
        this.#copiarTopeAlCarro();
        this.#bucle.reiniciar();
        this.#sincronizarCarroYCamara();
    }

    // ── Cargar el modelo GLB del carro ───────────────────────────
    async cargar(tipoAuto, color) {
        try {
            const gltf    = await VisorBase.cargarGLTF();
            if (this.#detenido || !this.#escena) return;
            const interno = VisorBase.construirGrupo(gltf, tipoAuto, color);
            VisorBase.centrarGrupo(interno, 2.6);

            if (this.#grupoCarro) this.#escena.remove(this.#grupoCarro);
            const inclina = new THREE.Group(); inclina.add(interno);
            const grupo   = new THREE.Group(); grupo.add(inclina);
            this.#escena.add(grupo);
            this.#grupoCarro   = grupo;
            this.#grupoInclina = inclina;
            this.#sincronizarCarroYCamara();
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[VisorCarreraSolo.cargar] ' + e.message);
            console.error('[VisorCarreraSolo.cargar]', e);
        }
    }

    // ── Ciclo de vida ────────────────────────────────────────────
    iniciar() {
        if (this.#detenido || this.#idAnimacion) return;
        window.addEventListener('resize', this.#alRedimensionar);
        window.addEventListener('orientationchange', this.#alRedimensionar);
        if (typeof ResizeObserver !== 'undefined' && this.#canvas.parentElement) {
            this.#observador = new ResizeObserver(this.#alRedimensionar);
            this.#observador.observe(this.#canvas.parentElement);
        }
        this.#redimensionar();
        this.#bucle.reiniciar();
        this.#idAnimacion  = requestAnimationFrame(this.#funcionAnimacion);
    }

    detener() {
        if (this.#detenido) return;
        this.#detenido = true;
        cancelAnimationFrame(this.#idAnimacion);
        this.#idAnimacion   = 0;
        this.#callbackFrame = null;
        window.removeEventListener('resize', this.#alRedimensionar);
        window.removeEventListener('orientationchange', this.#alRedimensionar);
        this.#observador?.disconnect();
        this.#observador = null;

        for (const obj of this.#objetos) obj.destruir(this.#escena);
        this.#objetos = [];
        this.#cielo?.destruir(this.#escena);
        this.#cielo = null;

        this.#circuito?.liberar();
        this.#circuito = null;

        const gl = this.#renderer?.getContext();
        this.#renderer?.dispose();
        this.#renderer = null;
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        this.#escena = null;
        this.#carro  = null;
    }

    // ── Escena, luces y cámara ───────────────────────────────────
    // Un visor anterior pudo forzar WEBGL_lose_context sobre este canvas; un canvas
    // con el contexto perdido no sirve para un renderer nuevo, así que el visor
    // lo sustituye por un clon limpio en el mismo lugar del DOM
    #canvasLimpio(canvas) {
        if (!canvas) throw new Error('VisorCarreraSolo: falta el canvas');
        const limpio = canvas.cloneNode(false);
        limpio.removeAttribute('style');
        if (canvas.parentNode) canvas.replaceWith(limpio);
        return limpio;
    }

    #dimensionarCanvas() {
        const ancho = Math.max(1, Math.min(window.innerWidth, VisorCarreraSolo.#ANCHO_COLUMNA));
        const alto  = Math.max(1, window.innerHeight);
        this.#canvas.width        = ancho;
        this.#canvas.height       = alto;
        this.#canvas.style.width  = ancho + 'px';
        this.#canvas.style.height = alto + 'px';
        this.#canvas.style.display = 'block';
        return { ancho, alto };
    }

    #iniciarEscena() {
        const ancho = this.#canvas.width;
        const alto  = this.#canvas.height;

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        this.#renderer.setSize(ancho, alto, false);
        this.#renderer.shadowMap.enabled   = false;
        this.#renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.4;

        this.#escena = new THREE.Scene();
        const tipoCielo  = this.#pista?.tipoCielo ?? 'soleado';
        const colorCielo = this.#pista?.cielo ?? '#4a9eca';
        this.#cielo = tipoCielo === 'nocturno'
            ? new CieloNocturno(colorCielo)
            : new CieloSoleado(colorCielo);
        this.#cielo.construir(this.#escena);

        this.#crearCamara(ancho / alto);

        // Luces al nivel de VisorTestdriveRuta (asfalto gris, no negro)
        this.#escena.add(new THREE.AmbientLight(0xfff4e0, 1.2));
        this.#sol = new THREE.DirectionalLight(0xfffbe6, 2.2);
        const posSol = this.#cielo.posicionSol;
        if (posSol) this.#sol.position.copy(posSol);
        else        this.#sol.position.set(6, 10, 4);
        this.#escena.add(this.#sol, this.#sol.target);

        const relleno = new THREE.DirectionalLight(0xc8e8ff, 0.5);
        relleno.position.set(-5, 4, -3);
        this.#escena.add(relleno);
    }

    #crearCamara(aspecto) {
        this.#esVertical = aspecto < 1;
        this.#camara = this.#esVertical
            ? new CamaraSeguimiento(aspecto, {
                distancia: VisorCarreraSolo.#DIST_VERTICAL,
                altura:    VisorCarreraSolo.#ALTURA_VERTICAL,
            })
            : new CamaraSeguimiento(aspecto);
        this.#aplicarReglaFov(aspecto);
        this.#aplicarAlturaCamara();
    }

    #aplicarReglaFov(aspecto) {
        const camara = this.#camara?.camera;
        if (!camara) return;
        camara.fov    = aspecto < 1 ? VisorCarreraSolo.#FOV_VERTICAL : 55;
        camara.aspect = aspecto;
        camara.updateProjectionMatrix();
    }

    // En vertical se usa la altura del PRD (3.6); en horizontal, la preferida.
    #aplicarAlturaCamara() {
        if (!this.#camara) return;
        this.#camara.altura = this.#esVertical
            ? VisorCarreraSolo.#ALTURA_VERTICAL
            : this.#alturaPreferida;
    }

    #redimensionar() {
        if (this.#detenido || !this.#renderer) return;
        const { ancho, alto } = this.#dimensionarCanvas();
        const aspecto = ancho / alto;
        if ((aspecto < 1) !== this.#esVertical) this.#crearCamara(aspecto);
        else {
            this.#camara.resize(aspecto);
            this.#aplicarReglaFov(aspecto);
        }
        this.#renderer.setSize(ancho, alto, false);
        this.#sincronizarCarroYCamara();
    }

    // ── Circuito: superficie (ConstructorCircuitoCarreraSolo) y decoraciones ──
    #construirCircuito() {
        if (this.#pista?.tramos) this.#ruta.construir(this.#pista.tramos, this.#pista.totalSegs);
        this.#afinarLongitudArco();
        this.reiniciarCarro();
        const curva = this.#ruta.curve;
        if (!curva) return;

        this.#circuito = new ConstructorCircuitoCarreraSolo(this.#escena);
        this.#circuito.construir(curva);

        // Decoraciones
        for (const dec of this.#pista.decoraciones ?? []) {
            try {
                const obj = this.#crearObjeto(dec);
                if (!obj) continue;
                obj.construir(this.#escena);
                obj.setVisible?.(true);
                this.#objetos.push(obj);
            } catch (e) {
                console.error('[VisorCarreraSolo.decoracion]', e);
            }
        }
    }

    // La curva trae 200 divisiones de arco por defecto: con ~300 puntos de
    // control y el tramo de cierre largo de las pistas abiertas, getPointAt
    // deja de ser equiespaciado. Se afina solo en la curva de ESTA instancia
    // de Ruta (no se modifica la clase Ruta).
    #afinarLongitudArco() {
        const curva = this.#ruta.curve;
        if (!curva) return;
        const puntosControl = curva.points?.length ?? 0;
        curva.arcLengthDivisions = Math.max(60000, puntosControl * 200);
        curva.updateArcLengths();
    }

    #crearObjeto({ tipo, prog, lado, dist, escala = 1, texto = '', direccion = 'derecha', conLuz = true }) {
        const pos  = this.#ruta.posicionEn(prog);
        const wx   = pos.x + Math.cos(pos.angle) * dist * lado;
        const wz   = pos.z - Math.sin(pos.angle) * dist * lado;
        return this.#fabrica.crear(tipo, wx, wz, { escala, texto, direccion, rotY: pos.angle, lado, conLuz });
    }

    // ── Carro ────────────────────────────────────────────────────
    #copiarTopeAlCarro() {
        if (!this.#carro) return;
        this.#carro.velMaxAdelante = this.#velocidadMaxBase * this.#fraccionTope;
        this.#carro.constArrastre  = this.#arrastreBase     * this.#factorArrastre;
    }

    #sincronizarCarroYCamara() {
        if (!this.#carro) return;
        if (this.#grupoCarro) {
            this.#grupoCarro.position.set(this.#carro.px, 0, this.#carro.pz);
            this.#grupoCarro.rotation.y = this.#carro.rotY;
        }
        if (this.#grupoInclina) this.#grupoInclina.rotation.z = this.#carro.carLean;
        this.#camara?.actualizar(this.#carro.px, this.#carro.pz, this.#carro.velAngle, this.#entradaDireccion);
    }

    // ── Bucle: pasos fijos de 60 Hz + callback + render ──────────
    #avanzarCuadro(marca) {
        if (this.#detenido) return;
        this.#idAnimacion = requestAnimationFrame(this.#funcionAnimacion);

        const activo = !this.#congelado && !!this.#carro;
        const pasos  = this.#bucle.avanzar(marca, activo, () => {
            this.#carro.entradaAcel      = this.#entradaAcel;
            this.#carro.entradaDireccion = this.#entradaDireccion;
            this.#carro.actualizar(16);
        });
        this.#pasosUltimoFrame = pasos;

        this.#sincronizarCarroYCamara();

        if (this.#callbackFrame) {
            try { this.#callbackFrame(); }
            catch (e) { console.error('[VisorCarreraSolo.alActualizar]', e); }
        }
        if (this.#detenido || !this.#renderer || !this.#escena) return;

        this.#cielo?.actualizar(this.#camara.camera);
        this.#renderer.render(this.#escena, this.#camara.camera);
    }
}

window.VisorCarreraSolo = VisorCarreraSolo;
