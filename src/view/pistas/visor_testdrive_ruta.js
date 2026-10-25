'use strict';
import * as THREE from 'three';
import { Ruta } from '../../model/ruta.js';
import { Carro } from '../../model/carros/carro.js';
import { RegistroCarros } from '../../model/carros/registro_carros.js';
import { ConductorPasoFijo } from './comun/conductor_paso_fijo.js';
import { ConstructorPisoPista } from './comun/constructor_piso_pista.js';
import { TrazadoPisoCurva } from './comun/trazado_piso_curva.js';
import { CamaraSeguimiento as CamaraChase } from '../camaras/camara_seguimiento.js';
import { CieloSoleado }  from '../cielo_soleado.js';
import { CieloNocturno } from '../cielo_nocturno.js';
import { CamaraAerea } from '../camaras/camara_aerea.js';
import { VisorBase } from '../visor_base.js';

// ================================================================
// CLASS: VisorJuego — pista 3D con curvas reales desde tramos
// ================================================================
class VisorTestdriveRuta extends VisorBase {
    #renderer = null; #scene = null; #camaraChase = null;
    #canvas; #hudCanvas = null; #hudCtx = null; #idAnimacion = 0; #sun = null;
    #funcionAnimacion = marca => this.#tick(marca);
    #carGroup = null; #leanGroup = null; #wheels = []; #cielo = null;
    #resizeHandler = null;

    #ruta = new Ruta();
    #camAerea = null;
    #camAereaActiva = false;
    #conductor = new ConductorPasoFijo(carro => this.#seguirRuta(carro));
    #medidas = new window.MedidasEscena(); #giroRuedas = 6;   // escala real (PRD 009)
    #piso     = null;   // ConstructorPisoPista (PRD 012)
    #dirLine  = null;
    #camPunto = null;

    #progress        = 0;
    #lateral         = 0;
    #movimientoLibre = false;

    entradaAcel = 0;
    entradaDireccion = 0;
    alturaCamara  = 2.8;

