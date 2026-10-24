'use strict';

// ================================================================
// MODEL — SuperficiePasto: fuera de la pista. Acelerando a fondo el carro
// se estabiliza cerca del 40 % de su velocidad máxima (PRD 008, D3).
// ================================================================
class SuperficiePasto extends window.Superficie {
    get nombre()     { return 'pasto'; }
    get rozamiento() { return 2.2; }
    get esPasto()    { return true; }
}

window.SuperficiePasto = SuperficiePasto;
