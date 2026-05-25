'use strict';

// ================================================================
// DEFINICIONES DE TIPOS DE CARRO
// ================================================================
const TIPOS_CARRO = {
    deportivo: { nombre: 'Deportivo', desc: 'Rápido y bajo' },
    suv:       { nombre: 'SUV',       desc: 'Alto y robusto' },
    muscle:    { nombre: 'Muscle',    desc: 'Potente y ancho' },
    formula:   { nombre: 'Fórmula',  desc: 'Ultra aerodinámico' },
    pickup:    { nombre: 'Pickup',    desc: 'Resistente' },
    clasico:   { nombre: 'Clásico',  desc: 'Estilo retro' },
};

// ================================================================
// DIBUJA CARRO DE PERFIL LATERAL (miniatura garage)
// ================================================================
function dibujarCarroMini(canvas, tipo, color) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a1e';
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 8); ctx.fill();

    ctx.save();
    ctx.translate(W / 2, H * 0.78);
    switch (tipo) {
        case 'deportivo': perfilDeportivo(ctx, color); break;
        case 'suv':       perfilSUV(ctx, color);       break;
        case 'muscle':    perfilMuscle(ctx, color);    break;
        case 'formula':   perfilFormula(ctx, color);   break;
        case 'pickup':    perfilPickup(ctx, color);    break;
        case 'clasico':   perfilClasico(ctx, color);   break;
    }
    ctx.restore();
}

// Helper: rueda lateral
function rueda(ctx, x, y, r) {
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(x, y, r * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, Math.PI * 2); ctx.fill();
}

function perfilDeportivo(ctx, color) {
    // Carro bajo, techo inclinado tipo fastback
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-44, 0);        // trasera abajo
    ctx.lineTo(-44, -14);      // trasera arriba
    ctx.lineTo(-20, -30);      // inicio techo
    ctx.lineTo(14, -30);       // fin techo
    ctx.lineTo(38, -16);       // parabrisas delantera
    ctx.lineTo(44, -16);       // capó delantero
    ctx.lineTo(44, 0);         // delantera abajo
    ctx.closePath(); ctx.fill();
    // Vidrio
    ctx.fillStyle = 'rgba(120,210,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(-18, -28); ctx.lineTo(12, -28); ctx.lineTo(36, -17); ctx.lineTo(-18, -17);
    ctx.closePath(); ctx.fill();
    // Luces delantera
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.roundRect(40, -22, 5, 5, 1); ctx.fill();
    // Luces trasera
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.roundRect(-47, -18, 4, 8, 1); ctx.fill();
    // Ruedas
    rueda(ctx, -28, 4, 10);
    rueda(ctx, 26, 4, 10);
}

function perfilSUV(ctx, color) {
    // Alto, cuadrado, robusto
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-46, 0);
    ctx.lineTo(-46, -20);
    ctx.lineTo(-38, -38);      // techo trasero
    ctx.lineTo(30, -38);       // techo plano
    ctx.lineTo(42, -26);       // parabrisas
    ctx.lineTo(46, -20);
    ctx.lineTo(46, 0);
    ctx.closePath(); ctx.fill();
    // Vidrio grande
    ctx.fillStyle = 'rgba(120,210,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-36, -36); ctx.lineTo(28, -36); ctx.lineTo(40, -26); ctx.lineTo(-36, -22);
    ctx.closePath(); ctx.fill();
    // Detalles laterales
    ctx.fillStyle = brillante(color, -30);
    ctx.fillRect(-44, -12, 88, 4);
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.roundRect(42, -28, 5, 7, 1); ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.roundRect(-48, -28, 4, 10, 1); ctx.fill();
    rueda(ctx, -28, 4, 11);
    rueda(ctx, 26, 4, 11);
}

function perfilMuscle(ctx, color) {
    // Ancho, con joroba en el capó
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-48, 0);
    ctx.lineTo(-48, -16);
    ctx.lineTo(-30, -28);
    ctx.lineTo(-4, -34);
    ctx.lineTo(16, -34);
    ctx.lineTo(28, -28);       // joroba capó
    ctx.lineTo(40, -28);
    ctx.lineTo(48, -18);
    ctx.lineTo(48, 0);
    ctx.closePath(); ctx.fill();
    // Joroba capó highlight
    ctx.fillStyle = brillante(color, 25);
    ctx.beginPath();
    ctx.moveTo(10, -32); ctx.lineTo(26, -26); ctx.lineTo(38, -26); ctx.lineTo(32, -32);
    ctx.closePath(); ctx.fill();
    // Vidrio
    ctx.fillStyle = 'rgba(120,210,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-28, -27); ctx.lineTo(14, -33); ctx.lineTo(26, -27); ctx.lineTo(-28, -18);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.roundRect(44, -24, 5, 6, 1); ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.roundRect(-51, -22, 5, 9, 1); ctx.fill();
    rueda(ctx, -30, 5, 12);
    rueda(ctx, 28, 5, 12);
}

