'use strict';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Helpers ──────────────────────────────────────────────────────
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
// CLASS: TestDrive3D — pista recta 3D con cámara chase
// ================================================================
class TestDrive3D {
    #renderer = null; #scene = null; #camera = null;
    #canvas; #carGroup = null; #raf = 0; #sun = null;
    #resizeHandler = null;
    #px = -2; #pz = 0; #rotY = 0; #speed = 0;
    #accel = 0; #maxSpeed = 0; #carLean = 0;
    #camRotY = 0;
    #leanGroup = null;
    #wheels = [];

    accelInput = 0;
    steerInput = 0;
    camHeight  = 2.8;

    get speed()    { return this.#speed; }
    get accel()    { return this.#accel; }
    get maxSpeed() { return this.#maxSpeed; }
    get camRotY()  { return this.#camRotY; }
    get physics()  { return { maxFwd:0.74, maxRev:0.28, accel:0.006, brake:0.026, drag:0.009, steer:0.010, camDist:7 }; }
    get px()       { return this.#px; }
    get pz()       { return this.#pz; }
    get rotY()     { return this.#rotY; }
    get rotZ()     { return this.#carLean; }

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

        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.5), lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(0, 0.02, z);
        this.#scene.add(line);
    }

    #addFinishArch(z) {
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
        const lean = new THREE.Group();
        lean.add(inner);
        this.#leanGroup = lean;
        const outer = new THREE.Group();
        outer.add(lean);
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
        const MAX_FWD = 0.74, MAX_REV = 0.28;
        const ACCEL = 0.006, BRAKE = 0.026, DRAG = 0.009, STEER = 0.010;
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

        const speedFactor = Math.abs(this.#speed) / 0.74;
        const targetLean = -this.steerInput * 0.22 * speedFactor;
        this.#carLean += (targetLean - this.#carLean) * 0.08;
        if (this.#leanGroup) this.#leanGroup.rotation.z = this.#carLean;

        const spin = this.#speed * 6;
        for (const w of this.#wheels) w.rotation.x += spin;
    }

    #updateCamera() {
        const D = 7;
        const cx = this.#px - Math.sin(this.#camRotY) * D;
        const cz = this.#pz - Math.cos(this.#camRotY) * D;
        this.#camera.position.set(cx, this.camHeight, cz);
        this.#camera.lookAt(this.#px, 0.6, this.#pz);
    }
}

window.TestDrive3D = TestDrive3D;
