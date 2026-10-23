'use strict';

// ================================================================
// CLASE: PerfilCarro — superclase de los perfiles laterales 2D de
// cada tipo de carro del garaje (PRD 004 D7). Cada subclase dice su
// tipo, su nombre y cómo se dibuja de lado con dibujar(ctx, color).
// Aquí viven las piezas que comparten todas: rueda y color aclarado.
// ================================================================
class PerfilCarro {
    // Clave del tipo (la misma de data-tipo en index.html)
    get tipo()   { return ''; }

    // Nombre que se muestra en la vista previa
    get nombre() { return ''; }

    // Dibuja el carro de lado con el origen en el piso, al centro
    dibujar(ctx, color) {}

    // Devuelve el color aclarado (cantidad > 0) u oscurecido (< 0)
    aclarar(hex, cantidad = 30) {
        if (!hex || hex.startsWith('rgb')) return hex;
        const num = parseInt(hex.replace('#',''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + cantidad));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + cantidad));
        const b = Math.max(0, Math.min(255, (num & 0xff) + cantidad));
        return `rgb(${r},${g},${b})`;
    }

    // Rueda vista de lado: llanta, rin y centro
    dibujarRueda(ctx, x, y, r) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(x, y, r*0.65, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(x, y, r*0.28, 0, Math.PI*2); ctx.fill();
    }
}

window.PerfilCarro = PerfilCarro;
