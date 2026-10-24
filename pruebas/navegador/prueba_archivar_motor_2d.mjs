// ================================================================
// Prueba en navegador real del PRD 005 — Archivar el motor 2D.
// En vertical (390x844) y horizontal (844x390) comprueba:
//   RF-02 → las pantallas y botones 2D no existen y no aparece "GIRA TU CELULAR"
//   RF-03 → atrás / adelante hacia una pantalla borrada llevan a Inicio
//   RF-06 → RegistroPistas (D4) tiene las 5 pistas y la lista las muestra
//   RF-05 → el garaje abre la vista previa 3D
//   RF-09 → sin errores de consola
// ================================================================
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const SP = process.env.CAPTURAS_DIR || '/tmp/capturas_turborace'; (await import('fs')).mkdirSync(SP, { recursive: true });
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
let ok=0, fallos=0;
const check=(c,m)=>{ if(c){ok++;console.log('OK  ',m);} else {fallos++;console.log('FALLO',m);} };
const browser = await chromium.launch({ headless:false, args:['--use-gl=angle','--ignore-gpu-blocklist'] });

// ── Utilidades sobre una página ────────────────────────────────
const activa = page => page.evaluate(()=>document.querySelector('.pantalla.activa')?.id);
const cuantasActivas = page => page.evaluate(()=>document.querySelectorAll('.pantalla.activa').length);
const existe = (page, id) => page.evaluate(i=>!!document.getElementById(i), id);
const visible = (page, id) => page.evaluate(i=>{ const b=document.getElementById(i);
  if(!b || b.hidden) return false; const cs=getComputedStyle(b); const r=b.getBoundingClientRect();
  return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0; }, id);
const clic = (page, id) => page.evaluate(i=>document.getElementById(i).click(), id);
const esperar = (page, ms) => page.waitForTimeout(ms);
const irAInicio = async page => {
  for (let i=0;i<8 && await activa(page)!=='pantalla-inicio';i++){ await page.goBack().catch(()=>{}); await esperar(page,300); }
};

const PISTAS = ['ciudad','desierto','montana','costa','volcan'];
const BORRADOS = ['pantalla-crear','pantalla-unirse','pantalla-espera','pantalla-resultado','pantalla-rotar',
                  'btn-test-drive','btn-clasico-2d'];

async function abrir(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch:true, isMobile:true });
  const page = await ctx.newPage();
  const errores=[];
  page.on('pageerror', e=>errores.push('pageerror: '+e.message));
  page.on('console', m=>{ if(m.type()==='error') errores.push('console: '+m.text()); });
  await page.route('**', parchear);
  await page.goto(URL_JUEGO, { waitUntil:'load', timeout:60000 });
  await page.waitForFunction(()=>window.VisorTestdriveRecto && window.VisorTestdriveRuta, null, { timeout:15000 }).catch(()=>{});
  await esperar(page, 500);
  return { ctx, page, errores };
}

// RF-02: lo 2D ya no existe en el DOM
async function revisarBorrados(page, et) {
  check(await activa(page)==='pantalla-inicio', `PRD 005 RF-02 ${et}: arranca en pantalla-inicio`);
  for (const id of BORRADOS) check(!(await existe(page,id)), `PRD 005 RF-02 ${et}: #${id} no existe en el DOM`);
  const gira = await page.evaluate(()=>/GIRA TU CELULAR/i.test(document.documentElement.textContent));
  check(!gira, `PRD 005 RF-02 ${et}: "GIRA TU CELULAR" no aparece`);
}

// RF-03: una entrada del historial hacia una pantalla borrada lleva a Inicio
async function revisarHistorial(page, et, pantallaBorrada) {
  await irAInicio(page);
  await page.evaluate(p=>{ history.pushState({ pantalla:p }, ''); history.pushState({ pantalla:'pantalla-inicio' }, ''); }, pantallaBorrada);
  const revisar = async paso => {
    const id = await activa(page), n = await cuantasActivas(page);
    check(id==='pantalla-inicio' && n===1,
      `PRD 005 RF-03 ${et}: ${paso} hacia ${pantallaBorrada} → pantalla-inicio activa y una sola .pantalla.activa (${id}, ${n})`);
  };
  await page.goBack(); await esperar(page, 400); await revisar('atrás');
  await page.goForward(); await esperar(page, 400); await revisar('adelante');
  await page.goBack(); await esperar(page, 400); await revisar('atrás otra vez');
}

