// ================================================================
// Prueba en navegador real del PRD 011 — Señalética a tamaño real.
//   RF-01 → en Jugar Solo las flechas tienen tablero de 2,4 × 0,8 × 0,03 m,
//           con su borde de abajo a 0,9 m
//   RF-06 → en Jugar Solo hay un arco de meta sobre la línea de meta, girado
//           con la pista, con postes a 6,0 m del centro y 5,5 m de altura libre
//   RF-08 → en Diseño de Objetos los arcos de meta y de salida tienen esas
//           medidas y se ven completos al abrir
//   RF-10 → el botón "Chevrón" ya no existe
//   Sin errores de consola (lección 8). Capturas en /tmp/capturas_prd011/
//   (lecciones 13 y 16): arco en Jugar Solo, arcos y flecha de frente y de costado.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd011';
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
const check = (c, texto) => {
  const m = 'PRD 011 ' + texto;
  if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); }
};
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));

// Abre el juego con espías: cada ObjetoEscena construido, la cámara dibujada en
// cada lienzo y cada piso de pista (mismos módulos que usa el juego)
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
    const { ObjetoEscena } = await import('/src/view/objetos/objeto_escena.js');
    const { ConstructorPisoPista } = await import('/src/view/pistas/comun/constructor_piso_pista.js');
    window.__THREE = THREE;
    window.__objetos = [];
    window.__dibujos = {};
    window.__pisos = [];
    const construir = ObjetoEscena.prototype.construir;
    ObjetoEscena.prototype.construir = function (scene) { window.__objetos.push(this); return construir.call(this, scene); };
    const construirPiso = ConstructorPisoPista.prototype.construir;
    ConstructorPisoPista.prototype.construir = function () { const g = construirPiso.call(this); window.__pisos.push(g); return g; };
    THREE.Scene.prototype.onBeforeRender = function (renderer, scene, camera) { window.__dibujos[renderer.domElement.id] = { scene, camera }; };
  });
  return { page, errores };
}

// Medidas de un arco (el último de esa clase): postes, altura libre y su caja
const medirArco = (page, clase) => page.evaluate(clase => {
  const THREE = window.__THREE;
  const arco = [...window.__objetos].reverse().find(o => o.constructor.name === clase && o._grupo?.parent);
  if (!arco) return null;
  const g = arco._grupo;
  g.updateMatrixWorld(true);
  const postes = [], cruces = [];
  for (const hijo of g.children) {
    const caja = new THREE.Box3().setFromObject(hijo);
    const alto = caja.max.y - caja.min.y;
    // Poste: pieza vertical que llega al piso
    if (caja.min.y < 0.01 && alto > 3) postes.push(hijo.getWorldPosition(new THREE.Vector3()));
    else cruces.push(caja.min.y);
  }
  const local = postes.map(p => g.worldToLocal(p.clone()));
  return {
    postesX: local.map(p => p.x), libre: Math.min(...cruces), rotY: g.rotation.y,
    x: g.position.x, z: g.position.z, mundo: postes.map(p => [p.x, p.z]),
  };
}, clase);

const medirEncuadre = page => page.evaluate(() => {
  const THREE = window.__THREE;
  const obj = window.__objetos[window.__objetos.length - 1];
  const d = window.__dibujos['canvas-do-visor'];
  if (!obj?._grupo || !d) return null;
  const caja = new THREE.Box3().setFromObject(obj._grupo);
  let dentro = true, peor = 0;
  for (const x of [caja.min.x, caja.max.x]) for (const y of [caja.min.y, caja.max.y]) for (const z of [caja.min.z, caja.max.z]) {
    const p = new THREE.Vector3(x, y, z).project(d.camera);
    peor = Math.max(peor, Math.abs(p.x), Math.abs(p.y));
    if (p.z >= 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) dentro = false;
  }
  return { clase: obj.constructor.name, dentro, peor };
});

// Tablero de la última flecha: medidas de su caja y altura de su borde de abajo
const medirFlecha = page => page.evaluate(() => {
  const THREE = window.__THREE;
  const flecha = [...window.__objetos].reverse().find(o => o.constructor.name === 'FlechaCurvaEscena' && o._grupo?.parent);
  const tablero = flecha?._grupo.children.find(h => h.geometry?.type === 'BoxGeometry');
  if (!tablero) return null;
  const p = tablero.geometry.parameters;
  const cuantas = window.__objetos.filter(o => o.constructor.name === 'FlechaCurvaEscena' && o._grupo?.parent).length;
  return { ancho: p.width, alto: p.height, grosor: p.depth, abajo: tablero.position.y - p.height / 2, cuantas };
});

const cerca = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;

