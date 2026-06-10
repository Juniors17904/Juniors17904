'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';
import { Luna }  from './cielos/luna.js';
import { Nube }  from './cielos/nube.js';

// ================================================================
// CLASS: CieloNocturno — domo esférico nocturno con textura canvas.
//        Usa MeshBasicMaterial con toneMapped:false para que los colores
//        oscuros del cielo no sean aclarados por el tone mapping del renderer.
//        Compone objetos ObjetoCielo: Luna, estrellas, nubes.
// ================================================================
export class CieloNocturno extends Cielo {
    #malla   = null;
    #luna    = new Luna(0.25, 0.18);
    #nubes   = [
        new Nube(0.32, 0.23, 1.3),
        new Nube(0.68, 0.16, 1.0),
        new Nube(0.54, 0.34, 0.75),
        new Nube(0.10, 0.27, 0.95),
        new Nube(0.82, 0.28, 0.80),
    ];

    constructor(colorCielo = '#071830') { super(colorCielo); }

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
        scene.background = this._colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    restaurar(scene) {
        scene.background = this._colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    actualizar(camara) {
        if (this.#malla && camara) this.#malla.position.copy(camara.position);
    }

    get visible()  { return this.#malla?.visible ?? false; }
    set visible(v) { if (this.#malla) this.#malla.visible = !!v; }

    destruir(scene) {
        if (!this.#malla) return;
        scene.remove(this.#malla);
        this.#malla.geometry.dispose();
        this.#malla.material.map?.dispose();
        this.#malla.material.dispose();
        this.#malla = null;
        scene.fog = null;
    }

    // ── Generación de la textura canvas ─────────────────────────────
    #generarTextura() {
        const W = 2048, H = 1024;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');
        const rng = this.#rng(98765);

        // Gradiente azul medianoche (sin púrpura)
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#020c18');
        grad.addColorStop(0.30, '#051428');
        grad.addColorStop(0.65, '#071a32');
        grad.addColorStop(1,    '#0d2240');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // 650 estrellas de fondo — puntitos visibles r=0.5-1.2px
        for (let i = 0; i < 650; i++) {
            const x  = rng() * W;
            const y  = rng() * H * 0.62;
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
            const y = rng() * H * 0.55;
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

        // Luna detrás de las nubes
        this.#luna.dibujar(ctx, W, H, rng);

        // Nubes oscuras azul-gris nocturnas
        for (const nube of this.#nubes) nube.dibujar(ctx, W, H, rng);

        // 9 estrellas brillantes sparkle sobre las nubes
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 9; i++) {
            const x    = rng() * W;
            const y    = rng() * H * 0.50;
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
