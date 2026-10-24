'use strict';

// ================================================================
// MODEL — Superficie: el piso bajo el carro (PRD 008, D5).
//   rozamiento: cuánto frena la superficie por sí sola, en proporción a
//   la fuerza del motor del carro y a su velocidad. 0 = asfalto.
//   Con rozamiento r, acelerando a fondo la velocidad se estabiliza donde
//   el empuje del motor iguala al rozamiento.
// ================================================================
class Superficie {
    get nombre()     { return ''; }
    get rozamiento() { return 0; }
    get esPasto()    { return false; }
}

window.Superficie = Superficie;
