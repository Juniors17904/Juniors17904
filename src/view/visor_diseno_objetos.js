'use strict';

import * as THREE                from 'three';
import { VisorBase }             from './visor_base.js';
import { ControlOrbitaObjeto }   from './controles/control_orbita_objeto.js';
import { FabricaObjetoEscena }   from './objetos/fabrica_objeto_escena.js';

// ================================================================
// CLASS: VisorDisenoObjetos — visor 3D de un objeto decorativo.
//        Permite orbitar (rotar, hacer zoom) con táctil o ratón.
//        Usa FabricaObjetoEscena — no conoce las subclases concretas.
// ================================================================
class VisorDisenoObjetos extends VisorBase {
    #canvas;
    #renderer      = null;
    #scene         = null;
    #camera        = null;
    #controlOrbita = null;
    #fabrica       = new FabricaObjetoEscena();
    #idAnimacion           = 0;
    #objeto        = null;
    #resizeObs     = null;
    #funcionAnimacion        = () => this.#tick();

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
        this.#scene.background = new THREE.Color(0x1a2a3a);
        this.#objeto = this.#fabrica.crear(tipo, 0, 0,
            { escala: tipo === 'arbol' ? 1.4 : 1, texto: 'STOP' });
        await this.#objeto?.construir(this.#scene);
    }

    mostrarCielo(color = '#4a9eca') {
        if (this.#objeto) { this.#objeto.destruir(this.#scene); this.#objeto = null; }
        this.#scene.background = new THREE.Color(color);
    }

    // ── Ciclo de vida ────────────────────────────────────────────
    iniciar() { if (!this.#idAnimacion) this.#tick(); }

    detener() {
        cancelAnimationFrame(this.#idAnimacion);
        this.#idAnimacion = 0;
        this.#resizeObs?.disconnect();
        this.#resizeObs = null;
        this.#controlOrbita?.destruir();
        this.#controlOrbita = null;
        if (this.#objeto) { this.#objeto.destruir(this.#scene); this.#objeto = null; }
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #tick() {
        this.#idAnimacion = requestAnimationFrame(this.#funcionAnimacion);
        this.#controlOrbita?.actualizar();
        if (this.#renderer && this.#scene && this.#camera)
            this.#renderer.render(this.#scene, this.#camera);
    }
}

window.VisorDisenoObjetos = VisorDisenoObjetos;