    get velocidad()    { return this.#mov?.velocidad    ?? 0; }
    get aceleracion()    { return this.#mov?.aceleracion    ?? 0; }
    get velocidadMax() { return this.#mov?.velocidadMax ?? 0; }
    get progress() { return this.#progress; }
    get rotY()     { return this.#mov?.rotY     ?? 0; }
    get rotZ()     { return this.#mov?.carLean  ?? 0; }
    get px()       { return this.#mov?.px       ?? 0; }
    get pz()       { return this.#mov?.pz       ?? 0; }
    get camRotX()      { return this.#camaraChase?.camRotX ?? 0; }
    get camRotY()      { return this.#camaraChase?.camRotY ?? 0; }
    get camRotZ()      { return this.#camaraChase?.camRotZ ?? 0; }
    get constantesFisica() { return this.#mov?.constantes ?? null; }
    get camDist()      { return 7; }
    get #mov()         { return this.#conductor.carro; }
    get pathPos()      { return this.#ruta.posicionEn(this.#progress); }
    get lateral()      { return this.#lateral; }
    get pathLen()      { return this.#ruta.longitud; }
    get camAereaActiva()    { return this.#camAereaActiva; }
    get camAerea()          { return this.#camAerea; }
    get movimientoLibre()   { return this.#movimientoLibre; }
    alternarMovimientoLibre() { this.#movimientoLibre = !this.#movimientoLibre; return this.#movimientoLibre; }
    get camaraChasePos() {
        const p = this.#camaraChase?.camera?.position;
        return p ? { x: p.x, z: p.z } : null;
    }
    get contextLost()  { return this.#renderer?.getContext()?.isContextLost() ?? true; }
    pathSamples(n) { return this.#ruta.muestras(n); }

    toggleCamaraAerea() {
        this.#camAereaActiva = !this.#camAereaActiva;
        if (this.#camAereaActiva) {
            if (!this.#camAerea) this.#camAerea = new CamaraAerea(this.#camaraChase.camera.aspect);
            this.#camAerea.activar(this.#mov.px, this.#mov.pz);
            this.#scene.fog = null;
        } else {
            if (this.#camAerea) { this.#camAerea.moveX = 0; this.#camAerea.moveZ = 0; }
            this.#cielo?.construir(this.#scene);
        }
        return this.#camAereaActiva;
    }

    setCamAereaAltura(sliderVal) { this.#camAerea?.setAltura(sliderVal); }

    constructor(canvas, tipoPista = 'ciudad') {
        super();
        this.#canvas    = canvas;
        this.#hudCanvas = document.getElementById('canvas-hud-cir3d');
        this.#hudCtx    = this.#hudCanvas?.getContext('2d') ?? null;
        this.#initScene();
        this.#cargarRuta(tipoPista);
        this.#buildRoad();
    }

    setVelocimetroModelo(n) { if (this.#mov) this.#mov.velocimetroModelo = n; }

    // ── Escena ───────────────────────────────────────────────────
    #initScene() {
        const W = window.innerWidth, H = window.innerHeight;
        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);
        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.4;

        this.#scene = new THREE.Scene();
        this.#cielo = new CieloSoleado('#4a9eca');
        this.#cielo.construir(this.#scene);

        this.#camaraChase = new CamaraChase(W / H, { seguirRotacion: true });
        this.#camaraChase.agregarIndicador(this.#scene);

        this.#scene.add(new THREE.AmbientLight(0xfff4e0, 1.2));
        this.#sun = new THREE.DirectionalLight(0xfffbe6, 2.2);
        this.#sun.castShadow = true;
        this.#sun.shadow.mapSize.set(1024, 1024);
        this.#sun.shadow.camera.near = 1; this.#sun.shadow.camera.far = 60;
        this.#sun.shadow.camera.left = -15; this.#sun.shadow.camera.right = 15;
        this.#sun.shadow.camera.top  =  15; this.#sun.shadow.camera.bottom = -15;
        this.#sun.position.set(6, 10, 4);
        this.#scene.add(this.#sun, this.#sun.target);
        const fill = new THREE.DirectionalLight(0xc8e8ff, 0.5);
        fill.position.set(-5, 4, -3);
        this.#scene.add(fill);
    }

    // ── Cargar ruta desde la pista ───────────────────────────────
    #cargarRuta(tipoPista) {
        try {
            const pista = window.registroPistas?.obtener(tipoPista);
            if (!pista?.tramos) {
                window.__modelErrors = window.__modelErrors || [];
                window.__modelErrors.push(`[pista_ciudad] pista "${tipoPista}" no está en registroPistas`);
                return;
            }
            this.#ruta.construir(pista.tramos, pista.totalSegs);
            const inicio = this.#ruta.inicio;
            this.#conductor.carro = new Carro(inicio.x, inicio.z, inicio.angle);
            if (pista.cielo && this.#cielo) {
                this.#cielo.destruir(this.#scene);
                this.#cielo = pista.tipoCielo === 'soleado'
                    ? new CieloSoleado(pista.cielo)
                    : new CieloNocturno(pista.cielo);
                this.#cielo.construir(this.#scene);
                const pos = this.#cielo.posicionSol;
                if (pos && this.#sun) this.#sun.position.copy(pos);
            }
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[pista_ciudad] ' + e.message);
            console.error('[pista_ciudad.js #cargarRuta]', e);
        }
    }

    // ── Construir pista curva ────────────────────────────────────
    #buildRoad() {
        const curve = this.#ruta.curve;
        if (!curve) return;

        const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = 0;
        grass.receiveShadow = true;
        this.#scene.add(grass);

        // Piso de la pista (asfalto, pianos, líneas y meta): pieza compartida (PRD 012)
        this.#piso = new ConstructorPisoPista(new TrazadoPisoCurva(curve), 0, 0x3a3a3a);
        this.#scene.add(this.#piso.construir());
    }

    // ── Cargar auto ──────────────────────────────────────────────
    async cargar(tipo, color) {
        const i = this.#ruta.curve ? this.#ruta.inicio : null;
        if (i) this.#conductor.carro = new RegistroCarros().crear(tipo, i.x, i.z, i.angle);
        this.#camaraChase.escala = this.#medidas.escalaCarro(tipo); this.#giroRuedas = 6 / this.#medidas.escalaCarro(tipo);
        try {
            this.#setCar(await VisorBase.cargarGLTF(), tipo, color);
        } catch(e) { console.error('VisorJuego:', e); }
    }

    #setCar(gltf, tipo, color) {
        if (this.#carGroup) { this.#scene.remove(this.#carGroup); this.#carGroup = null; }
        const inner = VisorBase.construirGrupo(gltf, tipo, color);
        VisorBase.centrarGrupo(inner, this.#medidas.medidaCarro(tipo).largo);
        const lean = new THREE.Group(); lean.add(inner); this.#leanGroup = lean;
        const outer = new THREE.Group(); outer.add(lean);
        this.#scene.add(outer); this.#carGroup = outer;
        this.#wheels = [];
        const prefix = VisorBase.MAPA[tipo] ?? 'Sports';
        for (const w of ['front_right', 'front_left', 'rear_right', 'rear_left']) {
            const node = inner.getObjectByName(`${prefix}_wheel_${w}`);
            if (node) this.#wheels.push(node);
        }
    }

    // ── Loop principal ───────────────────────────────────────────
    iniciar() {
        if (!this.#idAnimacion) {
            this.#resizeHandler = () => {
                const W = window.innerWidth, H = window.innerHeight;
                this.#canvas.width = W; this.#canvas.height = H;
                if (this.#hudCanvas) { this.#hudCanvas.width = W; this.#hudCanvas.height = H; }
                this.#camaraChase.resize(W / H);
                this.#camAerea?.resize(W / H);
                this.#renderer?.setSize(W, H, false);
            };
            window.addEventListener('resize', this.#resizeHandler);
            window.addEventListener('orientationchange', () => setTimeout(this.#resizeHandler, 120));
            this.#conductor.reiniciar();
            this.#tick();
        }
    }

    detener() {
        cancelAnimationFrame(this.#idAnimacion); this.#idAnimacion = 0;
        if (this.#resizeHandler) {
            window.removeEventListener('resize', this.#resizeHandler);
            this.#resizeHandler = null;
        }
        this.#cielo?.destruir(this.#scene); this.#cielo = null;
        this.#piso?.liberar(); this.#piso = null;
        this.#renderer?.dispose(); this.#renderer = null;
    }

    #tick(marca) {
        this.#idAnimacion = requestAnimationFrame(this.#funcionAnimacion);
        this.#updatePhysics(marca);
        this.#camaraChase.altura = this.alturaCamara;
        this.#camaraChase.actualizar(this.#mov.px, this.#mov.pz, this.#mov.velAngle, this.entradaDireccion);
        if (this.#camAereaActiva) {
            this.#camAerea.actualizar(this.#mov.px, this.#mov.pz);
        }
        this.#sun.position.set(this.#mov.px + 10, 20, this.#mov.pz + 10);
        this.#sun.target.position.set(this.#mov.px, 0, this.#mov.pz);
        this.#sun.target.updateMatrixWorld();

        if (this.#mov) {
            const dir    = new THREE.Vector3(Math.sin(this.#mov.rotY), 0, Math.cos(this.#mov.rotY));
            const origin = new THREE.Vector3(this.#mov.px, 0.5, this.#mov.pz);
            if (!this.#dirLine) {
                const geo = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 0, 3),
                ]);
                this.#dirLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffff00 }));
                this.#scene.add(this.#dirLine);
            }
            this.#dirLine.position.copy(origin);
            this.#dirLine.lookAt(origin.clone().add(dir));
            this.#dirLine.visible = this.#camAereaActiva;

            const camPos = this.#camaraChase.camera.position;
            if (!this.#camPunto) {
                this.#camPunto = new THREE.Mesh(
                    new THREE.SphereGeometry(0.4, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x00ffff, depthTest: false })
                );
                this.#scene.add(this.#camPunto);
            }
            this.#camPunto.position.set(camPos.x, 0.5, camPos.z);
            this.#camPunto.visible = this.#camAereaActiva;
            this.#camaraChase.indicadorVisible = this.#camAereaActiva;
        }

        const cam = this.#camAereaActiva ? this.#camAerea.camera : this.#camaraChase.camera;
        this.#cielo?.actualizar(cam);
        this.#renderer.render(this.#scene, cam);
        this.#dibujarHUD();
    }

    #dibujarHUD() {
        if (!this.#hudCtx || !this.#mov || !window.RenderizadorVelocimetro) return;
        const W = this.#hudCanvas.width, H = this.#hudCanvas.height;
        this.#hudCtx.clearRect(0, 0, W, H);
        const fraccion = Math.min(1, Math.abs(this.#mov.velocidad) / this.#mov.velMaxAdelante);
        const cx = W - 70, cy = H - 70, r = 50;
        window.RenderizadorVelocimetro.dibujar(this.#hudCtx, cx, cy, r, fraccion, this.#mov.velocimetroModelo);
    }

    // ── Física ───────────────────────────────────────────────────
    // Avance por la ruta y límite suave, después de cada paso fijo
    #seguirRuta(carro) {
        if (this.#movimientoLibre || this.#ruta.longitud <= 0) return;
        this.#progress = ((this.#progress + carro.velocidad / this.#ruta.longitud) % 1 + 1) % 1;

        // Límite suave: empujar de vuelta si se aleja del trazado más que el límite de MedidasEscena
        const p = this.#ruta.posicionEn(this.#progress);
        const dx = carro.px - p.x, dz = carro.pz - p.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        this.#lateral = dx * Math.cos(p.angle) + dz * -Math.sin(p.angle);
        const lim = this.#medidas.limiteSuave;
        if (dist > lim) carro.setPosicion(p.x + (dx / dist) * lim * 0.90, p.z + (dz / dist) * lim * 0.90);
    }

    #updatePhysics(marca) {
        if (!this.#mov) return;
        this.#conductor.avanzar(marca, this.entradaAcel, this.entradaDireccion);

        if (this.#carGroup) {
            this.#carGroup.position.set(this.#mov.px, this.#medidas.alturaAsfalto, this.#mov.pz);
            this.#carGroup.rotation.y = this.#mov.rotY;
        }
        if (this.#leanGroup) this.#leanGroup.rotation.z = this.#mov.carLean;
        for (const w of this.#wheels) w.rotation.x += this.#mov.velocidad * this.#giroRuedas;
    }


}

export { VisorTestdriveRuta };
window.VisorTestdriveRuta = VisorTestdriveRuta;
