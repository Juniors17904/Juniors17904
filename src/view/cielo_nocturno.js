'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';
import { Nube }  from './cielos/nube.js';

// ================================================================
// CLASS: CieloNocturno — domo esférico nocturno con textura canvas.
//        Usa MeshBasicMaterial con toneMapped:false para que los colores
//        oscuros del cielo no sean aclarados por el tone mapping del renderer.
//        Compone objetos ObjetoCielo: Luna, estrellas, nubes.
// ================================================================
export class CieloNocturno extends Cielo {
    #malla     = null;
    #lunaDisc  = null;
    #lunaHalo  = null;
    #lunaLuz   = null;
    #nubes     = [
        new Nube(0.875, 0.59, 0.30),
        new Nube(0.810, 0.55, 0.22),
        new Nube(0.940, 0.57, 0.18),
        new Nube(0.770, 0.62, 0.22),
        new Nube(0.960, 0.52, 0.19),
    ];

    constructor(colorCielo = '#050e20') {
        super(colorCielo);
    }

    construir(scene) {
        const tex = new THREE.CanvasTexture(this.#generarTextura());
        tex.colorSpace    = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.MeshBasicMaterial({
            map: tex, side: THREE.BackSide,
            depthWrite: false, depthTest: false, toneMapped: false, fog: false,
        });
        // Esfera completa (no semidomo) para cubrir todo el cielo nocturno
        const geo = new THREE.SphereGeometry(180, 32, 32);
        this.#malla = new THREE.Mesh(geo, mat);
        this.#malla.renderOrder   = -1;
        this.#malla.frustumCulled = false;
        scene.add(this.#malla);

        // Luna 3D integrada en el cielo — sigue a la cámara en actualizar()
        const lunaGeo = new THREE.SphereGeometry(8, 32, 32);
        const lunaMat = new THREE.MeshBasicMaterial({ color: 0xf0eedf, toneMapped: false, fog: false });
        this.#lunaDisc = new THREE.Mesh(lunaGeo, lunaMat);
        this.#lunaDisc.frustumCulled = false;
        scene.add(this.#lunaDisc);

        // Halo luminoso — sprite con gradiente radial azulado
        const haloCanvas = document.createElement('canvas');
        haloCanvas.width = haloCanvas.height = 256;
        const hCtx = haloCanvas.getContext('2d');
        const hGrad = hCtx.createRadialGradient(128, 128, 0, 128, 128, 128);
        hGrad.addColorStop(0,    'rgba(220,230,255,0.85)');
        hGrad.addColorStop(0.18, 'rgba(190,210,255,0.55)');
        hGrad.addColorStop(0.45, 'rgba(140,175,255,0.18)');
        hGrad.addColorStop(1,    'rgba(100,140,255,0)');
        hCtx.fillStyle = hGrad;
        hCtx.fillRect(0, 0, 256, 256);
        const haloMat = new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(haloCanvas),
            blending: THREE.AdditiveBlending,
            depthWrite: false, fog: false, toneMapped: false,
        });
        this.#lunaHalo = new THREE.Sprite(haloMat);
        this.#lunaHalo.scale.set(45, 45, 1);
        this.#lunaHalo.frustumCulled = false;
        scene.add(this.#lunaHalo);

        this.#lunaLuz = new THREE.PointLight(0xc8d8f0, 35, 0);
        scene.add(this.#lunaLuz);

        scene.background = this._colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    restaurar(scene) {
        scene.background = this._colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    // Dirección en espacio de cámara: centrada, ligeramente arriba-izquierda, adelante
    static #LUNA_CAM_DIR = new THREE.Vector3(-0.08, 0.35, -1).normalize();

    actualizar(camara) {
        if (this.#malla && camara) this.#malla.position.copy(camara.position);
        if (camara) {
            const dir = CieloNocturno.#LUNA_CAM_DIR.clone().applyQuaternion(camara.quaternion);
            if (this.#lunaDisc) this.#lunaDisc.position.copy(camara.position).addScaledVector(dir, 150);
            if (this.#lunaHalo) this.#lunaHalo.position.copy(camara.position).addScaledVector(dir, 149);
            if (this.#lunaLuz)  this.#lunaLuz.position.copy(camara.position).addScaledVector(dir, 25);
        }
    }

    get visible()  { return this.#malla?.visible ?? false; }
    set visible(v) {
        if (this.#malla)    this.#malla.visible    = !!v;
        if (this.#lunaDisc) this.#lunaDisc.visible = !!v;
        if (this.#lunaHalo) this.#lunaHalo.visible = !!v;
        if (this.#lunaLuz)  this.#lunaLuz.visible  = !!v;
    }

    destruir(scene) {
        if (!this.#malla) return;
        scene.remove(this.#malla);
        this.#lunaDisc?.geometry.dispose();
        this.#lunaDisc?.material.dispose();
        this.#lunaDisc = null;
        this.#lunaHalo?.material.map?.dispose();
        this.#lunaHalo?.material.dispose();
        this.#lunaHalo = null;
        this.#malla.geometry.dispose();
        this.#malla.material.map?.dispose();
        this.#malla.material.dispose();
        this.#malla = null;
        if (this.#lunaLuz) { scene.remove(this.#lunaLuz); this.#lunaLuz = null; }
        scene.fog = null;
    }

    // ── Generación de la textura canvas ─────────────────────────────
    #generarTextura() {
        const W = 2048, H = 1024;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');
        const rng = this.#rng(98765);

        // Gradiente azul profundo — cenit casi negro, horizonte azul marino oscuro
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#020810');  // cenit: casi negro
        grad.addColorStop(0.25, '#040f1e');  // azul muy oscuro
        grad.addColorStop(0.55, '#061830');  // azul marino
        grad.addColorStop(1,    '#08152a');  // horizonte: azul profundo
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // 650 estrellas de fondo — puntitos visibles r=0.5-1.2px
        for (let i = 0; i < 650; i++) {
            const x  = rng() * W;
            const y  = (0.38 + rng() * 0.30) * H;
            const r  = rng() * 0.7 + 0.5;
            const al = (rng() * 0.4 + 0.6).toFixed(2);
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220,228,255,${al})`;
            ctx.fill();
        }

        // 45 estrellas medianas con glow r=1.5-3px
        for (let i = 0; i < 45; i++) {
            const x = rng() * W;
            const y = (0.40 + rng() * 0.22) * H;
            const r = rng() * 1.5 + 1.5;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
            g.addColorStop(0,   'rgba(238,242,255,1.0)');
            g.addColorStop(0.3, 'rgba(190,208,255,0.55)');
            g.addColorStop(1,   'rgba(150,175,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nubes detrás de la luna
        for (const nube of this.#nubes) nube.dibujar(ctx, W, H, rng);

        // 9 estrellas brillantes sparkle sobre las nubes
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 9; i++) {
            const x    = rng() * W;
            const y    = (0.45 + rng() * 0.15) * H;
            const tam  = rng() * 5 + 4;
            const tamV = tam * 0.50;
            const gr   = rng() * 0.4 + 0.6;

            const gH = ctx.createLinearGradient(x - tam, y, x + tam, y);
            gH.addColorStop(0,   'rgba(255,255,255,0)');
            gH.addColorStop(0.5, 'rgba(255,255,255,0.95)');
            gH.addColorStop(1,   'rgba(255,255,255,0)');
            ctx.strokeStyle = gH;
            ctx.lineWidth   = gr;
            ctx.beginPath(); ctx.moveTo(x - tam, y); ctx.lineTo(x + tam, y); ctx.stroke();

            const gV = ctx.createLinearGradient(x, y - tamV, x, y + tamV);
            gV.addColorStop(0,   'rgba(255,255,255,0)');
            gV.addColorStop(0.5, 'rgba(255,255,255,0.95)');
            gV.addColorStop(1,   'rgba(255,255,255,0)');
            ctx.strokeStyle = gV;
            ctx.lineWidth   = gr * 0.6;
            ctx.beginPath(); ctx.moveTo(x, y - tamV); ctx.lineTo(x, y + tamV); ctx.stroke();

            const gC = ctx.createRadialGradient(x, y, 0, x, y, gr * 3);
            gC.addColorStop(0,   'rgba(255,255,255,1.0)');
            gC.addColorStop(0.5, 'rgba(210,225,255,0.65)');
            gC.addColorStop(1,   'rgba(160,190,255,0)');
            ctx.fillStyle = gC;
            ctx.beginPath(); ctx.arc(x, y, gr * 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        return lienzo;
    }

    #rng(semilla) {
        let s = semilla;
        return () => {
            s = (s * 1664525 + 1013904223) & 0xffffffff;
            return (s >>> 0) / 0xffffffff;
        };
    }
}
