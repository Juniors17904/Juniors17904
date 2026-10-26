// ================================================================
// Prueba en navegador real del PRD 020 — Récords por pista.
//   RF-06 → en "Preparar carrera" se ve "Sin récord todavía" y, después, el récord de la pista elegida
//   RF-01/RF-07/RF-08 → al terminar las 3 vueltas: récord nuevo, "¡Nuevo récord!" y el récord en el resultado
//   RF-04 → una meta sin las 3 vueltas no cambia el récord ni muestra el aviso; Revancha limpia el aviso
//   RF-05 → tras recargar sigue el récord, y otra pista sigue sin récord
//   RF-09 → el texto entra en 390×844 y 844×390, y "Preparar carrera" se sigue viendo completa
//   Sin errores de consola. Capturas en /tmp/capturas_prd020/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd020';
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
const check = (c, texto) => { const m = 'PRD 020 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));

async function abrir(ctx) {
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  return { page, errores };
}
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const elegir = (page, contenedor, clave) => page.evaluate(([c, k]) => document.querySelector(`#${c} .opcion-carrera[data-clave="${k}"]`).click(), [contenedor, clave]);
const textoRecord = page => page.evaluate(() => document.getElementById('record-pista')?.textContent ?? '');
const esperarCarrera = page => page.waitForFunction(() => document.querySelector('.pantalla.activa')?.id === 'pantalla-carrera-solo'
  && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 25000 }).then(() => true, () => false);
// Fuerza los eventos de la carrera del jugador, uno cada 0,4 s: así hay tiempos de vuelta de verdad
const forzar = (page, eventos) => page.evaluate(lista => {
  const o = window.__actualizarOriginal ?? window.CarreraVueltas.prototype.actualizar;
  window.__actualizarOriginal = o;
  window.__eventos = [...lista]; window.__siguiente = performance.now() + 400;
  window.CarreraVueltas.prototype.actualizar = function (...a) {
    const r = o.apply(this, a);
    if (this.totalVueltas === 3 && window.__eventos.length && performance.now() > window.__siguiente) { window.__siguiente = performance.now() + 400; return window.__eventos.shift(); }
    return r;
  };
}, eventos);
const resultado = page => page.evaluate(() => {
  const vis = c => { const e = document.querySelector('#resultado-carrera-solo ' + c); return e && getComputedStyle(e).display !== 'none' ? e : null; };
  const nuevo = vis('.resultado-carrera-nuevo-record'), linea = vis('.resultado-carrera-record');
  const caja = linea?.getBoundingClientRect();
  return { panel: getComputedStyle(document.getElementById('resultado-carrera-solo')).display !== 'none', nuevo: nuevo?.textContent ?? '', record: linea?.textContent ?? '',
    dentro: !!caja && caja.left >= 0 && caja.right <= innerWidth + 0.5 && caja.width > 0 };
});

for (const [nombre, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' }));
    if (!localStorage.getItem('__prueba_limpia')) { localStorage.removeItem('tr_records'); localStorage.removeItem('tr_carrera'); localStorage.setItem('__prueba_limpia', '1'); }   // solo al abrir el contexto, no al recargar
  });
  let { page, errores } = await abrir(ctx);
  await clic(page, 'btn-solo'); await esperar(300);
  await elegir(page, 'opciones-modo', 'contrarreloj');
  await elegir(page, 'opciones-pista', 'ciudad');
  check(await textoRecord(page) === 'Sin récord todavía', `RF-06 (${nombre}) sin carreras: "Sin récord todavía"`);
  // RF-09: el texto y toda la pantalla entran
  const cajas = await page.evaluate(() => ['record-pista', 'opciones-modo', 'opciones-pista', 'btn-correr', 'btn-volver-preparar'].map(i => {
    const b = document.getElementById(i).getBoundingClientRect(); return { i, ok: b.width > 0 && b.left >= 0 && b.right <= innerWidth + 0.5 && b.top >= 0 && b.bottom <= innerHeight + 0.5 }; }));
  check(cajas.every(c => c.ok), `RF-09 (${nombre}) el récord y "Preparar carrera" se ven completos (${cajas.filter(c => !c.ok).map(c => c.i)})`);

  // RF-01/RF-07/RF-08: 3 vueltas completas → récord nuevo
  await clic(page, 'btn-correr');
  check(await esperarCarrera(page), `(${nombre}) la carrera arranca`);
  await forzar(page, ['vuelta', 'vuelta', 'meta']);
  await page.waitForFunction(() => getComputedStyle(document.getElementById('resultado-carrera-solo')).display !== 'none', null, { timeout: 10000 }).catch(() => {});
  await esperar(300);
  const r1 = await resultado(page);
  check(r1.panel && r1.nuevo === '¡Nuevo récord!', `RF-01/RF-08 (${nombre}) la primera carrera terminada es "¡Nuevo récord!" (${r1.nuevo})`);
  check(/^Récord \d+:\d\d\.\d\d · Mejor vuelta \d+:\d\d\.\d\d$/.test(r1.record) && r1.dentro, `RF-07/RF-09 (${nombre}) el resultado muestra el récord, completo (${r1.record})`);
  await page.screenshot({ path: `${CARPETA}/resultado_${nombre}.png` });

  // RF-04: Revancha limpia el aviso; una meta sin las 3 vueltas no cambia el récord
  await clic(page, 'btn-revancha-solo');
  await esperar(400);
  const limpio = await page.evaluate(() => getComputedStyle(document.querySelector('#resultado-carrera-solo .resultado-carrera-nuevo-record')).display === 'none');
  check(limpio, `D5 (${nombre}) con Revancha desaparece el aviso viejo`);
  check(await esperarCarrera(page), `(${nombre}) la revancha arranca`);
  await forzar(page, ['meta']);
  await page.waitForFunction(() => getComputedStyle(document.getElementById('resultado-carrera-solo')).display !== 'none', null, { timeout: 10000 }).catch(() => {});
  await esperar(300);
  const r2 = await resultado(page);
  check(r2.panel && r2.nuevo === '' && r2.record === r1.record, `RF-04 (${nombre}) una meta sin las 3 vueltas no cambia el récord ni muestra el aviso`);

  // RF-05/RF-06: tras recargar sigue el récord; otra pista no tiene
  await page.close();
  ({ page, errores } = await abrir(ctx));
  await clic(page, 'btn-solo'); await esperar(300);
  await elegir(page, 'opciones-pista', 'ciudad');
  const enCiudad = await textoRecord(page);
  check(enCiudad === r1.record, `RF-05/RF-06 (${nombre}) tras recargar, "Preparar carrera" muestra el récord de la pista (${enCiudad})`);
  await page.screenshot({ path: `${CARPETA}/preparar_${nombre}.png` });
  await elegir(page, 'opciones-pista', 'costa');
  check(await textoRecord(page) === 'Sin récord todavía', `RF-06 (${nombre}) al cambiar de pista cambia el texto: otra pista sin récord`);
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
