// ================================================================
// Prueba en navegador real del PRD 012 — Relieves y espesores del piso.
//   RF-01..06 → en las 5 pantallas el piso lo dibuja ConstructorPisoPista: grupo
//               'pisoPista' con sus 7 mallas (asfalto, pianos, bordes, central, meta)
//   RF-03     → el carro va a la altura del asfalto (MedidasEscena.alturaAsfalto)
//   RF-09     → capturas de cerca y con la cámara aérea (donde existe) para revisar parpadeo
//   Sin errores de consola (lección 8)
// Espía ConstructorPisoPista.construir (mismo módulo que usan los visores).
// Capturas: /tmp/piso_<pantalla>.png y /tmp/piso_<pantalla>_aerea.png
// ================================================================
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
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
const check = (c, m) => { if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const reales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const MALLAS = ['asfalto', 'pianoRojo', 'pianoBlanco', 'lineasBorde', 'lineaCentral', 'metaBlanca', 'metaNegra'];

const PANTALLAS = [
  { nombre: 'jugar_solo',        pasos: ['btn-solo'], espera: 7000, vertical: true },
  { nombre: 'diseno_general',    pasos: ['btn-garage', 'btn-ir-diseno-general'], espera: 5000 },
  { nombre: 'diseno_pistas',     pasos: ['btn-garage', 'btn-ir-pista', '.pista-card[data-pista="ciudad"]', 'btn-seleccionar-pista'], espera: 4500, aerea: true },
  { nombre: 'test_drive_ruta',   pasos: ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-con-ruta'], espera: 4500, aerea: true },
  { nombre: 'test_drive_recto',  pasos: ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-simple'], espera: 4500 },
];

for (const p of PANTALLAS) {
  const page = await browser.newPage({ viewport: p.vertical ? { width: 390, height: 844 } : { width: 844, height: 390 } });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(1500);
  await page.evaluate(async () => {
    const { ConstructorPisoPista } = await import('/src/view/pistas/comun/constructor_piso_pista.js');
    const construir = ConstructorPisoPista.prototype.construir;
    window.__pisos = [];
    ConstructorPisoPista.prototype.construir = function () { const g = construir.call(this); window.__pisos.push(g); return g; };
  });
  for (const paso of p.pasos) {
    if (paso.startsWith('.')) await page.evaluate(s => document.querySelector(s).click(), paso);
    else await clic(page, paso);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(p.espera);

  const r = await page.evaluate(() => {
    const g = window.__pisos?.[window.__pisos.length - 1];
    const h = new window.MedidasEscena().alturaAsfalto;
    const escena = g?.parent;
    // El carro: el grupo de la escena que se dibuja a la altura del asfalto y tiene hijos
    const carro = escena?.children.find(c => c !== g && c.isGroup && c.children.length && Math.abs(c.position.y - h) < 1e-6);
    return { nombre: g?.name, enEscena: !!escena, mallas: g ? g.children.map(m => m.name) : [], carroY: carro?.position.y ?? null, h };
  });
  check(r.nombre === 'pisoPista' && r.enEscena, `PRD 012 RF-08 ${p.nombre}: el piso lo dibuja ConstructorPisoPista y está en la escena`);
  check(MALLAS.every(m => r.mallas.includes(m)), `PRD 012 RF-01..06 ${p.nombre}: asfalto, pianos, bordes, línea central y meta (${r.mallas})`);
  check(r.carroY !== null && Math.abs(r.carroY - r.h) < 1e-6, `PRD 012 RF-03 ${p.nombre}: el carro va a la altura del asfalto (${r.carroY})`);
  await page.screenshot({ path: `/tmp/piso_${p.nombre}.png` });

  if (p.aerea) {
    await clic(page, 'btn-cam-aerea');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/piso_${p.nombre}_aerea.png` });
  }
  check(reales(errores).length === 0, `${p.nombre}: sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
