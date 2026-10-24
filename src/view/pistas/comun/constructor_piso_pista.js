'use strict';

import * as THREE from 'three';
import { AcumuladorGeometria } from './acumulador_geometria.js';

// ================================================================
// VIEW — ConstructorPisoPista: dibuja el piso de la pista igual en las
// 5 pantallas de manejo (PRD 012, D9): asfalto, pianos con relieve,
// líneas de borde, línea central discontinua y meta a cuadros.
//   - Sigue un TrazadoPiso (curva cerrada o recta abierta).
//   - Todas las medidas salen de MedidasEscena (D8).
//   - El pasto queda a nivel 0 (lo dibuja cada visor); el asfalto queda
//     a alturaAsfalto y el piano sube alturaPiano más en su borde exterior.
//   - Una malla por material; las líneas y la meta no parpadean
//     (polygonOffset y renderOrder).
// construir() devuelve un THREE.Group; liberar() suelta todo.
// ================================================================
export class ConstructorPisoPista {
    #trazado;
    #medidas;
    #distanciaMeta;
    #colorAsfalto;
    #grupo       = null;
    #geometrias  = [];
    #materiales  = [];

    // distanciaMeta: dónde va el centro de la meta, en metros desde el inicio
    constructor(trazado, distanciaMeta = 0, colorAsfalto = 0x404040, medidas = new window.MedidasEscena()) {
        this.#trazado       = trazado;
        this.#distanciaMeta = distanciaMeta;
        this.#colorAsfalto  = colorAsfalto;
        this.#medidas       = medidas;
    }

