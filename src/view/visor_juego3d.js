'use strict';

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ── Utilidades compartidas ───────────────────────────────────────
let _glbPromise = null;
function _loadGLTF() {
    if (!_glbPromise)
        _glbPromise = new GLTFLoader().loadAsync('src/assets/models/vehicles_pack.glb');
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

window.VisorJuego3D = VisorJuego3D;
