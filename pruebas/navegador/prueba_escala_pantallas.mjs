// ================================================================
// Prueba en navegador real del PRD 009 — Escala del carro y la pista.
//   RF-01 → en las 5 pantallas y en la vista previa el carro se dibuja a su largo real
//   RF-07 → en Jugar Solo (vertical y horizontal) la cámara guarda la misma proporción
//           con el carro que antes (el carro se ve del mismo tamaño en pantalla, ±15 %)
//   RF-08 → se ven al menos 30 m de pista delante del carro
//   RF-09 → los deslizadores conservan su rango y la altura guardada no cambia
//   RF-10 → la vista previa muestra el carro completo
//   Capturas en /tmp/escala_*.png para revisarlas a ojo (lección 13). Sin errores de consola.
// Espía VisorBase.centrarGrupo (largo dibujado) y CamaraSeguimiento (posición de la cámara).
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

async function abrir(ancho, alto) {
  const page = await browser.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  await page.evaluate(async () => {
    const THREE = await import('three');
    const { VisorBase } = await import('/src/view/visor_base.js');
    const { CamaraSeguimiento } = await import('/src/view/camaras/camara_seguimiento.js');
    const centrar = VisorBase.centrarGrupo;
    VisorBase.centrarGrupo = (grupo, largo) => {
      const caja = centrar(grupo, largo);
      const t = caja.getSize(new THREE.Vector3());
      window.__largoDibujado = Math.max(t.x, t.z);
      return caja;
    };
    const actualizar = CamaraSeguimiento.prototype.actualizar;
    CamaraSeguimiento.prototype.actualizar = function (px, pz, rotY, dir) {
      actualizar.call(this, px, pz, rotY, dir);
      window.__camara = { objeto: this.camera, px, pz, rotY, altura: this.altura };
    };
    // Medida de la cámara: distancia horizontal al carro y si se ven 30 m delante
    window.__medirCamara = () => {
      const c = window.__camara; if (!c) return null;
      const p = c.objeto.position;
      const delante = new THREE.Vector3(c.px + Math.sin(c.rotY) * 30, 0, c.pz + Math.cos(c.rotY) * 30).project(c.objeto);
      return { distancia: Math.hypot(p.x - c.px, p.z - c.pz), y: p.y, altura: c.altura,
               ve30: Math.abs(delante.x) <= 1 && Math.abs(delante.y) <= 1 && delante.z < 1 };
    };
  });
  return { page, errores };
}

const LARGO_DEPORTIVO = 4.5;

// Jugar Solo: RF-01, RF-07 y RF-08 en vertical y horizontal
for (const [ancho, alto, nombre, referencia] of [[390, 844, 'vertical', 9 / 2.6], [844, 390, 'horizontal', 7 / 2.6]]) {
  const { page, errores } = await abrir(ancho, alto);
  await clic(page, 'btn-solo'); await clic(page, 'btn-correr');
  await page.waitForFunction(() => document.getElementById('cuenta-carrera-solo')?.textContent === '¡YA!', null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({ largo: window.__largoDibujado, camara: window.__medirCamara() }));
  check(Math.abs(r.largo - LARGO_DEPORTIVO) / LARGO_DEPORTIVO <= 0.05, `RF-01 Jugar Solo ${nombre}: el deportivo mide ${r.largo?.toFixed(2)} m`);
  const proporcion = r.camara.distancia / r.largo;
  check(Math.abs(proporcion - referencia) / referencia <= 0.15, `RF-07 Jugar Solo ${nombre}: cámara/carro ${proporcion.toFixed(2)} (antes ${referencia.toFixed(2)})`);
  check(r.camara.ve30, `RF-08 Jugar Solo ${nombre}: se ven 30 m delante`);
  await page.screenshot({ path: `/tmp/escala_jugar_solo_${nombre}.png` });
  check(reales(errores).length === 0, `Jugar Solo ${nombre}: sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

// Las otras 4 pantallas: RF-01 y RF-08
const PANTALLAS = [
  ['Test Drive simple',   ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-simple'],   'escala_test_drive_recta'],
  ['Test Drive con ruta', ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-con-ruta'], 'escala_test_drive_ruta'],
  ['Diseño de Pistas',    ['btn-garage', 'btn-ir-pista', '.pista-card[data-pista="ciudad"]', 'btn-seleccionar-pista'], 'escala_diseno_pistas'],
  ['Diseño General',      ['btn-garage', 'btn-ir-diseno-general'], 'escala_diseno_general'],
];
for (const [nombre, pasos, captura] of PANTALLAS) {
  const { page, errores } = await abrir(844, 390);
  for (const paso of pasos) {
    if (paso.startsWith('.')) await page.evaluate(s => document.querySelector(s).click(), paso);
    else await clic(page, paso);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(4000);
  const r = await page.evaluate(() => ({ largo: window.__largoDibujado, camara: window.__medirCamara() }));
  check(Math.abs(r.largo - LARGO_DEPORTIVO) / LARGO_DEPORTIVO <= 0.05, `RF-01 ${nombre}: el deportivo mide ${r.largo?.toFixed(2)} m`);
  check(r.camara?.ve30, `RF-08 ${nombre}: se ven 30 m delante`);
  if (nombre === 'Test Drive simple') {
    // RF-09: el deslizador conserva su rango y la cámara sube con él (multiplicado por la escala)
    const d = await page.evaluate(async () => {
      const s = document.getElementById('slider-cam-height');
      s.value = s.max; s.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      const alto = window.__medirCamara();
      return { min: s.min, max: s.max, altura: alto.altura, y: alto.y };
    });
    check(Number(d.min) === 0.4 && Number(d.max) === 5, `RF-09 el deslizador conserva su rango (${d.min}–${d.max})`);
    check(Math.abs(d.altura - 5) < 1e-6 && Math.abs(d.y - 5 * LARGO_DEPORTIVO / 2.6) < 0.05, `RF-09 altura elegida ${d.altura}, cámara a ${d.y.toFixed(2)} m`);
  }
  await page.screenshot({ path: `/tmp/${captura}.png` });
  check(reales(errores).length === 0, `${nombre}: sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

// Vista previa del garaje: RF-01 y RF-10 con el carro más largo (clásico, 6 m)
{
  const { page, errores } = await abrir(390, 844);
  await clic(page, 'btn-garage'); await page.waitForTimeout(300);
  await clic(page, 'btn-ir-garage'); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('.carro-card[data-tipo="clasico"]').click());
  await clic(page, 'btn-ver-carro'); await page.waitForTimeout(3500);
  const largo = await page.evaluate(() => window.__largoDibujado);
  check(Math.abs(largo - 6) / 6 <= 0.05, `RF-01 vista previa: el clásico mide ${largo?.toFixed(2)} m`);
  await page.screenshot({ path: '/tmp/escala_vista_previa.png' });
  check(reales(errores).length === 0, `vista previa: sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

// RF-09: la altura que guardó el jugador en la Vista de conducción no cambia de valor
{
  const { page } = await abrir(390, 844);
  await page.evaluate(() => localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'botones' })));
  await page.reload(); await page.waitForTimeout(2000);
  await clic(page, 'btn-solo'); await clic(page, 'btn-correr'); await page.waitForTimeout(5000);
  const guardada = await page.evaluate(() => JSON.parse(localStorage.getItem('vc_preferencias') ?? '{}').alturaCamara);
  check(guardada === 2.8, `RF-09 la altura guardada sigue en 2.8 (${guardada})`);
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
