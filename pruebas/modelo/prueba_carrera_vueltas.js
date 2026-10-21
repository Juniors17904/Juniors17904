const fs = require('fs');
global.window = {};
eval(fs.readFileSync(require('path').join(__dirname,'../../src/')+'model/muestra_ruta.js', 'utf8'));
eval(fs.readFileSync(require('path').join(__dirname,'../../src/')+'model/carrera_vueltas.js', 'utf8'));
const M = window.MuestraRuta;
if (window.__modelErrors) { console.error(window.__modelErrors); process.exit(1); }
const C = window.CarreraVueltas;
let fallos = 0, ok = 0;
const afirmar = (c, m) => { if (c) ok++; else { fallos++; console.log('FALLO:', m); } };

function circulo(n, R = 100) {
  // sentido de avance: angle = atan2(t.x, t.z)
  return Array.from({ length: n }, (_, i) => {
    const a = 2 * Math.PI * i / n;
    const x = R * Math.sin(a), z = R * Math.cos(a);
    const tx = Math.cos(a), tz = -Math.sin(a);
    return new M(x, z, Math.atan2(tx, tz));
  });
}
const pos = (m, f, off = 0) => { // posición en fracción f, desplazada radialmente off
  const a = 2 * Math.PI * f, R = 100 + off;
  return [R * Math.sin(a), R * Math.cos(a)];
};
// Recorre de f0 a f1 en pasos de 0.05 (dir +1/-1), terminando exacto en f1
function recorrer(c, desde, hasta, dir, eventos) {
  let f = desde;
  for (let g = 0; g < 100; g++) {
    let dist = dir > 0 ? ((hasta - f) % 1 + 1) % 1 : ((f - hasta) % 1 + 1) % 1;
    dist = Math.round(dist * 1000) / 1000;
    if (dist === 0) break;
    const paso = Math.min(0.05, dist);
    f = Math.round((((f + dir * paso) % 1) + 1) % 1 * 1000) / 1000;
    const [x, z] = pos(null, f);
    const ev = c.actualizar(x, z, 1);
    if (eventos) eventos.push(ev);
  }
}
const cuenta = (arr, e) => arr.filter(x => x === e).length;

// RF-06
const c100 = circulo(100);
let c = new C(c100);
afirmar(c.progreso === 0 && c.vueltaActual === 1 && c.totalVueltas === 3, 'RF-06 inicial');

// RF-06
for (let i = 5; i <= 25; i += 5) { const [x, z] = pos(0, i / 100); c.actualizar(x, z); }
afirmar(c.progreso === 0.25, 'RF-06 avanzar a 0.25 => ' + c.progreso);
{ const [x, z] = pos(0, 0.2); c.actualizar(x, z); afirmar(c.progreso === 0.2, 'RF-06 atrás disminuye'); }
c = new C(c100);
recorrer(c, 0, 0.98, -1);
afirmar(c.progreso === 0.98, 'RF-06 llegar a 0.98 => ' + c.progreso);
{ const [x, z] = pos(0, 0.01); c.actualizar(x, z); afirmar(c.progreso === 0.01, 'RF-06 envolvimiento 98->1 => ' + c.progreso); }

// RF-07 pasto
c = new C(c100);
{ let [x, z] = pos(0, 0.1); c.actualizar(x, z); }
recorrer(c, 0, 0.1, 1);
{ const [x, z] = pos(0, 0.1, 5); c.actualizar(x, z, 0); afirmar(c.enPasto === true && c.factorArrastre === 3, 'RF-07 5u => pasto (lat ' + c.lateral + ')'); }
{ const [x, z] = pos(0, 0.1, -5); c.actualizar(x, z, 0); afirmar(c.enPasto === true, 'RF-07 -5u => pasto'); }
{ const [x, z] = pos(0, 0.1, 3); c.actualizar(x, z, 0); afirmar(c.enPasto === false && c.factorArrastre === 1, 'RF-07 3u => no pasto'); }
// segmento largo: 20 muestras R=200 (espaciado ~63)
{
  const n = 20, R = 200;
  const ms = Array.from({ length: n }, (_, i) => { const a = 2*Math.PI*i/n; return new M(R*Math.sin(a), R*Math.cos(a), Math.atan2(Math.cos(a), -Math.sin(a))); });
  const cc = new C(ms);
  const a = ms[0], b = ms[1];
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L;
  // perpendicular (uz, -ux)
  cc.actualizar(mx + 3 * uz, mz - 3 * ux, 0);
  afirmar(cc.enPasto === false && Math.abs(Math.abs(cc.lateral) - 3) < 1e-6, 'RF-07 mitad segmento 3u => no pasto (lat ' + cc.lateral + ')');
  cc.actualizar(mx - 5 * uz, mz + 5 * ux, 0);
  afirmar(cc.enPasto === true, 'RF-07 mitad segmento 5u => pasto');
}
// fracción de tope
c = new C(c100);
{ const [x, z] = pos(0, 0, 6);
  c.actualizar(x, z, 60); afirmar(c.fraccionTope <= 0.43, 'RF-07 60 pasos <= 0.43: ' + c.fraccionTope);
  c.actualizar(x, z, 60); afirmar(c.fraccionTope < 0.41, 'RF-07 120 pasos < 0.41: ' + c.fraccionTope);
  const [x2, z2] = pos(0, 0); let prev = c.fraccionTope;
  c.actualizar(x2, z2, 1); const esperado = prev + (1 - prev) * 0.05;
  afirmar(Math.abs(c.fraccionTope - esperado) < 1e-12, 'RF-07 vuelta asfalto misma ley');
  c.actualizar(x2, z2, 200); afirmar(c.fraccionTope > 0.9999 && c.fraccionTope <= 1, 'RF-07 sube a 1');
  c.actualizar(x, z, 0); afirmar(c.fraccionTope > 0.9999, 'RF-07 0 pasos no cambia');
}

