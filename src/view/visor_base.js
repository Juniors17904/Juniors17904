'use strict';

import * as THREE    from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ================================================================
// CLASE BASE: VisorBase — utilidades compartidas para todos los visores 3D
// ================================================================

let _glbPromise = null;

export class VisorBase {
    static MAPA = {
        deportivo: 'Sports',
        suv:       'SUV',
        muscle:    'Muscle',
        formula:   'Roadster',
        pickup:    'Pickup',
        clasico:   'Limousine',
    };

    static cargarGLTF() {
        if (!_glbPromise)
            _glbPromise = new GLTFLoader().loadAsync('src/assets/models/vehicles_pack.glb');
        return _glbPromise;
    }

    static esCarroceria(name) {
        const l = name.toLowerCase();
        return l.includes('body') && !l.includes('black') && !l.includes('white');
    }

    static construirGrupo(gltf, tipo, color) {
        const prefix = VisorBase.MAPA[tipo] ?? 'Sports';
        const group  = new THREE.Group();
        const nodos  = [
            prefix,
            `${prefix}_wheel_front_right`,
            `${prefix}_wheel_front_left`,
            `${prefix}_wheel_rear_right`,
            `${prefix}_wheel_rear_left`,
        ];
        for (const nombre of nodos) {
            const nodo = gltf.scene.getObjectByName(nombre);
            if (!nodo) continue;
            const clone = nodo.clone();
            clone.traverse(child => {
                if (!child.isMesh) return;
                child.material = child.material.clone();
                child.castShadow    = true;
                child.receiveShadow = true;
                if (VisorBase.esCarroceria(child.name)) child.material.color.set(color);
            });
            group.add(clone);
        }
        return group;
    }

    static centrarGrupo(group, targetDim) {
        const box  = new THREE.Box3().setFromObject(group);
        const size = box.getSize(new THREE.Vector3());
        group.scale.setScalar(targetDim / Math.max(size.x, size.z));
        const box2   = new THREE.Box3().setFromObject(group);
        const center = box2.getCenter(new THREE.Vector3());
        group.position.set(-center.x, -box2.min.y, -center.z);
        return box2;
    }
}