// RF-06 y D4: RegistroPistas y la lista de pistas
async function revisarPistas(page, et) {
  const reg = await page.evaluate(()=>window.registroPistas ? {
    claves: window.registroPistas.claves,
    obtiene: window.registroPistas.obtener('ciudad') !== null,
    nulo: window.registroPistas.obtener('no-existe') === null,
  } : null);
  check(!!reg, `PRD 005 RF-06 D4 ${et}: window.registroPistas existe`);
  for (const p of PISTAS) check(!!reg && reg.claves.includes(p), `PRD 005 RF-06 D4 ${et}: registroPistas tiene "${p}"`);
  check(!!reg && reg.obtiene && reg.nulo, `PRD 005 RF-06 D4 ${et}: obtener('ciudad') da la pista y una clave desconocida da null`);

  await irAInicio(page);
  await clic(page,'btn-garage'); await esperar(page,300);
  await clic(page,'btn-ir-pista'); await esperar(page,400);
  check(await activa(page)==='pantalla-pista', `PRD 005 RF-06 ${et}: ⚙ → pistas abre pantalla-pista`);
  const tarjetas = await page.evaluate(()=>[...document.querySelectorAll('#pantalla-pista .pista-card')].map(c=>c.dataset.pista));
  check(JSON.stringify([...tarjetas].sort())===JSON.stringify([...PISTAS].sort()),
    `PRD 005 RF-06 ${et}: la lista muestra las mismas pistas (${tarjetas.join(', ')})`);
  check(!!reg && tarjetas.every(t=>reg.claves.includes(t)), `PRD 005 RF-06 D4 ${et}: cada tarjeta tiene su pista en registroPistas`);
  await page.screenshot({ path: `${SP}/prd005_pistas_${et}.png` });
  await page.evaluate(()=>document.querySelector('.pista-card[data-pista="ciudad"]').click()); await esperar(page,400);
  check(await activa(page)==='pantalla-detalle-pista', `PRD 005 RF-06 ${et}: al elegir Ciudad se abre el detalle`);
  const nombre = await page.evaluate(()=>document.getElementById('detalle-pista-nombre')?.textContent.trim());
  check(!!nombre, `PRD 005 RF-06 ${et}: el detalle muestra el nombre de la pista (${nombre})`);
  await page.screenshot({ path: `${SP}/prd005_detalle_ciudad_${et}.png` });
}

// RF-05: el garaje abre la vista previa 3D
async function revisarGaraje(page, et) {
  await irAInicio(page);
  await clic(page,'btn-garage'); await esperar(page,300);
  await clic(page,'btn-ir-garage'); await esperar(page,400);
  check(await activa(page)==='pantalla-garage', `PRD 005 RF-05 ${et}: ⚙ → garaje abre pantalla-garage`);
  await page.waitForFunction(()=>!!window.Visor3D, null, { timeout:15000 }).catch(()=>{});
  check(await page.evaluate(()=>!!window.Visor3D), `PRD 005 RF-05 ${et}: window.Visor3D existe (visor3d.js cargado)`);
  await clic(page,'btn-ver-carro'); await esperar(page,3000);
  check(await activa(page)==='pantalla-preview', `PRD 005 RF-05 ${et}: "Ver en 3D" abre pantalla-preview`);
  check(await visible(page,'canvas-preview-3d'), `PRD 005 RF-05 ${et}: canvas-preview-3d visible`);
  await page.screenshot({ path: `${SP}/prd005_preview_${et}.png` });
  await irAInicio(page);
}

async function recorrer(viewport, et) {
  const { ctx, page, errores } = await abrir(viewport);
  await revisarBorrados(page, et);
  await revisarHistorial(page, et, 'pantalla-espera');
  await revisarHistorial(page, et, 'pantalla-crear');
  await revisarPistas(page, et);
  await revisarGaraje(page, et);
  check(await activa(page)==='pantalla-inicio', `PRD 005 RF-03 ${et}: al final se vuelve a Inicio`);
  const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)/.test(t));
  check(reales.length===0, `PRD 005 RF-09 ${et}: sin errores de consola ${reales.join(' | ')}`);
  await ctx.close();
}

// Las dos orientaciones corren a la vez, cada una en su propia página
await Promise.all([
  recorrer({ width:390, height:844 }, 'vertical'),
  recorrer({ width:844, height:390 }, 'horizontal'),
]);

console.log(`Capturas en ${SP}`);
console.log(`OK ${ok}, fallos ${fallos}`);
await browser.close();
process.exitCode = fallos ? 1 : 0;