// RF-06
c = new C(c100); let ev = [];
recorrer(c, 0, 0.5, 1, ev); recorrer(c, 0.5, 0, -1, ev);
afirmar(c.vueltaActual === 1 && cuenta(ev, 'vuelta') === 0, 'RF-06 0->0.5->0 atrás no suma');
c = new C(c100); ev = [];
recorrer(c, 0, 0.34, 1, ev); afirmar(c.puntoControlSiguiente === 2, 'RF-06 PC1 marcado');
recorrer(c, 0.34, 0.67, 1, ev); afirmar(c.puntoControlSiguiente === 3, 'RF-06 PC2 marcado');
recorrer(c, 0.67, 0.99, 1, ev); recorrer(c, 0.99, 0.01, 1, ev);
afirmar(c.vueltaActual === 2 && cuenta(ev, 'vuelta') === 1 && cuenta(ev, 'puntoControl') === 2, 'RF-06 una vuelta ' + ev.join(','));
afirmar(c.puntoControlSiguiente === 1, 'RF-06 PCs reiniciados tras vuelta');
// Corte 40 -> 200 con N=400
{
  const c400 = circulo(400); const cc = new C(c400);
  for (let i = 10; i <= 40; i += 10) { const m = c400[i]; cc.actualizar(m.x, m.z); }
  afirmar(cc.progreso === 0.1, 'corte: en muestra 40');
  const m = c400[200]; const e = cc.actualizar(m.x, m.z);
  afirmar(cc.progreso <= 0.2 && cc.puntoControlSiguiente === 1 && cc.vueltaActual === 1 && e === 'nada', 'RF-06 corte 40->200 prog ' + cc.progreso);
  // repetir el salto muchas veces: avanza máx 0.1 por llamada, no marca PC hasta cruzar realmente
  let e2 = cc.actualizar(m.x, m.z);
  afirmar(cc.progreso <= 0.3, 'corte 2do salto <= 0.3');
}

// RF-06
c = new C(c100); ev = [];
recorrer(c, 0, 0.05, 1, ev);
recorrer(c, 0.05, 0.95, -1, ev);
recorrer(c, 0.95, 0.05, 1, ev);
afirmar(cuenta(ev, 'vuelta') === 0, 'RF-06 retorno por meta sin PC no cuenta');
recorrer(c, 0.05, 0.34, 1, ev); recorrer(c, 0.34, 0.67, 1, ev); recorrer(c, 0.67, 0.99, 1, ev); recorrer(c, 0.99, 0.01, 1, ev);
afirmar(cuenta(ev, 'vuelta') === 1 && c.vueltaActual === 2, 'RF-06 exactamente 1 vuelta: ' + cuenta(ev, 'vuelta'));
// Reinicio de PC al retroceder por meta con PC marcados
c = new C(c100); ev = [];
recorrer(c, 0, 0.7, 1, ev); recorrer(c, 0.7, 0.05, 1, ev); // vuelta 1
recorrer(c, 0.05, 0.7, 1, ev); afirmar(c.puntoControlSiguiente === 3, 'PCs marcados');
recorrer(c, 0.7, 0.05, -1, ev); afirmar(c.puntoControlSiguiente === 3, 'retroceder sin cruzar meta no reinicia');
recorrer(c, 0.05, 0.9, -1, ev); afirmar(c.puntoControlSiguiente === 1, 'RF-06 meta hacia atrás reinicia PC');
recorrer(c, 0.9, 0.05, 1, ev); afirmar(c.vueltaActual === 2, 'RF-06 no cuenta tras reinicio');

// RF-06 / RF-06 / RF-06
c = new C(c100); ev = [];
for (let v = 0; v < 3; v++) { recorrer(c, 0, 0.5, 1, ev); recorrer(c, 0.5, 0, 1, ev); }
const relevantes = ev.filter(e => e === 'vuelta' || e === 'meta');
afirmar(JSON.stringify(relevantes) === '["vuelta","vuelta","meta"]', 'RF-06 eventos ' + relevantes);
afirmar(c.terminada === true && c.vueltaActual === 3, 'RF-06 terminada');
ev = []; for (let v = 0; v < 2; v++) { recorrer(c, 0, 0.5, 1, ev); recorrer(c, 0.5, 0, 1, ev); }
afirmar(c.vueltaActual === 3 && ev.every(e => e === 'nada'), 'RF-06 no cambia tras terminar');
c.reiniciar();
afirmar(c.vueltaActual === 1 && c.progreso === 0 && c.terminada === false && c.fraccionTope === 1 && c.puntoControlSiguiente === 1, 'RF-06 reiniciar');
ev = []; recorrer(c, 0, 0.5, 1, ev); recorrer(c, 0.5, 0, 1, ev);
afirmar(c.vueltaActual === 2, 'RF-06 vuelve a contar tras reiniciar');
// totalVueltas personalizado
{ const cc = new C(c100, 1); const e = []; recorrer(cc, 0, 0.5, 1, e); recorrer(cc, 0.5, 0, 1, e); afirmar(e.includes('meta') && cc.terminada, 'totalVueltas=1'); }
// encapsulamiento
afirmar(Object.keys(c).length === 0, 'sin campos públicos');
console.log(`OK ${ok}, fallos ${fallos}`);
process.exit(fallos ? 1 : 0);
