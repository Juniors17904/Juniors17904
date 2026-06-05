'use strict';

import * as THREE        from 'three';
import { Ruta }          from '../model/ruta.js';
import { VisorBase }     from './visor_base.js';
import { CamaraAerea }   from './camaras/camara_aerea.js';
import { ArbolEscena }   from './objetos/arbol_escena.js';
import { PosteEscena }   from './objetos/poste_escena.js';
import { AvisoEscena }   from './objetos/aviso_escena.js';

// ================================================================
// CLASS: VisorDisenoObjetos — vista cenital del circuito para
//        la pantalla Diseño de Objetos.
//        Cámara aérea con pan táctil/ratón. Muestra todas las
//        decoraciones de la pista. Sin física de carro.
// ================================================================
class VisorDisenoObjetos extends VisorBase {
    #canvas;
    #renderer    = null;
    #scene       = null;
    #camaraAerea = null;
    #raf         = 0;
    #pista       = null;
    #ruta        = new Ruta();
    #objetos     = [];
    #resizeObs   = null;
    #handlers    = [];   // { target, tipo, fn } para cleanup

    constructor(canvas, pista) {
        super();
        this.#canvas = canvas;
        this.#pista  = pista;
        this.#initScene();
        this.#buildCircuito();
        this.#wirePan();
    }

    // ── Escena ───────────────────────────────────────────────────
    #initScene() {
        const W = this.#canvas.width  || window.innerWidth;
        const H = this.#canvas.height || window.innerHeight;

