'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: SalidaEscena — semáforo F1 de salida (rojo apagado,
//        amarillo apagado, verde encendido)
// ================================================================
export class SalidaEscena extends ObjetoEscena {
    constructor(x, z) { super(x, z); }

    _poblar(grupo) {
        // Poste
        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.13, 4.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 })
        );
        poste.position.y = 2.25;
        poste.castShadow = true;

        // Carcasa del semáforo
        const carcasa = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 1.9, 0.45),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 })
        );
        carcasa.position.set(0, 5.2, 0);

        // Luces: roja apagada, amarilla apagada, verde encendida
        const geoLuz = new THREE.SphereGeometry(0.16, 12, 8);
        const luzRoja = new THREE.Mesh(geoLuz,
            new THREE.MeshStandardMaterial({ color: 0x3a0000 }));
        const luzAmarilla = new THREE.Mesh(geoLuz,
            new THREE.MeshStandardMaterial({ color: 0x2a2000 }));
        const luzVerde = new THREE.Mesh(geoLuz,
            new THREE.MeshStandardMaterial({ color: 0x00ee44, emissive: 0x00aa22, emissiveIntensity: 0.8 }));

        luzRoja.position.set(0, 5.9, 0.23);
        luzAmarilla.position.set(0, 5.2, 0.23);
        luzVerde.position.set(0, 4.5, 0.23);

        grupo.add(poste, carcasa, luzRoja, luzAmarilla, luzVerde);
    }
}
