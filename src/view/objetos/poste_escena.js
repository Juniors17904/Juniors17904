'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';


// ================================================================
// CLASS: PosteEscena — poste de alumbrado urbano
//        El brazo y la lámpara apuntan siempre hacia el interior
//        de la pista: lado=+1 (derecha) → brazo hacia -X local,
//        lado=-1 (izquierda) → brazo hacia +X local.
//
//        Solo 1 de cada 4 postes lleva PointLight real (conLuz=true).
//        La luz se añade DIRECTAMENTE a la escena para mantener el
//        conteo de luces fijo y evitar recompilación de shaders.
//        El apagado/encendido usa intensity=0/intensidad en vez de visible.
//
//        Tamaño real (PRD 010, RF-02): alto, radio, brazo y lámpara
//        salen de MedidasEscena. La luz sale de la lámpara; como ahora
//        está más alta, se compensa con la INTENSIDAD (no con el alcance)
//        para que al asfalto llegue la misma luz que antes. La PointLight
//        usa decaimiento físico (decay = 2 por defecto en Three r164):
//        la luz cae con 1/d², así que se multiplica por (alto nuevo / alto viejo)².
// ================================================================
export class PosteEscena extends ObjetoEscena {
    static #INTENSIDAD_ANTERIOR = 300;   // intensidad con la luz a la altura anterior
    static #ALTURA_LUZ_ANTERIOR = 4.8;   // altura de la luz antes del PRD 010
    static #RANGO_LUZ           = 30;
    static #RADIO_BRAZO         = 0.5;   // radio del brazo / radio del poste
    static #AFINADO_POSTE       = 0.85;  // radio arriba / radio en la base

    #lado;
    #conLuz;
    #luz        = null;
    #scene      = null;
    #intensidad = 0;

    constructor(x, z, rotY = 0, lado = -1, conLuz = true) {
        super(x, z, rotY);
        this.#lado   = lado;
        this.#conLuz = conLuz;
    }

    _poblar(grupo) {
        const medidas    = new window.MedidasEscena();
        const alto       = medidas.altoPoste;
        const radio      = medidas.radioPoste;
        const largoBrazo = medidas.largoBrazoPoste;
        const radioLamp  = medidas.radioLampara;
        const radioBrazo = radio * PosteEscena.#RADIO_BRAZO;

        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(radio * PosteEscena.#AFINADO_POSTE, radio, alto, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
        );
        poste.position.y = alto / 2;
        poste.castShadow = true;

        // Brazo horizontal hacia la pista, con su borde de arriba en la punta del poste
        const yBrazo = alto - radioBrazo;
        const brazo = new THREE.Mesh(
            new THREE.CylinderGeometry(radioBrazo, radioBrazo, largoBrazo, 6),
            new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 })
        );
        brazo.position.set(-(largoBrazo / 2) * this.#lado, yBrazo, 0);
        brazo.rotation.z = Math.PI / 2;

        // Lámpara colgada en la punta del brazo (no sube más que el poste)
        const yLampara = alto - radioLamp;
        const colorLampara = this.#conLuz ? 0xfffbe0 : 0xff0000;
        const lampara = new THREE.Mesh(
            new THREE.SphereGeometry(radioLamp, 8, 6),
            new THREE.MeshStandardMaterial({ color: colorLampara, emissive: colorLampara, emissiveIntensity: 0.6 })
        );
        lampara.position.set(-largoBrazo * this.#lado, yLampara, 0);

        if (this.#conLuz) {
            // La luz sale justo debajo de la lámpara
            const yLuz = yLampara - radioLamp;
            const compensacion = (yLuz / PosteEscena.#ALTURA_LUZ_ANTERIOR) ** 2;
            this.#intensidad = PosteEscena.#INTENSIDAD_ANTERIOR * compensacion;
            this.#luz = new THREE.PointLight(0xffe8a0, this.#intensidad, PosteEscena.#RANGO_LUZ);
            this.#luz.position.set(-largoBrazo * this.#lado, yLuz, 0);
        }

        grupo.add(poste, brazo, lampara);
    }

    construir(scene) {
        this.#scene = scene;
        super.construir(scene);
        if (this.#luz && this._grupo) {
            this._grupo.updateMatrixWorld(true);
            const posM = this.#luz.position.clone();
            this._grupo.localToWorld(posM);
            this.#luz.position.copy(posM);
            scene.add(this.#luz);
        }
    }

    setVisible(v) {
        super.setVisible(v);
        if (this.#luz) this.#luz.intensity = v ? this.#intensidad : 0;
    }

    destruir(scene) {
        if (this.#luz) {
            (this.#scene ?? scene).remove(this.#luz);
            this.#luz = null;
        }
        super.destruir(scene);
        this.#scene = null;
    }
}