        this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true });
        this.#renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        this.#renderer.setSize(W, H, false);

        this.#scene = new THREE.Scene();
        this.#scene.background = new THREE.Color(0x4a9eca);

        this.#camaraAerea = new CamaraAerea(W / H);

        this.#scene.add(new THREE.AmbientLight(0xffffff, 2.0));
        const sol = new THREE.DirectionalLight(0xfffbe6, 1.5);
        sol.position.set(20, 50, 20);
        this.#scene.add(sol);

        this.#resizeObs = new ResizeObserver(() => this.#resize());
        this.#resizeObs.observe(this.#canvas);
    }

    #resize() {
        const W = this.#canvas.clientWidth  || window.innerWidth;
        const H = this.#canvas.clientHeight || window.innerHeight;
        if (!W || !H) return;
        this.#canvas.width  = W;
        this.#canvas.height = H;
        this.#camaraAerea?.resize(W / H);
        this.#renderer?.setSize(W, H, false);
    }

    // ── Construir circuito y objetos ─────────────────────────────
    #buildCircuito() {
        if (!this.#pista?.tramos) return;

        this.#ruta.construir(this.#pista.tramos, this.#pista.totalSegs);
        const curve = this.#ruta.curve;
        if (!curve) return;

        const DIV = 600;
        const cp  = curve.getPoints(DIV);

        const _perp = i => {
            const a = cp[i], b = cp[(i + 1) % cp.length];
            let tx = b.x - a.x, tz = b.z - a.z;
            let L  = Math.sqrt(tx*tx + tz*tz);
            if (L < 0.0001) {
                const prev = cp[(i - 1 + cp.length) % cp.length];
                tx = a.x - prev.x; tz = a.z - prev.z;
                L  = Math.sqrt(tx*tx + tz*tz) || 1;
            }
            return { px: -tz / L, pz: tx / L };
        };

        const _ribbon = (lo, ro, y, mat) => {
            const pos = [], nor = [], idx = [];
            for (let i = 0; i <= DIV; i++) {
                const q = cp[i % cp.length];
                const { px, pz } = _perp(i % cp.length);
                pos.push(q.x + px*lo, y, q.z + pz*lo,
                         q.x + px*ro, y, q.z + pz*ro);
                nor.push(0,1,0, 0,1,0);
            }
            for (let i = 0; i < DIV; i++) {
                const a = i*2, b = a+1, c = a+2, d = a+3;
                idx.push(a,c,b, b,c,d);
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            g.setAttribute('normal',   new THREE.Float32BufferAttribute(nor, 3));
            g.setIndex(idx);
            return new THREE.Mesh(g, mat);
        };

        // Pasto
        const pasto = new THREE.Mesh(
            new THREE.PlaneGeometry(3000, 3000),
            new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 })
        );
        pasto.rotation.x = -Math.PI / 2;
        pasto.position.y = -0.01;
        this.#scene.add(pasto);

        // Pista
        this.#scene.add(_ribbon(-4, 4, 0,
            new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.85, side: THREE.DoubleSide })));

        // Bordes rojos/blancos
        const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, side: THREE.DoubleSide });
        const whtMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, side: THREE.DoubleSide });
        const curbW  = 0.7;
        this.#scene.add(_ribbon(-4 - curbW, -4, 0.04, redMat));
        this.#scene.add(_ribbon(4, 4 + curbW,  0.04, whtMat));

        // Decoraciones
        for (const dec of this.#pista.decoraciones) {
            const obj = this.#crearObjeto(dec);
            if (obj) { obj.construir(this.#scene); this.#objetos.push(obj); }
        }

        this.#centrarCamara();
    }

    // ── Centrar cámara sobre todo el circuito ────────────────────
    #centrarCamara() {
        const muestras = this.#ruta.muestras(200);
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const p of muestras) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z;
        }
        const cx     = (minX + maxX) / 2;
        const cz     = (minZ + maxZ) / 2;
        const rangoX = maxX - minX;
        const rangoZ = maxZ - minZ;

        // Calcular altura mínima para que el circuito completo sea visible
        // considerando el aspect ratio real (modo retrato ≈ 0.46)
        const aspect   = (this.#canvas.width  || window.innerWidth) /
                         (this.#canvas.height || window.innerHeight);
        const tanHalf  = Math.tan(Math.PI / 6); // tan(30°) = FOV 60° / 2
        const hPorZ    = (rangoZ / 2) / tanHalf;
        const hPorX    = (rangoX / 2) / (tanHalf * aspect);
        const h        = Math.max(hPorZ, hPorX) * 1.25; // margen del 25 %

        this.#camaraAerea.activar(cx, cz);
        this.#camaraAerea.h = h;
    }

    // ── Fábrica de objetos (misma lógica que VisorDisenoGeneral) ─
    #crearObjeto({ tipo, prog, lado, dist, escala = 1, texto = '' }) {
        const pos = this.#ruta.posicionEn(prog);
        const wx  = pos.x + Math.cos(pos.angle) * dist * lado;
        const wz  = pos.z - Math.sin(pos.angle) * dist * lado;
        if (tipo === 'arbol') return new ArbolEscena(wx, wz, escala);
        if (tipo === 'poste') return new PosteEscena(wx, wz);
        if (tipo === 'aviso') return new AvisoEscena(wx, wz, texto);
        return null;
    }

    // ── Pan táctil y ratón ───────────────────────────────────────
    #wirePan() {
        let panActivo = false, ux = 0, uy = 0;
        let mouseDown = false, mx = 0, my = 0;

        const onTouchStart = e => {
            if (e.touches.length !== 1) return;
            panActivo = true; ux = e.touches[0].clientX; uy = e.touches[0].clientY;
        };
        const onTouchMove = e => {
            if (!panActivo || e.touches.length !== 1) return;
            e.preventDefault();
            const escala = this.#camaraAerea.h / 250;
            const dx = e.touches[0].clientX - ux;
            const dy = e.touches[0].clientY - uy;
            this.#camaraAerea.pan(-dx * escala, dy * escala);
            ux = e.touches[0].clientX; uy = e.touches[0].clientY;
        };
        const onTouchEnd = () => { panActivo = false; };

        const onMouseDown = e => { mouseDown = true; mx = e.clientX; my = e.clientY; };
        const onMouseMove = e => {
            if (!mouseDown) return;
            const escala = this.#camaraAerea.h / 250;
            this.#camaraAerea.pan(-(e.clientX - mx) * escala, (e.clientY - my) * escala);
            mx = e.clientX; my = e.clientY;
        };
        const onMouseUp = () => { mouseDown = false; };

        this.#canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        this.#canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
        this.#canvas.addEventListener('touchend',   onTouchEnd);
        this.#canvas.addEventListener('mousedown',  onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup',   onMouseUp);

        this.#handlers = [
            { target: this.#canvas, tipo: 'touchstart', fn: onTouchStart },
            { target: this.#canvas, tipo: 'touchmove',  fn: onTouchMove  },
            { target: this.#canvas, tipo: 'touchend',   fn: onTouchEnd   },
            { target: this.#canvas, tipo: 'mousedown',  fn: onMouseDown  },
            { target: window,       tipo: 'mousemove',  fn: onMouseMove  },
            { target: window,       tipo: 'mouseup',    fn: onMouseUp    },
        ];
    }

    // ── Ciclo de vida ────────────────────────────────────────────
    iniciar() { if (!this.#raf) this.#tick(); }

    detener() {
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
        this.#resizeObs?.disconnect();
        this.#resizeObs = null;
        for (const { target, tipo, fn } of this.#handlers) target.removeEventListener(tipo, fn);
        this.#handlers = [];
        for (const obj of this.#objetos) obj.destruir(this.#scene);
        this.#objetos = [];
        this.#renderer?.dispose();
        this.#renderer = null;
    }

    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());
        this.#camaraAerea.actualizar();
        if (this.#renderer && this.#scene)
            this.#renderer.render(this.#scene, this.#camaraAerea.camera);
    }
}

window.VisorDisenoObjetos = VisorDisenoObjetos;
