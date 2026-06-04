'use strict';

// ================================================================
// CLASS: MinimapaConductor — minimapa del HUD durante la carrera
//        Extiende MinimapBase: añade panel, puntos del jugador
//        y del oponente, y conversión de coordenadas 3D → canvas.
// ================================================================
class MinimapaConductor extends MinimapBase {

    setCircuito(pistaCfg) {
        super.setCircuito(pistaCfg);
    }

    // Convierte coordenadas mundo 3D → pixel del canvas HUD
    worldToScreen(worldX, worldZ) {
        if (!this._tienePuntos) return null;
        // Offset (11, 20): margen izquierdo y superior dentro del panel
        return {
            x: -worldX * 0.375 * this._escala + this._ox + 11,
            y: -worldZ * 0.375 * this._escala + this._oy + 20,
        };
    }

    // ctx: canvas HUD completo (ej. 1280×720)
    // Panel dibujado en esquina superior izquierda: (6,4,116,88)
    // Pista escalada en área interna (11,20,100,63)
    dibujar(ctx, carro, oponenteProgreso, nivel, zonaVisible = null) {
        if (!this._tienePuntos) this._construirPuntos(100, 63, 6);
        if (!this._tienePuntos) return;

        ctx.save();

        // Panel de fondo
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.roundRect(6, 4, 116, 88, 8); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;

        // Nombre del nivel
        ctx.fillStyle = '#06b6d4'; ctx.font = '8px Orbitron';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText((nivel || '').toUpperCase(), 12, 8);

        // Área interna: desplazamos al origen del trazado
        ctx.save();
        ctx.translate(11, 20);

        // Trazado: capa sombra + capa visible
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 7;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        this._dibujarTrazado(ctx);
        ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3;
        this._dibujarTrazado(ctx);

        // Línea de meta
        const sf = this._primerPunto;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sf.x - 5, sf.y); ctx.lineTo(sf.x + 5, sf.y); ctx.stroke();

        // Punto del jugador
        const pp = this._posEnProgreso(carro.progreso);
        ctx.shadowColor = carro.color; ctx.shadowBlur = 10;
        ctx.fillStyle = carro.color;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Punto del oponente
        if (oponenteProgreso !== null) {
            const op = this._posEnProgreso(oponenteProgreso);
            ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 7;
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath(); ctx.arc(op.x, op.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();

        // Zona visible de cámara aérea (coordenadas absolutas canvas)
        if (zonaVisible) {
            const c = this.worldToScreen(zonaVisible.x, zonaVisible.z);
            if (c) {
                const r = zonaVisible.radio * 0.375 * this._escala;
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.rect(c.x - r, c.y - r, r * 2, r * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        ctx.restore();
    }
}

window.MinimapaConductor = MinimapaConductor;
// Alias de compatibilidad con código existente
window.Minimapa = MinimapaConductor;
window.Minimap  = MinimapaConductor;
