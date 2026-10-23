'use strict';

// ================================================================
// CLASE: PerfilCarroPickup — perfil lateral 2D de la pickup
// ================================================================
class PerfilCarroPickup extends PerfilCarro {
    get tipo()   { return 'pickup'; }
    get nombre() { return 'Pickup'; }

    dibujar(ctx, color) {
        ctx.fillStyle = this.aclarar(color,-25);
        ctx.beginPath();
        ctx.moveTo(-48,0); ctx.lineTo(-48,-18); ctx.lineTo(-10,-18); ctx.lineTo(-10,0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = this.aclarar(color,-50); ctx.lineWidth = 1.5;
        ctx.strokeRect(-46,-16,34,14);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-12,0); ctx.lineTo(-12,-26); ctx.lineTo(-4,-40); ctx.lineTo(28,-40);
        ctx.lineTo(44,-28); ctx.lineTo(48,-20); ctx.lineTo(48,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,210,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(-3,-38); ctx.lineTo(26,-38); ctx.lineTo(42,-28); ctx.lineTo(-3,-28);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.roundRect(44,-28,5,7,1); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.roundRect(-51,-18,4,10,1); ctx.fill();
        this.dibujarRueda(ctx,-32,4,11);
        this.dibujarRueda(ctx,28,4,11);
    }
}

window.PerfilCarroPickup = PerfilCarroPickup;
