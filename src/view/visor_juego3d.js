'use strict';

import * as THREE from 'three';
import { VisorBase } from './visor_base.js';

// ================================================================
// CLASS: VisorJuego3D — carro 3D desde atrás para el HUD del juego
// ================================================================
class VisorJuego3D extends VisorBase {
    #renderer = null; #scene = null; #camera = null;
    #canvas; #carGroup = null;

    constructor(canvas) {
        super();
        this.#canvas = canvas;
        this.#init();
    }

    async cargar(tipo, color) {
        try {
            const gltf = await VisorBase.cargarGLTF();
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
        const group = VisorBase.construirGrupo(gltf, tipo, color);
        VisorBase.centrarGrupo(group, 2.6);
        this.#scene.add(group);
        this.#carGroup = group;
    }
}

window.VisorJuego3D = VisorJuego3D;
