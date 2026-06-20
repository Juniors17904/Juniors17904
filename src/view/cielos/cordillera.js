'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: Cordillera — cilindro 3D panorámico que rodea el horizonte
//        del cielo nocturno. Textura canvas con silueta angular de
//        picos + halo cálido de luces de ciudad detrás.
//        Radio 170 (dentro de la esfera del cielo de radio 180).
// ================================================================
export class Cordillera {
    #malla = null;

    construir(scene) {
        const tex = new THREE.CanvasTexture(this.#generarTextura());
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshBasicMaterial({
            map: tex, side: THREE.BackSide,
            transparent: true, depthWrite: false,
            toneMapped: false, fog: false,
        });
        const geo = new THREE.CylinderGeometry(170, 170, 55, 64, 1, true);
        this.#malla               = new THREE.Mesh(geo, mat);
        this.#malla.renderOrder   = 0;
        this.#malla.frustumCulled = false;
        scene.add(this.#malla);
    }

    destruir(scene) {
        if (!this.#malla) return;
        scene.remove(this.#malla);
        this.#malla.geometry.dispose();
        this.#malla.material.map?.dispose();
        this.#malla.material.dispose();
        this.#malla = null;
    }

    actualizar(camara) {
        if (!this.#malla || !camara) return;
        this.#malla.position.set(
            camara.position.x,
            camara.position.y - 18,
            camara.position.z
        );
    }

    get visible()  { return this.#malla?.visible ?? false; }
    set visible(v) { if (this.#malla) this.#malla.visible = !!v; }

    // ── Textura panorámica ───────────────────────────────────────
    #generarTextura() {
        const W = 2048, H = 512;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        // Halo de ciudad — puntos de luz cálida en el horizonte
        const centrosGlow = [0.08, 0.22, 0.38, 0.52, 0.67, 0.80, 0.93];
        for (const gx of centrosGlow) {
            const g = ctx.createRadialGradient(
                gx * W, H * 0.58, 0,
                gx * W, H * 0.58, W * 0.13
            );
            g.addColorStop(0,   'rgba(255,160,50,0.22)');
            g.addColorStop(0.4, 'rgba(255,120,30,0.10)');
            g.addColorStop(1,   'rgba(255,90,20,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }

        // Cordillera — silueta angular panorámica
        const BASE = H * 0.58;
        const picos = [
            [0.00, 0.26], [0.04, 0.44], [0.08, 0.20], [0.12, 0.50],
            [0.17, 0.30], [0.22, 0.58], [0.27, 0.22], [0.32, 0.46],
            [0.37, 0.34], [0.42, 0.54], [0.47, 0.24], [0.52, 0.42],
            [0.57, 0.52], [0.62, 0.20], [0.67, 0.48], [0.72, 0.30],
            [0.77, 0.56], [0.82, 0.24], [0.87, 0.44], [0.92, 0.36],
            [0.97, 0.40], [1.00, 0.26],
        ];

        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, BASE);
        for (const [px, ph] of picos) {
            ctx.lineTo(px * W, BASE - ph * BASE * 0.80);
        }
        ctx.lineTo(W, BASE);
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = '#040d1e';
        ctx.fill();

        // Luz de luna sobre los picos
        ctx.save(); ctx.clip();
        const lgl = ctx.createLinearGradient(W * 0.15, 0, W * 0.65, BASE);
        lgl.addColorStop(0, 'rgba(170,200,255,0.09)');
        lgl.addColorStop(1, 'rgba(60,100,180,0)');
        ctx.fillStyle = lgl;
        ctx.fillRect(0, 0, W, BASE + 10);
        ctx.restore();

        return lienzo;
    }
}