function perfilFormula(ctx, color) {
    // Ultra bajo, alas, cockpit abierto
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.lineTo(-50, -8);
    ctx.lineTo(-36, -16);
    ctx.lineTo(-10, -16);
    ctx.lineTo(0, -22);        // cockpit
    ctx.lineTo(14, -22);
    ctx.lineTo(14, -16);
    ctx.lineTo(46, -12);
    ctx.lineTo(50, -8);
    ctx.lineTo(50, 0);
    ctx.closePath(); ctx.fill();
    // Cockpit
    ctx.fillStyle = 'rgba(100,200,255,0.7)';
    ctx.beginPath(); ctx.ellipse(6, -22, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Ala trasera
    ctx.fillStyle = brillante(color, -20);
    ctx.fillRect(-54, -20, 10, 3);
    ctx.fillRect(-50, -20, 3, 8);
    // Ala delantera
    ctx.fillRect(46, -14, 10, 3);
    // Ruedas grandes
    rueda(ctx, -34, 3, 9);
    rueda(ctx, 30, 3, 9);
    // Ruedas delanteras visibles
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(30, 0, 9, 6, 0, 0, Math.PI*2); ctx.fill();
}

function perfilPickup(ctx, color) {
    // Cabina + caja de carga trasera
    // Caja de carga (trasera, más baja)
    ctx.fillStyle = brillante(color, -25);
    ctx.beginPath();
    ctx.moveTo(-48, 0); ctx.lineTo(-48, -18); ctx.lineTo(-10, -18); ctx.lineTo(-10, 0);
    ctx.closePath(); ctx.fill();
    // Borde interior caja
    ctx.strokeStyle = brillante(color, -50);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-46, -16, 34, 14);
    // Cabina (delantera, alta)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(-12, -26);
    ctx.lineTo(-4, -40);
    ctx.lineTo(28, -40);
    ctx.lineTo(44, -28);
    ctx.lineTo(48, -20);
    ctx.lineTo(48, 0);
    ctx.closePath(); ctx.fill();
    // Vidrio
    ctx.fillStyle = 'rgba(120,210,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-3, -38); ctx.lineTo(26, -38); ctx.lineTo(42, -28); ctx.lineTo(-3, -28);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.roundRect(44, -28, 5, 7, 1); ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.roundRect(-51, -18, 4, 10, 1); ctx.fill();
    rueda(ctx, -32, 4, 11);
    rueda(ctx, 28, 4, 11);
}

function perfilClasico(ctx, color) {
    // Techo redondeado tipo burbuja, estilo 60s
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-44, 0);
    ctx.lineTo(-44, -18);
    ctx.lineTo(-34, -18);
    ctx.bezierCurveTo(-30, -42, 30, -42, 34, -18);
    ctx.lineTo(44, -18);
    ctx.lineTo(44, 0);
    ctx.closePath(); ctx.fill();
    // Techo color claro
    ctx.fillStyle = brillante(color, 28);
    ctx.beginPath();
    ctx.moveTo(-28, -20);
    ctx.bezierCurveTo(-24, -40, 24, -40, 28, -20);
    ctx.closePath(); ctx.fill();
    // Vidrio
    ctx.fillStyle = 'rgba(120,210,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(-22, -20); ctx.bezierCurveTo(-18, -36, 18, -36, 22, -20);
    ctx.closePath(); ctx.fill();
    // Luces redondas retro
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath(); ctx.arc(40, -12, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.arc(-40, -12, 4, 0, Math.PI*2); ctx.fill();
    // Detalle cromado
    ctx.strokeStyle = brillante(color, 50);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-44, -10); ctx.lineTo(44, -10); ctx.stroke();
    rueda(ctx, -28, 4, 10);
    rueda(ctx, 26, 4, 10);
}

