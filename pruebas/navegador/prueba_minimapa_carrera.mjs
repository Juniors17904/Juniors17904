// ================================================================
// Prueba en navegador real del PRD 017 — Minimapa en Jugar Solo.
//   RF-01/RF-02 → al empezar, el mapa recibe a los 5 carros, cada uno con el color de su auto
//   RF-03 → los puntos siguen el lugar real de cada carro (el del jugador es el del visor)
//   RF-05 → arriba a la derecha, bajo la barra del HUD, sin tocar velocímetro ni controles
//   RF-06 → en horizontal es más ancho y más bajo; al girar cambia de tamaño
//   RF-07 → el mapa no gira
//   RF-08 → se ve en la cuenta 3-2-1, se oculta con el resultado y vuelve con Revancha
//   RF-09 → fondo semitransparente
//   RF-10 → en Diseño de Pistas no aparece
//   Sin errores de consola. Capturas en /tmp/capturas_prd017/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd017';
mkdirSync(CARPETA, { recursive: true });
const parchear = async route => {
  const url = route.request().url();
  if (url.startsWith('https://')) { await route.abort(); return; }
  try {
    const res = await route.fetch();
    const ct = res.headers()['content-type'] ?? '';
    if (!ct.includes('text/html')) { await route.fulfill({ response: res }); return; }
    let body = await res.text();
    body = body.replace('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js','/node_modules/three/build/three.module.min.js')
               .replace('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/','/node_modules/three/examples/jsm/');
    await route.fulfill({ response: res, body });
  } catch { await route.abort(); }
};
let ok = 0, fallos = 0;
const check = (c, texto) => { const m = 'PRD 017 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function abrir(vp) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' })));
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  // Espías: el visor, el velocímetro dibujado y lo que recibe el mapa
  await page.evaluate(() => {
    const iniciar = window.VisorCarreraSolo.prototype.iniciar;
    window.VisorCarreraSolo.prototype.iniciar = function (...a) { window.__visor = this; return iniciar.apply(this, a); };
    const dibujar = window.RenderizadorVelocimetro.dibujar.bind(window.RenderizadorVelocimetro);
    window.RenderizadorVelocimetro.dibujar = (c, cx, cy, r, ...resto) => { window.__velocimetro = { x: cx - r, y: cy - r, r: cx + r, b: cy + r }; return dibujar(c, cx, cy, r, ...resto); };
    window.__ubicados = [];
    const ubicar = window.MinimapaCarrera.prototype.ubicar;
    window.MinimapaCarrera.prototype.ubicar = function (i, x, z, color, esJugador) { window.__ubicados[i] = { x, z, color, esJugador: !!esJugador }; return ubicar.call(this, i, x, z, color, esJugador); };
  });
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, errores, cdp };
}

const tocar = (cdp, tipo, dedos) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: dedos.map(d => ({ x: d.x, y: d.y, id: d.id, radiusX: 4, radiusY: 4, force: 1 })) });
const medir = page => page.evaluate(() => {
  const caja = id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return null;
    const b = e.getBoundingClientRect(); return b.width > 0 ? { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } : null; };
  return { W: innerWidth, H: innerHeight, mapa: caja('minimapa-carrera-solo'), acel: caja('btn-acelerar'), freno: caja('btn-freno'),
    timon: caja('canvas-timon'), zona: caja('zona-giro'), vel: window.__velocimetro, transform: getComputedStyle(document.getElementById('minimapa-carrera-solo')).transform };
});
const solapa = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
const ALTO_BARRA = 52;

