'use strict';
import { Cielo } from './cielo.js';

// ================================================================
// CLASS: CieloDespejado — cielo de día con gradiente azul neutro.
//        Usado en el visor de Diseño de Objetos para que los objetos
//        terrestres (árbol, poste, barrera...) se vean con luz natural,
//        sin la oscuridad del cielo nocturno de carrera.
// ================================================================
export class CieloDespejado extends Cielo {
    constructor() {
        super(['#1565c0', '#b8d8f8']);
    }

    _generarTextura() {
        const W = 512, H = 256;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');

        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#0d47a1');  // cenit: azul profundo
        grad.addColorStop(0.30, '#1976d2');  // azul medio
        grad.addColorStop(0.65, '#64b5f6');  // azul claro
        grad.addColorStop(0.85, '#bbdefb');  // celeste pálido
        grad.addColorStop(1,    '#e3f2fd');  // horizonte: casi blanco
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        return lienzo;
    }
}
