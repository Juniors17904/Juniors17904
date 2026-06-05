'use strict';

import * as THREE    from 'three';
import { Ruta }               from '../model/ruta.js';
import { VisorBase }          from './visor_base.js';
import { CamaraSeguimiento }  from './camaras/camara_seguimiento.js';

// ================================================================
// CLASS: VisorDisenoGeneral — vista 3D con cámara trasera del circuito
//        para la pantalla Diseño General.
//        Capas activables: pasto → pista → auto
// ================================================================
class VisorDisenoGeneral extends VisorBase {
    #canvas;
    #renderer     = null;
    #scene        = null;
    #camaraChase  = null;
    #raf          = 0;
    #ruta         = new Ruta();
    #sol          = null;
    #resizeObs    = null;

    #meshPasto   = null;   // THREE.Mesh  — plano de pasto
    #grupoPista  = null;   // THREE.Group — asfalto + bordillos + líneas
    #carGroup    = null;   // THREE.Group — auto 3D

    #mostrarPasto = false;
    #mostrarPista = false;
    #mostrarAuto  = false;
    #progreso     = 0;

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

    get mostrarPasto() { return this.#mostrarPasto; }
    get mostrarPista() { return this.#mostrarPista; }
    get mostrarAuto()  { return this.#mostrarAuto;  }

    constructor(canvas, tipoPista = 'ciudad') {
        super();
        this.#canvas = canvas;
        this.#initScene();
        this.#buildCircuito(tipoPista);
    }

    // ── Escena ───────────────────────────────────────────────────
    #initScene() {
        const W = this.#canvas.width  || window.innerWidth;
        const H = this.#canvas.height || window.innerHeight;

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
        this.#renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.4;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x4a9eca);
        this.#scene.fog        = new THREE.FogExp2(0x4a9eca, 0.018);

        this.#camaraChase = new CamaraSeguimiento(W / H, { seguirRotacion: true });

        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 1.2));
        this.#sol = new THREE.DirectionalLight(0xfffbe6, 2.2);
        this.#sol.castShadow = true;
        this.#sol.shadow.mapSize.set(1024, 1024);
        this.#sol.shadow.camera.near   =  1;
        this.#sol.shadow.camera.far    =  60;
        this.#sol.shadow.camera.left   = this.#sol.shadow.camera.bottom = -15;
        this.#sol.shadow.camera.right  = this.#sol.shadow.camera.top    =  15;
        this.#scene.add(this.#sol, this.#sol.target);

        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.5);
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
    #buildCircuito(tipoPista) {
        const pista = window.PISTAS?.[tipoPista];
        if (!pista?.tramos) return;

        this.#ruta.construir(pista.tramos, pista.totalSegs);
        const curve = this.#ruta.curve;
        if (!curve) return;

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

        // ── Capa 2: pista (asfalto + bordillos + líneas) ─────────
        const grupoPista = new THREE.Group();

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.DoubleSide });
        const road    = new THREE.Mesh(_ribbon(-4, 4, 0, 0, DIV), roadMat);
        road.receiveShadow = true;
        grupoPista.add(road);

        const curbW  = 0.7;
        const BAND   = 10;
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.7, side: THREE.DoubleSide });
        const whtMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7, side: THREE.DoubleSide });

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
                for (let j = 0; j < i1 - i0; j++) {
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
    }

    // ── Cargar auto ──────────────────────────────────────────────
    async cargar(tipo, color) {
        try {
            const gltf  = await VisorBase.cargarGLTF();
            const inner = VisorBase.construirGrupo(gltf, tipo, color);
            VisorBase.centrarGrupo(inner, 2.6);

            if (this.#carGroup) this.#scene.remove(this.#carGroup);
            const grupo = new THREE.Group();
            grupo.add(inner);
            grupo.visible = this.#mostrarAuto;
            this.#scene.add(grupo);
            this.#carGroup = grupo;
        } catch (e) {
            console.error('[VisorDisenoGeneral.cargar]', e);
        }
    }

    // ── Loop de render ───────────────────────────────────────────
    iniciar() {
        if (!this.#raf) this.#tick();
    }

    detener() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        this.#resizeObs?.disconnect();
        this.#resizeObs = null;
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());

        // El auto siempre avanza — la cámara siempre tiene dónde mirar
        this.#progreso = (this.#progreso + 0.00018) % 1;
        const pos = this.#ruta.posicionEn(this.#progreso);

        if (this.#carGroup) {
            this.#carGroup.position.set(pos.x, 0, pos.z);
            this.#carGroup.rotation.y = pos.angle;
        }

        // Sol sigue al auto
        this.#sol.position.set(pos.x + 10, 20, pos.z + 10);
        this.#sol.target.position.set(pos.x, 0, pos.z);
        this.#sol.target.updateMatrixWorld();

        // Cámara trasera sigue al auto
        this.#camaraChase.actualizar(pos.x, pos.z, pos.angle, 0);

        if (this.#renderer && this.#scene) {
            this.#renderer.render(this.#scene, this.#camaraChase.camera);
        }
    }
}

window.VisorDisenoGeneral = VisorDisenoGeneral;
