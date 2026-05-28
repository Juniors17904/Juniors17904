'use strict';

import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Utilidades compartidas (módulo) ──────────────────────────────
let _glbPromise = null;
function _loadGLTF() {
    if (!_glbPromise)
        _glbPromise = new GLTFLoader().loadAsync('models/vehicles_pack.glb');
    return _glbPromise;
}

const _MAPA = {
    deportivo: 'Sports',
    suv:       'SUV',
    muscle:    'Muscle',
    formula:   'Roadster',
    pickup:    'Pickup',
    clasico:   'Limousine',
};

function _esCarroceria(name) {
    const l = name.toLowerCase();
    return l.includes('body') && !l.includes('black') && !l.includes('white');
}

function _buildGroup(gltf, tipo, color) {
    const prefix = _MAPA[tipo] ?? 'Sports';
    const group  = new THREE.Group();
    const nombresGrupo = [
        prefix,
        `${prefix}_wheel_front_right`,
        `${prefix}_wheel_front_left`,
        `${prefix}_wheel_rear_right`,
        `${prefix}_wheel_rear_left`,
    ];
    for (const nombre of nombresGrupo) {
        const nodo = gltf.scene.getObjectByName(nombre);
        if (!nodo) continue;
        const clone = nodo.clone();
        clone.traverse(child => {
            if (!child.isMesh) return;
            child.material = child.material.clone();
            child.castShadow    = true;
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
// CLASS: Viewer3D — visor 3D interactivo con Three.js (garage)
// ================================================================
class Viewer3D {
    #renderer = null; #scene = null; #camera = null; #controls = null;
    #canvas; #raf = 0; #carGroup = null;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#initScene();
    }

    async cargar(tipo, color) {
        if (!this.#raf) this.#tick();
        try {
            const gltf = await _loadGLTF();
            this.#setCar(gltf, tipo, color);
        } catch (e) {
            console.error('Viewer3D:', e);
        }
    }

    cambiarColor(color) {
        if (!this.#carGroup) return;
        this.#carGroup.traverse(child => {
            if (child.isMesh && _esCarroceria(child.name))
                child.material.color.set(color);
        });
    }

    detener() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        this.#controls?.dispose();
        this.#renderer?.dispose();
    }

    #initScene() {
        const W = this.#canvas.width, H = this.#canvas.height;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x87ceeb);
        this.#scene.fog = new THREE.Fog(0x87ceeb, 18, 40);

        this.#camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
        this.#camera.position.set(4, 2.5, 5);

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.4;

        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 1.4));
        const sun = new THREE.DirectionalLight(0xfffbe6, 2.4);
        sun.position.set(6, 12, 6);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        this.#scene.add(sun);
        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.6);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);

        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: 0x7a9e6e, roughness: 0.85, metalness: 0.0 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.#scene.add(ground);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.9, 2.1, 48),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.4, transparent: true })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.005;
        this.#scene.add(ring);

        this.#controls = new OrbitControls(this.#camera, this.#canvas);
        this.#controls.enableDamping   = true;
        this.#controls.dampingFactor   = 0.07;
        this.#controls.enablePan       = false;
        this.#controls.minDistance     = 3;
        this.#controls.maxDistance     = 12;
        this.#controls.maxPolarAngle   = Math.PI * 0.50;
        this.#controls.autoRotate      = true;
        this.#controls.autoRotateSpeed = 1.8;
        this.#controls.target.set(0, 0.8, 0);
        this.#controls.addEventListener('start', () => { this.#controls.autoRotate = false; });
        this.#controls.addEventListener('end',   () => {
            setTimeout(() => { this.#controls.autoRotate = true; }, 2500);
        });
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) { this.#scene.remove(this.#carGroup); this.#carGroup = null; }
        const group = _buildGroup(gltf, tipo, color);
        const box2  = _centerGroup(group, 3.2);
        this.#scene.add(group);
        this.#carGroup = group;
        const carH = (box2.max.y - box2.min.y) * 0.5;
        this.#camera.position.set(4, 2.5, 5);
        this.#controls.target.set(0, carH, 0);
        this.#controls.update();
    }

    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());
        this.#controls.update();
        this.#renderer.render(this.#scene, this.#camera);
    }
}