    get grupo() { return this.#grupo; }

    construir() {
        this.liberar();
        this.#grupo = new THREE.Group();
        this.#grupo.name = 'pisoPista';

        const asfalto = new AcumuladorGeometria();
        const rojo = new AcumuladorGeometria(), blanco = new AcumuladorGeometria();
        const bordes = new AcumuladorGeometria(), central = new AcumuladorGeometria();
        const metaBlanca = new AcumuladorGeometria(), metaNegra = new AcumuladorGeometria();

        this.#agregarAsfalto(asfalto);
        this.#agregarPianos(rojo, blanco);
        this.#agregarBordes(bordes);
        this.#agregarCentral(central);
        this.#agregarMeta(metaBlanca, metaNegra);

        this.#agregarMalla('asfalto', asfalto, new THREE.MeshStandardMaterial({ color: this.#colorAsfalto, roughness: 0.85 }), 0, 0);
        this.#agregarMalla('pianoRojo', rojo, new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.4, emissive: 0xaa0000, emissiveIntensity: 0.25 }), 0, 0);
        this.#agregarMalla('pianoBlanco', blanco, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.2 }), 0, 0);
        this.#agregarMalla('lineasBorde', bordes, new THREE.MeshBasicMaterial({ color: 0xffffff }), 1, -1);
        this.#agregarMalla('lineaCentral', central, new THREE.MeshBasicMaterial({ color: 0xffee44 }), 1, -1);
        this.#agregarMalla('metaBlanca', metaBlanca, new THREE.MeshBasicMaterial({ color: 0xffffff }), 2, -2);
        this.#agregarMalla('metaNegra', metaNegra, new THREE.MeshBasicMaterial({ color: 0x111111 }), 2, -2);
        return this.#grupo;
    }

    liberar() {
        for (const g of this.#geometrias) g.dispose();
        for (const m of this.#materiales) m.dispose();
        this.#geometrias = [];
        this.#materiales = [];
        if (this.#grupo) {
            this.#grupo.parent?.remove(this.#grupo);
            this.#grupo.clear();
        }
        this.#grupo = null;
    }

    // ── Piezas ──────────────────────────────────────────────────
    #agregarAsfalto(acc) {
        const m = this.#medidas, h = m.alturaAsfalto, M = m.medioAnchoAsfalto;
        acc.agregarTira(this.#trazado, 0, this.#trazado.largo, -M, h, M, h);
    }

    // Piano: sube del borde del asfalto a su borde exterior y baja en una
    // pared hasta el pasto. Franjas alternas del mismo largo (en las pistas
    // cerradas se ajusta un poco para que todas midan igual).
    #agregarPianos(rojo, blanco) {
        const m = this.#medidas, t = this.#trazado;
        const M = m.medioAnchoAsfalto, E = m.limitePiano;
        const hA = m.alturaAsfalto, hP = m.alturaAsfalto + m.alturaPiano;
        const franja = this.#largoParejo(m.largoFranjaPiano);
        for (let i = 0, s = 0; s < t.largo - 1e-9; i++, s += franja) {
            const acc = i % 2 === 0 ? rojo : blanco;
            const s1 = Math.min(t.largo, s + franja);
            for (const lado of [-1, 1]) {
                acc.agregarTira(t, s, s1, lado * M, hA, lado * E, hP);
                acc.agregarTira(t, s, s1, lado * E, hP, lado * E, 0);
            }
        }
    }

    #agregarBordes(acc) {
        const m = this.#medidas, h = m.alturaAsfalto, a = m.anchoLineaBorde / 2;
        for (const lado of [-1, 1]) {
            const c = lado * m.lineaBorde;
            acc.agregarTira(this.#trazado, 0, this.#trazado.largo, c - a, h, c + a, h);
        }
    }

    #agregarCentral(acc) {
        const m = this.#medidas, t = this.#trazado, h = m.alturaAsfalto, a = m.anchoLineaCentral / 2;
        const paso = m.trazoLineaCentral + m.huecoLineaCentral;
        for (let s = 0; s < t.largo - 1e-9; s += paso) {
            acc.agregarTira(t, s, Math.min(t.largo, s + m.trazoLineaCentral), -a, h, a, h);
        }
    }

    // Meta a cuadros: largoMeta de largo, todo el ancho del asfalto
    #agregarMeta(blanca, negra) {
        const m = this.#medidas, t = this.#trazado, h = m.alturaAsfalto, M = m.medioAnchoAsfalto;
        let s0 = this.#distanciaMeta - m.largoMeta / 2;
        if (!t.cerrado) s0 = Math.min(Math.max(0, s0), t.largo - m.largoMeta);
        const filas = Math.max(1, Math.round(m.largoMeta / m.ladoCuadroMeta));
        const columnas = Math.max(1, Math.round(2 * M / m.ladoCuadroMeta));
        const alto = m.largoMeta / filas, ancho = 2 * M / columnas;
        for (let f = 0; f < filas; f++) {
            for (let c = 0; c < columnas; c++) {
                const acc = (f + c) % 2 === 0 ? blanca : negra;
                acc.agregarTira(t, s0 + f * alto, s0 + (f + 1) * alto, -M + c * ancho, h, -M + (c + 1) * ancho, h);
            }
        }
    }

    // En un trazado cerrado, el largo más cercano a "largo" que entra un número
    // entero de veces (todas las franjas iguales)
    #largoParejo(largo) {
        if (!this.#trazado.cerrado) return largo;
        return this.#trazado.largo / Math.max(1, Math.round(this.#trazado.largo / largo));
    }

    #agregarMalla(nombre, acc, material, orden, desplazamiento) {
        const geo = acc.geometria();
        if (!geo) { material.dispose(); return; }
        if (orden > 0) {
            material.polygonOffset       = true;
            material.polygonOffsetFactor = desplazamiento;
            material.polygonOffsetUnits  = desplazamiento;
        }
        const malla = new THREE.Mesh(geo, material);
        malla.name          = nombre;
        malla.renderOrder   = orden;
        malla.receiveShadow = true;
        this.#geometrias.push(geo);
        this.#materiales.push(material);
        this.#grupo.add(malla);
    }
}
