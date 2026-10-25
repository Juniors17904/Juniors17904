// ================================================================
// Prueba en navegador real del PRD 016 — Controles más cómodos en Jugar Solo.
// Toques reales con pantalla táctil (Input.dispatchTouchEvent de Chrome).
//   RF-01 → arrastrar en la zona de giro gira el carro, sin tocar el timón
//   RF-02 → el timón dibujado gira mientras se arrastra en la zona
//   RF-03 → giro máximo con 85 px en vertical y con un cuarto del ancho en horizontal
//   RF-04 → en vertical ACEL y FRENO de 72 px o más, a 16 px o más
//   RF-05 → en horizontal lado a lado (FRENO a la izquierda), de 88 px o más, a 16 px o más
//   RF-06 → el botón apretado se ve distinto y vuelve al soltarlo
//   RF-07 → vibra al empezar a acelerar si el celular lo permite
//   RF-08 → dos dedos: girar y acelerar a la vez; soltar uno no corta al otro;
//           un segundo dedo en la zona no endereza el timón
//   RF-09 → nada tapa el velocímetro ni se corta
//   D1    → en Diseño de Pistas no hay zona de giro y los botones quedan como siempre
//   Sin errores de consola. Capturas en /tmp/capturas_prd016/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd016';
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
const check = (c, texto) => { const m = 'PRD 016 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function abrir(vp) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' }));
    window.__vibraciones = 0;
    navigator.vibrate = () => { window.__vibraciones++; return true; };
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  // Espías: el visor (sus entradas de giro y aceleración) y el velocímetro dibujado
  await page.evaluate(() => {
    const iniciar = window.VisorCarreraSolo.prototype.iniciar;
    window.VisorCarreraSolo.prototype.iniciar = function (...a) { window.__visor = this; return iniciar.apply(this, a); };
    const dibujar = window.RenderizadorVelocimetro.dibujar.bind(window.RenderizadorVelocimetro);
    window.RenderizadorVelocimetro.dibujar = (c, cx, cy, r, ...resto) => { window.__velocimetro = { x: cx - r, y: cy - r, r: cx + r, b: cy + r }; return dibujar(c, cx, cy, r, ...resto); };
  });
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, errores, cdp };
}

// Toques reales: la lista son los dedos apoyados en este momento
const tocar = (cdp, tipo, dedos) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: dedos.map(d => ({ x: d.x, y: d.y, id: d.id, radiusX: 4, radiusY: 4, force: 1 })) });
const entradas = page => page.evaluate(() => ({ giro: window.__visor.entradaDireccion, acel: window.__visor.entradaAcel }));
const medir = page => page.evaluate(() => {
  const caja = id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return null;
    const b = e.getBoundingClientRect(); return b.width > 0 ? { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height } : null; };
  return { W: innerWidth, H: innerHeight, acel: caja('btn-acelerar'), freno: caja('btn-freno'), timon: caja('canvas-timon'), zona: caja('zona-giro'), vel: window.__velocimetro };
});
const solapa = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
const dentro = (b, W, H) => b && b.x >= -0.5 && b.y >= -0.5 && b.r <= W + 0.5 && b.b <= H + 0.5;

