'use strict';

import * as THREE                from 'three';
import { VisorBase }             from './visor_base.js';
import { ControlOrbitaObjeto }   from './controles/control_orbita_objeto.js';
import { ArbolEscena }           from './objetos/arbol_escena.js';
import { PosteEscena }           from './objetos/poste_escena.js';
import { AvisoEscena }           from './objetos/aviso_escena.js';
import { MetaEscena }            from './objetos/meta_escena.js';
import { SalidaEscena }          from './objetos/salida_escena.js';
import { BarreraEscena }         from './objetos/barrera_escena.js';

// ================================================================
// CLASS: VisorDisenoObjetos — visor 3D de un objeto decorativo.
//        Permite orbitar (rotar, hacer zoom) con táctil o ratón.
// ================================================================
class VisorDisenoObjetos extends VisorBase {
    #canvas;
    #renderer      = null;
    #scene         = null;
    #camera        = null;
    #controlOrbita = null;
    #raf           = 0;
    #objeto        = null;
    #resizeObs     = null;

    constructor(canvas) {
        super();
        this.#canvas = canvas;
        this.#initScene();
        this.mostrar('arbol');
    }

    // ── Escena ───────────────────────────────────────────────────
    #initScene() {
        const W = this.#canvas.width  || window.innerWidth;
        const H = this.#canvas.height || window.innerHeight;

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x1a2a3a);

        this.#camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
        this.#camera.position.set(5, 4, 5);

        this.#controlOrbita = new ControlOrbitaObjeto();
        this.#controlOrbita.activar(this.#camera, this.#canvas);

        this.#scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const sol = new THREE.DirectionalLight(0xfffbe6, 2.0);
        sol.position.set(6, 10, 6);
        sol.castShadow = true;
        this.#scene.add(sol);

        const suelo = new THREE.Mesh(
            new THREE.CircleGeometry(3, 32),
            new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 })
        );
        suelo.rotation.x = -Math.PI / 2;
        suelo.receiveShadow = true;
        this.#scene.add(suelo);

        this.#resizeObs = new ResizeObserver(() => this.#resize());
        this.#resizeObs.observe(this.#canvas);
    }

    #resize() {
        const W = this.#canvas.clientWidth  || window.innerWidth;
        const H = this.#canvas.clientHeight || window.innerHeight;
        if (!W || !H) return;
        this.#canvas.width  = W;
        this.#canvas.height = H;
        this.#camera.aspect = W / H;
        this.#camera.updateProjectionMatrix();
        this.#renderer?.setSize(W, H, false);
    }

    // ── Mostrar objeto ───────────────────────────────────────────
    async mostrar(tipo) {
        if (this.#objeto) { this.#objeto.destruir(this.#scene); this.#objeto = null; }
        if (tipo === 'arbol')   this.#objeto = new ArbolEscena(0, 0, 1.4);
        if (tipo === 'poste')   this.#objeto = new PosteEscena(0, 0);
        if (tipo === 'aviso')   this.#objeto = new AvisoEscena(0, 0, 'STOP');
        if (tipo === 'meta')    this.#objeto = new MetaEscena(0, 0);
        if (tipo === 'salida')  this.#objeto = new SalidaEscena(0, 0);
        if (tipo === 'barrera') this.#objeto = new BarreraEscena(0, 0);
        await this.#objeto?.construir(this.#scene);
    }

    // ── Ciclo de vida ────────────────────────────────────────────
    iniciar() { if (!this.#raf) this.#tick(); }

    detener() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        this.#resizeObs?.disconnect();
        this.#resizeObs = null;
        this.#controlOrbita?.destruir();
        this.#controlOrbita = null;
        if (this.#objeto) { this.#objeto.destruir(this.#scene); this.#objeto = null; }
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());
        this.#controlOrbita?.actualizar();
        if (this.#renderer && this.#scene && this.#camera)
            this.#renderer.render(this.#scene, this.#camera);
    }
}

window.VisorDisenoObjetos = VisorDisenoObjetos;
