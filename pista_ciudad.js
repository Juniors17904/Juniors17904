'use strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Helpers (igual que viewer3d.js) ─────────────────────────────
let _glbPromise = null;
function _loadGLTF() {
    if (!_glbPromise)
        _glbPromise = new GLTFLoader().loadAsync('models/vehicles_pack.glb');
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
// CLASS: Ruta — recorrido cerrado del circuito (puntos + longitud)
// ================================================================
class Ruta {
    #puntos   = [];   // {x, z, angle}[]
    #segs     = [];   // longitud de cada segmento
    #longitud = 0;

    get longitud() { return this.#longitud; }
    get puntos()   { return this.#puntos; }
    get inicio()   { return this.#puntos[0]; }

    construir(tramos, totalSegs) {
        const paso = 4;
        let x = 0, z = 0, angle = 0;
        const pts = [{ x, z, angle }];
        for (let i = 0; i < totalSegs; i++) {
            const tr = tramos.find(([d, h]) => i >= d && i < h);
            angle += (tr ? tr[2] : 0) * 0.045;
            x += Math.sin(angle) * paso;
            z += Math.cos(angle) * paso;
            pts.push({ x, z, angle });
        }
        const last = pts[pts.length - 1];
        pts.push({ x: pts[0].x, z: pts[0].z, angle: last.angle });
        this.#puntos = pts;

        let total = 0;
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i+1].x - pts[i].x, dz = pts[i+1].z - pts[i].z;
            const d  = Math.sqrt(dx*dx + dz*dz);
            this.#segs.push(d); total += d;
        }
        this.#longitud = total;
    }

    posicionEn(prog) {
        let t = ((prog % 1) + 1) % 1 * this.#longitud;
        const p = this.#puntos;
        for (let i = 0; i < this.#segs.length; i++) {
            if (t <= this.#segs[i]) {
                const f = t / this.#segs[i];
                return {
                    x:     p[i].x + f * (p[i+1].x - p[i].x),
                    z:     p[i].z + f * (p[i+1].z - p[i].z),
                    angle: p[i].angle + f * (p[i+1].angle - p[i].angle),
                };
            }
            t -= this.#segs[i];
        }
        return p[0];
    }

    muestras(n) {
        return Array.from({ length: n }, (_, i) => this.posicionEn(i / n));
    }
}

// ================================================================
// CLASS: CircuitoUrbano — pista 3D con curvas reales desde tramos
// ================================================================
class CircuitoUrbano {
    #renderer = null; #scene = null; #camera = null;
    #canvas; #raf = 0; #sun = null;
    #carGroup = null; #leanGroup = null; #wheels = [];
    #resizeHandler = null;

    #ruta = new Ruta();

    // Estado del auto
    #progress = 0;
    #lateral  = 0;
    #speed    = 0;
    #accel    = 0;
    #maxSpeed = 0;
    #carLean  = 0;
    #px = 0; #pz = 0; #rotY = 0;

    accelInput = 0;
    steerInput = 0;
    camHeight  = 2.8;

    get speed()    { return this.#speed; }
    get accel()    { return this.#accel; }
    get maxSpeed() { return this.#maxSpeed; }
    get progress() { return this.#progress; }
    get rotY()     { return this.#rotY; }
    get rotZ()     { return this.#carLean; }
    get px()       { return this.#px; }
    get pz()       { return this.#pz; }
    get camRotY()  { return this.#rotY; }
    get physics()  { return { maxFwd:0.74, maxRev:0.28, accel:0.006, brake:0.026, drag:0.009, steer:0.010, camDist:7 }; }
    get pathPos()  { return this.#ruta.posicionEn(this.#progress); }
    get lateral()  { return this.#lateral; }
    get pathLen()  { return this.#ruta.longitud; }
    pathSamples(n) { return this.#ruta.muestras(n); }

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

        this.#camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);

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
        const pista = window.PISTAS?.[tipoPista];
        if (!pista?.tramos) return;
        this.#ruta.construir(pista.tramos, pista.totalSegs);
        const inicio = this.#ruta.inicio;
        this.#px = inicio.x; this.#pz = inicio.z; this.#rotY = inicio.angle;
    }

    // ── Construir pista curva ────────────────────────────────────
    #buildRoad() {
        const pts = this.#ruta.puntos;
        if (pts.length < 2) return;

        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.01;
        grass.receiveShadow = true;
        this.#scene.add(grass);

        const curve = new THREE.CatmullRomCurve3(
            pts.slice(0, -1).map(p => new THREE.Vector3(p.x, 0, p.z)),
            true
        );
        const DIV = Math.max(pts.length * 3, 600);
        const cp  = curve.getPoints(DIV);

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
        const road = new THREE.Mesh(_ribbon(-4, 4, 0, 0, DIV - 1), roadMat);
        road.receiveShadow = true;
        this.#scene.add(road);

        const curbW  = 0.7;
        const BAND   = 10;
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.7, side: THREE.DoubleSide });
        const whtMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7, side: THREE.DoubleSide });

        const _buildCurbs = (lo, ro) => {
            const rPos=[], rNor=[], rIdx=[], wPos=[], wNor=[], wIdx=[];
            for (let b = 0; b * BAND < DIV; b++) {
                const i0 = b * BAND, i1 = Math.min((b+1)*BAND, DIV - 1);
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
        for (let i = 0; i < DIV - 1; i += DASH+GAP) {
            this.#scene.add(new THREE.Mesh(_ribbon(-0.12, 0.12, 0.005, i, Math.min(i+DASH, DIV - 1)), dashMat));
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
                this.#camera.aspect = W / H;
                this.#camera.updateProjectionMatrix();
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
        this.#updatePhysics();
        this.#updateCamera();
        this.#sun.position.set(this.#px + 10, 20, this.#pz + 10);
        this.#sun.target.position.set(this.#px, 0, this.#pz);
        this.#sun.target.updateMatrixWorld();
        this.#renderer.render(this.#scene, this.#camera);
    }

    // ── Física ───────────────────────────────────────────────────
    #updatePhysics() {
        const MAX_FWD = 0.74, MAX_REV = 0.28, ACCEL = 0.006, BRAKE = 0.026, DRAG = 0.009;
        const prev = this.#speed;

        if (this.accelInput === 1)       this.#speed = Math.min(MAX_FWD, this.#speed + ACCEL);
        else if (this.accelInput === -1) {
            if (this.#speed > 0.01) this.#speed = Math.max(0, this.#speed - BRAKE);
            else                    this.#speed = Math.max(-MAX_REV, this.#speed - ACCEL * 0.6);
        } else {
            if (this.#speed > 0) this.#speed = Math.max(0, this.#speed - DRAG);
            else                 this.#speed = Math.min(0, this.#speed + DRAG);
        }
        this.#accel = this.#speed - prev;
        if (Math.abs(this.#speed) > this.#maxSpeed) this.#maxSpeed = Math.abs(this.#speed);

        if (this.#ruta.longitud > 0) {
            this.#progress = ((this.#progress + this.#speed / this.#ruta.longitud) % 1 + 1) % 1;
            const p = this.#ruta.posicionEn(this.#progress);
            this.#lateral = Math.max(-3.5, Math.min(3.5, this.#lateral + this.steerInput * 0.015));
            this.#lateral *= 0.98;
            const perpX = Math.cos(p.angle), perpZ = -Math.sin(p.angle);
            this.#px   = p.x + perpX * this.#lateral;
            this.#pz   = p.z + perpZ * this.#lateral;
            this.#rotY = p.angle;
        }

        const sf = Math.abs(this.#speed) / 0.74;
        this.#carLean += (-this.steerInput * 0.22 * sf - this.#carLean) * 0.08;

        if (this.#carGroup) {
            this.#carGroup.position.set(this.#px, 0, this.#pz);
            this.#carGroup.rotation.y = this.#rotY;
        }
        if (this.#leanGroup) this.#leanGroup.rotation.z = this.#carLean;
        for (const w of this.#wheels) w.rotation.x += this.#speed * 6;
    }

    // ── Cámara chase ─────────────────────────────────────────────
    #updateCamera() {
        const D = 7;
        const cx = this.#px - Math.sin(this.#rotY) * D;
        const cz = this.#pz - Math.cos(this.#rotY) * D;
        this.#camera.position.set(cx, this.camHeight, cz);
        this.#camera.lookAt(
            this.#px + Math.sin(this.#rotY) * 4,
            0.6,
            this.#pz + Math.cos(this.#rotY) * 4
        );
    }
}

window.CircuitoUrbano = CircuitoUrbano;