// ================================================================
// CLASS: VisorJuego3D — carro 3D desde atrás para el juego
// ================================================================
class VisorJuego3D {
    #renderer = null; #scene = null; #camera = null;
    #canvas; #carGroup = null;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#init();
    }

    async cargar(tipo, color) {
        try {
            const gltf = await _loadGLTF();
            this.#setCar(gltf, tipo, color);
        } catch (e) { console.error('VisorJuego3D:', e); }
    }

    setTilt(t) {
        if (this.#carGroup) this.#carGroup.rotation.z = -t * 0.28;
    }

    render() {
        if (this.#renderer) this.#renderer.render(this.#scene, this.#camera);
    }

    detener() {
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #init() {
        const W = this.#canvas.width, H = this.#canvas.height;
        this.#scene  = new THREE.Scene();
        this.#camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 50);
        this.#camera.position.set(0, 1.6, -4.2);
        this.#camera.lookAt(0, 0.35, 0);

        this.#renderer = new THREE.WebGLRenderer({
            canvas: this.#canvas, antialias: true, alpha: true
        });
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.5;

        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 2.0));
        const sun = new THREE.DirectionalLight(0xfffbe6, 2.8);
        sun.position.set(3, 8, 5);
        this.#scene.add(sun);
        const fill = new THREE.DirectionalLight(0xc8e8ff, 1.0);
        fill.position.set(-3, 2, -2);
        this.#scene.add(fill);
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) { this.#scene.remove(this.#carGroup); this.#carGroup = null; }
        const group = _buildGroup(gltf, tipo, color);
        _centerGroup(group, 2.6);
        this.#scene.add(group);
        this.#carGroup = group;
    }
}

// ================================================================
// CLASS: TestDrive3D — pista 3D completa con cámara chase
// ================================================================
class TestDrive3D {
    #renderer = null; #scene = null; #camera = null;
    #canvas; #carGroup = null; #raf = 0; #sun = null;
    #resizeHandler = null;
    #px = 0; #pz = 0; #rotY = 0; #speed = 0;
    #accel = 0; #maxSpeed = 0;
    #wheels = [];

    accelInput = 0;
    steerInput = 0;