// ── Jugar Solo: arco de meta (RF-06) y flechas (RF-01) ───────────────
{
  const { page, errores } = await abrir(390, 844);
  await clic(page, 'btn-solo');
  await page.waitForTimeout(3500);
  const arco = await medirArco(page, 'MetaEscena');
  check(!!arco, 'RF-06 Jugar Solo tiene un arco de meta');
  if (arco) {
    check(arco.postesX.length === 2 && arco.postesX.every(x => cerca(Math.abs(x), 6.0)),
      `RF-06 Jugar Solo: postes del arco a 6,0 m del centro (${arco.postesX.map(x => x.toFixed(2))})`);
    check(cerca(arco.libre, 5.5), `RF-06 Jugar Solo: altura libre del arco ${arco.libre.toFixed(2)} m (5,5)`);
    // Sobre la línea de meta y girado con la pista: los postes quedan a los lados de la meta a cuadros
    const meta = await page.evaluate(() => {
      const THREE = window.__THREE, g = window.__pisos[window.__pisos.length - 1];
      const c = new THREE.Box3().setFromObject(g.getObjectByName('metaBlanca')).getCenter(new THREE.Vector3());
      return [c.x, c.z];
    });
    const dMeta = Math.hypot(arco.x - meta[0], arco.z - meta[1]);
    check(dMeta < 0.6, `RF-06 Jugar Solo: el arco está sobre la línea de meta (${dMeta.toFixed(2)} m)`);
    const [[ax, az], [bx, bz]] = arco.mundo;
    const ancho = Math.hypot(ax - bx, az - bz);
    const medio = [(ax + bx) / 2, (az + bz) / 2];
    check(cerca(ancho, 12, 0.05) && Math.hypot(medio[0] - meta[0], medio[1] - meta[1]) < 0.6,
      `RF-06 Jugar Solo: el arco cruza la pista de lado a lado, centrado en la meta (${ancho.toFixed(2)} m entre postes)`);
  }
  const flecha = await medirFlecha(page);
  check(flecha && cerca(flecha.ancho, 2.4, 1e-6) && cerca(flecha.alto, 0.8, 1e-6) && cerca(flecha.grosor, 0.03, 1e-6) && cerca(flecha.abajo, 0.9, 1e-6),
    `RF-01 Jugar Solo: ${flecha?.cuantas} flechas con tablero de ${flecha?.ancho} × ${flecha?.alto} × ${flecha?.grosor} m, borde de abajo a ${flecha?.abajo?.toFixed(2)} m`);
  await page.screenshot({ path: `${CARPETA}/jugar_solo_arco_meta.png` });
  const reales = erroresReales(errores);
  check(reales.length === 0, 'Jugar Solo sin errores de consola ' + reales.join(' | '));
  await page.close();
}

// ── Diseño de Objetos: arcos (RF-08), flecha (RF-01) y sin baliza (RF-10) ──
for (const [nombreVista, ancho, alto] of [['vertical', 390, 844], ['horizontal', 844, 390]]) {
  const { page, errores } = await abrir(ancho, alto);
  await clic(page, 'btn-garage'); await page.waitForTimeout(300);
  await clic(page, 'btn-ir-diseno-objetos');
  await page.waitForTimeout(1500);
  check(await page.evaluate(() => document.getElementById('do-sel-baliza-chevron') === null),
    `RF-10 (${nombreVista}) el botón "Chevrón" ya no existe`);
  for (const [boton, clase] of [['do-sel-meta', 'MetaEscena'], ['do-sel-salida', 'SalidaEscena']]) {
    await clic(page, boton); await page.waitForTimeout(900);
    const arco = await medirArco(page, clase);
    check(arco?.postesX.length === 2 && arco.postesX.every(x => cerca(Math.abs(x), 6.0)),
      `RF-08 (${nombreVista}) ${clase}: postes a 6,0 m del centro (${arco?.postesX.map(x => x.toFixed(2))})`);
    check(arco && cerca(arco.libre, 5.5), `RF-08 (${nombreVista}) ${clase}: altura libre ${arco?.libre.toFixed(2)} m (5,5)`);
    const e = await medirEncuadre(page);
    check(e?.clase === clase && e.dentro, `RF-08 (${nombreVista}) ${clase} se ve completo al abrir (borde más lejano ${e?.peor.toFixed(2)} ≤ 1)`);
    if (nombreVista === 'vertical') await page.screenshot({ path: `${CARPETA}/diseno_objetos_${clase}.png` });
  }
  await clic(page, 'do-sel-flecha'); await page.waitForTimeout(900);
  const flecha = await medirFlecha(page);
  check(flecha && cerca(flecha.grosor, 0.03, 1e-6) && cerca(flecha.abajo, 0.9, 1e-6),
    `RF-01 (${nombreVista}) Diseño de Objetos: flecha con grosor ${flecha?.grosor} m y borde de abajo a ${flecha?.abajo?.toFixed(2)} m`);
  if (nombreVista === 'vertical') {
    await page.screenshot({ path: `${CARPETA}/diseno_objetos_flecha.png` });
    // De costado: la cámara se pone en la punta del tablero (se ve el grosor)
    await page.evaluate(() => {
      const cam = window.__dibujos['canvas-do-visor'].camera;
      cam.position.set(0.2, 1.4, 3.2);
      cam.lookAt(0, 1.3, 0);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${CARPETA}/diseno_objetos_flecha_costado.png` });
  }
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombreVista}) Diseño de Objetos sin errores de consola ` + reales.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
