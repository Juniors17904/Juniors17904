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

window.Viewer3D     = Viewer3D;
window.VisorJuego3D = VisorJuego3D;
