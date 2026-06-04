'use strict';
import * as THREE from 'three';
import { CamaraBase } from './camara_base.js';

// ================================================================
// VIEW — CamaraSeguimiento  (antes CamaraChase)
// Cámara que sigue al carro. Dos modos:
//   seguirRotacion: true  → gira con el carro, el carro queda fijo en pantalla (Circuito)
//   seguirRotacion: false → ángulo fijo, el carro se ve rotar en pantalla (Test Drive)
// ================================================================
export class CamaraSeguimiento extends CamaraBase {
    #distancia;
    #seguirRotacion;
    #indicador = null;
    #camAngle  = 0;
    #carRotY   = 0;
    #lean      = 0;

    altura    = 2.8;
    leanMax   = 0.5;
    leanSpeed = 0.06;

    get camRotY() {
        let a = this.#camAngle - this.#carRotY;
        return ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    }
    get camRotX() { return this.camera.rotation.x; }
    get camRotZ() { return this.#lean; }

    constructor(aspect, { distancia = 7, altura = 2.8, seguirRotacion = true } = {}) {
        super(55, aspect, 0.1, 200);
        this.#distancia       = distancia;
        this.#seguirRotacion  = seguirRotacion;
        this.altura           = altura;
    }

    agregarIndicador(scene) {
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
        ]);
        this.#indicador = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff, depthTest: false }));
        this.#indicador.renderOrder    = 999;
        this.#indicador.frustumCulled  = false;
        this.#indicador.visible = false;
        scene.add(this.#indicador);
    }

    set indicadorVisible(v) {
        if (this.#indicador) this.#indicador.visible = v;
    }

    actualizar(px, pz, rotY, steerInput = 0) {
        this.#carRotY = rotY;
        const orbit = this.#seguirRotacion ? rotY : 0;
        const sinY  = Math.sin(orbit);
        const cosY  = Math.cos(orbit);
        const D     = this.#distancia;

        this.camera.position.set(px - sinY * D, this.altura, pz - cosY * D);
        this.camera.lookAt(px, 0.6, pz);

        this.actualizarIndicador(px, pz);
    }

    actualizarIndicador(px, pz) {
        const cx = this.camera.position.x, cz = this.camera.position.z;
        const dx = px - cx, dz = pz - cz;
        this.#camAngle = Math.atan2(dx, dz);
        if (this.#indicador) {
            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);
            const L   = 5;
            const pos = this.#indicador.geometry.attributes.position;
            pos.setXYZ(0, cx, 0.5, cz);
            pos.setXYZ(1, cx + dir.x * L, 0.5, cz + dir.z * L);
            pos.needsUpdate = true;
        }
    }
}

// CamaraChase es alias de CamaraSeguimiento — se maneja en camara_chase.js
