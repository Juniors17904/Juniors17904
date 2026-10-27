// ================================================================
// Prueba en navegador real del PRD 021 — Estilos de timón y pedales
// (parte 2 de 2; los pedales están en prueba_estilos_controles.mjs).
//   RF-06 → la galería de timones muestra 6 modelos con dibujo y nombre y se
//           ve entera en 390×844 y 844×390 (la de velocímetros sigue con 4)
//   RF-07 → Rally y Camión se ven y giran en Jugar Solo, Diseño General y
//           Diseño de Pistas → Entrar
//   RF-08 → al recargar, el timón y los pedales elegidos siguen; lo roto
//           cae en Clásico
//   RF-09 → elegir la pista Ciudad no cambia el timón ni el velocímetro;
//           quien nunca eligió velocímetro ve el Clásico (D6)
//   Sin errores de consola. Capturas en /tmp/capturas_prd021/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd021';
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
const check = (c, texto) => { const m = 'PRD 021 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));
const VERTICAL = { width: 390, height: 844 }, HORIZONTAL = { width: 844, height: 390 };

// guardado: lo que hay en tr_controles al abrir por primera vez (texto crudo; null = nada)
async function abrir(vp, guardado = null) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(g => {
    localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' }));
    if (g !== null && !sessionStorage.getItem('__prd021')) { localStorage.setItem('tr_controles', g); sessionStorage.setItem('__prd021', '1'); }
  }, guardado);
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  await espiar(page);
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, errores, cdp };
}
// Espías: qué modelo de timón se dibuja en #canvas-timon y qué velocímetro se dibuja
const espiar = page => page.evaluate(() => {
  const timon = window.RenderizadorTimon.dibujar;
  window.RenderizadorTimon.dibujar = (ctx, S, indice) => { if (ctx.canvas?.id === 'canvas-timon') window.__timon = indice; return timon(ctx, S, indice); };
  const vel = window.RenderizadorVelocimetro.dibujar.bind(window.RenderizadorVelocimetro);
  window.RenderizadorVelocimetro.dibujar = (c, cx, cy, r, f, indice = 0) => { window.__velocimetro = indice; return vel(c, cx, cy, r, f, indice); };
});
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const tocar = (cdp, tipo, dedos) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: dedos.map(d => ({ x: d.x, y: d.y, id: d.id, radiusX: 4, radiusY: 4, force: 1 })) });
const leer = page => page.evaluate(() => ({ timon: window.__timon, velocimetro: window.__velocimetro }));
const guardado = page => page.evaluate(() => localStorage.getItem('tr_controles'));

