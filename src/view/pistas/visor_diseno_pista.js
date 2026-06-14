'use strict';

import * as THREE    from 'three';
import { Ruta } from '../../model/ruta.js';
import { Carro }             from '../../model/carros/carro.js';
import { VisorBase }         from '../visor_base.js';
import { CamaraSeguimiento } from '../camaras/camara_seguimiento.js';
import { FabricaObjetoEscena } from '../objetos/fabrica_objeto_escena.js';
import { CieloSoleado }  from '../cielo_soleado.js';
import { CieloNocturno } from '../cielo_nocturno.js';

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
    #mov         = null;
    #sol         = null;
    #resizeObs   = null;

    #pista      = null;
    #objetos        = [];
    #objetosSenales = [];
    #objetosFlechas = [];
    #objetosPostes  = [];
    #funcionAnimacion     = () => this.#tick();

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
        this.#renderer.toneMappingExposure = 1.4;

        this.#scene = new THREE.Scene();
        const tipoCielo  = this.#pista?.tipoCielo ?? 'soleado';
        const colorCielo = this.#pista?.cielo ?? '#4a9eca';
        this.#cielo = tipoCielo === 'soleado'
            ? new CieloSoleado(colorCielo)
            : new CieloNocturno(colorCielo, { sinLuna: true });
        this.#cielo.construir(this.#scene);

        if (tipoCielo === 'nocturno') this.#agregarLuna3D();

        this.#camaraChase = new CamaraSeguimiento(W / H, { seguirRotacion: true });

        this.#scene.add(new THREE.AmbientLight(0x8899bb, 0.28));
        this.#sol = new THREE.DirectionalLight(0xaabbdd, 0.35);
        this.#scene.add(this.#sol, this.#sol.target);
        const posSol = this.#cielo.posicionSol;
        if (posSol) this.#sol.position.copy(posSol);
        else this.#sol.position.set(6, 10, 4);

        const fill = new THREE.DirectionalLight(0x8899cc, 0.12);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);

        this.#resizeObs = new ResizeObserver(() => this.#resize());
        this.#resizeObs.observe(this.#canvas);
    }

    #agregarLuna3D() {
        const pos = new THREE.Vector3(-60, 200, -400);

        // Anillo oscuro grueso — contraste fuerte para definir el borde
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x04080f, depthWrite: false, side: THREE.DoubleSide });
        const ring    = new THREE.Mesh(new THREE.RingGeometry(11.5, 14.5, 64), ringMat);
        ring.position.copy(pos);
        ring.lookAt(0, pos.y, 0);
        this.#scene.add(ring);

        // Disco lunar — color crema medio (no blanco puro) para evitar bloom del toneMapping
        const discoMat = new THREE.MeshBasicMaterial({ color: 0xff0000, depthWrite: false, side: THREE.DoubleSide });
        const disco    = new THREE.Mesh(new THREE.CircleGeometry(11.5, 64), discoMat);
        disco.position.copy(pos);
        disco.lookAt(0, pos.y, 0);
        this.#scene.add(disco);
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
        this.#mov = new Carro(inicio.x, inicio.z, inicio.angle);

        const DIV = 800;
        const cp  = curve.getPoints(DIV);

        const _perp = i => {
            const a = cp[i], b = cp[(i + 1) % cp.length];
            let tx = b.x - a.x, tz = b.z - a.z;
            let L  = Math.sqrt(tx*tx + tz*tz);
            if (L < 0.0001) {
                const prev = cp[(i - 1 + cp.length) % cp.length];
                tx = a.x - prev.x; tz = a.z - prev.z;
                L  = Math.sqrt(tx*tx + tz*tz) || 1;
            }
            return { px: -tz / L, pz: tx / L };
        };

        const _ribbon = (lo, ro, y, i0, i1) => {
            const pos = [], nor = [], uv = [], idx = [];
            for (let i = i0; i <= i1; i++) {
                const q = cp[i % cp.length];
                const { px, pz } = _perp(i % cp.length);
                const u = (i - i0) / (i1 - i0 || 1);
                pos.push(q.x + px*lo, y, q.z + pz*lo,
                         q.x + px*ro, y, q.z + pz*ro);
                nor.push(0,1,0, 0,1,0);
                uv.push(0,u, 1,u);
            }
            for (let i = 0; i < i1 - i0; i++) {
                const a = i*2, b = a+1, c = a+2, d = a+3;
                idx.push(a,c,b, b,c,d);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            g.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
            g.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
            g.setIndex(idx);
            return g;
        };

        // ── Capa 1: pasto ────────────────────────────────────────
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        this.#meshPasto = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
        this.#meshPasto.rotation.x = -Math.PI / 2;
        this.#meshPasto.position.y = -0.01;
        this.#meshPasto.receiveShadow = true;
        this.#meshPasto.visible = false;
        this.#scene.add(this.#meshPasto);

        // ── Capa 2: pista ────────────────────────────────────────
        const grupoPista = new THREE.Group();

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.DoubleSide });
        const road    = new THREE.Mesh(_ribbon(-4, 4, 0, 0, DIV), roadMat);
        road.receiveShadow = true;
        grupoPista.add(road);

        const curbW = 0.7, BAND = 10;
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.3, emissive: 0xaa0000, emissiveIntensity: 0.25, side: THREE.DoubleSide });
        const whtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.2,  side: THREE.DoubleSide });

        const _buildCurbs = (lo, ro) => {
            const rPos=[], rNor=[], rIdx=[], wPos=[], wNor=[], wIdx=[];
            for (let b = 0; b * BAND <= DIV; b++) {
                const i0 = b * BAND, i1 = Math.min((b+1)*BAND, DIV);
                const pos = b%2===0 ? rPos : wPos;
                const nor = b%2===0 ? rNor : wNor;
                const idx = b%2===0 ? rIdx : wIdx;
                const v0  = pos.length / 3;
                for (let i = i0; i <= i1; i++) {
                    const q = cp[i % cp.length];
                    const { px, pz } = _perp(i % cp.length);
                    pos.push(q.x + px*lo, 0.04, q.z + pz*lo);
                    pos.push(q.x + px*ro, 0.04, q.z + pz*ro);
                    nor.push(0,1,0, 0,1,0);
                }
                for (let j = 0; j < i1-i0; j++) {
                    const a = v0+j*2, b2 = a+1, c = a+2, d = a+3;
                    idx.push(a,c,b2, b2,c,d);
                }
            }
            const _geo = (p, n, i) => {
                const g = new THREE.BufferGeometry();
                g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
                g.setAttribute('normal',   new THREE.Float32BufferAttribute(n, 3));
                g.setIndex(i);
                return g;
            };
            if (rPos.length) grupoPista.add(new THREE.Mesh(_geo(rPos, rNor, rIdx), redMat));
            if (wPos.length) grupoPista.add(new THREE.Mesh(_geo(wPos, wNor, wIdx), whtMat));
        };
        _buildCurbs(-4 - curbW, -4);
        _buildCurbs(4, 4 + curbW);

        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const DASH = 10, GAP = 10;
        for (let i = 0; i < DIV; i += DASH + GAP) {
            grupoPista.add(new THREE.Mesh(_ribbon(-0.12, 0.12, 0.005, i, Math.min(i+DASH, DIV)), dashMat));
        }
        grupoPista.add(new THREE.Mesh(_ribbon(-4, 4, 0.015, 0, 5), new THREE.MeshBasicMaterial({ color: 0xffffff })));

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
        if (!this.#idAnimacion) this.#tick();
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

    #tick() {
        this.#idAnimacion = requestAnimationFrame(this.#funcionAnimacion);

        if (this.#mov) {
            this.#mov.entradaAcel = this.entradaAcel;
            this.#mov.entradaDireccion = this.entradaDireccion;
            this.#mov.actualizar();

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
