'use strict';

// ================================================================
// MODEL — CatalogoCarrera: los modos y las dificultades que se pueden
// elegir en "Preparar carrera" (PRD 018), en el orden en que se muestran,
// y la búsqueda de cada uno por su clave (para la elección guardada).
// ================================================================
class CatalogoCarrera {
    #modos        = [new window.ModoContraPC(), new window.ModoContrarreloj()];
    #dificultades = [new window.DificultadFacil(), new window.DificultadNormal(), new window.DificultadDificil()];

    get modos()        { return [...this.#modos]; }
    get dificultades() { return [...this.#dificultades]; }

    modo(clave)       { return this.#modos.find(m => m.clave === clave) ?? null; }
    dificultad(clave) { return this.#dificultades.find(d => d.clave === clave) ?? null; }

    // Contra la PC, Normal y 4 rivales: la carrera de siempre
    eleccionPorOmision() {
        return new window.EleccionCarrera(this.modo('contra-pc'), this.dificultad('normal'));
    }
}

window.CatalogoCarrera = CatalogoCarrera;
