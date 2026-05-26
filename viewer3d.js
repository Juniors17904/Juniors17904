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

        // Luces
        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 1.4));

        const sun = new THREE.DirectionalLight(0xfffbe6, 2.4);
        sun.position.set(6, 12, 6);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        this.#scene.add(sun);

        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.6);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);

        // Suelo
        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: 0x7a9e6e, roughness: 0.85, metalness: 0.0 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.#scene.add(ground);

        // Anillo neón en el suelo
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.9, 2.1, 48),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.4, transparent: true })
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
        const dbg = [];

        // Three.js reemplaza espacios con _ al cargar GLB
        const nombres = [
            prefix,
            `${prefix}_wheel_front_right`,
            `${prefix}_wheel_front_left`,
            `${prefix}_wheel_rear_right`,
            `${prefix}_wheel_rear_left`,
        ];

        for (const nombre of nombres) {
            const nodo = gltf.scene.getObjectByName(nombre);
            if (!nodo) { dbg.push(`✗ ${nombre}`); continue; }
            let meshCount = 0;
            const clone = nodo.clone();
            clone.traverse(child => {
                if (!child.isMesh) return;
                meshCount++;
                child.material  = child.material.clone();
                child.castShadow    = true;
                child.receiveShadow = true;
                if (Viewer3D.#esCarroceria(child.name)) {
                    child.material.color.set(color);
                }
            });
            dbg.push(`✓ ${nombre} (${meshCount})`);
            group.add(clone);
        }

        Viewer3D.#dbgPanel(dbg.join('\n'));

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

    // ── Debug overlay ────────────────────────────────────────────
    static #dbgPanel(msg) {
        let el = document.getElementById('v3d-dbg');
        if (!el) {
            el = document.createElement('pre');
            el.id = 'v3d-dbg';
            Object.assign(el.style, {
                position:'fixed', top:'8px', left:'8px', right:'8px',
                background:'rgba(0,0,0,0.75)', color:'#0f0', fontSize:'11px',
                padding:'6px', borderRadius:'6px', zIndex:'9999',
                pointerEvents:'none', whiteSpace:'pre-wrap', margin:'0',
            });
            document.body.appendChild(el);
        }
        el.textContent = msg;
        clearTimeout(el._t);
        el._t = setTimeout(() => el.remove(), 15000);
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
