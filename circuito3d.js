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
// CLASS: Circuito3D — pista 3D con curvas reales desde tramos
// ================================================================
class Circuito3D {
    #renderer = null; #scene = null; #camera = null;
    #canvas; #raf = 0; #sun = null;
    #carGroup = null; #leanGroup = null; #wheels = [];
    #resizeHandler = null;

    // Path
    #pathPts  = [];   // {x, z, angle}[]  — un punto por segmento
    #pathLen  = 0;
    #segLens  = [];

    // Estado del auto
    #progress = 0;    // 0..1 a lo largo del circuito
    #lateral  = 0;    // desplazamiento lateral dentro de la pista (-3.5..3.5)
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

    constructor(canvas, tipoPista = 'ciudad') {
        this.#canvas = canvas;
        this.#initScene();
        this.#genPath(tipoPista);
        this.#buildRoad();
    }

    // ── Escena (igual que TestDrive3D) ───────────────────────────
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

    // ── Generar path desde tramos ────────────────────────────────
    #genPath(tipoPista) {
        const pista = window.PISTAS?.[tipoPista];
        if (!pista?.tramos) return;
        const paso = 4;
        let x = 0, z = 0, angle = 0;
        const pts = [{ x, z, angle }];
        for (let i = 0; i < pista.totalSegs; i++) {
            const tr = pista.tramos.find(([d, h]) => i >= d && i < h);
            angle += (tr ? tr[2] : 0) * 0.045;
            x += Math.sin(angle) * paso;
            z += Math.cos(angle) * paso;
            pts.push({ x, z, angle });
        }
        pts.push(pts[0]); // cerrar loop
        this.#pathPts = pts;

        let total = 0;
        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i+1].x - pts[i].x, dz = pts[i+1].z - pts[i].z;
            const d = Math.sqrt(dx*dx + dz*dz);
            this.#segLens.push(d); total += d;
        }
        this.#pathLen = total;
        this.#px = pts[0].x; this.#pz = pts[0].z; this.#rotY = pts[0].angle;
    }

    #posAt(prog) {
        let t = ((prog % 1) + 1) % 1 * this.#pathLen;
        const p = this.#pathPts;
        for (let i = 0; i < this.#segLens.length; i++) {
            if (t <= this.#segLens[i]) {
                const f = t / this.#segLens[i];
                return {
                    x:     p[i].x + f * (p[i+1].x - p[i].x),
                    z:     p[i].z + f * (p[i+1].z - p[i].z),
                    angle: p[i].angle + f * (p[i+1].angle - p[i].angle),
                };
            }
            t -= this.#segLens[i];
        }
        return p[0];
    }

    // ── Construir pista curva ─────────────────────────────────────
    #buildRoad() {
        const pts = this.#pathPts;
        if (pts.length < 2) return;

        // Pasto base
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.01;
        grass.receiveShadow = true;
        this.#scene.add(grass);

        // Asfalto: segmentos PlaneGeometry siguiendo el path
        const roadMat  = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.DoubleSide });
        const edgeMat  = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const curbRed  = new THREE.MeshStandardMaterial({ color: 0xff3333 });
        const curbWht  = new THREE.MeshStandardMaterial({ color: 0xfafafa });

        for (let i = 0; i < pts.length - 1; i++) {
            const dx = pts[i+1].x - pts[i].x, dz = pts[i+1].z - pts[i].z;
            const segLen = Math.sqrt(dx*dx + dz*dz) + 0.05; // slight overlap
            const mx = (pts[i].x + pts[i+1].x) / 2;
            const mz = (pts[i].z + pts[i+1].z) / 2;
            const ang = Math.atan2(dx, dz);

            // Asfalto
            const road = new THREE.Mesh(new THREE.PlaneGeometry(8, segLen), roadMat);
            road.rotation.x = -Math.PI / 2;
            road.rotation.z = -ang;
            road.position.set(mx, 0, mz);
            road.receiveShadow = true;
            this.#scene.add(road);

            // Línea central (cada 6 segmentos)
            if (i % 6 === 0) {
                const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.14, Math.min(segLen * 6, 2.5)), edgeMat);
                dash.rotation.x = -Math.PI / 2;
                dash.rotation.z = -ang;
                dash.position.set(mx, 0.01, mz);
                this.#scene.add(dash);
            }

            // Bordillos rojos/blancos
            const perp = { x: Math.cos(ang), z: -Math.sin(ang) };
            for (const side of [-1, 1]) {
                const cx = mx + perp.x * side * 4.35;
                const cz = mz + perp.z * side * 4.35;
                const curb = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.06, segLen),
                    i % 2 === 0 ? curbRed : curbWht
                );
                curb.rotation.y = ang;
                curb.position.set(cx, 0.03, cz);
                this.#scene.add(curb);
            }
        }

        // Línea de meta en pts[0]
        const ang0 = this.#pathPts[0].angle;
        const finish = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.2), edgeMat);
        finish.rotation.x = -Math.PI / 2;
        finish.rotation.z = -ang0;
        finish.position.set(pts[0].x, 0.02, pts[0].z);
        this.#scene.add(finish);
    }

    // ── Cargar auto (igual que TestDrive3D) ─────────────────────
    async cargar(tipo, color) {
        try {
            const gltf = await _loadGLTF();
            this.#setCar(gltf, tipo, color);
        } catch(e) { console.error('Circuito3D:', e); }
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

    // ── Física: avanza por el path + offset lateral para girar ──
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

        if (this.#pathLen > 0) {
            this.#progress = ((this.#progress + this.#speed / this.#pathLen) % 1 + 1) % 1;
            const p = this.#posAt(this.#progress);
            // Offset lateral (steer mueve izq/der dentro de la pista)
            this.#lateral = Math.max(-3.5, Math.min(3.5, this.#lateral + this.steerInput * 0.015));
            this.#lateral *= 0.98; // vuelve al centro suavemente
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

    // ── Cámara chase (igual que TestDrive3D original) ────────────
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

window.Circuito3D = Circuito3D;
