'use strict';

import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ================================================================
// CLASS: Viewer3D — visor 3D interactivo con Three.js
// ================================================================
class Viewer3D {
    #renderer = null; #scene = null; #camera = null; #controls = null;
    #canvas; #raf = 0; #carGroup = null;

    static #promise = null;

    constructor(canvas) {
        this.#canvas = canvas;
        this.#initScene();
    }

    async cargar(tipo, color) {
        if (!this.#raf) this.#tick();
        try {
            const gltf = await Viewer3D.#loadGLTF();
            this.#setCar(gltf, tipo, color);
        } catch (e) {
            console.error('Viewer3D: error cargando GLB', e);
        }
    }

    cambiarColor(color) {
        if (!this.#carGroup) return;
        this.#carGroup.traverse(child => {
            if (child.isMesh && Viewer3D.#esCarroceria(child.name)) {
                child.material.color.set(color);
            }
        });
    }

    detener() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        this.#controls?.dispose();
        this.#renderer?.dispose();
    }

    // ── Escena Three.js ──────────────────────────────────────────
    #initScene() {
        const W = this.#canvas.width, H = this.#canvas.height;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x06060f);

        this.#camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
        this.#camera.position.set(4, 2.5, 5);

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.1;

        // Luces
        this.#scene.add(new THREE.AmbientLight(0xffffff, 0.8));

        const sun = new THREE.DirectionalLight(0xffffff, 1.8);
        sun.position.set(5, 10, 5);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        this.#scene.add(sun);

        const fill = new THREE.DirectionalLight(0x8899ff, 0.5);
        fill.position.set(-4, 3, -3);
        this.#scene.add(fill);

        // Suelo
        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: 0x12122a, roughness: 0.9, metalness: 0.1 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.#scene.add(ground);

        // Anillo neón en el suelo
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.9, 2.1, 48),
            new THREE.MeshBasicMaterial({ color: 0x7c3aed, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.005;
        this.#scene.add(ring);

        // OrbitControls con autorotación
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

        this.#controls.addEventListener('start', () => {
            this.#controls.autoRotate = false;
        });
        this.#controls.addEventListener('end', () => {
            setTimeout(() => { this.#controls.autoRotate = true; }, 2500);
        });
    }

    // ── Carga del GLB (singleton por sesión) ─────────────────────
    static #loadGLTF() {
        if (!Viewer3D.#promise) {
            Viewer3D.#promise = new GLTFLoader().loadAsync('models/vehicles_pack.glb');
        }
        return Viewer3D.#promise;
    }

    // ── Extraer y mostrar un carro del pack ───────────────────────
    #setCar(gltf, tipo, color) {
        if (this.#carGroup) {
            this.#scene.remove(this.#carGroup);
            this.#carGroup = null;
        }

        const prefix = Viewer3D.MAPA[tipo] ?? 'Sports';
        const group  = new THREE.Group();

        gltf.scene.traverse(node => {
            if (!node.isMesh) return;
            if (!node.name.startsWith(prefix + '_') &&
                !node.name.startsWith(prefix + ' wheel')) return;

            const mesh = node.clone();
            mesh.material = node.material.clone();
            mesh.castShadow    = true;
            mesh.receiveShadow = true;

            if (Viewer3D.#esCarroceria(node.name)) {
                mesh.material.color.set(color);
            }
            group.add(mesh);
        });

        // Centrar y escalar para que llene bien el canvas
        const box    = new THREE.Box3().setFromObject(group);
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z);
        const scale  = 3.2 / maxDim;
        group.scale.setScalar(scale);

        const box2   = new THREE.Box3().setFromObject(group);
        const center = box2.getCenter(new THREE.Vector3());
        group.position.set(-center.x, -box2.min.y, -center.z);

        this.#scene.add(group);
        this.#carGroup = group;

        const carH = (box2.max.y - box2.min.y) * 0.5;
        this.#controls.target.set(0, carH, 0);
        this.#controls.update();
    }

    // ── Helpers ──────────────────────────────────────────────────
    static #esCarroceria(name) {
        const l = name.toLowerCase();
        return l.includes('body') && !l.includes('black') && !l.includes('white');
    }

    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());
        this.#controls.update();
        this.#renderer.render(this.#scene, this.#camera);
    }

    // ── Mapa: tipo del juego → nombre en el GLB ──────────────────
    static MAPA = {
        deportivo: 'Sports',
        suv:       'SUV',
        muscle:    'Muscle',
        formula:   'Roadster',
        pickup:    'Pickup',
        clasico:   'Limousine',
    };
}

window.Viewer3D = Viewer3D;
