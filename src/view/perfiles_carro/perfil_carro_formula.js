'use strict';

// ================================================================
// CLASE: PerfilCarroFormula — perfil lateral 2D del fórmula
// ================================================================
class PerfilCarroFormula extends PerfilCarro {
    get tipo()   { return 'formula'; }
    get nombre() { return 'Fórmula'; }

    dibujar(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-50,0); ctx.lineTo(-50,-8); ctx.lineTo(-36,-16); ctx.lineTo(-10,-16);
        ctx.lineTo(0,-22); ctx.lineTo(14,-22); ctx.lineTo(14,-16); ctx.lineTo(46,-12);
        ctx.lineTo(50,-8); ctx.lineTo(50,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(100,200,255,0.7)';
        ctx.beginPath(); ctx.ellipse(6,-22,10,6,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = this.aclarar(color,-20);
        ctx.fillRect(-54,-20,10,3); ctx.fillRect(-50,-20,3,8); ctx.fillRect(46,-14,10,3);
        this.dibujarRueda(ctx,-34,3,9);
        this.dibujarRueda(ctx,30,3,9);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.ellipse(30,0,9,6,0,0,Math.PI*2); ctx.fill();
    }
}

window.PerfilCarroFormula = PerfilCarroFormula;