// ================================================================
// DIBUJA CARRO EN 3D — vista 3/4 lateral izquierda
// ================================================================
function dibujarCarro3D(canvas, tipo, color) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W/2, H*0.5, 20, W/2, H*0.5, W*0.8);
    bg.addColorStop(0, '#14142e');
    bg.addColorStop(1, '#060610');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.fill();

    // Suelo reflejo
    ctx.fillStyle = 'rgba(124,58,237,0.12)';
    ctx.beginPath(); ctx.ellipse(W*0.5, H*0.84, W*0.38, H*0.06, 0, 0, Math.PI*2); ctx.fill();

    ctx.save();
    ctx.translate(W * 0.5, H * 0.78);
    const scale = Math.min(W, H) / 220;
    ctx.scale(scale, scale);

    switch (tipo) {
        case 'deportivo': carro3DDeportivo(ctx, color); break;
        case 'suv':       carro3DSUV(ctx, color);       break;
        case 'muscle':    carro3DMuscle(ctx, color);    break;
        case 'formula':   carro3DFormula(ctx, color);   break;
        case 'pickup':    carro3DPickup(ctx, color);    break;
        case 'clasico':   carro3DClasico(ctx, color);   break;
    }
    ctx.restore();

    ctx.fillStyle = '#7c3aed';
    ctx.font = `bold ${Math.round(W*0.038)}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#7c3aed'; ctx.shadowBlur = 8;
    ctx.fillText(TIPOS_CARRO[tipo]?.desc || '', W/2, H - 8);
    ctx.shadowBlur = 0;
}

// Helper: rueda 3D con llanta
function rueda3D(ctx, x, y, rx, ry) {
    // Sombra rueda
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(x+4, y+4, rx, ry, 0, 0, Math.PI*2); ctx.fill();
    // Caucho
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2); ctx.fill();
    // Llanta
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.ellipse(x, y, rx*0.72, ry*0.72, 0, 0, Math.PI*2); ctx.fill();
    // Rayos
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI*2; a += Math.PI/3) {
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a)*rx*0.18, y + Math.sin(a)*ry*0.18);
        ctx.lineTo(x + Math.cos(a)*rx*0.65, y + Math.sin(a)*ry*0.65);
        ctx.stroke();
    }
    // Centro
    ctx.fillStyle = '#888';
    ctx.beginPath(); ctx.ellipse(x, y, rx*0.16, ry*0.16, 0, 0, Math.PI*2); ctx.fill();
}

// Helper: cara lateral del carro (polígono + vidrio)
function caraLateral(ctx, pts, fill) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
}

function carro3DDeportivo(ctx, color) {
    const c = color, cl = brillante(color,40), cd = brillante(color,-50), cs = brillante(color,-20);
    // Cuerpo lateral principal
    caraLateral(ctx, [[-90,0],[-90,-38],[-60,-55],[40,-55],[85,-38],[85,0]], c);
    // Techo / cabina más oscuro
    caraLateral(ctx, [[-58,-55],[-30,-80],[30,-80],[60,-55]], cl);
    // Cara lateral derecha (profundidad)
    caraLateral(ctx, [[85,0],[95,-10],[95,-42],[85,-38]], cs);
    // Cara superior derecha
    caraLateral(ctx, [[85,-38],[95,-42],[65,-58],[60,-55]], cd);
    // Vidrio lateral
    ctx.fillStyle = 'rgba(100,200,255,0.50)';
    ctx.beginPath(); ctx.moveTo(-55,-54); ctx.lineTo(-28,-76); ctx.lineTo(28,-76); ctx.lineTo(58,-54); ctx.closePath(); ctx.fill();
    // Vidrio frontal (derecha)
    ctx.fillStyle = 'rgba(100,200,255,0.35)';
    ctx.beginPath(); ctx.moveTo(60,-55); ctx.lineTo(65,-58); ctx.lineTo(82,-42); ctx.lineTo(80,-38); ctx.closePath(); ctx.fill();
    // Luz delantera
    ctx.fillStyle = '#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.roundRect(78,-36,10,8,2); ctx.fill(); ctx.shadowBlur=0;
    // Luz trasera
    ctx.fillStyle = '#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.roundRect(-92,-30,6,12,2); ctx.fill(); ctx.shadowBlur=0;
    // Ruedas
    rueda3D(ctx, -52, 4, 22, 14);
    rueda3D(ctx, 52, 4, 22, 14);
}

function carro3DSUV(ctx, color) {
    const c = color, cl = brillante(color,35), cd = brillante(color,-45), cs = brillante(color,-15);
    caraLateral(ctx, [[-88,0],[-88,-52],[-70,-70],[65,-70],[85,-52],[85,0]], c);
    caraLateral(ctx, [[-68,-70],[-68,-100],[62,-100],[62,-70]], cl);
    caraLateral(ctx, [[85,0],[96,-10],[96,-56],[85,-52]], cs);
    caraLateral(ctx, [[85,-52],[96,-56],[64,-72],[62,-70]], cd);
    ctx.fillStyle = 'rgba(100,200,255,0.48)';
    ctx.beginPath(); ctx.moveTo(-66,-70); ctx.lineTo(-66,-96); ctx.lineTo(60,-96); ctx.lineTo(60,-70); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,0.32)';
    ctx.beginPath(); ctx.moveTo(62,-70); ctx.lineTo(64,-72); ctx.lineTo(93,-55); ctx.lineTo(84,-52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.roundRect(80,-48,10,10,2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle = '#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.roundRect(-91,-44,6,14,2); ctx.fill(); ctx.shadowBlur=0;
    rueda3D(ctx, -54, 4, 24, 16);
    rueda3D(ctx, 54, 4, 24, 16);
}

function carro3DMuscle(ctx, color) {
    const c = color, cl = brillante(color,40), cd = brillante(color,-45), cs = brillante(color,-18);
    caraLateral(ctx, [[-92,0],[-92,-42],[-65,-58],[55,-58],[90,-42],[90,0]], c);
    // Joroba del capó
    caraLateral(ctx, [[20,-58],[40,-70],[75,-50],[90,-42],[55,-58]], brillante(color,20));
    caraLateral(ctx, [[-63,-58],[-35,-82],[30,-82],[55,-58]], cl);
    caraLateral(ctx, [[90,0],[100,-10],[100,-46],[90,-42]], cs);
    caraLateral(ctx, [[90,-42],[100,-46],[76,-53],[75,-50]], cd);
    ctx.fillStyle = 'rgba(100,200,255,0.48)';
    ctx.beginPath(); ctx.moveTo(-60,-57); ctx.lineTo(-33,-78); ctx.lineTo(28,-78); ctx.lineTo(52,-57); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,0.30)';
    ctx.beginPath(); ctx.moveTo(55,-58); ctx.lineTo(76,-53); ctx.lineTo(98,-45); ctx.lineTo(88,-42); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.roundRect(85,-40,10,10,2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle = '#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.roundRect(-95,-34,6,14,2); ctx.fill(); ctx.shadowBlur=0;
    rueda3D(ctx, -56, 4, 26, 17);
    rueda3D(ctx, 56, 4, 26, 17);
}

function carro3DFormula(ctx, color) {
    const c = color, cl = brillante(color,40), cd = brillante(color,-40);
    // Cuerpo bajo y estrecho
    caraLateral(ctx, [[-95,-5],[-95,-20],[-50,-28],[55,-28],[90,-18],[90,-5]], c);
    caraLateral(ctx, [[-95,-5],[-95,-20],[-50,-28],[55,-28],[90,-18],[90,-5],[95,-8],[95,-22],[56,-32],[-50,-32],[-100,-23],[-100,-8]], cd);
    // Cockpit
    ctx.fillStyle = brillante(color,30);
    ctx.beginPath(); ctx.ellipse(-5,-30,28,14,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,0.65)';
    ctx.beginPath(); ctx.ellipse(-5,-30,20,10,0,0,Math.PI*2); ctx.fill();
    // Ala trasera
    caraLateral(ctx, [[-100,-24],[-100,-30],[-75,-30],[-75,-24]], cd);
    ctx.fillStyle = cd;
    ctx.beginPath(); ctx.roundRect(-92,-30,5,20,1); ctx.fill();
    // Ala delantera
    caraLateral(ctx, [[80,-18],[96,-12],[96,-18],[80,-22]], cd);
    // Ruedas grandes
    rueda3D(ctx, -60, 8, 22, 22);
    rueda3D(ctx, 55, 8, 22, 22);
    // Ruedas traseras visibles
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(-60, 8, 8, 22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(55, 8, 8, 22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.roundRect(85,-16,8,6,1); ctx.fill(); ctx.shadowBlur=0;
}

function carro3DPickup(ctx, color) {
    const c = color, cl = brillante(color,35), cd = brillante(color,-45), cs = brillante(color,-18);
    // Caja de carga (trasera)
    caraLateral(ctx, [[-90,0],[-90,-40],[-10,-40],[-10,0]], brillante(color,-30));
    caraLateral(ctx, [[-90,-40],[-10,-40],[-10,-46],[-90,-46]], cd);
    // Cabina (delantera)
    caraLateral(ctx, [[-12,0],[-12,-58],[-5,-72],[58,-72],[85,-55],[85,0]], c);
    caraLateral(ctx, [[-3,-72],[56,-72],[76,-58],[56,-55],[-3,-55]], cl);
    caraLateral(ctx, [[85,0],[95,-10],[95,-58],[85,-55]], cs);
    caraLateral(ctx, [[85,-55],[95,-58],[76,-62],[56,-55]], cd);
    ctx.fillStyle = 'rgba(100,200,255,0.48)';
    ctx.beginPath(); ctx.moveTo(-2,-55); ctx.lineTo(-2,-68); ctx.lineTo(55,-68); ctx.lineTo(74,-57); ctx.lineTo(55,-55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.roundRect(80,-50,10,10,2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle = '#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.roundRect(-93,-34,6,12,2); ctx.fill(); ctx.shadowBlur=0;
    rueda3D(ctx, -58, 4, 24, 16);
    rueda3D(ctx, 54, 4, 24, 16);
}

function carro3DClasico(ctx, color) {
    const c = color, cl = brillante(color,35), cd = brillante(color,-45), cs = brillante(color,-18);
    caraLateral(ctx, [[-85,0],[-85,-40],[-70,-40],[65,-40],[82,-30],[82,0]], c);
    // Techo burbuja redondeado
    ctx.fillStyle = cl;
    ctx.beginPath();
    ctx.moveTo(-68,-40); ctx.bezierCurveTo(-68,-90, 62,-90, 62,-40);
    ctx.closePath(); ctx.fill();
    caraLateral(ctx, [[82,0],[92,-8],[92,-34],[82,-30]], cs);
    ctx.fillStyle = cd;
    ctx.beginPath(); ctx.moveTo(82,-30); ctx.lineTo(92,-34); ctx.bezierCurveTo(72,-80,62,-88,62,-40); ctx.closePath(); ctx.fill();
    // Vidrio burbuja
    ctx.fillStyle = 'rgba(100,200,255,0.50)';
    ctx.beginPath();
    ctx.moveTo(-60,-42); ctx.bezierCurveTo(-60,-82, 56,-82, 56,-42);
    ctx.closePath(); ctx.fill();
    // Franja cromada
    ctx.strokeStyle = brillante(color,60); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-84,-20); ctx.lineTo(80,-20); ctx.stroke();
    ctx.fillStyle = '#ffffc0'; ctx.shadowColor='#ffff00'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.arc(76,-14,6,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle = '#ff2222'; ctx.shadowColor='#ff0000'; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(-80,-14,6,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    rueda3D(ctx, -52, 4, 22, 14);
    rueda3D(ctx, 50, 4, 22, 14);
}

// ================================================================
// FUNCIONES ANTIGUAS — mantenidas por compatibilidad (no se usan)
// ================================================================
function iso(x, y, z) {
    const angleX = Math.PI / 6; // 30 grados
    const sx = (x - z) * Math.cos(angleX) * 1.1;
    const sy = (x + z) * Math.sin(angleX) * 0.6 - y;
    return { x: sx, y: sy };
}

function quad3D(ctx, pts, fill, stroke = null) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke(); }
}

function dibujar3DDeportivo(ctx, color) {
    const c = color, cl = brillante(color, 35), cd = brillante(color, -40), cm = brillante(color, 15);
    const W = 110, H = 38, D = 200;

    // Ruedas traseras
    ctx.fillStyle = '#111';
    const rt1 = [iso(-W*0.52,-5,-D*0.25), iso(-W*0.52,-25,-D*0.25), iso(-W*0.52,-25,-D*0.52), iso(-W*0.52,-5,-D*0.52)];
    quad3D(ctx, rt1, '#111');
    const rt2 = [iso(W*0.52,-5,-D*0.25), iso(W*0.52,-25,-D*0.25), iso(W*0.52,-25,-D*0.52), iso(W*0.52,-5,-D*0.52)];
    quad3D(ctx, rt2, '#111');

    // Piso / fondo
    const floor = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(-W*0.5,0,-D*0.9)];
    quad3D(ctx, floor, cd, '#00000033');

    // Cara lateral derecha
    const sideR = [iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(W*0.5,-H,-D*0.9), iso(W*0.5,-H,-D*0.1)];
    quad3D(ctx, sideR, cm, '#00000022');

    // Cara frontal (trasera del carro)
    const back = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(-W*0.5,-H,-D*0.1)];
    quad3D(ctx, back, c, '#00000011');

    // Techo bajo / capó (cara superior)
    const top = [iso(-W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.9), iso(-W*0.5,-H,-D*0.9)];
    quad3D(ctx, top, cl, '#ffffff15');

    // Cabina (cristal)
    const cab = [iso(-W*0.38,-H,-D*0.28), iso(W*0.38,-H,-D*0.28), iso(W*0.38,-H-30,-D*0.48), iso(-W*0.38,-H-30,-D*0.48)];
    quad3D(ctx, cab, 'rgba(100,200,255,0.55)', '#06b6d450');

    // Luces traseras
    ctx.fillStyle = '#ff2222';
    const ll = iso(-W*0.48, -H*0.3, -D*0.12);
    const lr = iso(W*0.48, -H*0.3, -D*0.12);
    ctx.beginPath(); ctx.ellipse(ll.x, ll.y, 10, 5, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(lr.x, lr.y, 10, 5, 0.3, 0, Math.PI*2); ctx.fill();

    // Ruedas delanteras
    const rd1 = [iso(-W*0.52,-5,-D*0.65), iso(-W*0.52,-25,-D*0.65), iso(-W*0.52,-25,-D*0.88), iso(-W*0.52,-5,-D*0.88)];
    quad3D(ctx, rd1, '#111');
    const rd2 = [iso(W*0.52,-5,-D*0.65), iso(W*0.52,-25,-D*0.65), iso(W*0.52,-25,-D*0.88), iso(W*0.52,-5,-D*0.88)];
    quad3D(ctx, rd2, '#111');
}

function dibujar3DSUV(ctx, color) {
    const c = color, cl = brillante(color, 35), cd = brillante(color, -40), cm = brillante(color, 15);
    const W = 115, H = 58, D = 190;

    const floor = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(-W*0.5,0,-D*0.9)];
    quad3D(ctx, floor, cd);
    const sideR = [iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(W*0.5,-H,-D*0.9), iso(W*0.5,-H,-D*0.1)];
    quad3D(ctx, sideR, cm);
    const back = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(-W*0.5,-H,-D*0.1)];
    quad3D(ctx, back, c);
    const top = [iso(-W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.9), iso(-W*0.5,-H,-D*0.9)];
    quad3D(ctx, top, cl);
    // Techo alto
    const cab = [iso(-W*0.44,-H,-D*0.2), iso(W*0.44,-H,-D*0.2), iso(W*0.44,-H-36,-D*0.8), iso(-W*0.44,-H-36,-D*0.8)];
    quad3D(ctx, cab, 'rgba(100,200,255,0.5)');
    ctx.fillStyle = '#ff2222';
    const ll = iso(-W*0.48,-H*0.35,-D*0.12);
    const lr = iso(W*0.48,-H*0.35,-D*0.12);
    ctx.beginPath(); ctx.ellipse(ll.x,ll.y,12,6,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(lr.x,lr.y,12,6,0.3,0,Math.PI*2); ctx.fill();
    // Ruedas
    [[0.25,0.48],[0.65,0.85]].forEach(([z1,z2]) => {
        quad3D(ctx,[iso(-W*0.52,-4,-D*z1),iso(-W*0.52,-28,-D*z1),iso(-W*0.52,-28,-D*z2),iso(-W*0.52,-4,-D*z2)],'#111');
        quad3D(ctx,[iso(W*0.52,-4,-D*z1),iso(W*0.52,-28,-D*z1),iso(W*0.52,-28,-D*z2),iso(W*0.52,-4,-D*z2)],'#111');
    });
}

function dibujar3DMuscle(ctx, color) {
    const c = color, cl = brillante(color, 35), cd = brillante(color, -40), cm = brillante(color, 15);
    const W = 130, H = 44, D = 205;

    const floor = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(-W*0.5,0,-D*0.9)];
    quad3D(ctx, floor, cd);
    const sideR = [iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(W*0.5,-H,-D*0.9), iso(W*0.5,-H,-D*0.1)];
    quad3D(ctx, sideR, cm);
    const back = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(-W*0.5,-H,-D*0.1)];
    quad3D(ctx, back, c);
    const top = [iso(-W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.9), iso(-W*0.5,-H,-D*0.9)];
    quad3D(ctx, top, cl);
    // Capó con joroba
    const capo = [iso(-W*0.48,-H,-D*0.3), iso(W*0.48,-H,-D*0.3), iso(W*0.36,-H-10,-D*0.5), iso(-W*0.36,-H-10,-D*0.5)];
    quad3D(ctx, capo, brillante(color,20));
    const cab = [iso(-W*0.34,-H,-D*0.28), iso(W*0.34,-H,-D*0.28), iso(W*0.34,-H-28,-D*0.55), iso(-W*0.34,-H-28,-D*0.55)];
    quad3D(ctx, cab, 'rgba(100,200,255,0.5)');
    ctx.fillStyle = '#ff2222';
    const ll = iso(-W*0.48,-H*0.3,-D*0.12);
    const lr = iso(W*0.48,-H*0.3,-D*0.12);
    ctx.beginPath(); ctx.ellipse(ll.x,ll.y,13,6,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(lr.x,lr.y,13,6,0.3,0,Math.PI*2); ctx.fill();
    [[0.22,0.46],[0.62,0.86]].forEach(([z1,z2]) => {
        quad3D(ctx,[iso(-W*0.52,-4,-D*z1),iso(-W*0.52,-30,-D*z1),iso(-W*0.52,-30,-D*z2),iso(-W*0.52,-4,-D*z2)],'#111');
        quad3D(ctx,[iso(W*0.52,-4,-D*z1),iso(W*0.52,-30,-D*z1),iso(W*0.52,-30,-D*z2),iso(W*0.52,-4,-D*z2)],'#111');
    });
}

function dibujar3DFormula(ctx, color) {
    const c = color, cl = brillante(color, 40), cd = brillante(color, -40);
    const W = 65, H = 28, D = 220;

    // Cuerpo estrecho
    const floor = [iso(-W*0.5,0,-D*0.05), iso(W*0.5,0,-D*0.05), iso(W*0.5,0,-D*0.95), iso(-W*0.5,0,-D*0.95)];
    quad3D(ctx, floor, cd);
    const back = [iso(-W*0.5,0,-D*0.05), iso(W*0.5,0,-D*0.05), iso(W*0.5,-H,-D*0.05), iso(-W*0.5,-H,-D*0.05)];
    quad3D(ctx, back, c);
    const top = [iso(-W*0.5,-H,-D*0.05), iso(W*0.5,-H,-D*0.05), iso(W*0.5,-H,-D*0.95), iso(-W*0.5,-H,-D*0.95)];
    quad3D(ctx, top, cl);
    const sideR = [iso(W*0.5,0,-D*0.05), iso(W*0.5,0,-D*0.95), iso(W*0.5,-H,-D*0.95), iso(W*0.5,-H,-D*0.05)];
    quad3D(ctx, sideR, brillante(color,15));
    // Ala trasera
    const ala = [iso(-W*1.1,-H*0.8,-D*0.08), iso(W*1.1,-H*0.8,-D*0.08), iso(W*1.1,-H,-D*0.08), iso(-W*1.1,-H,-D*0.08)];
    quad3D(ctx, ala, cd);
    // Cockpit
    const cock = [iso(-W*0.25,-H,-D*0.35), iso(W*0.25,-H,-D*0.35), iso(W*0.15,-H-18,-D*0.55), iso(-W*0.15,-H-18,-D*0.55)];
    quad3D(ctx, cock, 'rgba(100,200,255,0.65)');
    // 4 ruedas grandes
    [[0.12,0.3],[0.72,0.9]].forEach(([z1,z2]) => {
        quad3D(ctx,[iso(-W*0.6,-2,-D*z1),iso(-W*0.6,-26,-D*z1),iso(-W*0.6,-26,-D*z2),iso(-W*0.6,-2,-D*z2)],'#111');
        quad3D(ctx,[iso(W*0.6,-2,-D*z1),iso(W*0.6,-26,-D*z1),iso(W*0.6,-26,-D*z2),iso(W*0.6,-2,-D*z2)],'#111');
    });
}

function dibujar3DPickup(ctx, color) {
    const c = color, cl = brillante(color, 35), cd = brillante(color, -40), cm = brillante(color, 15);
    const W = 118, D = 210;

    // Caja de carga (trasera, baja)
    const H1 = 30, cajaZ = 0.1;
    const caja = [iso(-W*0.5,0,-D*cajaZ), iso(W*0.5,0,-D*cajaZ), iso(W*0.5,-H1,-D*cajaZ), iso(-W*0.5,-H1,-D*cajaZ)];
    quad3D(ctx, caja, cd);
    const cajaTecho = [iso(-W*0.5,-H1,-D*cajaZ), iso(W*0.5,-H1,-D*cajaZ), iso(W*0.5,-H1,-D*0.45), iso(-W*0.5,-H1,-D*0.45)];
    quad3D(ctx, cajaTecho, brillante(color,-20));
    const cajaLat = [iso(W*0.5,0,-D*cajaZ), iso(W*0.5,0,-D*0.45), iso(W*0.5,-H1,-D*0.45), iso(W*0.5,-H1,-D*cajaZ)];
    quad3D(ctx, cajaLat, brillante(color,-30));
    // Cabina (delantera, alta)
    const H2 = 55;
    const cabBack = [iso(-W*0.44,0,-D*0.45), iso(W*0.44,0,-D*0.45), iso(W*0.44,-H2,-D*0.45), iso(-W*0.44,-H2,-D*0.45)];
    quad3D(ctx, cabBack, c);
    const cabTop = [iso(-W*0.44,-H2,-D*0.45), iso(W*0.44,-H2,-D*0.45), iso(W*0.44,-H2,-D*0.9), iso(-W*0.44,-H2,-D*0.9)];
    quad3D(ctx, cabTop, cl);
    const cabSide = [iso(W*0.44,0,-D*0.45), iso(W*0.44,0,-D*0.9), iso(W*0.44,-H2,-D*0.9), iso(W*0.44,-H2,-D*0.45)];
    quad3D(ctx, cabSide, cm);
    const vidrio = [iso(-W*0.38,-H2,-D*0.47), iso(W*0.38,-H2,-D*0.47), iso(W*0.38,-H2-28,-D*0.72), iso(-W*0.38,-H2-28,-D*0.72)];
    quad3D(ctx, vidrio, 'rgba(100,200,255,0.5)');
    ctx.fillStyle = '#ff2222';
    const ll = iso(-W*0.48,-H1*0.5,-D*0.12);
    const lr = iso(W*0.48,-H1*0.5,-D*0.12);
    ctx.beginPath(); ctx.ellipse(ll.x,ll.y,11,5,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(lr.x,lr.y,11,5,0.3,0,Math.PI*2); ctx.fill();
    [[0.18,0.42],[0.62,0.86]].forEach(([z1,z2]) => {
        quad3D(ctx,[iso(-W*0.52,-3,-D*z1),iso(-W*0.52,-28,-D*z1),iso(-W*0.52,-28,-D*z2),iso(-W*0.52,-3,-D*z2)],'#111');
        quad3D(ctx,[iso(W*0.52,-3,-D*z1),iso(W*0.52,-28,-D*z1),iso(W*0.52,-28,-D*z2),iso(W*0.52,-3,-D*z2)],'#111');
    });
}

function dibujar3DClasico(ctx, color) {
    const c = color, cl = brillante(color, 35), cd = brillante(color, -40), cm = brillante(color, 15);
    const W = 120, H = 46, D = 200;

    const floor = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(-W*0.5,0,-D*0.9)];
    quad3D(ctx, floor, cd);
    const sideR = [iso(W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.9), iso(W*0.5,-H,-D*0.9), iso(W*0.5,-H,-D*0.1)];
    quad3D(ctx, sideR, cm);
    const back = [iso(-W*0.5,0,-D*0.1), iso(W*0.5,0,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(-W*0.5,-H,-D*0.1)];
    quad3D(ctx, back, c);
    const top = [iso(-W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.1), iso(W*0.5,-H,-D*0.9), iso(-W*0.5,-H,-D*0.9)];
    quad3D(ctx, top, cl);
    // Techo redondeado estilo retro
    const cab = [iso(-W*0.38,-H,-D*0.25), iso(W*0.38,-H,-D*0.25), iso(W*0.28,-H-32,-D*0.6), iso(-W*0.28,-H-32,-D*0.6)];
    quad3D(ctx, cab, 'rgba(100,200,255,0.52)');
    // Luces redondas traseras retro
    ctx.fillStyle = '#ff2222';
    const ll = iso(-W*0.46,-H*0.45,-D*0.12);
    const lr = iso(W*0.46,-H*0.45,-D*0.12);
    ctx.beginPath(); ctx.arc(ll.x,ll.y,7,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(lr.x,lr.y,7,0,Math.PI*2); ctx.fill();
    [[0.22,0.44],[0.64,0.86]].forEach(([z1,z2]) => {
        quad3D(ctx,[iso(-W*0.52,-4,-D*z1),iso(-W*0.52,-26,-D*z1),iso(-W*0.52,-26,-D*z2),iso(-W*0.52,-4,-D*z2)],'#111');
        quad3D(ctx,[iso(W*0.52,-4,-D*z1),iso(W*0.52,-26,-D*z1),iso(W*0.52,-26,-D*z2),iso(W*0.52,-4,-D*z2)],'#111');
    });
}

// ================================================================
// HELPER DE COLOR
// ================================================================
function brillante(hex, amount = 30) {
    if (!hex || hex.startsWith('rgb')) return hex;
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
}

// ================================================================
// INICIALIZACIÓN DEL GARAGE
// ================================================================
function iniciarGarage() {
    let tipoSel = estado.tipoAuto || 'deportivo';
    let colorPreview = estado.color;

    // Dibujar miniaturas
    document.querySelectorAll('.carro-mini-canvas').forEach(canvas => {
        dibujarCarroMini(canvas, canvas.dataset.tipo, estado.color);
    });

    // Selección de carro
    document.getElementById('garage-grid').addEventListener('click', e => {
        const card = e.target.closest('.carro-card');
        if (!card) return;
        document.querySelectorAll('.carro-card').forEach(c => c.classList.remove('sel'));
        card.classList.add('sel');
        tipoSel = card.dataset.tipo;
    });

    // Ver en 3D
    document.getElementById('btn-ver-carro').addEventListener('click', () => {
        mostrar('pantalla-preview');
        document.getElementById('preview-nombre').textContent = TIPOS_CARRO[tipoSel]?.nombre || tipoSel;
        dibujarCarro3D(document.getElementById('canvas-preview-3d'), tipoSel, colorPreview);

        // Cambio de color en preview
        document.getElementById('colores-preview').onclick = e => {
            const btn = e.target.closest('.color-btn');
            if (!btn) return;
            document.querySelectorAll('#colores-preview .color-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            colorPreview = btn.dataset.color;
            dibujarCarro3D(document.getElementById('canvas-preview-3d'), tipoSel, colorPreview);
            // También actualizar miniaturas
            document.querySelectorAll('.carro-mini-canvas').forEach(c => dibujarCarroMini(c, c.dataset.tipo, colorPreview));
        };
    });

    // Seleccionar carro
    document.getElementById('btn-seleccionar-carro').addEventListener('click', () => {
        estado.tipoAuto = tipoSel;
        estado.color = colorPreview;
        // Actualizar selector de color en inicio
        document.querySelectorAll('#colores-grid .color-btn').forEach(b => {
            b.classList.toggle('sel', b.dataset.color === colorPreview);
        });
        mostrar('pantalla-inicio');
    });

    // Volver
    document.getElementById('btn-volver-preview').addEventListener('click', () => mostrar('pantalla-garage'));
    document.getElementById('btn-volver-garage').addEventListener('click', () => mostrar('pantalla-inicio'));
}

window.iniciarGarage = iniciarGarage;
window.dibujarCarroMini = dibujarCarroMini;
window.dibujarCarro3D = dibujarCarro3D;
window.brillante = brillante;
