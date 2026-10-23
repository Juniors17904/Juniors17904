'use strict';

// ================================================================
// CLASE: PerfilCarroMuscle — perfil lateral 2D del muscle
// ================================================================
class PerfilCarroMuscle extends PerfilCarro {
    get tipo()   { return 'muscle'; }
    get nombre() { return 'Muscle'; }

    dibujar(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-48,0); ctx.lineTo(-48,-16); ctx.lineTo(-30,-28); ctx.lineTo(-4,-34);
        ctx.lineTo(16,-34); ctx.lineTo(28,-28); ctx.lineTo(40,-28); ctx.lineTo(48,-18); ctx.lineTo(48,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.aclarar(color,25);
        ctx.beginPath();
        ctx.moveTo(10,-32); ctx.lineTo(26,-26); ctx.lineTo(38,-26); ctx.lineTo(32,-32);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,210,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(-28,-27); ctx.lineTo(14,-33); ctx.lineTo(26,-27); ctx.lineTo(-28,-18);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.roundRect(44,-24,5,6,1); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.roundRect(-51,-22,5,9,1); ctx.fill();
        this.dibujarRueda(ctx,-30,5,12);
        this.dibujarRueda(ctx,28,5,12);
    }
}

window.PerfilCarroMuscle = PerfilCarroMuscle;
