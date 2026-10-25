// ================================================================
// Prueba en navegador real del PRD 015 — Jugar Solo en vertical y en horizontal.
//   RF-01 → en vertical, la columna de siempre (hasta 480 px)
//   RF-02 → en horizontal, la pista ocupa toda la pantalla
//   RF-03 → en horizontal: HUD arriba, timón abajo a la izquierda, ACEL/FRENO abajo
//           a la derecha con el velocímetro encima; nada se corta ni se tapa
//   RF-05 → al girar en plena carrera sigue el mismo carro, en el mismo lugar, el
//           cronómetro y los rivales siguen
//   RF-06 → después de girar, ACEL y el timón reciben el toque
//   RF-07 → el panel de resultado se ve entero en horizontal (o se desplaza)
//   RF-08 → en PC con la ventana más ancha que alta, diseño horizontal
//   RF-09 → no hay aviso de "gira tu celular" ni su estilo
//   Sin errores de consola (lección 8). Capturas en /tmp/capturas_prd015/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd015';
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
const check = (c, texto) => { const m = 'PRD 015 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });

async function abrir(vp, movil) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: movil, isMobile: movil });
  await ctx.addInitScript(() => localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' })));
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  // Espías: el carro del jugador, el último tiempo del cronómetro y el velocímetro dibujado
  await page.evaluate(async () => {
    const { Carro } = await import('/src/model/carros/carro.js');
    const actualizar = Carro.prototype.actualizar;
    window.__carros = new Set();
    Carro.prototype.actualizar = function (dt) { window.__carros.add(this); return actualizar.call(this, dt); };
    const formatear = window.Cronometro.prototype.formatear;
    window.Cronometro.prototype.formatear = function (ms) { window.__tiempo = ms; return formatear.call(this, ms); };
    const dibujar = window.RenderizadorVelocimetro.dibujar.bind(window.RenderizadorVelocimetro);
    window.RenderizadorVelocimetro.dibujar = (ctx, cx, cy, r, ...resto) => { window.__velocimetro = { cx, cy, r }; return dibujar(ctx, cx, cy, r, ...resto); };
  });
  return { ctx, page, errores };
}

// Medidas de la pantalla: diseño, ancho de la pista y del HUD, cajas de los controles y del velocímetro
const medir = page => page.evaluate(() => {
  const caja = id => { const e = document.getElementById(id); if (!e || getComputedStyle(e).display === 'none') return null;
    const b = e.getBoundingClientRect(); return b.width > 0 ? { x: b.left, y: b.top, r: b.right, b: b.bottom } : null; };
  const v = window.__velocimetro;
  return {
    W: innerWidth, H: innerHeight,
    diseno: document.getElementById('pantalla-carrera-solo').dataset.diseno,
    pista: document.getElementById('canvas-carrera-solo').getBoundingClientRect().width,
    hud: document.getElementById('canvas-hud-carrera-solo').getBoundingClientRect().width,
    columna: document.querySelector('.columna-carrera-solo').getBoundingClientRect(),
    timon: caja('canvas-timon'), acel: caja('btn-acelerar'), freno: caja('btn-freno'),
    vel: v ? { x: v.cx - v.r, y: v.cy - v.r, r: v.cx + v.r, b: v.cy + v.r } : null,
  };
});
const dentro = (b, W, H) => b && b.x >= -0.5 && b.y >= -0.5 && b.r <= W + 0.5 && b.b <= H + 0.5;
const solapa = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;