for (const [nombre, vp, ancho, alto] of [['vertical', { width: 390, height: 844 }, 90, 120], ['horizontal', { width: 844, height: 390 }, 140, 104]]) {
  const { ctx, page, errores, cdp } = await abrir(vp);
  await page.evaluate(() => document.getElementById('btn-solo').click());
  // RF-08: durante la cuenta 3-2-1 el mapa ya se ve
  const huboCuenta = await page.waitForFunction(() => document.getElementById('cuenta-carrera-solo')?.style.display === 'flex', null, { timeout: 20000 }).then(() => true, () => false);
  const enCuenta = await medir(page);
  check(huboCuenta && enCuenta.mapa && enCuenta.mapa.w === ancho, `RF-08 (${nombre}) el mapa se ve durante la cuenta 3-2-1`);
  await page.waitForFunction(() => window.__visor && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 20000 }).catch(() => {});
  await esperar(500);
  const m = await medir(page);
  check(m.mapa && m.mapa.w === ancho && m.mapa.h === alto, `RF-05/RF-06 (${nombre}) el mapa mide ${ancho}×${alto} (${m.mapa?.w}×${m.mapa?.h})`);
  check(m.mapa && m.mapa.y >= ALTO_BARRA && m.mapa.r >= m.W - 12 && m.mapa.r <= m.W && m.mapa.x > m.W / 2, `RF-05 (${nombre}) arriba a la derecha, bajo la barra del HUD (${JSON.stringify(m.mapa)})`);
  check([m.vel, m.acel, m.freno, m.timon, m.zona].every(b => !solapa(m.mapa, b)), `RF-05 (${nombre}) no toca el velocímetro ni los controles`);
  check(m.transform === 'none', `RF-07 (${nombre}) el mapa no gira`);
  const fondo = await page.evaluate(() => { const c = document.getElementById('minimapa-carrera-solo'); return Array.from(c.getContext('2d').getImageData(6, 6, 1, 1).data); });
  check(fondo[3] > 40 && fondo[3] < 230, `RF-09 (${nombre}) el fondo es semitransparente (alfa ${fondo[3]})`);
  const u0 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__ubicados)));
  const colores = u0.map(c => c?.color);
  check(u0.length === 5 && u0.every(Boolean) && new Set(colores.map(String)).size === 5, `RF-02 (${nombre}) el mapa recibe 5 carros de colores distintos (${colores})`);
  check(u0[0]?.esJugador && u0.slice(1).every(c => !c.esJugador), `RF-04 (${nombre}) el primero es el jugador y los otros 4 los rivales`);
  // RF-03: se acelera un rato; los puntos siguen el lugar real (el del jugador es el del visor)
  const acel = { id: 1, x: (m.acel.x + m.acel.r) / 2, y: (m.acel.y + m.acel.b) / 2 };
  await tocar(cdp, 'touchStart', [acel]);
  await esperar(2500);
  const despues = await page.evaluate(() => ({ u: JSON.parse(JSON.stringify(window.__ubicados)), px: window.__visor.px, pz: window.__visor.pz,
    rivales: window.__visor.rivales.rivales.map(r => ({ x: r.carro.px, z: r.carro.pz, color: r.piloto.color })) }));
  await tocar(cdp, 'touchEnd', [acel]);
  const movidos = despues.u.filter((c, i) => Math.hypot(c.x - u0[i].x, c.z - u0[i].z) > 5).length;
  check(movidos === 5, `RF-03 (${nombre}) los 5 puntos se mueven con sus carros (${movidos})`);
  check(Math.abs(despues.u[0].x - despues.px) < 3 && Math.abs(despues.u[0].z - despues.pz) < 3, `RF-03 (${nombre}) el punto del jugador está en su lugar real`);
  check(despues.rivales.length === 4 && despues.rivales.every((r, i) => { const u = despues.u[i + 1]; return u.color === r.color && Math.hypot(u.x - r.x, u.z - r.z) < 3; }),
    `RF-02/RF-03 (${nombre}) cada rival está en el lugar real de su carro y con el color de su auto`);
  await page.screenshot({ path: `${CARPETA}/${nombre}.png` });
  if (nombre === 'vertical') {
    // RF-06: al girar el celular cambia de tamaño sin cortar la carrera
    const antes = await page.evaluate(() => window.__visor.px + ',' + window.__visor.pz);
    await page.setViewportSize({ width: 844, height: 390 });
    await esperar(800);
    const girado = await medir(page);
    const sigue = await page.evaluate(v => !!window.__visor && document.getElementById('pantalla-carrera-solo').classList.contains('activa')
      && !document.getElementById('pantalla-carrera-solo').classList.contains('con-resultado') && (window.__visor.px + ',' + window.__visor.pz) !== v, antes);
    check(sigue, 'RF-06 al girar el celular la carrera sigue (el carro se sigue moviendo)');
    check(girado.mapa && girado.mapa.w === 140 && girado.mapa.h === 104 && girado.mapa.r <= 844, `RF-06 al girar a horizontal el mapa pasa a 140×104 (${girado.mapa?.w}×${girado.mapa?.h})`);
    await page.screenshot({ path: `${CARPETA}/vertical_girado.png` });
    await page.setViewportSize(vp);
    await esperar(500);
  }
  // RF-08: con el resultado el mapa se oculta y vuelve con Revancha
  await page.evaluate(() => { const o = window.CarreraVueltas.prototype.actualizar; window.CarreraVueltas.prototype.actualizar = function (...a) { o.apply(this, a); return 'meta'; }; window.__original = o; });
  await esperar(800);
  const conResultado = await medir(page);
  check(!conResultado.mapa, `RF-08 (${nombre}) con el panel de resultado el mapa se oculta`);
  await page.evaluate(() => { window.CarreraVueltas.prototype.actualizar = window.__original; document.getElementById('btn-revancha-solo').click(); });
  await esperar(1500);
  const revancha = await medir(page);
  check(revancha.mapa && revancha.mapa.w === ancho, `RF-08 (${nombre}) con Revancha el mapa vuelve`);
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

// ── RF-10: en Diseño de Pistas no aparece este mapa ──
{
  const { ctx, page, errores } = await abrir({ width: 844, height: 390 });
  await page.evaluate(() => document.getElementById('btn-garage').click()); await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('btn-ir-pista').click()); await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById('btn-seleccionar-pista').click());
  await page.waitForTimeout(5000);
  const m = await medir(page);
  const recibio = await page.evaluate(() => window.__ubicados.length);
  const enDiseno = await page.evaluate(() => !!document.querySelector('.pantalla.activa') && !document.getElementById('pantalla-carrera-solo').classList.contains('activa')
    && !!document.getElementById('canvas-timon')?.getBoundingClientRect().width);
  check(enDiseno && !m.mapa && recibio === 0, 'RF-10 en Diseño de Pistas no aparece el mapa de la carrera');
  const reales = erroresReales(errores);
  check(reales.length === 0, 'Diseño de Pistas sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
