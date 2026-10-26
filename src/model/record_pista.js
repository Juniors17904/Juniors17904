'use strict';

// ================================================================
// MODEL — RecordPista: el récord de una pista en Jugar Solo (PRD 020):
// el mejor tiempo total de las 3 vueltas y la mejor vuelta, en ms.
// Cada uno puede faltar (null) si todavía no hay una carrera terminada.
// Solo se lee: un récord mejor es otro RecordPista (lo arma RegistroRecords).
// ================================================================
class RecordPista {
    #totalMs  = null;
    #vueltaMs = null;

    constructor(totalMs = null, vueltaMs = null) {
        this.#totalMs  = RecordPista.#valido(totalMs) ? totalMs : null;
        this.#vueltaMs = RecordPista.#valido(vueltaMs) ? vueltaMs : null;
    }

    get totalMs()     { return this.#totalMs; }
    get vueltaMs()    { return this.#vueltaMs; }
    get tieneRecord() { return this.#totalMs !== null || this.#vueltaMs !== null; }

    // ¿Este tiempo total (o vuelta) mejora el récord? El primero siempre lo mejora
    mejoraTotal(ms)  { return RecordPista.#valido(ms) && (this.#totalMs === null || ms < this.#totalMs); }
    mejoraVuelta(ms) { return RecordPista.#valido(ms) && (this.#vueltaMs === null || ms < this.#vueltaMs); }

    static #valido(ms) { return typeof ms === 'number' && Number.isFinite(ms) && ms > 0; }
}

window.RecordPista = RecordPista;
