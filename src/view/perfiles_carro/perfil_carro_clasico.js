'use strict';

// ================================================================
// CLASE: PerfilCarroClasico — perfil lateral 2D del clásico
// ================================================================
class PerfilCarroClasico extends PerfilCarro {
    get tipo()   { return 'clasico'; }
    get nombre() { return 'Clásico'; }

    dibujar(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-44,0); ctx.lineTo(-44,-18); ctx.lineTo(-34,-18);
        ctx.bezierCurveTo(-30,-42,30,-42,34,-18);
        ctx.lineTo(44,-18); ctx.lineTo(44,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.aclarar(color,28);
        ctx.beginPath();
        ctx.moveTo(-28,-20); ctx.bezierCurveTo(-24,-40,24,-40,28,-20);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,210,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(-22,-20); ctx.bezierCurveTo(-18,-36,18,-36,22,-20);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.arc(40,-12,4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.arc(-40,-12,4,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = this.aclarar(color,50); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-44,-10); ctx.lineTo(44,-10); ctx.stroke();
        this.dibujarRueda(ctx,-28,4,10);
        this.dibujarRueda(ctx,26,4,10);
    }
}

window.PerfilCarroClasico = PerfilCarroClasico;
