'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: Cielo — domo semiesférico con gradiente y nubes suaves.
//        Acepta color string '#rrggbb' o array [cénit, horizonte]
//        igual que el formato de ConfigPista.get cielo().
//        Se mueve con la cámara para que nunca se vea el borde.
// ================================================================
export class Cielo {
    #malla          = null;
    #colorArriba;
    #colorHorizonte;

    constructor(colorCielo = '#4a9eca') {
        if (Array.isArray(colorCielo)) {
            this.#colorArriba    = new THREE.Color(colorCielo[0]);
            this.#colorHorizonte = new THREE.Color(colorCielo[1]);
        } else {
            this.#colorHorizonte = new THREE.Color(colorCielo);
            this.#colorArriba    = this.#colorHorizonte.clone().lerp(new THREE.Color('#020810'), 0.72);
        }
    }

    // ── Textura canvas: gradiente + nubes para cielos diurnos ────
    #generarTextura() {
        const W = 512, H = 256;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        const arriba    = '#' + this.#colorArriba.getHexString();
        const horizonte = '#' + this.#colorHorizonte.getHexString();

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,   arriba);
        grad.addColorStop(0.65, horizonte);
        grad.addColorStop(1,   horizonte);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Nubes solo si el cielo es suficientemente claro (diurno)
        const lum = this.#colorHorizonte.r * 0.299 +
                    this.#colorHorizonte.g * 0.587 +
                    this.#colorHorizonte.b * 0.114;
        if (lum > 0.25) {
            const nubes = [
                [70,  175, 100, 22],
                [220, 185,  75, 18],
                [380, 170,  95, 20],
                [150, 200,  55, 14],
                [310, 195,  65, 16],
                [460, 180,  80, 17],
            ];
            for (const [x, y, rx, ry] of nubes) {
                for (let r = 1; r >= 0.35; r -= 0.25) {
                    ctx.beginPath();
                    ctx.ellipse(x, y, rx * r, ry * r, 0, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${0.11 * (2 - r)})`;
                    ctx.fill();
                }
            }
        }

        return lienzo;
    }

    construir(scene) {
        const radio = 180;
        const geo = new THREE.SphereGeometry(radio, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

        const textura = new THREE.CanvasTexture(this.#generarTextura());
        const mat = new THREE.MeshBasicMaterial({
            map:        textura,
            side:       THREE.BackSide,
            depthWrite: false,
            depthTest:  false,
            toneMapped: false,
            fog:        false,
        });

        this.#malla = new THREE.Mesh(geo, mat);
        this.#malla.renderOrder   = -1;
        this.#malla.frustumCulled = false;
        scene.add(this.#malla);

        scene.background = this.#colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this.#colorHorizonte.getHex(), 0.018);
    }

    restaurar(scene) {
        scene.background = this.#colorHorizonte.clone();
        scene.fog        = new THREE.FogExp2(this.#colorHorizonte.getHex(), 0.018);
    }

    get visible()  { return this.#malla?.visible ?? false; }
    set visible(v) { if (this.#malla) this.#malla.visible = !!v; }

    actualizar(camara) {
        if (this.#malla && camara) this.#malla.position.copy(camara.position);
    }

    destruir(scene) {
        if (!this.#malla) return;
        scene.remove(this.#malla);
        this.#malla.geometry.dispose();
        this.#malla.material.map?.dispose();
        this.#malla.material.dispose();
        this.#malla = null;
    }
}
