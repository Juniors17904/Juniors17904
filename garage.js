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
// DIBUJA CARRO DESDE ATRÁS (miniatura en tarjeta del garage)
// ================================================================
function dibujarCarroMini(canvas, tipo, color) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fondo pequeño
    ctx.fillStyle = '#0a0a1e';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 8);
    ctx.fill();

    const cx = W / 2, by = H * 0.88;

    switch (tipo) {
        case 'deportivo': dibujarMiniDeportivo(ctx, cx, by, color); break;
        case 'suv':       dibujarMiniSUV(ctx, cx, by, color);       break;
        case 'muscle':    dibujarMiniMuscle(ctx, cx, by, color);    break;
        case 'formula':   dibujarMiniFormula(ctx, cx, by, color);   break;
        case 'pickup':    dibujarMiniPickup(ctx, cx, by, color);    break;
        case 'clasico':   dibujarMiniClasico(ctx, cx, by, color);   break;
    }
}

function dibujarMiniDeportivo(ctx, cx, by, color) {
    const w = 38, h = 44;
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, by, w*0.55, 5, 0, 0, Math.PI*2); ctx.fill();
    // Carrocería baja y aerodinámica
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-w/2, by-h, w, h, [2,2,5,5]); ctx.fill();
    // Techo muy bajo
    ctx.fillStyle = brillante(color);
    ctx.beginPath(); ctx.roundRect(cx-w*0.32, by-h-h*0.2, w*0.64, h*0.22, [6,6,2,2]); ctx.fill();
    // Vidrio
    ctx.fillStyle = 'rgba(140,220,255,0.6)';
    ctx.beginPath(); ctx.roundRect(cx-w*0.28, by-h-h*0.17, w*0.56, h*0.15, 3); ctx.fill();
    // Luces traseras
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(cx-w/2+2, by-7, w*0.3, 5);
    ctx.fillRect(cx+w/2-w*0.3-2, by-7, w*0.3, 5);
    // Ruedas
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(cx-w/2-5, by-h*0.35, 9, 6, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-4, by-h*0.35, 9, 6, 2); ctx.fill();
}

function dibujarMiniSUV(ctx, cx, by, color) {
    const w = 40, h = 54;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, by, w*0.55, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-w/2, by-h, w, h, [4,4,6,6]); ctx.fill();
    // Techo alto y cuadrado
    ctx.fillStyle = brillante(color);
    ctx.beginPath(); ctx.roundRect(cx-w*0.42, by-h-h*0.35, w*0.84, h*0.38, [5,5,2,2]); ctx.fill();
    ctx.fillStyle = 'rgba(140,220,255,0.55)';
    ctx.beginPath(); ctx.roundRect(cx-w*0.37, by-h-h*0.3, w*0.74, h*0.28, 3); ctx.fill();
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(cx-w/2+2, by-8, w*0.28, 6);
    ctx.fillRect(cx+w/2-w*0.28-2, by-8, w*0.28, 6);
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(cx-w/2-6, by-h*0.32, 10, 8, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-4, by-h*0.32, 10, 8, 2); ctx.fill();
}

function dibujarMiniMuscle(ctx, cx, by, color) {
    const w = 46, h = 46;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, by, w*0.55, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-w/2, by-h, w, h, [3,3,6,6]); ctx.fill();
    // Capó elevado (músculo)
    ctx.fillStyle = brillante(color, 15);
    ctx.beginPath(); ctx.roundRect(cx-w*0.35, by-h-h*0.14, w*0.7, h*0.17, [5,5,1,1]); ctx.fill();
    ctx.fillStyle = brillante(color);
    ctx.beginPath(); ctx.roundRect(cx-w*0.3, by-h-h*0.28, w*0.6, h*0.16, [5,5,2,2]); ctx.fill();
    ctx.fillStyle = 'rgba(140,220,255,0.5)';
    ctx.beginPath(); ctx.roundRect(cx-w*0.25, by-h-h*0.24, w*0.5, h*0.11, 3); ctx.fill();
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(cx-w/2+2, by-7, w*0.32, 5);
    ctx.fillRect(cx+w/2-w*0.32-2, by-7, w*0.32, 5);
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(cx-w/2-7, by-h*0.3, 11, 8, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-4, by-h*0.3, 11, 8, 2); ctx.fill();
}

