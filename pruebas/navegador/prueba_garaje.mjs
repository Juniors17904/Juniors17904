// ================================================================
// Prueba en navegador real del PRD 004 — RF-06 (el garaje funciona igual)
// y RF-11 (sin errores de consola en el garaje).
// Recorre: ⚙ → Diseño de carro → elegir tipo → Ver en 3D → elegir color
// → Seleccionar → Inicio con el color elegido → volver al garaje.
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

const TIPO_ELEGIDO  = 'formula';
const NOMBRE_TIPO   = 'Fórmula';
const COLOR_INICIAL = '#ef4444';
const COLOR_ELEGIDO = '#a855f7';   // morado: no se confunde con el cielo ni el pasto del visor

// ── Utilidades sobre una página ────────────────────────────────
const activa = page => page.evaluate(()=>document.querySelector('.pantalla.activa')?.id);
const visible = (page, id) => page.evaluate(i=>{ const b=document.getElementById(i);
  if(!b || b.hidden) return false; const cs=getComputedStyle(b); const r=b.getBoundingClientRect();
  return cs.display!=='none' && cs.visibility!=='hidden' && r.width>0 && r.height>0; }, id);
const clic = (page, id) => page.evaluate(i=>document.getElementById(i).click(), id);
const esperar = (page, ms) => page.waitForTimeout(ms);
const colorSelInicio = page => page.evaluate(()=>document.querySelector('#colores-grid .color-btn.sel')?.dataset.color);
const tipoSelGaraje  = page => page.evaluate(()=>document.querySelector('#garage-grid .carro-card.sel')?.dataset.tipo);

// Cuenta píxeles del canvas 3D (WebGL) a partir de una captura del elemento:
// la captura se decodifica dentro de la página con un canvas 2D.
async function analizarCanvas3D(page) {
  const png = await page.locator('#canvas-preview-3d').screenshot();
  return page.evaluate(async b64 => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let total = 0, rojo = 0, morado = 0, oscuro = 0; const tonos = new Set();
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], bl = d[i+2]; total++;
      if (r > g + 60 && r > bl + 50) rojo++;
      if (bl > g + 40 && r > g + 20) morado++;
      if (r + g + bl < 30) oscuro++;
      tonos.add((r >> 4) << 8 | (g >> 4) << 4 | (bl >> 4));
    }
    return { total, rojo, morado, oscuro, tonos: tonos.size };
  }, png.toString('base64'));
}

// Espera hasta que el carro (GLB) aparezca en el visor: hay píxeles del color pedido
async function esperarCarro(page, campo, limiteMs = 15000) {
  const t0 = Date.now(); let a = await analizarCanvas3D(page);
  while (a[campo] < 200 && Date.now() - t0 < limiteMs) { await esperar(page, 700); a = await analizarCanvas3D(page); }
  return a;
}

// Color dominante (no fondo) de una miniatura 2D del garaje
const pixelesMiniatura = (page, tipo) => page.evaluate(t=>{
  const c = document.querySelector(`.carro-mini-canvas[data-tipo="${t}"]`);
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let rojo = 0, morado = 0;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    if (r > g + 60 && r > b + 50) rojo++;
    if (b > g + 40 && r > g + 20) morado++;
  }
  return { rojo, morado };
}, tipo);

async function abrir(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch:true, isMobile:true });
  const page = await ctx.newPage();
  const errores=[];
  page.on('pageerror', e=>errores.push('pageerror: '+e.message));
  page.on('console', m=>{ if(m.type()==='error') errores.push('console: '+m.text()); });
  await page.route('**', parchear);
  await page.goto(URL_JUEGO, { waitUntil:'load' });
  await page.waitForTimeout(2500);
  await page.waitForFunction(()=>window.Visor3D && window.Garaje, null, { timeout:15000 }).catch(()=>{});
  return { ctx, page, errores };
}

