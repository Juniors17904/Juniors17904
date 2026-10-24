'use strict';

// ================================================================
// MODEL — SuperficieAsfalto: la pista. No agrega rozamiento.
// ================================================================
class SuperficieAsfalto extends window.Superficie {
    get nombre()     { return 'asfalto'; }
    get rozamiento() { return 0; }
}

window.SuperficieAsfalto = SuperficieAsfalto;