function dibujarMiniFormula(ctx, cx, by, color) {
    const w = 22, h = 38;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, by, w*0.9, 4, 0, 0, Math.PI*2); ctx.fill();
    // Cuerpo muy estrecho
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-w/2, by-h, w, h, [2,2,3,3]); ctx.fill();
    // Alas traseras
    ctx.fillStyle = brillante(color, 20);
    ctx.fillRect(cx-w/2-12, by-h*0.18, 10, 4);
    ctx.fillRect(cx+w/2+2, by-h*0.18, 10, 4);
    // Cockpit pequeño
    ctx.fillStyle = brillante(color);
    ctx.beginPath(); ctx.ellipse(cx, by-h*0.65, w*0.3, h*0.12, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,0.7)';
    ctx.beginPath(); ctx.ellipse(cx, by-h*0.65, w*0.22, h*0.08, 0, 0, Math.PI*2); ctx.fill();
    // Ruedas grandes formula
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(cx-w/2-8, by-h*0.22, 10, 14, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-2, by-h*0.22, 10, 14, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx-w/2-6, by-h*0.78, 9, 12, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-3, by-h*0.78, 9, 12, 3); ctx.fill();
}

function dibujarMiniPickup(ctx, cx, by, color) {
    const w = 42, h = 50;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, by, w*0.55, 5, 0, 0, Math.PI*2); ctx.fill();
    // Caja trasera
    ctx.fillStyle = brillante(color, -20);
    ctx.beginPath(); ctx.roundRect(cx-w/2, by-h*0.45, w, h*0.45, [1,1,4,4]); ctx.fill();
    // Cabina
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-w*0.4, by-h, w*0.8, h, [4,4,2,2]); ctx.fill();
    ctx.fillStyle = brillante(color);
    ctx.beginPath(); ctx.roundRect(cx-w*0.36, by-h-h*0.32, w*0.72, h*0.35, [5,5,2,2]); ctx.fill();
    ctx.fillStyle = 'rgba(140,220,255,0.55)';
    ctx.beginPath(); ctx.roundRect(cx-w*0.3, by-h-h*0.27, w*0.6, h*0.22, 3); ctx.fill();
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(cx-w/2+2, by-8, w*0.25, 6);
    ctx.fillRect(cx+w/2-w*0.25-2, by-8, w*0.25, 6);
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(cx-w/2-6, by-h*0.28, 11, 9, 3); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-5, by-h*0.28, 11, 9, 3); ctx.fill();
}

function dibujarMiniClasico(ctx, cx, by, color) {
    const w = 42, h = 48;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cx, by, w*0.55, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx-w/2, by-h, w, h, [1,1,5,5]); ctx.fill();
    // Techo estilo retro (arco suave)
    ctx.fillStyle = brillante(color);
    ctx.beginPath();
    ctx.moveTo(cx-w*0.38, by-h);
    ctx.quadraticCurveTo(cx, by-h-h*0.38, cx+w*0.38, by-h);
    ctx.lineTo(cx+w*0.38, by-h+4);
    ctx.lineTo(cx-w*0.38, by-h+4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(140,220,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(cx-w*0.3, by-h+2);
    ctx.quadraticCurveTo(cx, by-h-h*0.28, cx+w*0.3, by-h+2);
    ctx.closePath(); ctx.fill();
    // Luces retro redondas
    ctx.fillStyle = '#ff3333';
    ctx.beginPath(); ctx.arc(cx-w/2+7, by-9, 5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+w/2-7, by-9, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(cx-w/2-6, by-h*0.32, 10, 8, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(cx+w/2-4, by-h*0.32, 10, 8, 5); ctx.fill();
}

// ================================================================
// DIBUJA CARRO EN 3D (vista isométrica 3/4) para la pantalla preview
// ================================================================
function dibujarCarro3D(canvas, tipo, color) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fondo con gradiente
    const bg = ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, W*0.7);
    bg.addColorStop(0, '#12122a');
    bg.addColorStop(1, '#070710');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 16); ctx.fill();

    // Suelo con reflejo
    ctx.fillStyle = 'rgba(124,58,237,0.08)';
    ctx.beginPath(); ctx.ellipse(W/2, H*0.82, W*0.42, H*0.08, 0, 0, Math.PI*2); ctx.fill();

    // Dibujar en 3D según tipo
    ctx.save();
    ctx.translate(W/2, H*0.72);
    switch (tipo) {
        case 'deportivo': dibujar3DDeportivo(ctx, color); break;
        case 'suv':       dibujar3DSUV(ctx, color);       break;
        case 'muscle':    dibujar3DMuscle(ctx, color);    break;
        case 'formula':   dibujar3DFormula(ctx, color);   break;
        case 'pickup':    dibujar3DPickup(ctx, color);    break;
        case 'clasico':   dibujar3DClasico(ctx, color);   break;
    }
    ctx.restore();

    // Nombre neon
    ctx.fillStyle = '#7c3aed';
    ctx.font = 'bold 13px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = '#7c3aed';
    ctx.shadowBlur = 10;
    ctx.fillText(TIPOS_CARRO[tipo]?.desc || '', W/2, H - 10);
    ctx.shadowBlur = 0;
}

// Función auxiliar isométrica: convierte 3D (x,y,z) a 2D pantalla
// x = ancho, y = alto, z = profundidad
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
