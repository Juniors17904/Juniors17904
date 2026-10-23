'use strict';

// ================================================================
// CLASE: PerfilCarroSuv — perfil lateral 2D del SUV
// ================================================================
class PerfilCarroSuv extends PerfilCarro {
    get tipo()   { return 'suv'; }
    get nombre() { return 'SUV'; }

    dibujar(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-46,0); ctx.lineTo(-46,-20); ctx.lineTo(-38,-38);
        ctx.lineTo(30,-38); ctx.lineTo(42,-26); ctx.lineTo(46,-20); ctx.lineTo(46,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,210,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(-36,-36); ctx.lineTo(28,-36); ctx.lineTo(40,-26); ctx.lineTo(-36,-22);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.aclarar(color,-30); ctx.fillRect(-44,-12,88,4);
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.roundRect(42,-28,5,7,1); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.roundRect(-48,-28,4,10,1); ctx.fill();
        this.dibujarRueda(ctx,-28,4,11);
        this.dibujarRueda(ctx,26,4,11);
    }
}

window.PerfilCarroSuv = PerfilCarroSuv;