for (const [nombre, vp, recorrido] of [['vertical', { width: 390, height: 844 }, 85], ['horizontal', { width: 844, height: 390 }, 844 / 4]]) {
  const { ctx, page, errores, cdp } = await abrir(vp);
  await page.evaluate(() => document.getElementById('btn-solo').click());
  await page.waitForFunction(() => window.__visor && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  const m = await medir(page);

  // RF-04 / RF-05: tamaño, separación y orden de los pedales
  if (nombre === 'vertical') {
    check(m.acel.w >= 72 && m.freno.w >= 72 && m.freno.y - m.acel.b >= 16, `RF-04 en vertical ACEL y FRENO de ${m.acel.w}/${m.freno.w} px, apilados a ${(m.freno.y - m.acel.b).toFixed(0)} px`);
  } else {
    check(m.acel.w >= 88 && m.freno.w >= 88 && m.freno.r <= m.acel.x - 16 && Math.abs(m.acel.y - m.freno.y) < 1,
      `RF-05 en horizontal lado a lado, FRENO a la izquierda: ${m.freno.w}/${m.acel.w} px, a ${(m.acel.x - m.freno.r).toFixed(0)} px`);
  }
  // RF-09: nada tapa el velocímetro ni se corta
  check([m.acel, m.freno, m.timon, m.vel].every(b => dentro(b, m.W, m.H)), `RF-09 (${nombre}) nada se corta`);
  check(!solapa(m.vel, m.acel) && !solapa(m.vel, m.freno) && !solapa(m.vel, m.timon), `RF-09 (${nombre}) los controles no tapan el velocímetro`);
  check(m.zona && m.zona.x <= 0.5 && m.zona.w >= m.W / 3 - 1 && m.zona.b >= m.H - 0.5 && m.zona.r <= Math.max(m.W / 3, 200) + 1, `D3 (${nombre}) la zona de giro es el tercio izquierdo de abajo (${JSON.stringify(m.zona)})`);
  check(m.zona && m.zona.x <= m.timon.x && m.zona.r >= m.timon.r && m.zona.y <= m.timon.y && m.zona.b >= m.timon.b, `D3 (${nombre}) la zona de giro nunca es más chica que el timón: lo contiene`);
  await page.screenshot({ path: `${CARPETA}/${nombre}.png` });

  // RF-01 / RF-02 / RF-03: un dedo arrastra en la zona, lejos del timón
  const inicio = { id: 1, x: Math.max(8, m.zona.x + 8), y: m.zona.y + 20 };
  check(!solapa({ x: inicio.x - 4, y: inicio.y - 4, r: inicio.x + 4, b: inicio.y + 4 }, m.timon), `RF-01 (${nombre}) el dedo empieza fuera del dibujo del timón`);
  const dibujoAntes = await page.evaluate(() => document.getElementById('canvas-timon').toDataURL());
  await tocar(cdp, 'touchStart', [inicio]);
  await tocar(cdp, 'touchMove', [{ ...inicio, x: inicio.x + recorrido / 2 }]);
  await esperar(150);
  const mitad = await entradas(page);
  await tocar(cdp, 'touchMove', [{ ...inicio, x: inicio.x + recorrido }]);
  await esperar(400);
  const maximo = await entradas(page);
  const dibujoDespues = await page.evaluate(() => document.getElementById('canvas-timon').toDataURL());
  check(Math.abs(maximo.giro - 1) < 0.02, `RF-01/RF-03 (${nombre}) arrastrar ${recorrido.toFixed(0)} px en la zona da el giro máximo (${maximo.giro.toFixed(2)})`);
  check(Math.abs(mitad.giro - 0.5) < 0.05, `RF-03 (${nombre}) la mitad del recorrido da la mitad del giro (${mitad.giro.toFixed(2)})`);
  check(dibujoAntes !== dibujoDespues, `RF-02 (${nombre}) el timón dibujado gira con el arrastre en la zona`);

  const aspectoSuelto = await page.evaluate(() => { const c = getComputedStyle(document.getElementById('btn-acelerar')); return { fondo: c.backgroundColor, sombra: c.boxShadow }; });
  // RF-08: segundo dedo en ACEL mientras se gira
  const acel = { id: 2, x: (m.acel.x + m.acel.r) / 2, y: (m.acel.y + m.acel.b) / 2 };
  const girando = { ...inicio, x: inicio.x + recorrido };
  await tocar(cdp, 'touchStart', [girando, acel]);
  await esperar(250);
  const ambos = await entradas(page);
  // Se espera a que termine la transición: hundido es una escala menor a 1
  await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.getElementById('btn-acelerar')).transform).a < 0.95, null, { timeout: 3000 }).catch(() => {});
  const apretado = await page.evaluate(() => { const b = document.getElementById('btn-acelerar'), c = getComputedStyle(b); return { clase: b.classList.contains('apretado'), escala: new DOMMatrix(c.transform).a, fondo: c.backgroundColor, sombra: c.boxShadow }; });
  check(ambos.acel === 1 && Math.abs(ambos.giro - 1) < 0.02, `RF-08 (${nombre}) con dos dedos gira y acelera a la vez (${JSON.stringify(ambos)})`);
  check(apretado.clase && apretado.escala < 0.95, `RF-06 (${nombre}) ACEL apretado se ve hundido (escala ${apretado.escala.toFixed(2)})`);
  check(apretado.fondo !== aspectoSuelto.fondo || apretado.sombra !== aspectoSuelto.sombra, `RF-06 (${nombre}) ACEL apretado se ve iluminado (${apretado.fondo})`);
  check(await page.evaluate(() => window.__vibraciones > 0), `RF-07 (${nombre}) vibra al empezar a acelerar`);
  if (nombre === 'vertical') await page.screenshot({ path: `${CARPETA}/vertical_girando_y_acelerando.png` });
  // Se suelta ACEL: el giro sigue (en el CDP, touchEnd suelta los dedos que se le pasan)
  await tocar(cdp, 'touchEnd', [acel]);
  await esperar(200);
  const soloGiro = await entradas(page);
  const suelto = await page.evaluate(() => document.getElementById('btn-acelerar').classList.contains('apretado'));
  check(soloGiro.acel === 0 && Math.abs(soloGiro.giro - 1) < 0.02, `RF-08 (${nombre}) al soltar ACEL el giro sigue (${JSON.stringify(soloGiro)})`);
  check(!suelto, `RF-06 (${nombre}) al soltar ACEL vuelve a su aspecto`);
  // Un segundo dedo apoyado y levantado en la zona no endereza el timón
  const otro = { id: 3, x: inicio.x + 4, y: inicio.y + 60 };
  await tocar(cdp, 'touchStart', [otro]);
  await esperar(100);
  await tocar(cdp, 'touchEnd', [otro]);
  await esperar(200);
  const sigue = await entradas(page);
  check(Math.abs(sigue.giro - 1) < 0.02, `RF-08 (${nombre}) un segundo dedo en la zona no endereza el timón (${sigue.giro.toFixed(2)})`);
  // Al revés: con ACEL apretado se suelta el dedo que gira; el timón vuelve al centro y ACEL sigue
  const acel2 = { ...acel, id: 4 };
  await tocar(cdp, 'touchStart', [acel2]);
  await esperar(100);
  await tocar(cdp, 'touchEnd', [girando]);
  await esperar(300);
  const soloAcel = await entradas(page);
  check(soloAcel.acel === 1 && Math.abs(soloAcel.giro) < 0.02, `RF-08 (${nombre}) al soltar el giro, ACEL sigue y el timón vuelve al centro (${JSON.stringify(soloAcel)})`);
  await tocar(cdp, 'touchEnd', [acel2]);
  await esperar(150);
  // Girar y frenar a la vez; FRENO también se ve apretado
  const gira2 = { id: 5, x: inicio.x, y: inicio.y };
  const freno = { id: 6, x: (m.freno.x + m.freno.r) / 2, y: (m.freno.y + m.freno.b) / 2 };
  await tocar(cdp, 'touchStart', [gira2]);
  await tocar(cdp, 'touchMove', [{ ...gira2, x: gira2.x + recorrido }]);
  await tocar(cdp, 'touchStart', [freno]);
  await esperar(250);
  const frenando = await entradas(page);
  const frenoApretado = await page.evaluate(() => document.getElementById('btn-freno').classList.contains('apretado'));
  check(frenando.acel === -1 && Math.abs(frenando.giro - 1) < 0.02 && frenoApretado, `RF-06/RF-08 (${nombre}) gira y frena a la vez, FRENO apretado (${JSON.stringify(frenando)})`);
  await tocar(cdp, 'touchEnd', [freno]);
  await tocar(cdp, 'touchEnd', [{ ...gira2, x: gira2.x + recorrido }]);
  await esperar(150);

  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

// ── D1: en Diseño de Pistas no hay zona de giro y los botones son los de siempre ──
{
  const { ctx, page, errores } = await abrir({ width: 844, height: 390 });
  await page.evaluate(() => document.getElementById('btn-garage').click()); await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('btn-ir-pista').click()); await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById('btn-seleccionar-pista').click());
  await page.waitForTimeout(5000);
  const m = await medir(page);
  const variables = await page.evaluate(() => document.getElementById('ctrl-timon').style.getPropertyValue('--carrera-lado-pedal'));
  check(!m.zona && (!m.acel || m.acel.w === 90) && variables === '', `D1 en Diseño de Pistas no hay zona de giro y ACEL queda como siempre (${m.acel?.w} px)`);
  const reales = erroresReales(errores);
  check(reales.length === 0, 'Diseño de Pistas sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
