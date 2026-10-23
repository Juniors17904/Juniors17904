'use strict';

import * as THREE from 'three';

// ================================================================
// CLASS: LunaDisenoPista — luna 3D (anillo + disco) del cielo
//        nocturno de Diseño General.
// ================================================================
export class LunaDisenoPista {
    #posicion = new THREE.Vector3(-60, 200, -400);

    agregarA(scene) {
        const pos = this.#posicion;

        // Anillo oscuro grueso — contraste fuerte para definir el borde
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x04080f, depthWrite: false, side: THREE.DoubleSide });
        const ring    = new THREE.Mesh(new THREE.RingGeometry(11.5, 14.5, 64), ringMat);
        ring.position.copy(pos);
        ring.lookAt(0, pos.y, 0);
        scene.add(ring);

        // Disco lunar — color crema medio (no blanco puro) para evitar bloom del toneMapping
        const discoMat = new THREE.MeshBasicMaterial({ color: 0xff0000, depthWrite: false, side: THREE.DoubleSide });
        const disco    = new THREE.Mesh(new THREE.CircleGeometry(11.5, 64), discoMat);
        disco.position.copy(pos);
        disco.lookAt(0, pos.y, 0);
        scene.add(disco);
    }
}
