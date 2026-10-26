'use strict';

// ================================================================
// VIEW — TextoRecordPista: cómo se lee el récord de una pista (PRD 020,
// D4): "Récord 1:23.45 · Mejor vuelta 0:27.10" o "Sin récord todavía".
// Lo usan "Preparar carrera" y el panel de resultado, así dicen lo mismo.
// ================================================================
class TextoRecordPista {
    #cronometro = new window.Cronometro();   // solo para formatear los tiempos

    texto(record) {
        if (!record?.tieneRecord) return 'Sin récord todavía';
        const partes = [];
        if (record.totalMs !== null) partes.push('Récord ' + this.#cronometro.formatear(record.totalMs));
        if (record.vueltaMs !== null) partes.push('Mejor vuelta ' + this.#cronometro.formatear(record.vueltaMs));
        return partes.join(' · ');
    }
}

window.TextoRecordPista = TextoRecordPista;