    get speed()    { return this.#speed; }
    get accel()    { return this.#accel; }
    get maxSpeed() { return this.#maxSpeed; }
    get px()       { return this.#px; }
    get pz()       { return this.#pz; }
    get rotY()     { return this.#rotY; }

    constructor(canvas) {
        this.#canvas = canvas;
        this.#canvas.width  = window.innerWidth;
        this.#canvas.height = window.innerHeight;
        this.#init();
    }

    async cargar(tipo, color) {
        try {
            const gltf = await _loadGLTF();
            this.#setCar(gltf, tipo, color);
        } catch (e) { console.error('TestDrive3D:', e); }
    }

    iniciar() {
        if (!this.#raf) {
            this.#resizeHandler = () => {
                const W = window.innerWidth, H = window.innerHeight;
                this.#canvas.width = W;
                this.#canvas.height = H;
                this.#camera.aspect = W / H;
                this.#camera.updateProjectionMatrix();
                this.#renderer?.setSize(W, H, false);
            };
            window.addEventListener('resize', this.#resizeHandler);
            // iOS Safari fires orientationchange instead of resize
            window.addEventListener('orientationchange', () => {
                setTimeout(this.#resizeHandler, 120);
            });
            this.#tick();
        }
    }

    detener() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
            this.#resizeHandler = null;
        }
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #init() {
        const W = this.#canvas.width, H = this.#canvas.height;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x4a9eca);
        this.#scene.fog = new THREE.FogExp2(0x4a9eca, 0.018);

        this.#camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.4;

        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 1.2));
        this.#sun = new THREE.DirectionalLight(0xfffbe6, 2.2);
        this.#sun.castShadow = true;
        this.#sun.shadow.mapSize.set(1024, 1024);
        this.#sun.shadow.camera.near = 1;
        this.#sun.shadow.camera.far  = 60;
        this.#sun.shadow.camera.left   = -15;
        this.#sun.shadow.camera.right  =  15;
        this.#sun.shadow.camera.top    =  15;
        this.#sun.shadow.camera.bottom = -15;
        this.#scene.add(this.#sun);
        this.#scene.add(this.#sun.target);
        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.5);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);

        this.#buildRoad();
    }

    #buildRoad() {
        const L = 2000;

        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(8, L),
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85 })
        );
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        this.#scene.add(road);

        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        for (const side of [-1, 1]) {
            const g = new THREE.Mesh(new THREE.PlaneGeometry(200, L), grassMat);
            g.rotation.x = -Math.PI / 2;
            g.position.set(side * 104, -0.01, 0);
            g.receiveShadow = true;
            this.#scene.add(g);
        }

        const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        for (const side of [-1, 1]) {
            const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, L), edgeMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(side * 3.9, 0.01, 0);
            this.#scene.add(line);
        }

        const dc = document.createElement('canvas');
        dc.width = 16; dc.height = 128;
        dc.getContext('2d').fillStyle = '#ffff88';
        dc.getContext('2d').fillRect(0, 0, 16, 64);
        const dTex = new THREE.CanvasTexture(dc);
        dTex.wrapT = THREE.RepeatWrapping;
        dTex.repeat.set(1, L / 8);
        const centerLine = new THREE.Mesh(
            new THREE.PlaneGeometry(0.14, L),
            new THREE.MeshBasicMaterial({ map: dTex, transparent: true })
        );
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.01;
        this.#scene.add(centerLine);

        const segLen = 3, nSegs = Math.floor(L / segLen);
        const curbGeo = new THREE.BoxGeometry(0.6, 0.06, segLen - 0.05);
        const iRed = new THREE.InstancedMesh(curbGeo, new THREE.MeshStandardMaterial({ color: 0xff3333 }), nSegs);
        const iWht = new THREE.InstancedMesh(curbGeo, new THREE.MeshStandardMaterial({ color: 0xfafafa }), nSegs);
        const dummy = new THREE.Object3D();
        let ri = 0, wi = 0;
        for (let i = 0; i < nSegs; i++) {
            const z = -L / 2 + i * segLen + segLen / 2;
            for (const side of [-1, 1]) {
                dummy.position.set(side * 4.35, 0.03, z);
                dummy.updateMatrix();
                if (i % 2 === 0) iRed.setMatrixAt(ri++, dummy.matrix);
                else             iWht.setMatrixAt(wi++, dummy.matrix);
            }
        }
        iRed.count = ri; iWht.count = wi;
        iRed.instanceMatrix.needsUpdate = true;
        iWht.instanceMatrix.needsUpdate = true;
        this.#scene.add(iRed, iWht);

        this.#addStartArch(50);
        this.#addFinishArch(700);
    }

    #addStartArch(z) {
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
        const barMat  = new THREE.MeshStandardMaterial({ color: 0xffffff });

        const poleGeo = new THREE.BoxGeometry(0.22, 5, 0.22);
        const barGeo  = new THREE.BoxGeometry(9.5, 0.35, 0.22);

        for (const side of [-1, 1]) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(side * 4.7, 2.5, z);
            pole.castShadow = true;
            this.#scene.add(pole);
        }
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(0, 5.1, z);
        bar.castShadow = true;
        this.#scene.add(bar);

        // "SALIDA" sign on the bar
        const sc = document.createElement('canvas');
        sc.width = 256; sc.height = 32;
        const sx = sc.getContext('2d');
        sx.fillStyle = '#22c55e';
        sx.fillRect(0, 0, 256, 32);
        sx.fillStyle = '#ffffff';
        sx.font = 'bold 22px Arial';
        sx.textAlign = 'center';
        sx.textBaseline = 'middle';
        sx.fillText('SALIDA', 128, 16);
        const sTex = new THREE.CanvasTexture(sc);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 0.5),
            new THREE.MeshBasicMaterial({ map: sTex, transparent: true })
        );
        sign.position.set(0, 5.5, z - 0.12);
        this.#scene.add(sign);

        // White line on road
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.02, z);
        this.#scene.add(line);
    }

    #addFinishArch(z) {
        // Checkered texture
        const fc = document.createElement('canvas');
        fc.width = 128; fc.height = 128;
        const fx = fc.getContext('2d');
        const sq = 16;
        for (let cx = 0; cx < fc.width; cx += sq) {
            for (let cy = 0; cy < fc.height; cy += sq) {
                fx.fillStyle = (Math.floor(cx / sq) + Math.floor(cy / sq)) % 2 === 0 ? '#111' : '#fff';
                fx.fillRect(cx, cy, sq, sq);
            }
        }
        const fTex = new THREE.CanvasTexture(fc);

        const poleMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        const barMat  = new THREE.MeshStandardMaterial({ map: fTex });

        const poleGeo = new THREE.BoxGeometry(0.22, 5, 0.22);
        const barGeo  = new THREE.BoxGeometry(9.5, 0.7, 0.22);

        for (const side of [-1, 1]) {
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(side * 4.7, 2.5, z);
            pole.castShadow = true;
            this.#scene.add(pole);
        }
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(0, 5.2, z);
        bar.castShadow = true;
        this.#scene.add(bar);

        // "META" sign
        const mc = document.createElement('canvas');
        mc.width = 256; mc.height = 32;
        const mx = mc.getContext('2d');
        mx.fillStyle = '#f97316';
        mx.fillRect(0, 0, 256, 32);
        mx.fillStyle = '#ffffff';
        mx.font = 'bold 22px Arial';
        mx.textAlign = 'center';
        mx.textBaseline = 'middle';
        mx.fillText('META', 128, 16);
        const mTex = new THREE.CanvasTexture(mc);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 0.5),
            new THREE.MeshBasicMaterial({ map: mTex, transparent: true })
        );
        sign.position.set(0, 5.9, z - 0.12);
        this.#scene.add(sign);

        // Checkered road line
        const rc = document.createElement('canvas');
        rc.width = 128; rc.height = 128;
        const rx = rc.getContext('2d');
        for (let cx = 0; cx < rc.width; cx += sq) {
            for (let cy = 0; cy < rc.height; cy += sq) {
                rx.fillStyle = (Math.floor(cx / sq) + Math.floor(cy / sq)) % 2 === 0 ? '#111' : '#fff';
                rx.fillRect(cx, cy, sq, sq);
            }
        }
        const rTex = new THREE.CanvasTexture(rc);
        const roadLine = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 1.2),
            new THREE.MeshBasicMaterial({ map: rTex })
        );
        roadLine.rotation.x = -Math.PI / 2;
        roadLine.position.set(0, 0.02, z);
        this.#scene.add(roadLine);
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) { this.#scene.remove(this.#carGroup); this.#carGroup = null; }
        const inner = _buildGroup(gltf, tipo, color);
        _centerGroup(inner, 2.6);
        // Wrap in outer group so physics moves the outer while
        // inner keeps its centering offset intact
        const outer = new THREE.Group();
        outer.add(inner);
        this.#scene.add(outer);
        this.#carGroup = outer;
        this.#wheels = [];
        const prefix = _MAPA[tipo] ?? 'Sports';
        for (const w of ['front_right', 'front_left', 'rear_right', 'rear_left']) {
            const node = inner.getObjectByName(`${prefix}_wheel_${w}`);
            if (node) this.#wheels.push(node);
        }
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

    #updatePhysics() {
        const MAX_FWD = 0.30, MAX_REV = 0.12;
        const ACCEL = 0.009, BRAKE = 0.014, DRAG = 0.005, STEER = 0.038;
        const prevSpeed = this.#speed;

        if (this.accelInput === 1) {
            this.#speed = Math.min(MAX_FWD, this.#speed + ACCEL);
        } else if (this.accelInput === -1) {
            if (this.#speed > 0.01) this.#speed = Math.max(0, this.#speed - BRAKE);
            else this.#speed = Math.max(-MAX_REV, this.#speed - ACCEL * 0.6);
        } else {
            if (this.#speed > 0) this.#speed = Math.max(0, this.#speed - DRAG);
            else                 this.#speed = Math.min(0, this.#speed + DRAG);
        }

        if (Math.abs(this.#speed) > 0.005)
            this.#rotY -= this.steerInput * STEER * Math.sign(this.#speed);

        this.#pz += Math.cos(this.#rotY) * this.#speed;
        this.#px += Math.sin(this.#rotY) * this.#speed;

        this.#accel = this.#speed - prevSpeed;
        if (Math.abs(this.#speed) > this.#maxSpeed) this.#maxSpeed = Math.abs(this.#speed);

        if (Math.abs(this.#px) > 3.8) this.#px *= 0.90;
        if (this.#pz >  950) this.#pz -= 1900;
        if (this.#pz < -950) this.#pz += 1900;

        if (this.#carGroup) {
            this.#carGroup.position.set(this.#px, 0, this.#pz);
            this.#carGroup.rotation.y = this.#rotY;
        }

        const spin = this.#speed * 6;
        for (const w of this.#wheels) w.rotation.x += spin;
    }

    #updateCamera() {
        const D = 7;
        const cx = this.#px - Math.sin(this.#rotY) * D;
        const cz = this.#pz - Math.cos(this.#rotY) * D;
        this.#camera.position.set(cx, 2.8, cz);
        this.#camera.lookAt(
            this.#px + Math.sin(this.#rotY) * 4,
            0.6,
            this.#pz + Math.cos(this.#rotY) * 4
        );
    }
}

window.Viewer3D     = Viewer3D;
window.VisorJuego3D = VisorJuego3D;
window.TestDrive3D  = TestDrive3D;