// ── RF-01, RF-02, RF-03, RF-05, RF-06: vertical → horizontal en plena carrera ──
{
  const { ctx, page, errores } = await abrir({ width: 390, height: 844 }, true);
  await page.evaluate(() => document.getElementById('btn-solo').click());
  const ya = await page.waitForFunction(() => (window.__tiempo ?? 0) > 500, null, { timeout: 20000 }).then(() => true, () => false);
  check(ya, 'la carrera arranca');
  const v = await medir(page);
  check(v.diseno === 'vertical' && v.pista === 390 && v.columna.width === 390, `RF-01 en vertical, la columna de siempre (${v.diseno}, pista ${v.pista} px)`);
  await page.screenshot({ path: `${CARPETA}/vertical.png` });

  // En plena carrera: acelerar, tomar la foto del estado y girar
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1500);
  const antes = await page.evaluate(() => {
    const carros = [...window.__carros], jugador = carros.find(c => c.entradaAcel === 1) ?? carros[0];
    window.__jugador = jugador;
    return { tiempo: window.__tiempo, x: jugador.px, z: jugador.pz, carros: carros.length, rivales: carros.filter(c => c !== jugador).map(c => [c.px, c.pz]) };
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);
  const justo = await page.evaluate(() => ({ x: window.__jugador.px, z: window.__jugador.pz, tiempo: window.__tiempo }));
  await page.waitForTimeout(1500);
  const despues = await page.evaluate(() => {
    const carros = [...window.__carros], j = window.__jugador;
    return { tiempo: window.__tiempo, x: j.px, z: j.pz, vel: j.velocidad, mismo: carros.includes(j),
      rivales: carros.filter(c => c !== j).map(c => [c.px, c.pz]), pantalla: document.querySelector('.pantalla.activa')?.id };
  });
  await page.keyboard.up('ArrowUp');
  const salto = Math.hypot(justo.x - antes.x, justo.z - antes.z);
  const avanzaron = despues.rivales.filter((p, i) => antes.rivales[i] && Math.hypot(p[0] - antes.rivales[i][0], p[1] - antes.rivales[i][1]) > 1).length;
  check(despues.pantalla === 'pantalla-carrera-solo' && despues.mismo && despues.tiempo > antes.tiempo + 1500,
    `RF-05 al girar sigue la carrera, el mismo carro y el cronómetro (${antes.tiempo.toFixed(0)} → ${despues.tiempo.toFixed(0)} ms)`);
  check(salto < 25 && Math.hypot(despues.x - antes.x, despues.z - antes.z) > 1,
    `RF-05 el carro sigue desde donde estaba (en 300 ms avanzó ${salto.toFixed(1)} m, sin saltos) y sigue andando`);
  check(antes.rivales.length === 4 && avanzaron === 4, `RF-05 los 4 rivales siguen corriendo (${avanzaron} de ${antes.rivales.length} avanzaron)`);

  const h = await medir(page);
  check(h.diseno === 'horizontal' && h.pista === 844 && h.hud === 844 && h.columna.width === 844,
    `RF-02 en horizontal la pista y el HUD ocupan toda la pantalla (${h.diseno}, pista ${h.pista}, HUD ${h.hud})`);
  check(h.timon && h.timon.r <= h.W / 2 && h.timon.b >= h.H - 200, 'RF-03 el timón queda abajo a la izquierda');
  check(h.acel && h.freno && h.acel.x >= h.W / 2 && h.freno.x >= h.W / 2 && h.freno.b >= h.H - 80, 'RF-03 ACEL y FRENO quedan abajo a la derecha');
  check(h.vel && h.vel.x >= h.W / 2 && h.vel.b <= h.acel.y + 1, `RF-03 el velocímetro queda a la derecha, encima de ACEL (${JSON.stringify(h.vel)})`);
  check([h.timon, h.acel, h.freno, h.vel].every(b => dentro(b, h.W, h.H)), 'RF-03 nada se corta');
  check(!solapa(h.vel, h.acel) && !solapa(h.vel, h.timon) && !solapa(h.timon, h.acel), 'RF-03 nada se tapa');
  // RF-06: lo que se toca en el diseño nuevo es el control
  const toque = await page.evaluate(({ acel, timon }) => {
    const en = b => document.elementFromPoint((b.x + b.r) / 2, (b.y + b.b) / 2)?.id;
    return { acel: en(acel), timon: en(timon) };
  }, { acel: h.acel, timon: h.timon });
  check(toque.acel === 'btn-acelerar' && toque.timon === 'canvas-timon', `RF-06 después de girar, ACEL y el timón reciben el toque (${JSON.stringify(toque)})`);
  await page.screenshot({ path: `${CARPETA}/horizontal_despues_de_girar.png` });

  // RF-07: el panel de resultado en horizontal
  await page.evaluate(() => {
    const o = window.CarreraVueltas.prototype.actualizar;
    window.CarreraVueltas.prototype.actualizar = function (...a) { o.apply(this, a); return 'meta'; };
  });
  await page.waitForTimeout(1200);
  const panel = await page.evaluate(() => {
    const p = document.getElementById('resultado-carrera-solo');
    const visible = getComputedStyle(p).display !== 'none';
    const botones = ['btn-revancha-solo', 'btn-menu-solo'].map(id => {
      const e = document.getElementById(id); e.scrollIntoView({ block: 'nearest' });
      const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === e;
    });
    return { visible, botones, desplaza: getComputedStyle(p).overflowY };
  });
  check(panel.visible && panel.botones.every(Boolean), `RF-07 en horizontal el panel de resultado deja tocar Revancha y Menú (${JSON.stringify(panel)})`);
  await page.screenshot({ path: `${CARPETA}/horizontal_resultado.png` });
  await page.click('#btn-menu-solo');
  await page.waitForTimeout(500);
  const fin = await page.evaluate(() => ({ act: document.querySelector('.pantalla.activa')?.id, diseno: document.getElementById('pantalla-carrera-solo').dataset.diseno ?? null }));
  check(fin.act === 'pantalla-inicio' && fin.diseno === null, `al salir, la pantalla deja de tener diseño (${JSON.stringify(fin)})`);
  // De vuelta a vertical: los controles de las demás pantallas no quedan con el estilo horizontal (D1)
  const otros = await page.evaluate(() => { const t = document.getElementById('ctrl-timon'); return getComputedStyle(t).transform; });
  check(otros === 'none' || otros === 'matrix(1, 0, 0, 1, 0, 0)', `D1 fuera de la carrera, los controles no quedan con el estilo de la carrera (${otros})`);
  const reales = erroresReales(errores);
  check(reales.length === 0, 'giro en plena carrera sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

// ── RF-08: PC con la ventana más ancha que alta ──
{
  const { ctx, page, errores } = await abrir({ width: 1280, height: 960 }, false);
  await page.evaluate(() => document.getElementById('btn-solo').click());
  await page.waitForTimeout(5000);
  const pc = await medir(page);
  check(pc.diseno === 'horizontal' && pc.pista === 1280, `RF-08 en PC 1280×960 se usa el diseño horizontal (${pc.diseno}, pista ${pc.pista} px)`);
  await page.screenshot({ path: `${CARPETA}/pc_1280.png` });
  // RF-09: sin aviso de "gira tu celular" ni su estilo
  const aviso = await page.evaluate(() => {
    const reglas = [];
    for (const hoja of document.styleSheets) { try { for (const r of hoja.cssRules) reglas.push(r.cssText); } catch { /* hoja externa */ } }
    return { elemento: !!document.getElementById('pantalla-rotar'), estilo: reglas.some(t => /pantalla-rotar|rotar-icono|balanceo/.test(t)) };
  });
  check(!aviso.elemento && !aviso.estilo, `RF-09 no hay aviso de "gira tu celular" ni su estilo (${JSON.stringify(aviso)})`);
  const reales = erroresReales(errores);
  check(reales.length === 0, 'PC sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
