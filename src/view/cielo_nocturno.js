'use strict';
import * as THREE from 'three';
import { Cielo } from './cielo.js';
import { Nube }    from './cielos/nube.js';
import { Luna }    from './cielos/luna.js';
import { Montana } from './cielos/montana.js';

// ================================================================
// CLASS: CieloNocturno — domo esférico nocturno con textura canvas.
//        Usa MeshBasicMaterial con toneMapped:false para que los colores
//        oscuros del cielo no sean aclarados por el tone mapping del renderer.
//        Compone objetos ObjetoCielo: Luna, estrellas, nubes.
// ================================================================
export class CieloNocturno extends Cielo {
    #malla     = null;
    #mostrarMontanas = true;
    #luna        = new Luna(0.25, 0.47);
    #montanas    = [
        new Montana(0.03, 0.33, 0.36),
        new Montana(0.12, 0.43, 0.44),
        new Montana(0.22, 0.28, 0.32),
        new Montana(0.32, 0.39, 0.40),
        new Montana(0.43, 0.31, 0.36),
        new Montana(0.54, 0.40, 0.44),
        new Montana(0.65, 0.26, 0.32),
        new Montana(0.75, 0.36, 0.40),
        new Montana(0.85, 0.34, 0.36),
        new Montana(0.94, 0.38, 0.44),
    ];
    #nubesAtras  = [
        new Nube(0.17, 0.46, 0.22),
        new Nube(0.34, 0.45, 0.18),
    ];
    #nubes       = [
        new Nube(0.10, 0.50, 0.26),
        new Nube(0.38, 0.48, 0.24),
        new Nube(0.48, 0.44, 0.20),
        new Nube(0.60, 0.52, 0.22),
        new Nube(0.20, 0.54, 0.20),
    ];

    constructor(colorCielo = '#050e20') {
        super(colorCielo);
    }

    construir(scene) {
        const tex = new THREE.CanvasTexture(this.#generarTextura());
        tex.colorSpace      = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter       = THREE.LinearMipmapLinearFilter;
        tex.anisotropy      = 8;
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

    setMostrarMontanas(v) {
        this.#mostrarMontanas = !!v;
        this.#reconstruirTextura();
    }

    #reconstruirTextura() {
        if (!this.#malla) return;
        this.#malla.material.map?.dispose();
        const tex = new THREE.CanvasTexture(this.#generarTextura());
        tex.colorSpace      = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter       = THREE.LinearMipmapLinearFilter;
        tex.anisotropy      = 8;
        this.#malla.material.map = tex;
        this.#malla.material.needsUpdate = true;
    }

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
        const W = 4096, H = 2048;
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
            const r  = rng() * 0.56 + 0.4;
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
            const r = rng() * 1.2 + 1.2;
            const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
            g.addColorStop(0,   'rgba(238,242,255,1.0)');
            g.addColorStop(0.3, 'rgba(190,208,255,0.55)');
            g.addColorStop(1,   'rgba(150,175,255,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, r * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Montañas — siluetas en el horizonte (delante de las estrellas, detrás de las nubes)
        for (const montana of this.#montanas) montana.dibujar(ctx, W, H, rng, this.#mostrarMontanas);

        // Nubes detrás de la luna
        for (const nube of this.#nubesAtras) nube.dibujar(ctx, W, H, rng);

        // Luna
        this.#luna.dibujar(ctx, W, H, rng);

        // Nubes delante de la luna
        for (const nube of this.#nubes) nube.dibujar(ctx, W, H, rng);

        // 9 estrellas brillantes sparkle sobre las nubes
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 9; i++) {
            const x    = rng() * W;
            const y    = (0.45 + rng() * 0.15) * H;
            const tam  = rng() * 4 + 3.2;
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
