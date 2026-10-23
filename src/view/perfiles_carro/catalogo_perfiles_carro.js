'use strict';

// ================================================================
// CLASE: CatalogoPerfilesCarro — registro de los perfiles de carro
// por tipo (PRD 004 D7). Reemplaza el switch(tipo) del antiguo
// Garaje: cada tipo se busca aquí y el perfil se dibuja solo.
// ================================================================
class CatalogoPerfilesCarro {
    #perfiles = new Map();

    constructor() {
        [
            new PerfilCarroDeportivo(),
            new PerfilCarroSuv(),
            new PerfilCarroMuscle(),
            new PerfilCarroFormula(),
            new PerfilCarroPickup(),
            new PerfilCarroClasico(),
        ].forEach(p => this.#perfiles.set(p.tipo, p));
    }

    // Perfil del tipo pedido, o null si el tipo no existe
    obtener(tipo) {
        return this.#perfiles.get(tipo) || null;
    }
}

window.CatalogoPerfilesCarro = CatalogoPerfilesCarro;
