'use strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Ruta } from '../model/model_fisica.js';
import { Carro } from '../model/carros/carro.js';
import { CamaraChase } from './camaras/camara_chase.js';
import { CamaraAerea } from './camaras/camara_aerea.js';

// ── Helpers (igual que viewer3d.js) ─────────────────────────────
let _glbPromise = null;
function _loadGLTF() {
    if (!_glbPromise)
        _glbPromise = new GLTFLoader().loadAsync('src/assets/models/vehicles_pack.glb');
    return _glbPromise;
}

const _MAPA = {
    deportivo: 'Sports', suv: 'SUV', muscle: 'Muscle',
    formula: 'Roadster', pickup: 'Pickup', clasico: 'Limousine',
};

function _esCarroceria(name) {
    const l = name.toLowerCase();
    return l.includes('body') && !l.includes('black') && !l.includes('white');
}

function _buildGroup(gltf, tipo, color) {
    const prefix = _MAPA[tipo] ?? 'Sports';
    const group  = new THREE.Group();
    const names  = [
        prefix,
        `${prefix}_wheel_front_right`, `${prefix}_wheel_front_left`,
        `${prefix}_wheel_rear_right`,  `${prefix}_wheel_rear_left`,
    ];
    for (const n of names) {
        const nodo = gltf.scene.getObjectByName(n);
        if (!nodo) continue;
        const clone = nodo.clone();
        clone.traverse(child => {
            if (!child.isMesh) return;
            child.material = child.material.clone();
            child.castShadow = true;
            child.receiveShadow = true;
            if (_esCarroceria(child.name)) child.material.color.set(color);
        });
        group.add(clone);
    }
    return group;
}

function _centerGroup(group, targetDim) {
    const box  = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    group.scale.setScalar(targetDim / Math.max(size.x, size.z));
    const box2   = new THREE.Box3().setFromObject(group);
    const center = box2.getCenter(new THREE.Vector3());
    group.position.set(-center.x, -box2.min.y, -center.z);
    return box2;
}



// ================================================================
// CLASS: CircuitoUrbano — pista 3D con curvas reales desde tramos
// ================================================================
class CircuitoUrbano {
    #renderer = null; #scene = null; #camaraChase = null;
    #canvas; #raf = 0; #sun = null;
    #carGroup = null; #leanGroup = null; #wheels = [];
    #resizeHandler = null;

    #ruta = new Ruta();
    #camAerea = null;
    #camAereaActiva = false;
    #mov = null;
    #dirArrow = null;

    #progress = 0;
    #lateral  = 0;

    accelInput = 0;
    steerInput = 0;
    camHeight  = 2.8;