async function recorrerGaraje(viewport, E) {
  const { ctx, page, errores } = await abrir(viewport);

  // Punto de partida: Inicio con el color por defecto
  check(await activa(page)==='pantalla-inicio', `PRD 004 RF-06 ${E}: arranca en pantalla-inicio`);
  check(await colorSelInicio(page)===COLOR_INICIAL, `PRD 004 RF-06 ${E}: color inicial ${COLOR_INICIAL} seleccionado en Inicio`);

  // ⚙ → Diseño de carro
  await clic(page,'btn-garage'); await esperar(page,300);
  check(await activa(page)==='pantalla-ajustes', `PRD 004 RF-06 ${E}: ⚙ abre ajustes`);
  check(await visible(page,'btn-ir-garage'), `PRD 004 RF-06 ${E}: botón Diseño de carro visible en ⚙`);
  await clic(page,'btn-ir-garage'); await esperar(page,500);
  check(await activa(page)==='pantalla-garage', `PRD 004 RF-06 ${E}: Diseño de carro abre pantalla-garage`);

  // Los seis tipos de carro, con su miniatura dibujada
  const tipos = await page.evaluate(()=>[...document.querySelectorAll('#garage-grid .carro-card')].map(c=>{
    const r = c.getBoundingClientRect(); const cv = c.querySelector('.carro-mini-canvas');
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let pintados = 0; for (let i = 0; i < d.length; i += 4) if (d[i+3] > 0) pintados++;
    return { tipo: c.dataset.tipo, nombre: c.querySelector('span')?.textContent.trim(), visible: r.width>0 && r.height>0,
             pintados, total: cv.width*cv.height };
  }));
  const esperados = ['deportivo','suv','muscle','formula','pickup','clasico'];
  check(JSON.stringify(tipos.map(t=>t.tipo))===JSON.stringify(esperados),
    `PRD 004 RF-06 ${E}: se ven los 6 tipos de carro (${tipos.map(t=>t.tipo).join(',')})`);
  for (const t of tipos) {
    check(t.visible, `PRD 004 RF-06 ${E}: tarjeta ${t.tipo} (${t.nombre}) visible`);
    check(t.pintados > t.total*0.5, `PRD 004 RF-06 ${E}: miniatura ${t.tipo} dibujada (${t.pintados}/${t.total} px)`);
  }
  check((await pixelesMiniatura(page,'deportivo')).rojo > 50, `PRD 004 RF-06 ${E}: miniaturas pintadas con el color actual (rojo)`);
  check(await tipoSelGaraje(page)==='deportivo', `PRD 004 RF-06 ${E}: tipo por defecto "deportivo" marcado`);
  await page.screenshot({ path: `${SP}/prd004_garaje_${E}.png` });

  // Elegir otro tipo de carro
  await page.evaluate(t=>document.querySelector(`#garage-grid .carro-card[data-tipo="${t}"]`).click(), TIPO_ELEGIDO);
  await esperar(page,200);
  check(await tipoSelGaraje(page)===TIPO_ELEGIDO, `PRD 004 RF-06 ${E}: al tocar ${TIPO_ELEGIDO} queda marcado`);
  check(await page.evaluate(()=>document.querySelectorAll('#garage-grid .carro-card.sel').length)===1,
    `PRD 004 RF-06 ${E}: solo una tarjeta marcada`);

  // Vista previa 3D
  await clic(page,'btn-ver-carro'); await esperar(page,500);
  check(await activa(page)==='pantalla-preview', `PRD 004 RF-06 ${E}: "Ver en 3D" abre pantalla-preview`);
  check(await visible(page,'canvas-preview-3d'), `PRD 004 RF-06 ${E}: canvas 3D visible`);
  check(await page.evaluate(()=>document.getElementById('preview-nombre').textContent)===NOMBRE_TIPO,
    `PRD 004 RF-06 ${E}: la vista previa muestra el tipo elegido (${NOMBRE_TIPO})`);
  const a1 = await esperarCarro(page, 'rojo');
  check(a1.tonos > 20 && a1.oscuro < a1.total*0.5,
    `PRD 004 RF-06 ${E}: el canvas 3D tiene contenido (${a1.tonos} tonos, ${a1.oscuro}/${a1.total} px negros)`);
  check(a1.rojo >= 200, `PRD 004 RF-06 ${E}: se ve el carro 3D con el color actual (${a1.rojo} px rojos)`);
  await page.screenshot({ path: `${SP}/prd004_preview_rojo_${E}.png` });

  // Elegir otro color en la vista previa
  await page.evaluate(c=>document.querySelector(`#colores-preview .color-btn[data-color="${c}"]`).click(), COLOR_ELEGIDO);
  await esperar(page,800);
  check(await page.evaluate(()=>document.querySelector('#colores-preview .color-btn.sel')?.dataset.color)===COLOR_ELEGIDO,
    `PRD 004 RF-06 ${E}: el color ${COLOR_ELEGIDO} queda marcado en la vista previa`);
  const a2 = await esperarCarro(page, 'morado', 5000);
  check(a2.morado >= 200, `PRD 004 RF-06 ${E}: el carro 3D cambia al color elegido (${a2.morado} px morados)`);
  check(a2.rojo < a1.rojo/4, `PRD 004 RF-06 ${E}: ya no se ve el color anterior (${a2.rojo} px rojos)`);
  await page.screenshot({ path: `${SP}/prd004_preview_morado_${E}.png` });

  // Seleccionar → Inicio con el color elegido
  await clic(page,'btn-seleccionar-carro'); await esperar(page,500);
  check(await activa(page)==='pantalla-inicio', `PRD 004 RF-06 ${E}: "Seleccionar ✓" vuelve a Inicio`);
  check(await colorSelInicio(page)===COLOR_ELEGIDO, `PRD 004 RF-06 ${E}: el color elegido queda seleccionado en Inicio`);
  check(await page.evaluate(()=>document.querySelectorAll('#colores-grid .color-btn.sel').length)===1,
    `PRD 004 RF-06 ${E}: solo un color marcado en Inicio`);
  await page.screenshot({ path: `${SP}/prd004_inicio_${E}.png` });

  // Volver al garaje: la elección se conserva
  await clic(page,'btn-garage'); await esperar(page,300);
  await clic(page,'btn-ir-garage'); await esperar(page,500);
  check(await activa(page)==='pantalla-garage', `PRD 004 RF-06 ${E}: se puede volver a entrar al garaje`);
  check(await tipoSelGaraje(page)===TIPO_ELEGIDO, `PRD 004 RF-06 ${E}: el tipo elegido sigue marcado en el garaje`);
  const mini = await pixelesMiniatura(page, TIPO_ELEGIDO);
  check(mini.morado > 50 && mini.rojo < 20, `PRD 004 RF-06 ${E}: las miniaturas usan el color elegido (${mini.morado} morados, ${mini.rojo} rojos)`);
  await clic(page,'btn-ver-carro'); await esperar(page,500);
  check(await page.evaluate(()=>document.getElementById('preview-nombre').textContent)===NOMBRE_TIPO,
    `PRD 004 RF-06 ${E}: al reabrir la vista previa sale el tipo elegido`);
  const a3 = await esperarCarro(page, 'morado');
  check(a3.morado >= 200, `PRD 004 RF-06 ${E}: al reabrir, el carro 3D sale con el color elegido (${a3.morado} px morados)`);

  // Salir con ← desde la vista previa y desde el garaje
  await clic(page,'btn-volver-preview'); await esperar(page,400);
  check(await activa(page)==='pantalla-garage', `PRD 004 RF-06 ${E}: ← de la vista previa vuelve al garaje`);
  await clic(page,'btn-volver-garage'); await esperar(page,400);
  check(await activa(page)==='pantalla-inicio', `PRD 004 RF-06 ${E}: ← del garaje vuelve a Inicio`);
  check(await colorSelInicio(page)===COLOR_ELEGIDO, `PRD 004 RF-06 ${E}: al salir sin seleccionar se mantiene el color elegido`);

  // RF-11: sin errores de consola
  const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)/.test(t));
  if (errores.length) console.log('errores:', errores.join('\n'));
  check(reales.length===0, `PRD 004 RF-11 ${E}: sin errores de consola en el garaje ${reales.join(' | ')}`);
  await ctx.close();
}

await recorrerGaraje({ width:390, height:844 }, 'vertical');
await recorrerGaraje({ width:844, height:390 }, 'horizontal');

console.log(`OK ${ok}, fallos ${fallos}`);
await browser.close();
process.exitCode = fallos ? 1 : 0;
