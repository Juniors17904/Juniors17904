'use strict';

import * as THREE    from 'three';
import { Ruta } from '../../model/ruta.js';
import { Carro }             from '../../model/carros/carro.js';
import { ConductorPasoFijo } from './comun/conductor_paso_fijo.js';
import { VisorBase }         from '../visor_base.js';
import { CamaraSeguimiento } from '../camaras/camara_seguimiento.js';
import { FabricaObjetoEscena } from '../objetos/fabrica_objeto_escena.js';
import { CieloSoleado }  from '../cielo_soleado.js';
import { CieloNocturno } from '../cielo_nocturno.js';
import { MallaPistaDiseno } from './diseno_pista/malla_pista_diseno.js';
import { LunaDisenoPista }  from './diseno_pista/luna_diseno_pista.js';

// ================================================================
// CLASS: VisorDisenoGeneral — vista 3D con cámara trasera del circuito
//        para la pantalla Diseño General.
//        Capas activables: pasto → pista → auto
// ================================================================
class VisorDisenoPista extends VisorBase {
    #canvas;
    #renderer    = null;
    #scene       = null;
    #camaraChase = null;
    #idAnimacion         = 0;
    #cielo       = null;
    #ruta        = new Ruta();
    #conductor   = new ConductorPasoFijo();
    #sol         = null;
    #resizeObs   = null;

    #pista      = null;
    #objetos        = [];
    #objetosSenales = [];
    #objetosFlechas = [];
    #objetosPostes  = [];
    #funcionAnimacion     = marca => this.#tick(marca);

    #meshPasto  = null;
    #grupoPista = null;
    #carGroup   = null;
    #leanGroup  = null;

    #mostrarPasto   = false;
    #mostrarPista   = false;
    #mostrarAuto    = false;
    #mostrarObjetos = true;
    #mostrarPostes  = true;
    #mostrarSenales = false;
    #mostrarFlechas = false;
    #mostrarCielo   = true;

    entradaAcel = 0;
    entradaDireccion = 0;
    alturaCamara  = 2.8;

    // Stubs para compatibilidad con VistaConduccion
    get camAereaActiva() { return false; }
    get camAerea()       { return null;  }
    toggleCamaraAerea()  { return false; }

