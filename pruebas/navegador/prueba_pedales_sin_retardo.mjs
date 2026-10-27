// ================================================================
// Prueba en navegador real del PRD 024 — Acelerar y frenar sin retardo.
// Toques reales con pantalla táctil (Input.dispatchTouchEvent de Chrome).
//   RF-01/RF-02 → deslizar el dedo de ACEL a FRENO frena y lo muestra apretado; de vuelta acelera
//   RF-03 → al levantar el dedo deja de acelerar o frenar
//   RF-04 → deslizar entre pedales no corta el giro de otro dedo
//   RF-09 → del toque a que cambia la velocidad pasa como mucho un cuadro, también con la CPU lenta
//           (se cuenta desde que el pedal llega al visor; lo que tarda Chrome en entregar el
//           toque no depende del juego, por eso se espera el estado en vez de un tiempo fijo)
//   Sin errores de consola. Capturas en /tmp/capturas_prd024/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd024';
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
const check = (c, texto) => { const m = 'PRD 024 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
// "Ignored attempt to cancel…": aviso de Chrome cuando entrega un toque sin poder cancelarlo (CPU lenta), no un error del juego
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404|Ignored attempt to cancel a touch\w* event with cancelable=false/.test(t));
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
  await page.evaluate(() => {
    const iniciar = window.VisorCarreraSolo.prototype.iniciar;
    window.VisorCarreraSolo.prototype.iniciar = function (...a) { window.__visor = this; return iniciar.apply(this, a); };
    // Una muestra por cuadro dibujado, después de mover el carro: hora, velocidad y pasos de física
    const alActualizar = window.VisorCarreraSolo.prototype.alActualizar;
    window.VisorCarreraSolo.prototype.alActualizar = function (fn) {
      return alActualizar.call(this, (...a) => { const r = fn(...a); (window.__muestras ??= []).push([performance.now(), this.velocidad, this.pasosUltimoFrame]); return r; });
    };
    // Cuándo cambia el pedal en el visor: desde ahí se cuentan los cuadros (el toque ya llegó)
    const pedal = Object.getOwnPropertyDescriptor(window.VisorCarreraSolo.prototype, 'entradaAcel');
    Object.defineProperty(window.VisorCarreraSolo.prototype, 'entradaAcel', { configurable: true, get: pedal.get,
      set(v) { if (Number(v) !== pedal.get.call(this)) window.__toque = performance.now(); pedal.set.call(this, v); } });
  });
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, errores, cdp };
}

const tocar = (cdp, tipo, dedos) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: dedos.map(d => ({ x: d.x, y: d.y, id: d.id, radiusX: 4, radiusY: 4, force: 1 })) });
const caja = (page, id) => page.evaluate(i => { const b = document.getElementById(i).getBoundingClientRect(); return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 }; }, id);
const esperarEstado = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 4000 }).catch(() => {});
const entradas = page => page.evaluate(() => ({ giro: window.__visor.entradaDireccion, acel: window.__visor.entradaAcel,
  acelApretado: document.getElementById('btn-acelerar').classList.contains('apretado'), frenoApretado: document.getElementById('btn-freno').classList.contains('apretado') }));
// Cuadros desde el toque hasta que la velocidad cambia en el sentido pedido (+1 sube, -1 baja)
const cuadrosHastaCambio = (page, sentido) => page.evaluate(s => {
  const m = window.__muestras, t = window.__toque;
  const i0 = m.findIndex(x => x[0] >= t);
  if (i0 < 1) return null;
  for (let i = i0; i < m.length; i++) if ((m[i][1] - m[i - 1][1]) * s > 1e-6) return { cuadros: i - i0 + 1, pasosMax: Math.max(...m.slice(i0, i + 1).map(x => x[2])) };
  return null;
}, sentido);