    get speed()    { return this.#mov?.speed    ?? 0; }
    get accel()    { return this.#mov?.accel    ?? 0; }
    get maxSpeed() { return this.#mov?.maxSpeed ?? 0; }
    get progress() { return this.#progress; }
    get rotY()     { return this.#mov?.rotY     ?? 0; }
    get rotZ()     { return this.#mov?.carLean  ?? 0; }
    get px()       { return this.#mov?.px       ?? 0; }
    get pz()       { return this.#mov?.pz       ?? 0; }
    get camRotY()      { return this.#mov?.rotY ?? 0; }
    get physics()      { return { maxFwd:0.74, maxRev:0.28, accel:0.006, brake:0.026, drag:0.009, steer:0.010, camDist:7 }; }
    get pathPos()      { return this.#ruta.posicionEn(this.#progress); }
    get lateral()      { return this.#lateral; }
    get pathLen()      { return this.#ruta.longitud; }
    get camAereaActiva() { return this.#camAereaActiva; }
    get camAerea()     { return this.#camAerea; }
    get contextLost()  { return this.#renderer?.getContext()?.isContextLost() ?? true; }
    pathSamples(n) { return this.#ruta.muestras(n); }

    toggleCamaraAerea() {
        this.#camAereaActiva = !this.#camAereaActiva;
        if (this.#camAereaActiva) {
            if (!this.#camAerea) this.#camAerea = new CamaraAerea(this.#camaraChase.camera.aspect);
            this.#camAerea.activar(this.#mov.px, this.#mov.pz);
            this.#scene.fog = null;
        } else {
            if (this.#camAerea) { this.#camAerea.moveX = 0; this.#camAerea.moveZ = 0; }
            this.#scene.fog = new THREE.FogExp2(0x4a9eca, 0.018);
        }
        return this.#camAereaActiva;
    }

    setCamAereaAltura(sliderVal) { this.#camAerea?.setAltura(sliderVal); }

    constructor(canvas, tipoPista = 'ciudad') {
        this.#canvas = canvas;
        this.#initScene();
        this.#cargarRuta(tipoPista);
        this.#buildRoad();
    }

    // ── Escena ───────────────────────────────────────────────────
    #initScene() {
        const W = window.innerWidth, H = window.innerHeight;
        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.4;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x4a9eca);
        this.#scene.fog = new THREE.FogExp2(0x4a9eca, 0.018);

        this.#camaraChase = new CamaraChase(W / H, { seguirRotacion: false });

        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 1.2));
        this.#sun = new THREE.DirectionalLight(0xfffbe6, 2.2);
        this.#sun.castShadow = true;
        this.#sun.shadow.mapSize.set(1024, 1024);
        this.#sun.shadow.camera.near = 1; this.#sun.shadow.camera.far = 60;
        this.#sun.shadow.camera.left = -15; this.#sun.shadow.camera.right = 15;
        this.#sun.shadow.camera.top  =  15; this.#sun.shadow.camera.bottom = -15;
        this.#scene.add(this.#sun, this.#sun.target);
        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.5);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);
    }

    // ── Cargar ruta desde la pista ───────────────────────────────
    #cargarRuta(tipoPista) {
        try {
            const pista = window.PISTAS?.[tipoPista];
            if (!pista?.tramos) {
                window.__modelErrors = window.__modelErrors || [];
                window.__modelErrors.push(`[pista_ciudad] PISTAS.${tipoPista} no encontrado — ¿cargó model.js?`);
                return;
            }
            this.#ruta.construir(pista.tramos, pista.totalSegs);
            const inicio = this.#ruta.inicio;
            this.#mov = new Carro(inicio.x, inicio.z, inicio.angle);
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[pista_ciudad] ' + e.message);
            console.error('[pista_ciudad.js #cargarRuta]', e);
        }
    }

    // ── Construir pista curva ────────────────────────────────────
    #buildRoad() {
        const curve = this.#ruta.curve;
        if (!curve) return;

        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.01;
        grass.receiveShadow = true;
        this.#scene.add(grass);

        const DIV = 800;
        const cp  = curve.getPoints(DIV); // DIV+1 puntos, cp[DIV]=cp[0] para cerrar el loop

        const _perp = i => {
            const a = cp[i], b = cp[(i + 1) % cp.length];
            let tx = b.x - a.x, tz = b.z - a.z;
            let L  = Math.sqrt(tx*tx + tz*tz);
            if (L < 0.0001) {
                const prev = cp[(i - 1 + cp.length) % cp.length];
                tx = a.x - prev.x; tz = a.z - prev.z;
                L = Math.sqrt(tx*tx + tz*tz) || 1;
            }
            return { px: -tz/L, pz: tx/L };
        };

        const _ribbon = (lo, ro, y, i0, i1) => {
            const pos = [], nor = [], uv = [], idx = [];
            for (let i = i0; i <= i1; i++) {
                const q = cp[i % cp.length];
                const { px, pz } = _perp(i % cp.length);
                const u = (i - i0) / (i1 - i0 || 1);
                pos.push(q.x + px*lo, y, q.z + pz*lo, q.x + px*ro, y, q.z + pz*ro);
                nor.push(0,1,0, 0,1,0);
                uv.push(0,u, 1,u);
            }
            for (let i = 0; i < i1 - i0; i++) {
                const a=i*2, b=a+1, c=a+2, d=a+3;
                idx.push(a,c,b, b,c,d);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            g.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
            g.setAttribute('uv',       new THREE.Float32BufferAttribute(uv, 2));
            g.setIndex(idx);
            return g;
        };

        const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.DoubleSide });
        const road = new THREE.Mesh(_ribbon(-4, 4, 0, 0, DIV), roadMat);
        road.receiveShadow = true;
        this.#scene.add(road);

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
                for (let j = 0; j < i1-i0; j++) {
                    const a=v0+j*2, b2=a+1, c=a+2, d=a+3;
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
            if (rPos.length) this.#scene.add(new THREE.Mesh(_geo(rPos,rNor,rIdx), redMat));
            if (wPos.length) this.#scene.add(new THREE.Mesh(_geo(wPos,wNor,wIdx), whtMat));
        };
        _buildCurbs(-4-curbW, -4);
        _buildCurbs(4, 4+curbW);

        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const DASH = 10, GAP = 10;
        for (let i = 0; i < DIV; i += DASH+GAP) {
            this.#scene.add(new THREE.Mesh(_ribbon(-0.12, 0.12, 0.005, i, Math.min(i+DASH, DIV)), dashMat));
        }

        const finMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.#scene.add(new THREE.Mesh(_ribbon(-4, 4, 0.015, 0, 5), finMat));
    }

    // ── Cargar auto ──────────────────────────────────────────────
    async cargar(tipo, color) {
        try {
            const gltf = await _loadGLTF();
            this.#setCar(gltf, tipo, color);
        } catch(e) { console.error('CircuitoUrbano:', e); }
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) { this.#scene.remove(this.#carGroup); this.#carGroup = null; }
        const inner = _buildGroup(gltf, tipo, color);
        _centerGroup(inner, 2.6);
        const lean = new THREE.Group(); lean.add(inner); this.#leanGroup = lean;
        const outer = new THREE.Group(); outer.add(lean);
        this.#scene.add(outer); this.#carGroup = outer;
        this.#wheels = [];
        const prefix = _MAPA[tipo] ?? 'Sports';
        for (const w of ['front_right', 'front_left', 'rear_right', 'rear_left']) {
            const node = inner.getObjectByName(`${prefix}_wheel_${w}`);
            if (node) this.#wheels.push(node);
        }
    }

    // ── Loop principal ───────────────────────────────────────────
    iniciar() {
        if (!this.#raf) {
            this.#resizeHandler = () => {
                const W = window.innerWidth, H = window.innerHeight;
                this.#canvas.width = W; this.#canvas.height = H;
                this.#camaraChase.resize(W / H);
                this.#camAerea?.resize(W / H);
                this.#renderer?.setSize(W, H, false);
            };
            window.addEventListener('resize', this.#resizeHandler);
            window.addEventListener('orientationchange', () => setTimeout(this.#resizeHandler, 120));
            this.#tick();
        }
    }

    detener() {
        cancelAnimationFrame(this.#raf); this.#raf = 0;
        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
            this.#resizeHandler = null;
        }
        this.#renderer?.dispose(); this.#renderer = null;
    }

    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());
        if (this.#camAereaActiva) {
            this.#camAerea.actualizar();
        } else {
            this.#updatePhysics();
            this.#camaraChase.altura = this.camHeight;
            this.#camaraChase.actualizar(this.#mov.px, this.#mov.pz, this.#mov.rotY);
        }
        this.#sun.position.set(this.#mov.px + 10, 20, this.#mov.pz + 10);
        this.#sun.target.position.set(this.#mov.px, 0, this.#mov.pz);
        this.#sun.target.updateMatrixWorld();
        const cam = this.#camAereaActiva ? this.#camAerea.camera : this.#camaraChase.camera;
        this.#renderer.render(this.#scene, cam);
    }

    // ── Física ───────────────────────────────────────────────────
    #updatePhysics() {
        this.#mov.accelInput = this.accelInput;
        this.#mov.steerInput = this.steerInput;
        this.#mov.actualizar();

        if (this.#ruta.longitud > 0) {
            this.#progress = ((this.#progress + this.#mov.speed / this.#ruta.longitud) % 1 + 1) % 1;

            // Límite suave: empujar de vuelta si se aleja más de 3.8 del trazado
            const p = this.#ruta.posicionEn(this.#progress);
            const dx = this.#mov.px - p.x, dz = this.#mov.pz - p.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const perpX = Math.cos(p.angle), perpZ = -Math.sin(p.angle);
            this.#lateral = dx * perpX + dz * perpZ;
            if (dist > 3.8) {
                this.#mov.setPosicion(
                    p.x + (dx / dist) * 3.8 * 0.90,
                    p.z + (dz / dist) * 3.8 * 0.90
                );
            }
        }

        if (this.#carGroup) {
            this.#carGroup.position.set(this.#mov.px, 0, this.#mov.pz);
            this.#carGroup.rotation.y = this.#mov.rotY;
        }
        if (this.#leanGroup) this.#leanGroup.rotation.z = this.#mov.carLean;
        for (const w of this.#wheels) w.rotation.x += this.#mov.speed * 6;

        const dir = new THREE.Vector3(Math.sin(this.#mov.rotY), 0, Math.cos(this.#mov.rotY));
        const origin = new THREE.Vector3(this.#mov.px, 0.5, this.#mov.pz);
        if (!this.#dirArrow) {
            this.#dirArrow = new THREE.ArrowHelper(dir, origin, 6, 0xffff00, 1.5, 0.8);
            this.#scene.add(this.#dirArrow);
        }
        this.#dirArrow.position.copy(origin);
        this.#dirArrow.setDirection(dir);
    }


}

window.CircuitoUrbano = CircuitoUrbano;
