'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VisorBase } from './visor_base.js';

// ================================================================
// CLASS: Visor3D — visor 3D interactivo del garaje
// ================================================================
class Visor3D extends VisorBase {
    #renderer = null; #scene = null; #camera = null; #controls = null;
    #canvas; #idAnimacion = 0; #carGroup = null;

    constructor(canvas) {
        super();
        this.#canvas = canvas;
        this.#initScene();
    }

    async cargar(tipo, color) {
        if (!this.#idAnimacion) this.#tick();
        try {
            const gltf = await VisorBase.cargarGLTF();
            this.#setCar(gltf, tipo, color);
        } catch (e) {
            console.error('Visor3D:', e);
        }
    }

    cambiarColor(color) {
        if (!this.#carGroup) return;
        this.#carGroup.traverse(child => {
            if (child.isMesh && VisorBase.esCarroceria(child.name))
                child.material.color.set(color);
        });
    }

    detener() {
        cancelAnimationFrame(this.#idAnimacion);
        this.#idAnimacion = 0;
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
        sun.position.set(6, 12, 6); sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        this.#scene.add(sun);
        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.6);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);

        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(5, 48),
            new THREE.MeshStandardMaterial({ color: 0x7a9e6e, roughness: 0.85, metalness: 0.0 })
        );
        ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
        this.#scene.add(ground);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.9, 2.1, 48),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, opacity: 0.4, transparent: true })
        );
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005;
        this.#scene.add(ring);

        this.#controls = new OrbitControls(this.#camera, this.#canvas);
        this.#controls.enableDamping = true; this.#controls.dampingFactor = 0.07;
        this.#controls.enablePan = false; this.#controls.minDistance = 3;
        this.#controls.maxDistance = 12; this.#controls.maxPolarAngle = Math.PI * 0.50;
        this.#controls.autoRotate = true; this.#controls.autoRotateSpeed = 1.8;
        this.#controls.target.set(0, 0.8, 0);
        this.#controls.addEventListener('start', () => { this.#controls.autoRotate = false; });
        this.#controls.addEventListener('end', () => {
            setTimeout(() => { this.#controls.autoRotate = true; }, 2500);
        });
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) { this.#scene.remove(this.#carGroup); this.#carGroup = null; }
        const group = VisorBase.construirGrupo(gltf, tipo, color);
        const box2  = VisorBase.centrarGrupo(group, 3.2);
        this.#scene.add(group); this.#carGroup = group;
        const carH = (box2.max.y - box2.min.y) * 0.5;
        this.#camera.position.set(4, 2.5, 5);
        this.#controls.target.set(0, carH, 0);
        this.#controls.update();
    }

    #tick() {
        this.#idAnimacion = requestAnimationFrame(() => this.#tick());
        this.#controls.update();
        this.#renderer.render(this.#scene, this.#camera);
    }
}

window.Visor3D  = Visor3D;
window.Viewer3D = Visor3D;
