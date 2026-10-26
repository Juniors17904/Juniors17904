'use strict';

// ================================================================
// MODEL — DificultadCarrera: qué tan rápido y qué tan parejo corren los
// rivales de la PC (PRD 018, D3 y D4). Superclase de DificultadFacil,
// DificultadNormal y DificultadDificil. Los valores por omisión son los
// de Normal, que es la carrera de siempre (PRD 013, RF-08 del PRD 018).
//   - ritmoBase: el ritmo con que corre un rival cuando nadie lo apura
//     (1 = su manejo normal). El tope de su carro nunca cambia: el piloto
//     solo se anima más o menos (PilotoPC).
//   - ritmoMinimo / ritmoMaximo: hasta dónde puede aflojar o arriesgar.
//   - fuerzaEsperar: cuánto afloja el que se escapó para esperar (AjusteRitmo).
//   - indicesPilotos(cantidad, total): qué lugares de la lista de pilotos
//     (del más rápido al más lento) corren cuando hay menos que el total.
// ================================================================
class DificultadCarrera {
    get clave()         { return ''; }
    get nombre()        { return ''; }
    get ritmoBase()     { return 1; }
    get ritmoMinimo()   { return 0.85; }
    get ritmoMaximo()   { return 1.1; }
    get fuerzaEsperar() { return 1; }

    // Por omisión corren primero los más rápidos (Experto y Agresivo)
    indicesPilotos(cantidad, total) {
        const n = Math.max(0, Math.min(total, Math.round(Number(cantidad) || 0)));
        return Array.from({ length: n }, (_, i) => i);
    }
}

window.DificultadCarrera = DificultadCarrera;
