'use strict';

// ================================================================
// MODEL — RegistroRecords: los récords de todas las pistas (PRD 020).
//   - obtener(clave): el RecordPista de esa pista ("sin récord" si no hay).
//   - registrar(...): al terminar una carrera, guarda lo que mejora el
//     récord (tiempo total y mejor vuelta, cada uno por su lado) y dice si
//     hubo récord nuevo. Solo cuenta una carrera con todas sus vueltas y
//     tiempos válidos (D3): una meta forzada no deja un récord falso.
// Se guardan en el navegador con su propia clave (no la de la elección del
// PRD 018). Un dato roto en una pista deja solo esa pista sin récord (RF-10).
// ================================================================
class RegistroRecords {
    static #CLAVE = 'tr_records';

    #almacen;

    constructor(almacen = null) {
        this.#almacen = almacen ?? this.#almacenNavegador();
    }

    obtener(clavePista) {
        const dato = this.#leer()[clavePista];
        return dato && typeof dato === 'object' ? new window.RecordPista(dato.total, dato.vuelta) : new window.RecordPista();
    }

    // true si el tiempo total o la mejor vuelta son un récord nuevo
    registrar(clavePista, totalMs, mejorVueltaMs, vueltas, totalVueltas) {
        if (!clavePista || vueltas !== totalVueltas) return false;
        const actual = this.obtener(clavePista);
        const mejoraTotal = actual.mejoraTotal(totalMs), mejoraVuelta = actual.mejoraVuelta(mejorVueltaMs);
        if (!mejoraTotal && !mejoraVuelta) return false;
        const nuevo = new window.RecordPista(mejoraTotal ? totalMs : actual.totalMs, mejoraVuelta ? mejorVueltaMs : actual.vueltaMs);
        this.#escribir(clavePista, nuevo);
        return true;
    }

    #escribir(clavePista, record) {
        if (!this.#almacen) return;
        const datos = this.#leer();
        datos[clavePista] = { total: record.totalMs, vuelta: record.vueltaMs };
        try { this.#almacen.setItem(RegistroRecords.#CLAVE, JSON.stringify(datos)); } catch { /* sin almacenamiento */ }
    }

    // Lo guardado, como dato temporal para leer o escribir (nunca se guarda en la clase)
    #leer() {
        try {
            const datos = JSON.parse(this.#almacen?.getItem(RegistroRecords.#CLAVE) ?? 'null');
            return datos && typeof datos === 'object' && !Array.isArray(datos) ? datos : {};
        } catch { return {}; }
    }

    #almacenNavegador() {
        try { return window.localStorage ?? null; } catch { return null; }
    }
}

window.RegistroRecords = RegistroRecords;
