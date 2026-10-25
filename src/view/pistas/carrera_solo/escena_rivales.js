'use strict';

import * as THREE        from 'three';
import { VisorBase }     from '../../visor_base.js';
import { BuclePasoFijo } from '../comun/bucle_paso_fijo.js';

// ================================================================
// VIEW — EscenaRivales: los carros de la PC dentro de la escena 3D de
// Jugar Solo (PRD 013).
//   - Carga un modelo 3D por rival, con el tipo de auto y el color de
//     su piloto (los mismos pasos que usa VisorCarreraSolo con el jugador).
//   - Avanza a los rivales con su propio BuclePasoFijo de 60 Hz: en cada
//     paso llama a CarreraConRivales.paso (el modelo decide todo).
//   - Solo mueve los grupos 3D a donde está cada carro. Sin reglas de carrera.
// ================================================================
export class EscenaRivales {
    #escena;
    #carrera;     // CarreraConRivales (modelo)
    #medidas;     // MedidasEscena
    #bucle     = new BuclePasoFijo();
    #grupos    = [];   // un grupo 3D por rival, en el mismo orden que carrera.rivales
    #inclina   = [];   // grupo interior que se inclina en las curvas
    #destruido = false;

    constructor(escena, carreraConRivales, medidas) {
        if (!escena) throw new Error('EscenaRivales: falta la escena');
        if (!carreraConRivales) throw new Error('EscenaRivales: falta la carrera con rivales');
        this.#escena  = escena;
        this.#carrera = carreraConRivales;
        this.#medidas = medidas ?? new window.MedidasEscena();
    }

    // ── Carga de los modelos 3D (uno por rival) ──────────────────
    async cargar() {
        try {
            const gltf = await VisorBase.cargarGLTF();
            if (this.#destruido) return;
            this.#quitarGrupos();
            for (const rival of this.#carrera.rivales) this.#crearGrupo(gltf, rival);
            this.sincronizar();
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[EscenaRivales.cargar] ' + e.message);
            console.error('[EscenaRivales.cargar]', e);
        }
    }

    // ── Un cuadro: pasos fijos de 60 Hz de los rivales + posición 3D ──
    // Devuelve cuántos pasos se dieron en este cuadro.
    avanzar(marca, activo, carroJugador = null, medidaJugador = null) {
        if (this.#destruido) return 0;
        const pasos = this.#bucle.avanzar(marca, activo,
            () => this.#carrera.paso(carroJugador, medidaJugador));
        this.sincronizar();
        return pasos;
    }

    // Olvida el tiempo acumulado (al empezar o repetir la carrera)
    reiniciar() {
        this.#bucle.reiniciar();
        this.sincronizar();
    }

    // ── Lleva cada grupo 3D a la posición de su carro ────────────
    sincronizar() {
        if (this.#destruido) return;
        const rivales = this.#carrera.rivales;
        const altura  = this.#medidas.alturaAsfalto;
        this.#grupos.forEach((grupo, i) => {
            const carro = rivales[i]?.carro;
            if (!carro) return;
            grupo.position.set(carro.px, altura, carro.pz);
            grupo.rotation.y = carro.rotY;
            this.#inclina[i].rotation.z = carro.carLean;
        });
    }

    // ── Liberación ──────────────────────────────────────────────
    destruir() {
        if (this.#destruido) return;
        this.#destruido = true;
        this.#quitarGrupos();
        this.#escena = null;
    }

    // ── Privados ────────────────────────────────────────────────
    #crearGrupo(gltf, rival) {
        const piloto  = rival.piloto;
        const tipo    = piloto.tipoAuto;
        const interno = VisorBase.construirGrupo(gltf, tipo, piloto.color);
        VisorBase.centrarGrupo(interno, this.#medidas.medidaCarro(tipo).largo);

        const inclina = new THREE.Group(); inclina.add(interno);
        const grupo   = new THREE.Group(); grupo.add(inclina);
        grupo.name    = 'rival:' + rival.nombre;
        this.#escena.add(grupo);
        this.#grupos.push(grupo);
        this.#inclina.push(inclina);
    }

    // Saca los grupos de la escena y libera los materiales clonados
    // (la geometría la comparte el modelo GLB cargado una sola vez).
    #quitarGrupos() {
        for (const grupo of this.#grupos) {
            this.#escena?.remove(grupo);
            grupo.traverse(hijo => {
                if (!hijo.isMesh) return;
                const materiales = Array.isArray(hijo.material) ? hijo.material : [hijo.material];
                for (const m of materiales) m?.dispose?.();
            });
        }
        this.#grupos  = [];
        this.#inclina = [];
    }
}
