// ================================================================
// Prueba en navegador real del PRD 006 (física de manejo) y PRD 007.
//   PRD 006 RF-10 → Test Drive simple, con ruta y Diseño de Pistas se mueven con la física nueva
//   PRD 006 RF-11 → el panel de datos muestra las constantes del carro que se maneja
//   PRD 006 RF-12 → el botón y la tecla M de movimiento libre siguen funcionando
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
const texto = (page, id) => page.evaluate(i => document.getElementById(i)?.textContent ?? '', id);
const numero = async (page, id) => parseFloat(await texto(page, id));

// Aceleración esperada: la del carro guardado en el garaje (PRD 007) o la del básico (PRD 006)
const esperada = page => page.evaluate(async () => {
  const tipo = window.aplicacion?.estado?.tipoAuto ?? document.querySelector('.carro-card.sel')?.dataset.tipo;
  const { RegistroCarros } = await import('/src/model/carros/registro_carros.js');
  return new RegistroCarros().constantesDe(tipo).aceleracion;
});

async function abrir() {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(1500);
  return { page, errores };
}

// Mantiene ACEL apretado (flecha arriba) y devuelve cuánto se movió el carro según el panel
async function manejar(page, ms) {
  const antes = [await numero(page, 'dbg-px'), await numero(page, 'dbg-pz')];
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(ms);
  await page.keyboard.up('ArrowUp');
  const despues = [await numero(page, 'dbg-px'), await numero(page, 'dbg-pz')];
  return Math.hypot(despues[0] - antes[0], despues[1] - antes[1]);
}

const PANTALLAS = [
  { nombre: 'Test Drive simple',   pasos: ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-simple'] },
  { nombre: 'Test Drive con ruta', pasos: ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-con-ruta'], movLibre: true },
  { nombre: 'Diseño de Pistas',    pasos: ['btn-garage', 'btn-ir-pista'], tarjeta: 'ciudad', final: 'btn-seleccionar-pista' },
];

for (const p of PANTALLAS) {
  const { page, errores } = await abrir();
  for (const id of p.pasos) { await clic(page, id); await page.waitForTimeout(400); }
  if (p.tarjeta) {
    await page.evaluate(t => document.querySelector(`.pista-card[data-pista="${t}"]`).click(), p.tarjeta);
    await page.waitForTimeout(400);
    await clic(page, p.final);
  }
  await page.waitForTimeout(3500);

  const acel = await numero(page, 'dbg-f-accel');
  const valor = await esperada(page);
  check(Math.abs(acel - valor) < 1e-9, `PRD 006 RF-11 ${p.nombre}: el panel muestra la aceleración del carro (${acel} = ${valor})`);
  const movio = await manejar(page, 1500);
  check(movio > 5, `PRD 006 RF-10 ${p.nombre}: el carro avanza con ACEL (${movio.toFixed(1)} u)`);

  if (p.movLibre) {
    await clic(page, 'btn-mov-libre');
    check(await texto(page, 'btn-mov-libre') === 'LIBRE', 'PRD 006 RF-12 el botón activa el movimiento libre');
    await page.keyboard.press('m');
    check(await texto(page, 'btn-mov-libre') === 'PATH', 'PRD 006 RF-12 la tecla M lo desactiva');
  }
  // Errores ajenos: ServiceWorker con ruta de GitHub Pages (404) y URLs https bloqueadas a propósito
  const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
  check(reales.length === 0, `${p.nombre}: sin errores de consola ${reales.join(' | ')}`);
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
