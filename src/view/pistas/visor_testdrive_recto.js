'use strict';
import * as THREE from 'three';
import { Carro } from '../../model/carros/carro.js';
import { CamaraSeguimiento as CamaraChase } from '../camaras/camara_seguimiento.js';
import { VisorBase } from '../visor_base.js';
import { Cielo } from '../cielo.js';

// ================================================================
// CLASS: TestDrive3D — pista recta 3D con cámara chase
// ================================================================
class VisorTestdriveRecto extends VisorBase {
    #renderer = null; #scene = null; #camaraChase = null;
    #canvas; #carGroup = null; #raf = 0; #sun = null; #cielo = null;
    #tickFn = () => this.#tick();
    #resizeHandler = null;
    #carro = null;
    #leanGroup = null;
    #wheels = [];

    accelInput = 0;
    steerInput = 0;
    camHeight  = 2.8;

    get speed()    { return this.#carro?.speed    ?? 0; }
    get accel()    { return this.#carro?.accel    ?? 0; }
    get maxSpeed() { return this.#carro?.maxSpeed ?? 0; }
    get camRotY()  { return 0; }
    get physics()  { return { maxFwd:0.74, maxRev:0.28, accel:0.006, brake:0.026, drag:0.009, steer:0.010, camDist:7 }; }
    get px()       { return this.#carro?.px       ?? -2; }
    get pz()       { return this.#carro?.pz       ?? 0; }
    get rotY()     { return this.#carro?.rotY     ?? 0; }
    get rotZ()     { return this.#carro?.carLean  ?? 0; }

    constructor(canvas) {
        super();
        this.#canvas = canvas;
        this.#canvas.width  = window.innerWidth;
        this.#canvas.height = window.innerHeight;
        this.#carro = new Carro(-2, 0, 0);
        this.#init();
    }

    async cargar(tipo, color) {
        try {
            const gltf = await VisorBase.cargarGLTF();
            this.#setCar(gltf, tipo, color);
        } catch (e) { console.error('TestDrive3D:', e); }
    }

    iniciar() {
        if (!this.#raf) {
            this.#resizeHandler = () => {
                const W = window.innerWidth, H = window.innerHeight;
                this.#canvas.width = W;
                this.#canvas.height = H;
                this.#camaraChase.resize(W / H);
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
        this.#cielo?.destruir(this.#scene);
        this.#cielo = null;
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #init() {
        const W = this.#canvas.width, H = this.#canvas.height;

        this.#scene = new THREE.Scene();
        this.#cielo = new Cielo('#4a9eca');
        this.#cielo.construir(this.#scene);

        this.#camaraChase = new CamaraChase(W / H, { seguirRotacion: true });

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
        const inner = VisorBase.construirGrupo(gltf, tipo, color);
        VisorBase.centrarGrupo(inner, 2.6);
        const lean = new THREE.Group();
        lean.add(inner);
        this.#leanGroup = lean;
        const outer = new THREE.Group();
        outer.add(lean);
        this.#scene.add(outer);
        this.#carGroup = outer;
        this.#wheels = [];
        const prefix = VisorBase.MAPA[tipo] ?? 'Sports';
        for (const w of ['front_right', 'front_left', 'rear_right', 'rear_left']) {
            const node = inner.getObjectByName(`${prefix}_wheel_${w}`);
            if (node) this.#wheels.push(node);
        }
    }

    #tick() {
        this.#raf = requestAnimationFrame(this.#tickFn);
        this.#updatePhysics();
        this.#camaraChase.altura = this.camHeight;
        this.#camaraChase.actualizar(this.#carro.px, this.#carro.pz, 0);
        this.#sun.position.set(this.#carro.px + 10, 20, this.#carro.pz + 10);
        this.#sun.target.position.set(this.#carro.px, 0, this.#carro.pz);
        this.#sun.target.updateMatrixWorld();
        this.#cielo?.actualizar(this.#camaraChase.camera);
        this.#renderer.render(this.#scene, this.#camaraChase.camera);
    }

    #updatePhysics() {
        this.#carro.accelInput = this.accelInput;
        this.#carro.steerInput = this.steerInput;
        this.#carro.actualizar();

        const px = this.#carro.px, pz = this.#carro.pz;
        if (Math.abs(px) > 3.8)  this.#carro.setPosicion(px * 0.90, pz);
        if (this.#carro.pz >  950) this.#carro.setPosicion(this.#carro.px, this.#carro.pz - 1900);
        if (this.#carro.pz < -950) this.#carro.setPosicion(this.#carro.px, this.#carro.pz + 1900);

        if (this.#carGroup) {
            this.#carGroup.position.set(this.#carro.px, 0, this.#carro.pz);
            this.#carGroup.rotation.y = this.#carro.rotY;
        }
        if (this.#leanGroup) this.#leanGroup.rotation.z = this.#carro.carLean;

        const spin = this.#carro.speed * 6;
        for (const w of this.#wheels) w.rotation.x += spin;
    }


}

window.VisorTestdriveRecto = VisorTestdriveRecto;
// Alias de compatibilidad

