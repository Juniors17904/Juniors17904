'use strict';
import * as THREE from 'three';

// ================================================================
// VIEW — CamaraChase
// Cámara que sigue al carro. Dos modos:
//   seguirRotacion: true  → gira con el carro, el carro queda fijo en pantalla (Circuito)
//   seguirRotacion: false → ángulo fijo, el carro se ve rotar en pantalla (Test Drive)
// ================================================================
export class CamaraChase {
    #cam;
    #distancia;
    #seguirRotacion;
    #indicador = null;
    #camAngle  = 0;
    #carRotY   = 0;
    #lean      = 0;

    altura    = 2.8;
    leanMax   = 0.08;
    leanSpeed = 0.06;

    get camRotY() {
        let a = this.#camAngle - this.#carRotY;
        return ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    }
    get camRotX() { return this.#cam.rotation.x; }
    get camRotZ() { return this.#lean; }

    constructor(aspect, { distancia = 7, altura = 2.8, seguirRotacion = true } = {}) {
        this.#cam             = new THREE.PerspectiveCamera(55, aspect, 0.1, 200);
        this.#distancia       = distancia;
        this.#seguirRotacion  = seguirRotacion;
        this.altura           = altura;
    }

    get camera() { return this.#cam; }

    agregarIndicador(scene) {
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
        ]);
        this.#indicador = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
        this.#indicador.visible = false;
        scene.add(this.#indicador);
    }

    set indicadorVisible(v) {
        if (this.#indicador) this.#indicador.visible = v;
    }

    resize(aspect) {
        this.#cam.aspect = aspect;
        this.#cam.updateProjectionMatrix();
    }

    actualizar(px, pz, rotY, steerInput = 0) {
        this.#carRotY = rotY;
        this.#lean += (steerInput * this.leanMax - this.#lean) * this.leanSpeed;
        const ry   = this.#seguirRotacion ? rotY : 0;
        const sinY = Math.sin(ry);
        const cosY = Math.cos(ry);
        const D    = this.#distancia;

        this.#cam.position.set(px - sinY * D, this.altura, pz - cosY * D);

        if (this.#seguirRotacion) {
            this.#cam.lookAt(px + sinY * 4, 0.6, pz + cosY * 4);
        } else {
            this.#cam.lookAt(px, 0.6, pz);
        }

        this.#cam.rotation.z -= this.#lean;

        this.actualizarIndicador(px, pz);
    }

    actualizarIndicador(px, pz) {
        const cx  = this.#cam.position.x, cz = this.#cam.position.z;
        const dx  = px - cx, dz = pz - cz;
        const len = Math.sqrt(dx*dx + dz*dz) || 1;
        this.#camAngle = Math.atan2(dx, dz);
        if (this.#indicador) {
            const pos = this.#indicador.geometry.attributes.position;
            pos.setXYZ(0, cx, 0.5, cz);
            pos.setXYZ(1, cx + (dx/len) * 3, 0.5, cz + (dz/len) * 3);
            pos.needsUpdate = true;
        }
    }
}
