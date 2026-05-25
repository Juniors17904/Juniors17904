'use strict';

// ================================================================
// CLASS: Garage — dibujo de carros y UI del garage
// ================================================================
class Garage {
    static #TIPOS = {
        deportivo: { nombre: 'Deportivo', desc: 'Rápido y bajo' },
        suv:       { nombre: 'SUV',       desc: 'Alto y robusto' },
        muscle:    { nombre: 'Muscle',    desc: 'Potente y ancho' },
        formula:   { nombre: 'Fórmula',  desc: 'Ultra aerodinámico' },
        pickup:    { nombre: 'Pickup',    desc: 'Resistente' },
        clasico:   { nombre: 'Clásico',  desc: 'Estilo retro' },
        dragster:  { nombre: 'Dragster',  desc: 'Velocidad extrema' },
        rally:     { nombre: 'Rally',     desc: 'Domina el terreno' },
        kart:      { nombre: 'Kart',      desc: 'Ágil y preciso' },
        hypercar:  { nombre: 'Hypercar',  desc: 'El futuro del asfalto' },
    };

    // ── Miniatura lateral ────────────────────────────────────────
    static dibujarMini(canvas, tipo, color) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 8); ctx.fill();
        ctx.save();
        ctx.translate(W / 2, H * 0.78);
        Garage.#dibujarPerfil(ctx, tipo, color);
        ctx.restore();
    }

    static #dibujarPerfil(ctx, tipo, color) {
        switch (tipo) {
            case 'deportivo': Garage.#perfilDeportivo(ctx, color); break;
            case 'suv':       Garage.#perfilSUV(ctx, color);       break;
            case 'muscle':    Garage.#perfilMuscle(ctx, color);    break;
            case 'formula':   Garage.#perfilFormula(ctx, color);   break;
            case 'pickup':    Garage.#perfilPickup(ctx, color);    break;
            case 'clasico':   Garage.#perfilClasico(ctx, color);   break;
        }
    }

    // ── Vista 3D ─────────────────────────────────────────────────
    static dibujar3D(canvas, tipo, color) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const bg = ctx.createRadialGradient(W/2, H*0.5, 20, W/2, H*0.5, W*0.8);
        bg.addColorStop(0, '#14142e');
        bg.addColorStop(1, '#060610');
        ctx.fillStyle = bg;
        ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.fill();

        ctx.fillStyle = 'rgba(124,58,237,0.12)';
        ctx.beginPath(); ctx.ellipse(W*0.5, H*0.84, W*0.38, H*0.06, 0, 0, Math.PI*2); ctx.fill();

        ctx.save();
        ctx.translate(W * 0.5, H * 0.78);
        ctx.scale(Math.min(W, H) / 220, Math.min(W, H) / 220);
        Garage.#dibujar3DTipo(ctx, tipo, color);
        ctx.restore();

        ctx.fillStyle = '#7c3aed';
        ctx.font = `bold ${Math.round(W*0.038)}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 8;
        ctx.fillText(Garage.#TIPOS[tipo]?.desc || '', W/2, H - 8);
        ctx.shadowBlur = 0;
    }

    static #dibujar3DTipo(ctx, tipo, color) {
        switch (tipo) {
            case 'deportivo': Garage.#carro3DDeportivo(ctx, color); break;
            case 'suv':       Garage.#carro3DSUV(ctx, color);       break;
            case 'muscle':    Garage.#carro3DMuscle(ctx, color);    break;
            case 'formula':   Garage.#carro3DFormula(ctx, color);   break;
            case 'pickup':    Garage.#carro3DPickup(ctx, color);    break;
            case 'clasico':   Garage.#carro3DClasico(ctx, color);   break;
        }
    }

    // ── UI del garage ────────────────────────────────────────────
    static iniciar(estado, mostrar) {
        let tipoSel = estado.tipoAuto || 'deportivo';
        let colorPreview = estado.color;

        document.querySelectorAll('.carro-mini-canvas').forEach(c =>
            Garage.dibujarMini(c, c.dataset.tipo, estado.color)
        );

        document.getElementById('garage-grid').addEventListener('click', e => {
            const card = e.target.closest('.carro-card');
            if (!card) return;
            document.querySelectorAll('.carro-card').forEach(c => c.classList.remove('sel'));
            card.classList.add('sel');
            tipoSel = card.dataset.tipo;
        });

        document.getElementById('btn-ver-carro').addEventListener('click', () => {
            mostrar('pantalla-preview');
            document.getElementById('preview-nombre').textContent =
                Garage.#TIPOS[tipoSel]?.nombre || tipoSel;
            Garage.dibujar3D(document.getElementById('canvas-preview-3d'), tipoSel, colorPreview);

            document.getElementById('colores-preview').onclick = e => {
                const btn = e.target.closest('.color-btn');
                if (!btn) return;
                document.querySelectorAll('#colores-preview .color-btn').forEach(b => b.classList.remove('sel'));
                btn.classList.add('sel');
                colorPreview = btn.dataset.color;
                Garage.dibujar3D(document.getElementById('canvas-preview-3d'), tipoSel, colorPreview);
                document.querySelectorAll('.carro-mini-canvas').forEach(c =>
                    Garage.dibujarMini(c, c.dataset.tipo, colorPreview)
                );
            };
        });

        document.getElementById('btn-seleccionar-carro').addEventListener('click', () => {
            estado.tipoAuto = tipoSel;
            estado.color = colorPreview;
            document.querySelectorAll('#colores-grid .color-btn').forEach(b =>
                b.classList.toggle('sel', b.dataset.color === colorPreview)
            );
            mostrar('pantalla-inicio');
        });

        document.getElementById('btn-volver-preview').addEventListener('click', () => mostrar('pantalla-garage'));
        document.getElementById('btn-volver-garage').addEventListener('click', () => mostrar('pantalla-inicio'));
    }

    // ── Helpers de color y dibujo ────────────────────────────────
    static #brillante(hex, amount = 30) {
        if (!hex || hex.startsWith('rgb')) return hex;
        const num = parseInt(hex.replace('#',''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
        const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
        return `rgb(${r},${g},${b})`;
    }

    static #rueda(ctx, x, y, r) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(x, y, r*0.65, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#555';
        ctx.beginPath(); ctx.arc(x, y, r*0.28, 0, Math.PI*2); ctx.fill();
    }

    static #rueda3D(ctx, x, y, rx, ry) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(x+4, y+4, rx, ry, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath(); ctx.ellipse(x, y, rx*0.72, ry*0.72, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5;
        for (let a = 0; a < Math.PI*2; a += Math.PI/3) {
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(a)*rx*0.18, y + Math.sin(a)*ry*0.18);
            ctx.lineTo(x + Math.cos(a)*rx*0.65, y + Math.sin(a)*ry*0.65);
            ctx.stroke();
        }
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.ellipse(x, y, rx*0.16, ry*0.16, 0, 0, Math.PI*2); ctx.fill();
    }

    static #caraLateral(ctx, pts, fill) {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
    }

    // ── Perfiles laterales ───────────────────────────────────────
    static #perfilDeportivo(ctx, color) {
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
        Garage.#rueda(ctx,-28,4,10);
        Garage.#rueda(ctx,26,4,10);
    }

    static #perfilSUV(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-46,0); ctx.lineTo(-46,-20); ctx.lineTo(-38,-38);
        ctx.lineTo(30,-38); ctx.lineTo(42,-26); ctx.lineTo(46,-20); ctx.lineTo(46,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,210,255,0.55)';
        ctx.beginPath();
        ctx.moveTo(-36,-36); ctx.lineTo(28,-36); ctx.lineTo(40,-26); ctx.lineTo(-36,-22);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = Garage.#brillante(color,-30); ctx.fillRect(-44,-12,88,4);
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.roundRect(42,-28,5,7,1); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath(); ctx.roundRect(-48,-28,4,10,1); ctx.fill();
        Garage.#rueda(ctx,-28,4,11);
        Garage.#rueda(ctx,26,4,11);
    }

    static #perfilMuscle(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-48,0); ctx.lineTo(-48,-16); ctx.lineTo(-30,-28); ctx.lineTo(-4,-34);
        ctx.lineTo(16,-34); ctx.lineTo(28,-28); ctx.lineTo(40,-28); ctx.lineTo(48,-18); ctx.lineTo(48,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = Garage.#brillante(color,25);
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
        Garage.#rueda(ctx,-30,5,12);
        Garage.#rueda(ctx,28,5,12);
    }

    static #perfilFormula(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-50,0); ctx.lineTo(-50,-8); ctx.lineTo(-36,-16); ctx.lineTo(-10,-16);
        ctx.lineTo(0,-22); ctx.lineTo(14,-22); ctx.lineTo(14,-16); ctx.lineTo(46,-12);
        ctx.lineTo(50,-8); ctx.lineTo(50,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(100,200,255,0.7)';
        ctx.beginPath(); ctx.ellipse(6,-22,10,6,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = Garage.#brillante(color,-20);
        ctx.fillRect(-54,-20,10,3); ctx.fillRect(-50,-20,3,8); ctx.fillRect(46,-14,10,3);
        Garage.#rueda(ctx,-34,3,9);
        Garage.#rueda(ctx,30,3,9);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.ellipse(30,0,9,6,0,0,Math.PI*2); ctx.fill();
    }

    static #perfilPickup(ctx, color) {
        ctx.fillStyle = Garage.#brillante(color,-25);
        ctx.beginPath();
        ctx.moveTo(-48,0); ctx.lineTo(-48,-18); ctx.lineTo(-10,-18); ctx.lineTo(-10,0);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = Garage.#brillante(color,-50); ctx.lineWidth = 1.5;
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
        Garage.#rueda(ctx,-32,4,11);
        Garage.#rueda(ctx,28,4,11);
    }

    static #perfilClasico(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(-44,0); ctx.lineTo(-44,-18); ctx.lineTo(-34,-18);
        ctx.bezierCurveTo(-30,-42,30,-42,34,-18);
        ctx.lineTo(44,-18); ctx.lineTo(44,0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = Garage.#brillante(color,28);
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
        ctx.strokeStyle = Garage.#brillante(color,50); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-44,-10); ctx.lineTo(44,-10); ctx.stroke();
        Garage.#rueda(ctx,-28,4,10);
        Garage.#rueda(ctx,26,4,10);
    }

    // ── Carros 3D ────────────────────────────────────────────────
    static #carro3DDeportivo(ctx, color) {
        const cl = Garage.#brillante(color,40), cd = Garage.#brillante(color,-50), cs = Garage.#brillante(color,-20);
        Garage.#caraLateral(ctx,[[-90,0],[-90,-38],[-60,-55],[40,-55],[85,-38],[85,0]],color);
        Garage.#caraLateral(ctx,[[-58,-55],[-30,-80],[30,-80],[60,-55]],cl);
        Garage.#caraLateral(ctx,[[85,0],[95,-10],[95,-42],[85,-38]],cs);
        Garage.#caraLateral(ctx,[[85,-38],[95,-42],[65,-58],[60,-55]],cd);
        ctx.fillStyle='rgba(100,200,255,0.50)';
        ctx.beginPath(); ctx.moveTo(-55,-54); ctx.lineTo(-28,-76); ctx.lineTo(28,-76); ctx.lineTo(58,-54); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(100,200,255,0.35)';
        ctx.beginPath(); ctx.moveTo(60,-55); ctx.lineTo(65,-58); ctx.lineTo(82,-42); ctx.lineTo(80,-38); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.roundRect(78,-36,10,8,2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.roundRect(-92,-30,6,12,2); ctx.fill(); ctx.shadowBlur=0;
        Garage.#rueda3D(ctx,-52,4,22,14);
        Garage.#rueda3D(ctx,52,4,22,14);
    }

    static #carro3DSUV(ctx, color) {
        const cl = Garage.#brillante(color,35), cd = Garage.#brillante(color,-45), cs = Garage.#brillante(color,-15);
        Garage.#caraLateral(ctx,[[-88,0],[-88,-52],[-70,-70],[65,-70],[85,-52],[85,0]],color);
        Garage.#caraLateral(ctx,[[-68,-70],[-68,-100],[62,-100],[62,-70]],cl);
        Garage.#caraLateral(ctx,[[85,0],[96,-10],[96,-56],[85,-52]],cs);
        Garage.#caraLateral(ctx,[[85,-52],[96,-56],[64,-72],[62,-70]],cd);
        ctx.fillStyle='rgba(100,200,255,0.48)';
        ctx.beginPath(); ctx.moveTo(-66,-70); ctx.lineTo(-66,-96); ctx.lineTo(60,-96); ctx.lineTo(60,-70); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(100,200,255,0.32)';
        ctx.beginPath(); ctx.moveTo(62,-70); ctx.lineTo(64,-72); ctx.lineTo(93,-55); ctx.lineTo(84,-52); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.roundRect(80,-48,10,10,2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.roundRect(-91,-44,6,14,2); ctx.fill(); ctx.shadowBlur=0;
        Garage.#rueda3D(ctx,-54,4,24,16);
        Garage.#rueda3D(ctx,54,4,24,16);
    }

    static #carro3DMuscle(ctx, color) {
        const cl = Garage.#brillante(color,40), cd = Garage.#brillante(color,-45), cs = Garage.#brillante(color,-18);
        Garage.#caraLateral(ctx,[[-92,0],[-92,-42],[-65,-58],[55,-58],[90,-42],[90,0]],color);
        Garage.#caraLateral(ctx,[[20,-58],[40,-70],[75,-50],[90,-42],[55,-58]],Garage.#brillante(color,20));
        Garage.#caraLateral(ctx,[[-63,-58],[-35,-82],[30,-82],[55,-58]],cl);
        Garage.#caraLateral(ctx,[[90,0],[100,-10],[100,-46],[90,-42]],cs);
        Garage.#caraLateral(ctx,[[90,-42],[100,-46],[76,-53],[75,-50]],cd);
        ctx.fillStyle='rgba(100,200,255,0.48)';
        ctx.beginPath(); ctx.moveTo(-60,-57); ctx.lineTo(-33,-78); ctx.lineTo(28,-78); ctx.lineTo(52,-57); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(100,200,255,0.30)';
        ctx.beginPath(); ctx.moveTo(55,-58); ctx.lineTo(76,-53); ctx.lineTo(98,-45); ctx.lineTo(88,-42); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.roundRect(85,-40,10,10,2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.roundRect(-95,-34,6,14,2); ctx.fill(); ctx.shadowBlur=0;
        Garage.#rueda3D(ctx,-56,4,26,17);
        Garage.#rueda3D(ctx,56,4,26,17);
    }

    static #carro3DFormula(ctx, color) {
        const cd = Garage.#brillante(color,-40);
        Garage.#caraLateral(ctx,[[-95,-5],[-95,-20],[-50,-28],[55,-28],[90,-18],[90,-5]],color);
        Garage.#caraLateral(ctx,[[-95,-5],[-95,-20],[-50,-28],[55,-28],[90,-18],[90,-5],[95,-8],[95,-22],[56,-32],[-50,-32],[-100,-23],[-100,-8]],cd);
        ctx.fillStyle=Garage.#brillante(color,30);
        ctx.beginPath(); ctx.ellipse(-5,-30,28,14,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(100,200,255,0.65)';
        ctx.beginPath(); ctx.ellipse(-5,-30,20,10,0,0,Math.PI*2); ctx.fill();
        Garage.#caraLateral(ctx,[[-100,-24],[-100,-30],[-75,-30],[-75,-24]],cd);
        ctx.fillStyle=cd; ctx.beginPath(); ctx.roundRect(-92,-30,5,20,1); ctx.fill();
        Garage.#caraLateral(ctx,[[80,-18],[96,-12],[96,-18],[80,-22]],cd);
        Garage.#rueda3D(ctx,-60,8,22,22);
        Garage.#rueda3D(ctx,55,8,22,22);
        ctx.fillStyle='#1a1a1a';
        ctx.beginPath(); ctx.ellipse(-60,8,8,22,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(55,8,8,22,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.roundRect(85,-16,8,6,1); ctx.fill(); ctx.shadowBlur=0;
    }

    static #carro3DPickup(ctx, color) {
        const cl = Garage.#brillante(color,35), cd = Garage.#brillante(color,-45), cs = Garage.#brillante(color,-18);
        Garage.#caraLateral(ctx,[[-90,0],[-90,-40],[-10,-40],[-10,0]],Garage.#brillante(color,-30));
        Garage.#caraLateral(ctx,[[-90,-40],[-10,-40],[-10,-46],[-90,-46]],cd);
        Garage.#caraLateral(ctx,[[-12,0],[-12,-58],[-5,-72],[58,-72],[85,-55],[85,0]],color);
        Garage.#caraLateral(ctx,[[-3,-72],[56,-72],[76,-58],[56,-55],[-3,-55]],cl);
        Garage.#caraLateral(ctx,[[85,0],[95,-10],[95,-58],[85,-55]],cs);
        Garage.#caraLateral(ctx,[[85,-55],[95,-58],[76,-62],[56,-55]],cd);
        ctx.fillStyle='rgba(100,200,255,0.48)';
        ctx.beginPath(); ctx.moveTo(-2,-55); ctx.lineTo(-2,-68); ctx.lineTo(55,-68); ctx.lineTo(74,-57); ctx.lineTo(55,-55); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.roundRect(80,-50,10,10,2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.roundRect(-93,-34,6,12,2); ctx.fill(); ctx.shadowBlur=0;
        Garage.#rueda3D(ctx,-58,4,24,16);
        Garage.#rueda3D(ctx,54,4,24,16);
    }

    static #carro3DClasico(ctx, color) {
        const cl = Garage.#brillante(color,35), cd = Garage.#brillante(color,-45), cs = Garage.#brillante(color,-18);
        Garage.#caraLateral(ctx,[[-85,0],[-85,-40],[-70,-40],[65,-40],[82,-30],[82,0]],color);
        ctx.fillStyle=cl;
        ctx.beginPath();
        ctx.moveTo(-68,-40); ctx.bezierCurveTo(-68,-90,62,-90,62,-40);
        ctx.closePath(); ctx.fill();
        Garage.#caraLateral(ctx,[[82,0],[92,-8],[92,-34],[82,-30]],cs);
        ctx.fillStyle=cd;
        ctx.beginPath(); ctx.moveTo(82,-30); ctx.lineTo(92,-34); ctx.bezierCurveTo(72,-80,62,-88,62,-40); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(100,200,255,0.50)';
        ctx.beginPath();
        ctx.moveTo(-60,-42); ctx.bezierCurveTo(-60,-82,56,-82,56,-42);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle=Garage.#brillante(color,60); ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(-84,-20); ctx.lineTo(80,-20); ctx.stroke();
        ctx.fillStyle='#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
        ctx.beginPath(); ctx.arc(76,-14,6,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        ctx.fillStyle='#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
        ctx.beginPath(); ctx.arc(-80,-14,6,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
        Garage.#rueda3D(ctx,-52,4,22,14);
        Garage.#rueda3D(ctx,50,4,22,14);
    }
}