    // ── Setters de visibilidad ────────────────────────────────────
    set mostrarPasto(v) {
        this.#mostrarPasto = !!v;
        if (this.#meshPasto) this.#meshPasto.visible = this.#mostrarPasto;
    }
    set mostrarPista(v) {
        this.#mostrarPista = !!v;
        if (this.#grupoPista) this.#grupoPista.visible = this.#mostrarPista;
    }
    set mostrarAuto(v) {
        this.#mostrarAuto = !!v;
        if (this.#carGroup) this.#carGroup.visible = this.#mostrarAuto;
    }

    set mostrarObjetos(v) {
        this.#mostrarObjetos = !!v;
        for (const obj of this.#objetos) obj.setVisible(this.#mostrarObjetos);
    }

    set mostrarPostes(v) {
        this.#mostrarPostes = !!v;
        for (const obj of this.#objetosPostes) obj.setVisible(this.#mostrarPostes);
    }

    set mostrarSenales(v) {
        this.#mostrarSenales = !!v;
        for (const obj of this.#objetosSenales) obj.setVisible(this.#mostrarSenales);
    }

    set mostrarFlechas(v) {
        this.#mostrarFlechas = !!v;
        for (const obj of this.#objetosFlechas) obj.setVisible(this.#mostrarFlechas);
    }

    set mostrarCielo(v) {
        this.#mostrarCielo = !!v;
        if (this.#cielo) this.#cielo.visible = this.#mostrarCielo;
        if (this.#scene) {
            if (this.#mostrarCielo) {
                this.#cielo?.restaurar(this.#scene);
            } else {
                this.#scene.background = null;
                this.#scene.fog        = null;
            }
        }
    }

    set mostrarMontanas(v) {
        this.#cielo?.setMostrarMontanas?.(!!v);
    }

    get mostrarPasto()   { return this.#mostrarPasto;   }
    get mostrarPista()   { return this.#mostrarPista;   }
    get mostrarAuto()    { return this.#mostrarAuto;    }
    get mostrarObjetos() { return this.#mostrarObjetos; }
    get mostrarPostes()  { return this.#mostrarPostes;  }
    get mostrarSenales() { return this.#mostrarSenales; }
    get mostrarFlechas() { return this.#mostrarFlechas; }
    get mostrarCielo()   { return this.#mostrarCielo;   }

    // Datos del carro para el panel de debug de Diseño General
    get velocidad()    { return this.#mov?.velocidad    ?? 0; }
    get velocidadMax() { return this.#mov?.velocidadMax ?? 0; }
    get px()           { return this.#mov?.px           ?? 0; }
    get pz()           { return this.#mov?.pz           ?? 0; }

    constructor(canvas, pista) {
        super();
        this.#canvas = canvas;
        this.#pista  = pista;
        this.#initScene();
        this.#buildCircuito();
    }

    // ── Escena ───────────────────────────────────────────────────
    #initScene() {
        const W = this.#canvas.width  || window.innerWidth;
        const H = this.#canvas.height || window.innerHeight;

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = false;
        this.#renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 0.9;

        this.#scene = new THREE.Scene();
        const tipoCielo  = this.#pista?.tipoCielo ?? 'soleado';
        const colorCielo = this.#pista?.cielo ?? '#4a9eca';
        this.#cielo = tipoCielo === 'soleado'
            ? new CieloSoleado(colorCielo)
            : new CieloNocturno(colorCielo, { sinLuna: true });
        this.#cielo.construir(this.#scene);

        if (tipoCielo === 'nocturno') new LunaDisenoPista().agregarA(this.#scene);

        this.#camaraChase = new CamaraSeguimiento(W / H, { seguirRotacion: true });

        this.#scene.add(new THREE.AmbientLight(0x8899bb, 0.35));
        this.#sol = new THREE.DirectionalLight(0xaabbdd, 0.5);
        this.#scene.add(this.#sol, this.#sol.target);
        const posSol = this.#cielo.posicionSol;
        if (posSol) this.#sol.position.copy(posSol);
        else this.#sol.position.set(6, 10, 4);

        const fill = new THREE.DirectionalLight(0x8899cc, 0.15);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);

        this.#resizeObs = new ResizeObserver(() => this.#resize());
        this.#resizeObs.observe(this.#canvas);
    }

    #resize() {
        const W = this.#canvas.clientWidth  || window.innerWidth;
        const H = this.#canvas.clientHeight || window.innerHeight;
        if (!W || !H) return;
        this.#canvas.width  = W;
        this.#canvas.height = H;
        this.#camaraChase?.resize(W / H);
        this.#renderer?.setSize(W, H, false);
    }

    // ── Construir circuito ────────────────────────────────────────
    #buildCircuito() {
        if (!this.#pista?.tramos) return;

        this.#ruta.construir(this.#pista.tramos, this.#pista.totalSegs);
        const curve = this.#ruta.curve;
        if (!curve) return;

        const inicio = this.#ruta.inicio;
        this.#conductor.carro = new Carro(inicio.x, inicio.z, inicio.angle);

        // ── Capa 1: pasto ────────────────────────────────────────
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        this.#meshPasto = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
        this.#meshPasto.rotation.x = -Math.PI / 2;
        this.#meshPasto.position.y = -0.01;
        this.#meshPasto.receiveShadow = true;
        this.#meshPasto.visible = false;
        this.#scene.add(this.#meshPasto);

        // ── Capa 2: pista ────────────────────────────────────────
        const grupoPista = new MallaPistaDiseno(curve).construir();
        grupoPista.visible = false;
        this.#grupoPista   = grupoPista;
        this.#scene.add(grupoPista);

        // ── Capa 3: decoraciones de la pista ────────────────────
        for (const dec of this.#pista.decoraciones) {
            const obj = this.#crearObjeto(dec);
            if (!obj) continue;
            obj.construir(this.#scene);
            if (dec.tipo === 'senal_curva') {
                obj.setVisible(this.#mostrarSenales);
                this.#objetosSenales.push(obj);
            } else if (dec.tipo === 'flecha') {
                obj.setVisible(this.#mostrarFlechas);
                this.#objetosFlechas.push(obj);
            } else if (dec.tipo === 'poste') {
                obj.setVisible(this.#mostrarPostes);
                this.#objetosPostes.push(obj);
            } else {
                obj.setVisible(this.#mostrarObjetos);
                this.#objetos.push(obj);
            }
        }
    }

    // ── Posición en mundo a partir de datos relativos a la ruta ──
    #fabrica = new FabricaObjetoEscena();

    #crearObjeto({ tipo, prog, lado, dist, escala = 1, texto = '', direccion = 'derecha', conLuz = true }) {
        const pos  = this.#ruta.posicionEn(prog);
        const wx   = pos.x + Math.cos(pos.angle) * dist * lado;
        const wz   = pos.z - Math.sin(pos.angle) * dist * lado;
        const rotY = pos.angle;
        return this.#fabrica.crear(tipo, wx, wz, { escala, texto, direccion, rotY, lado, conLuz });
    }

    // ── Cargar auto ──────────────────────────────────────────────
    async cargar(tipo, color) {
        try {
            const gltf  = await VisorBase.cargarGLTF();
            const inner = VisorBase.construirGrupo(gltf, tipo, color);
            VisorBase.centrarGrupo(inner, 2.6);

            if (this.#carGroup) this.#scene.remove(this.#carGroup);
            const lean  = new THREE.Group(); lean.add(inner); this.#leanGroup = lean;
            const grupo = new THREE.Group(); grupo.add(lean);
            grupo.visible = this.#mostrarAuto;
            this.#scene.add(grupo);
            this.#carGroup = grupo;
        } catch (e) {
            console.error('[VisorDisenoGeneral.cargar]', e);
        }
    }

    // ── Loop de render ───────────────────────────────────────────
    iniciar() {
        if (this.#idAnimacion) return;
        this.#conductor.reiniciar();
        this.#tick();
    }

    detener() {
        cancelAnimationFrame(this.#idAnimacion);
        this.#idAnimacion = 0;
        this.#resizeObs?.disconnect();
        this.#resizeObs = null;
        for (const obj of this.#objetos)         obj.destruir(this.#scene);
        for (const obj of this.#objetosSenales)  obj.destruir(this.#scene);
        for (const obj of this.#objetosFlechas)  obj.destruir(this.#scene);
        for (const obj of this.#objetosPostes)   obj.destruir(this.#scene);
        this.#objetos = []; this.#objetosSenales = []; this.#objetosFlechas = []; this.#objetosPostes = [];
        this.#cielo?.destruir(this.#scene); this.#cielo = null;
        const gl = this.#renderer?.getContext();
        this.#renderer?.dispose();
        this.#renderer = null;
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
    }

    get #mov() { return this.#conductor.carro; }

    #tick(marca) {
        this.#idAnimacion = requestAnimationFrame(this.#funcionAnimacion);

        if (this.#mov) {
            this.#conductor.avanzar(marca, this.entradaAcel, this.entradaDireccion);

            if (this.#carGroup) {
                this.#carGroup.position.set(this.#mov.px, 0, this.#mov.pz);
                this.#carGroup.rotation.y = this.#mov.rotY;
            }
            if (this.#leanGroup) this.#leanGroup.rotation.z = this.#mov.carLean;

            this.#camaraChase.altura = this.alturaCamara;
            this.#camaraChase.actualizar(this.#mov.px, this.#mov.pz, this.#mov.velAngle, this.entradaDireccion);
        }

        if (this.#renderer && this.#scene) {
            this.#cielo?.actualizar(this.#camaraChase.camera);
            this.#renderer.render(this.#scene, this.#camaraChase.camera);
        }
    }
}

window.VisorDisenoPista = VisorDisenoPista;
