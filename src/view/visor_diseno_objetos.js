'use strict';

import * as THREE                from 'three';
import { VisorBase }             from './visor_base.js';
import { ControlOrbitaObjeto }   from './controles/control_orbita_objeto.js';
import { FabricaObjetoEscena }   from './objetos/fabrica_objeto_escena.js';
import { CieloDespejado }         from './cielo_despejado.js';
import { CieloNocturno }          from './cielo_nocturno.js';

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
    #idAnimacion   = 0;
    #objeto        = null;
    #cielo         = null;
    #cieloNoche    = null;
    #cieloActivo   = null;
    #luzAmbiente   = null;
    #luzSol        = null;
    #resizeObs     = null;
    #funcionAnimacion = () => this.#tick();
    #grupoPiso     = null;
    static #TIPOS_NOCHE = new Set(['nube', 'luna']);

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
        this.#cielo = new CieloDespejado();
        this.#cielo.construir(this.#scene);
        this.#cieloActivo = this.#cielo;
        this.#scene.fog = null;

        this.#camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
        this.#camera.position.set(8, 6, 8);

        this.#controlOrbita = new ControlOrbitaObjeto();
        this.#controlOrbita.activar(this.#camera, this.#canvas);

        // Luz ambiente — día por defecto
        this.#luzAmbiente = new THREE.AmbientLight(0xffffff, 0.7);
        this.#scene.add(this.#luzAmbiente);

        // Luz solar — simula el sol de día (desde arriba-adelante-izquierda)
        this.#luzSol = new THREE.DirectionalLight(0xfff5e0, 1.4);
        this.#luzSol.position.set(-6, 12, 8);
        this.#luzSol.castShadow = true;
        this.#luzSol.shadow.mapSize.set(1024, 1024);
        this.#scene.add(this.#luzSol);

        // ── Piso (suelo + carretera) agrupados para poder ocultarlos ─
        this.#grupoPiso = new THREE.Group();
        this.#scene.add(this.#grupoPiso);

        const suelo = new THREE.Mesh(
            new THREE.CircleGeometry(12, 40),
            new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 })
        );
        suelo.rotation.x = -Math.PI / 2;
        suelo.receiveShadow = true;
        this.#grupoPiso.add(suelo);

        const matAsfalto = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.85 });
        const carretera  = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 14), matAsfalto);
        carretera.rotation.x = -Math.PI / 2;
        carretera.position.set(3, 0.001, 0);
        carretera.receiveShadow = true;
        this.#grupoPiso.add(carretera);

        const matBlanco = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bordeIzq  = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 14), matBlanco);
        bordeIzq.rotation.x = -Math.PI / 2;
        bordeIzq.position.set(0.20, 0.002, 0);
        this.#grupoPiso.add(bordeIzq);

        const bordeDer = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 14), matBlanco);
        bordeDer.rotation.x = -Math.PI / 2;
        bordeDer.position.set(5.80, 0.002, 0);
        this.#grupoPiso.add(bordeDer);

        const dc = document.createElement('canvas');
        dc.width = 16; dc.height = 128;
        const dctx = dc.getContext('2d');
        dctx.fillStyle = '#ffee44';
        dctx.fillRect(0, 0, 16, 64);
        const dashTex = new THREE.CanvasTexture(dc);
        dashTex.wrapT = THREE.RepeatWrapping;
        dashTex.repeat.set(1, 7);
        const centreLine = new THREE.Mesh(
            new THREE.PlaneGeometry(0.12, 14),
            new THREE.MeshBasicMaterial({ map: dashTex, transparent: true })
        );
        centreLine.rotation.x = -Math.PI / 2;
        centreLine.position.set(3.0, 0.002, 0);
        this.#grupoPiso.add(centreLine);

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

    // ── Cambiar fondo según el tipo de objeto ────────────────────
    #cambiarCielo(nocturno) {
        if (nocturno) {
            if (!this.#cieloNoche) {
                this.#cieloNoche = new CieloNocturno('#050e20');
                this.#cieloNoche.construir(this.#scene);
            }
            this.#cielo.visible      = false;
            this.#cieloNoche.visible = true;
            this.#cieloNoche.restaurar(this.#scene);
        } else {
            if (this.#cieloNoche) this.#cieloNoche.visible = false;
            this.#cielo.visible = true;
            this.#cielo.restaurar(this.#scene);
        }
        // Ajustar luces según el modo
        if (this.#luzAmbiente) this.#luzAmbiente.intensity = nocturno ? 0.15 : 0.7;
        if (this.#luzSol)      this.#luzSol.intensity      = nocturno ? 0.05 : 1.4;
        this.#scene.fog  = null;
        this.#cieloActivo = nocturno ? this.#cieloNoche : this.#cielo;
    }

    // ── Mostrar objeto ───────────────────────────────────────────
    async mostrar(tipo) {
        if (this.#objeto) { this.#objeto.destruir(this.#scene); this.#objeto = null; }

        const nocturno = VisorDisenoObjetos.#TIPOS_NOCHE.has(tipo);
        const flotante = tipo === 'luna' || tipo === 'nube';
        this.#grupoPiso.visible = !flotante;
        this.#cambiarCielo(nocturno);
        this.#camera.position.set(flotante ? 6 : 8, flotante ? 7 : 6, flotante ? 6 : 8);

        this.#objeto = this.#fabrica.crear(tipo, 0, 0,
            { escala: tipo === 'arbol' ? 1.4 : 1, texto: 'STOP', direccion: 'derecha' });
        await this.#objeto?.construir(this.#scene);
    }

    mostrarCielo() {
        if (this.#objeto) { this.#objeto.destruir(this.#scene); this.#objeto = null; }
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
        this.#cielo?.destruir(this.#scene);     this.#cielo     = null;
        this.#cieloNoche?.destruir(this.#scene); this.#cieloNoche = null;
        this.#cieloActivo = null;
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #tick() {
        this.#idAnimacion = requestAnimationFrame(this.#funcionAnimacion);
        this.#controlOrbita?.actualizar();
        this.#cieloActivo?.actualizar(this.#camera);
        if (this.#renderer && this.#scene && this.#camera)
            this.#renderer.render(this.#scene, this.#camera);
    }
}

window.VisorDisenoObjetos = VisorDisenoObjetos;