// Arrastra sobre el timón (o su zona de giro) y dice si el dibujo cambió
async function gira(page, cdp) {
  const c = await page.evaluate(() => { const e = document.getElementById('zona-giro'), z = e && getComputedStyle(e).display !== 'none' ? e : null;
    const b = (z ?? document.getElementById('canvas-timon')).getBoundingClientRect(); return { x: b.left + (z ? 8 : b.width / 2), y: b.top + (z ? 20 : b.height / 2) }; });
  const antes = await page.evaluate(() => document.getElementById('canvas-timon').toDataURL());
  const dedo = { id: 1, ...c };
  await tocar(cdp, 'touchStart', [dedo]);
  for (const dx of [20, 40, 60, 80]) { await tocar(cdp, 'touchMove', [{ ...dedo, x: c.x + dx }]); await esperar(60); }
  await esperar(300);
  const durante = await page.evaluate(() => document.getElementById('canvas-timon').toDataURL());
  await tocar(cdp, 'touchEnd', [{ ...dedo, x: c.x + 80 }]);
  return antes !== durante;
}
const ENTRAR = {
  'Jugar Solo': async page => {
    await clic(page, 'btn-solo'); await clic(page, 'btn-correr');
    await page.waitForFunction(() => document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(800);
  },
  'Diseño General': async page => { await clic(page, 'btn-garage'); await clic(page, 'btn-ir-diseno-general'); await page.waitForTimeout(5000); },
  'Diseño de Pistas → Entrar': async page => {
    await clic(page, 'btn-garage'); await clic(page, 'btn-ir-pista'); await page.waitForTimeout(300);
    await clic(page, 'btn-seleccionar-pista'); await page.waitForTimeout(5000);
  },
};

// ── RF-06: galería de 6 timones entera en los dos tamaños; la de velocímetros sigue igual ──
for (const [nombre, vp] of [['vertical', VERTICAL], ['horizontal', HORIZONTAL]]) {
  const { ctx, page, errores } = await abrir(vp);
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-controles'); await page.waitForTimeout(300);
  await page.locator('#btn-disenar-timon').click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  const tarjetas = await page.evaluate(() => [...document.querySelectorAll('#pantalla-timon-diseno .timon-card')].map(t => {
    const c = t.querySelector('canvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let pintados = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) pintados++;
    return { modelo: t.dataset.modelo, nombre: t.querySelector('.timon-nombre')?.textContent.trim(), pintados };
  }));
  check(tarjetas.map(t => t.nombre).join() === 'Clásico,Deportivo,F1,Vintage,Rally,Camión' && tarjetas.map(t => t.modelo).join() === '0,1,2,3,4,5',
    `RF-06 (${nombre}) la galería de timones muestra los 6 modelos en orden (${tarjetas.map(t => t.nombre).join(', ')})`);
  check(tarjetas.every(t => t.pintados > 200), `RF-06 (${nombre}) cada timón tiene su dibujo (${tarjetas.map(t => t.pintados).join('/')} px pintados)`);
  const firmas = await page.evaluate(() => [...document.querySelectorAll('#pantalla-timon-diseno canvas')].map(c => c.toDataURL()));
  check(new Set(firmas).size === 6, `RF-06 (${nombre}) los 6 dibujos son distintos`);
  const entera = await page.evaluate(() => {
    const W = innerWidth, H = innerHeight, malas = [];
    for (const t of document.querySelectorAll('#pantalla-timon-diseno .timon-card')) {
      t.scrollIntoView({ block: 'nearest' });
      const b = t.getBoundingClientRect(), encima = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
      if (b.left < -0.5 || b.top < -0.5 || b.right > W + 0.5 || b.bottom > H + 0.5 || !t.contains(encima)) malas.push(t.textContent.trim());
    }
    return { malas, anchoPagina: document.documentElement.scrollWidth <= W + 0.5 };
  });
  check(!entera.malas.length && entera.anchoPagina, `RF-06 (${nombre}) la galería de timones se ve entera ${JSON.stringify(entera)}`);
  await page.evaluate(() => document.getElementById('pantalla-timon-diseno').scrollTo(0, 0));
  await page.screenshot({ path: `${CARPETA}/galeria_timones_${nombre}.png` });
  const velocimetros = await page.evaluate(() => document.querySelectorAll('#pantalla-velocimetro-diseno .velocimetro-card').length);
  check(velocimetros === 4, `RF-06 (${nombre}) la galería de velocímetros sigue con 4 modelos`);
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) galería de timones sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

// ── RF-07: Rally y Camión se ven y giran en las 3 pantallas del timón ──
for (const [clave, indice] of [['rally', 4], ['camion', 5]]) {
  for (const [pantalla, entrar] of Object.entries(ENTRAR)) {
    const { ctx, page, errores, cdp } = await abrir(VERTICAL, JSON.stringify({ timon: clave, pedales: 'clasicos' }));
    await entrar(page);
    const visto = await leer(page);
    check(visto.timon === indice, `RF-07 ${clave} se ve en ${pantalla} (modelo dibujado ${visto.timon})`);
    check(await gira(page, cdp), `RF-07 ${clave} gira en ${pantalla}`);
    const archivo = { 'Jugar Solo': 'solo', 'Diseño General': 'diseno_general', 'Diseño de Pistas → Entrar': 'diseno_pistas' }[pantalla];
    await page.screenshot({ path: `${CARPETA}/timon_${clave}_${archivo}.png` });
    const reales = erroresReales(errores);
    check(reales.length === 0, `RF-07 ${clave} en ${pantalla} sin errores de consola ` + reales.join(' | '));
    await ctx.close();
  }
}

// ── RF-08: elegir en las galerías, recargar y seguir igual; lo roto cae en Clásico ──
{
  const { ctx, page, errores } = await abrir(VERTICAL);
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-controles'); await clic(page, 'btn-disenar-timon');
  await page.locator('#pantalla-timon-diseno .timon-card[data-modelo="4"]').click();
  await page.waitForTimeout(300);
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-controles'); await clic(page, 'btn-disenar-pedales');
  await page.locator('#pantalla-pedales-diseno .pedales-card[data-pedales="retro"]').click();
  await page.waitForTimeout(300);
  check(await guardado(page) === JSON.stringify({ timon: 'rally', pedales: 'retro' }), `RF-08 lo elegido se guarda por su clave (${await guardado(page)})`);
  await page.reload(); await page.waitForTimeout(2000); await espiar(page);
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-controles'); await clic(page, 'btn-disenar-timon');
  const timonMarcado = await page.evaluate(() => [...document.querySelectorAll('#pantalla-timon-diseno .timon-card.sel')].map(t => t.dataset.modelo).join());
  await clic(page, 'btn-volver-timon-diseno'); await clic(page, 'btn-disenar-pedales');
  const pedalesMarcados = await page.evaluate(() => [...document.querySelectorAll('#pantalla-pedales-diseno .pedales-card.sel')].map(t => t.dataset.pedales).join());
  check(timonMarcado === '4' && pedalesMarcados === 'retro', `RF-08 después de recargar siguen marcados Rally y Retro (${timonMarcado}/${pedalesMarcados})`);
  await clic(page, 'btn-volver-pedales-diseno'); await clic(page, 'btn-volver-controles'); await clic(page, 'btn-volver-ajustes');
  await ENTRAR['Jugar Solo'](page);
  const visto = await leer(page);
  const clases = await page.evaluate(() => document.getElementById('btn-acelerar').className);
  check(visto.timon === 4 && clases.includes('pedales-retro'), `RF-08 después de recargar Jugar Solo usa Rally y Retro (${visto.timon}, ${clases})`);
  const reales = erroresReales(errores);
  check(reales.length === 0, 'RF-08 sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}
for (const roto of ['{roto', JSON.stringify({ timon: 'nave', pedales: 'cohete' }), '"texto"']) {
  const { ctx, page, errores } = await abrir(VERTICAL, roto);
  await ENTRAR['Jugar Solo'](page);
  const visto = await leer(page);
  const clases = await page.evaluate(() => document.getElementById('btn-acelerar').className);
  check(visto.timon === 0 && clases.includes('pedales-clasicos'), `RF-08 lo guardado roto (${roto}) cae en Clásico (timón ${visto.timon}, ${clases})`);
  const reales = erroresReales(errores);
  check(reales.length === 0, `RF-08 (${roto}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

// ── RF-09 / D6: elegir la pista Ciudad no cambia el timón ni el velocímetro ──
for (const eligeVelocimetro of [true, false]) {
  const { ctx, page, errores } = await abrir(HORIZONTAL);
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-controles'); await clic(page, 'btn-disenar-timon');
  await page.locator('#pantalla-timon-diseno .timon-card[data-modelo="5"]').click();
  await page.waitForTimeout(300);
  await clic(page, 'btn-garage');
  if (eligeVelocimetro) {
    await clic(page, 'btn-ir-velocimetro');
    await page.evaluate(() => document.querySelector('.velocimetro-card[data-modelo="1"]').click());
  }
  await clic(page, 'btn-ir-pista'); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.pista-card[data-pista="ciudad"]').click());
  await page.waitForTimeout(300);
  await clic(page, 'btn-seleccionar-pista'); await page.waitForTimeout(5000);
  const visto = await leer(page);
  const esperado = eligeVelocimetro ? 1 : 0;
  check(visto.timon === 5, `RF-09 ${eligeVelocimetro ? '' : '(sin velocímetro elegido) '}tras elegir Ciudad el timón sigue siendo Camión (${visto.timon})`);
  check(visto.velocimetro === esperado, eligeVelocimetro
    ? `RF-09 tras elegir Ciudad el velocímetro sigue siendo el elegido (${visto.velocimetro})`
    : `D6 quien nunca eligió velocímetro ve el Clásico en Diseño de Pistas, no el F1 (${visto.velocimetro})`);
  if (eligeVelocimetro) await page.screenshot({ path: `${CARPETA}/ciudad_camion.png` });
  const reales = erroresReales(errores);
  check(reales.length === 0, 'RF-09 sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