for (const [nombre, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const { ctx, page, errores, cdp } = await abrir(vp);
  await page.evaluate(() => { document.getElementById('btn-solo').click(); document.getElementById('btn-correr').click(); });
  await page.waitForFunction(() => window.__visor && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 25000 }).catch(() => {});
  await esperar(500);
  const acel = { id: 1, ...(await caja(page, 'btn-acelerar')) }, freno = await caja(page, 'btn-freno');

  // RF-09: del toque en ACEL a que sube la velocidad
    await tocar(cdp, 'touchStart', [acel]);
  await esperarEstado(page, () => window.__visor.entradaAcel === 1);
  await esperar(500);
  const arranque = await cuadrosHastaCambio(page, +1);
  check(arranque && arranque.cuadros <= 1, `RF-09 (${nombre}) ACEL cambia la velocidad en el primer cuadro (${JSON.stringify(arranque)})`);
  await esperar(800);

  // RF-01/RF-02: deslizar a FRENO sin levantar el dedo
  await tocar(cdp, 'touchMove', [{ ...acel, x: (acel.x + freno.x) / 2, y: (acel.y + freno.y) / 2 }]);
  await tocar(cdp, 'touchMove', [{ ...acel, x: freno.x, y: freno.y }]);
  await esperarEstado(page, () => window.__visor.entradaAcel === -1);
  await esperar(500);
  const enFreno = await entradas(page);
  const frenada = await cuadrosHastaCambio(page, -1);
  check(enFreno.acel === -1 && enFreno.frenoApretado && !enFreno.acelApretado, `RF-01/RF-02 (${nombre}) deslizar a FRENO frena y lo muestra apretado (${JSON.stringify(enFreno)})`);
  check(frenada && frenada.cuadros <= 1, `RF-09 (${nombre}) al llegar a FRENO la velocidad baja en el primer cuadro (${JSON.stringify(frenada)})`);
  if (nombre === 'vertical') await page.screenshot({ path: `${CARPETA}/deslizar_a_freno.png` });
  await tocar(cdp, 'touchMove', [acel]);
  await esperarEstado(page, () => window.__visor.entradaAcel === 1);
  await esperar(100);
  const deVuelta = await entradas(page);
  check(deVuelta.acel === 1 && deVuelta.acelApretado && !deVuelta.frenoApretado, `RF-01 (${nombre}) deslizar de vuelta acelera (${JSON.stringify(deVuelta)})`);

  // RF-04: un dedo girando no se corta al deslizar entre pedales
  const zona = await page.evaluate(() => { const b = document.getElementById('zona-giro').getBoundingClientRect(); return { x: b.left + 20, y: b.top + 40 }; });
  const giro = { id: 2, ...zona };
  await tocar(cdp, 'touchStart', [giro]);
  await tocar(cdp, 'touchMove', [{ ...giro, x: giro.x + 120 }]);
  await tocar(cdp, 'touchMove', [{ ...acel, x: freno.x, y: freno.y }]);
  await esperarEstado(page, () => window.__visor.entradaAcel === -1 && window.__visor.entradaDireccion > 0.5);
  const ambos = await entradas(page);
  check(ambos.acel === -1 && ambos.giro > 0.5, `RF-04 (${nombre}) deslizar a FRENO no corta el giro (${JSON.stringify(ambos)})`);
  await tocar(cdp, 'touchEnd', [{ ...giro, x: giro.x + 120 }]);

  // RF-03: al levantar el dedo (sobre FRENO) deja de frenar y los dos se ven sueltos
  await tocar(cdp, 'touchEnd', [{ ...acel, x: freno.x, y: freno.y }]);
  await esperarEstado(page, () => window.__visor.entradaAcel === 0 && !document.querySelector('.apretado'));
  const suelto = await entradas(page);
  check(suelto.acel === 0 && !suelto.acelApretado && !suelto.frenoApretado, `RF-03 (${nombre}) al levantar el dedo deja de acelerar y frenar (${JSON.stringify(suelto)})`);

  // RF-09 con pocas imágenes por segundo (CPU 6 veces más lenta)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await esperar(500);
    await tocar(cdp, 'touchStart', [acel]);
  await esperarEstado(page, () => window.__visor.entradaAcel === 1);
  await esperar(1500);
  const lento = await cuadrosHastaCambio(page, +1);
  check(lento && lento.cuadros <= 1, `RF-09 (${nombre}) con la CPU lenta también cambia en el primer cuadro (${JSON.stringify(lento)})`);
  await tocar(cdp, 'touchEnd', [acel]);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
