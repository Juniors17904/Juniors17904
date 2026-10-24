// ================================================================
// Prueba en navegador real del PRD 007 — Carros con personalidad.
//   RF-08 → el garaje muestra 3 barras del carro marcado y cambian al marcar otro
//   RF-09 → las barras se ven completas en vertical y horizontal, sin tapar carros ni botones
//   RF-02 → la carrera usa la física del carro GUARDADO con "Seleccionar"
//   Sin errores de consola (lección 8)
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
const marcar = (page, tipo) => page.evaluate(t => document.querySelector(`.carro-card[data-tipo="${t}"]`).click(), tipo);
const barras = page => page.evaluate(() => [...document.querySelectorAll('#barras-carro .barra-carro')]
  .map(b => ({ nombre: b.querySelector('.barra-carro-nombre').textContent, valor: Number(b.dataset.valor) })));

// Rectángulos para revisar que nada se tape ni se salga de la pantalla
const geometria = page => page.evaluate(() => {
  const r = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, x2: b.right, y2: b.bottom }; };
  return {
    barras: r(document.getElementById('barras-carro')),
    rellenos: [...document.querySelectorAll('.barra-carro-relleno')].map(e => e.getBoundingClientRect().height),
    tarjetas: [...document.querySelectorAll('.carro-card')].map(r),
    boton: r(document.getElementById('btn-ver-carro')),
    volver: r(document.getElementById('btn-volver-garage')),
    ancho: innerWidth, alto: innerHeight,
  };
});
const cruzan = (a, b) => a.x < b.x2 && b.x < a.x2 && a.y < b.y2 && b.y < a.y2;

async function abrir(ancho, alto) {
  const page = await browser.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(1500);
  await clic(page, 'btn-garage'); await page.waitForTimeout(300);
  await clic(page, 'btn-ir-garage'); await page.waitForTimeout(500);
  return { page, errores };
}
const reales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));

for (const [ancho, alto, nombre] of [[390, 844, 'vertical'], [844, 390, 'horizontal']]) {
  const { page, errores } = await abrir(ancho, alto);
  const inicial = await barras(page);
  check(inicial.length === 3 && inicial.map(b => b.nombre).join() === 'Velocidad,Aceleración,Agarre',
    `RF-08 ${nombre}: 3 barras (${inicial.map(b => b.nombre)})`);
  await marcar(page, 'pickup'); await page.waitForTimeout(300);
  const pickup = await barras(page);
  await marcar(page, 'formula'); await page.waitForTimeout(300);
  const formula = await barras(page);
  check(JSON.stringify(pickup) !== JSON.stringify(formula), `RF-08 ${nombre}: las barras cambian al marcar otro carro`);
  const esperadas = await page.evaluate(async () => {
    const { RegistroCarros } = await import('/src/model/carros/registro_carros.js');
    const r = new RegistroCarros(), todas = r.tipos.map(t => r.constantesDe(t)), c = r.constantesDe('formula');
    return c.agarre / Math.max(...todas.map(x => x.agarre));
  });
  check(Math.abs(formula[2].valor - esperadas) < 1e-3, `RF-09 ${nombre}: la barra de agarre sale de la física (${formula[2].valor} = ${esperadas.toFixed(3)})`);

  const g = await geometria(page);
  const dentro = g.barras.x >= 0 && g.barras.y >= 0 && g.barras.x2 <= g.ancho && g.barras.y2 <= g.alto;
  check(dentro, `RF-09 ${nombre}: las barras se ven completas ${JSON.stringify(g.barras)}`);
  check(g.rellenos.length === 3 && g.rellenos.every(h => h >= 4), `RF-09 ${nombre}: el relleno de cada barra se ve (alto ${g.rellenos})`);
  check(!g.tarjetas.some(t => cruzan(t, g.barras)), `RF-09 ${nombre}: no tapan los carros`);
  check(!cruzan(g.boton, g.barras) && !cruzan(g.volver, g.barras), `RF-09 ${nombre}: no tapan los botones`);
  check(g.boton.y2 <= g.alto, `RF-09 ${nombre}: el botón "Ver en 3D" sigue visible`);
  await page.screenshot({ path: `/tmp/garaje_barras_${nombre}.png` });
  check(reales(errores).length === 0, `${nombre}: sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

// RF-02: guardar "pickup" y manejar en las 5 pantallas con su física.
// Espía el Carro real (mismo módulo que usan los visores) para leer sus constantes.
const PANTALLAS = [
  ['Test Drive simple',   ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-simple']],
  ['Test Drive con ruta', ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-con-ruta']],
  ['Diseño de Pistas',    ['btn-garage', 'btn-ir-pista', '.pista-card[data-pista="ciudad"]', 'btn-seleccionar-pista']],
  ['Diseño General',      ['btn-garage', 'btn-ir-diseno-general']],
  ['Jugar Solo',          ['btn-solo']],
];
for (const [nombre, pasos] of PANTALLAS) {
  const { page, errores } = await abrir(844, 390);
  await page.evaluate(async () => {
    const { Carro } = await import('/src/model/carros/carro.js');
    const actualizar = Carro.prototype.actualizar;
    Carro.prototype.actualizar = function (dt) { window.__carro = this; return actualizar.call(this, dt); };
  });
  await marcar(page, 'pickup');
  await clic(page, 'btn-ver-carro'); await page.waitForTimeout(800);
  await clic(page, 'btn-seleccionar-carro'); await page.waitForTimeout(400);
  for (const paso of pasos) {
    if (paso.startsWith('.')) await page.evaluate(s => document.querySelector(s).click(), paso);
    else await clic(page, paso);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(nombre === 'Jugar Solo' ? 6000 : 4000);
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(500); await page.keyboard.up('ArrowUp');
  const r = await page.evaluate(async () => {
    const { RegistroCarros } = await import('/src/model/carros/registro_carros.js');
    return { usada: window.__carro?.constantes?.aceleracion, clase: window.__carro?.constructor?.name,
             esperada: new RegistroCarros().constantesDe('pickup').aceleracion };
  });
  check(r.usada === r.esperada && r.clase === 'CarroPickup',
    `RF-02 ${nombre} maneja con la física del carro guardado (${r.clase}, ${r.usada} = ${r.esperada})`);
  check(reales(errores).length === 0, `RF-02 ${nombre} sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
