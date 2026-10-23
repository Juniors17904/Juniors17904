'use strict';

// ================================================================
// CLASE: PerfilCarroDeportivo — perfil lateral 2D del deportivo
// ================================================================
class PerfilCarroDeportivo extends PerfilCarro {
    get tipo()   { return 'deportivo'; }
    get nombre() { return 'Deportivo'; }

    dibujar(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-44,0); ctx.lineTo(-44,-14); ctx.lineTo(-20,-30);
        ctx.lineTo(14,-30); ctx.lineTo(38,-16); ctx.lineTo(44,-16); ctx.lineTo(44,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,210,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(-18,-28); ctx.lineTo(12,-28); ctx.lineTo(36,-17); ctx.lineTo(-18,-17);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.roundRect(40,-22,5,5,1); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.roundRect(-47,-18,4,8,1); ctx.fill();
        this.dibujarRueda(ctx,-28,4,10);
        this.dibujarRueda(ctx,26,4,10);
    }
}

window.PerfilCarroDeportivo = PerfilCarroDeportivo;
