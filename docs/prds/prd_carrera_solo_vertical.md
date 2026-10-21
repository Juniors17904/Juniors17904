# PRD — Carrera Solo 3D en vertical (TURBO RACE)

| Campo | Valor |
|---|---|
| Producto | TURBO RACE (juego web, Three.js 0.164.1) |
| Funcionalidad | Carrera 3D por vueltas desde "Jugar Solo", en orientación vertical |
| Estado | Listo para implementar (decisiones D1–D10 cerradas; revisión técnica aplicada) |
| Fecha | 2026-10-21 |

---

## 1. Contexto y problema

Hoy el botón **"Jugar Solo"** (`#btn-solo`, index.html L72) lanza la carrera **2D** clásica. El recorrido es `pantalla-espera` (cuenta 3-2-1), luego `pantalla-juego` y al final `Juego` (`src/controller/juego.js`). Las dos pantallas están en `GestorOrientacion.#PANTALLAS_LANDSCAPE`, así que en el celular en vertical aparece el aviso **"GIRA TU CELULAR"**.

Por otro lado, la pantalla **🎨 Diseño General** (`VisorDisenoPista`, `src/view/pistas/visor_diseno_pista.js`) ya muestra una pista 3D con el carro del garaje. Pero no es una carrera: no tiene vueltas, cronómetro, meta ni resultado.

Además tiene defectos visuales:
- El asfalto se ve casi negro. Los triángulos de `_ribbon` miran hacia abajo y las luces son débiles: Ambient 0.28 y sol 0.35, frente a 1.2 y 2.2 en `VisorTestdriveRuta`. Los pianos (`_buildCurbs`) usan el mismo orden de índices `a,c,b, b,c,d` (caras hacia abajo con `DoubleSide`), así que también se ven oscuros.
- La línea central amarilla no se ve. `dashMat` es `MeshBasicMaterial` con FrontSide, así que la GPU la descarta. La **línea de meta blanca** (`MeshBasicMaterial` FrontSide sobre `_ribbon`) tiene el mismo defecto y hoy tampoco se ve.

**Problema:** el jugador que entra a "Jugar Solo" con el celular en la mano (vertical) no puede jugar sin girarlo. Además, la experiencia 3D más atractiva del juego no se puede jugar como carrera.

## 2. Objetivo

Convertir la pista 3D de Diseño General en una **carrera 3D real** de 3 vueltas, jugable en **vertical** desde "Jugar Solo". Tendrá cuenta regresiva, cronómetro, velocímetro, contador de vuelta y pantalla de resultado.

Todo se hace en **archivos nuevos**, con cambios mínimos solo en `index.html` y `src/controller/aplicacion.js`. La carrera 2D actual se conserva intacta como **"Clásico 2D"** dentro de ⚙ Ajustes.

**Métricas de éxito (cualitativas para el MVP):**
- En un celular en vertical, el jugador termina 3 vueltas sin ver "GIRA TU CELULAR".
- El asfalto se ve gris (no negro) y la línea central se ve en todo el recorrido.
- "Clásico 2D" funciona exactamente igual que el "Jugar Solo" actual.

## 3. Público objetivo y usuarios

| Usuario | Necesidad | Cómo lo resuelve el MVP |
|---|---|---|
| **Jugador móvil casual** (principal) | Jugar rápido con una mano, sin girar el celular | Carrera vertical con timón abajo a la izquierda y ACEL/FRENO abajo a la derecha (D10), con `ControlTimon` |
| **Jugador de PC** | Jugar con teclado (flechas/WASD) | Misma composición vertical, centrada en la ventana (columna ≤ 480 px). Con `ControlTeclado` la banda inferior muestra los botones ◀ ▲▼ ▶ que ya pinta `ControlTeclado.mostrarOverlay()` (sin timón ni ACEL/FRENO); el velocímetro queda en la misma posición fija (RF-42) |
| **Jugador que personaliza** | Ver su carro, color, timón y velocímetro en la carrera | Usa la pista elegida en ⚙→Pistas y la configuración del garaje (D4) |
| **Jugador nostálgico** | Seguir jugando la carrera 2D | Botón "Clásico 2D" en ⚙ Ajustes, en horizontal (D1) |

## 4. Alcance

### In scope (MVP)
- "Jugar Solo" abre la nueva pantalla `pantalla-carrera-solo` en **vertical** (D1, D9).
- Carrera de **3 vueltas** con cuenta regresiva **3-2-1** propia de la pantalla, sin pasar por `pantalla-espera` (D2, D7).
- HUD con:
  - **Vuelta X/3** y **cronómetro** arriba.
  - **Velocímetro** pequeño sobre los botones ACEL/FRENO (D2, D10).
- Vuelta válida solo si se pasan **3 puntos de control en orden**: 33 %, 66 % y meta (D5).
- **Pasto:** al salir de la pista la velocidad máxima baja al **40 %**. No hay choque ni reinicio (D3).
- **Resultado:** tiempo total y mejor vuelta, con botones **Revancha** y **Menú** (D2).
- Pista de ⚙→Pistas (`#estado.pista`, por defecto `'ciudad'`). Carro (`tipoAuto`), `color`, `timonModelo` y `velocimetroModelo` del garaje (D4).
- **Mejoras visuales** en el visor nuevo: asfalto y pianos más iluminados, línea central y línea de meta visibles (D8).
- Botón **"Clásico 2D"** en `pantalla-ajustes`, que abre la carrera 2D actual en horizontal (D1).
- Clases nuevas: `CarreraVueltas`, `Cronometro`, `VisorCarreraSolo`, `HudCarrera` y `ControladorCarreraSolo` (D6).

### Out of scope (explícito)
- Rivales, CPU, tráfico u oponentes en línea.
- Récords o tiempos guardados (localStorage, Supabase o tabla de posiciones).
- Choques, daños, reinicio en pista o penalizaciones de tiempo.
- Pausa de la carrera (ver S5).
- Turbo en el HUD. No se añade botón; si `Carro` lo soporta internamente, no se expone.
- Cerrar geométricamente las pistas abiertas (costa, desierto, montaña, volcán). Ver Riesgos (R1).
- **Archivos y clases que NO se modifican** (lista única, igual a RNF-07 y a la tabla 5.3): `Ruta`, `Carro`, `CamaraSeguimiento`, `VisorBase`, `FabricaObjetoEscena`, cielos (`CieloSoleado`, `CieloNocturno`), `RenderizadorVelocimetro`, `ConfigPista*`, `VisorDisenoPista`, `GestorOrientacion`, `VistaConduccion`, `ControlTimon`, `ControlTeclado`, `Juego`, `src/style.css` y **`CLAUDE.md`**.
- **Actualizar `CLAUDE.md`** (tabla de jerarquía `VisorBase` y tabla "Visores de pista: uno por pantalla"): no se hace en este MVP porque D7 dice que nada más se modifica. Queda como deuda de documentación (R13) para que el usuario decida después.
- Cambiar el flujo multijugador (`btn-crear` y unirse siguen usando `#iniciarCuentaRegresiva`).
- Cualquier cambio en otros archivos existentes fuera de D7.
- Modo horizontal para la carrera 3D nueva.

## 5. Conceptos de dominio

### 5.1 Glosario
| Término | Definición |
|---|---|
| **Muestras de la ruta** | `N = 400` puntos `{x, z, angle}` tomados **por longitud de arco** (`ruta.curve.getPointAt(i/N)` y `getTangentAt(i/N)`), generados por `VisorCarreraSolo.muestrasRuta(N)` sin modificar `Ruta`. La muestra 0 coincide con `ruta.inicio` (`getPoint(0) === getPointAt(0)`). |
| **Progreso** | Posición del carro a lo largo de la ruta, en 0..1. Se obtiene **proyectando** el carro a la muestra más cercana dentro de una ventana circular (RF-06): `progreso = idx / N`. No se integra la velocidad. Como las muestras son por longitud de arco, el progreso es proporcional a la distancia recorrida. |
| **Δ envuelto** | Cambio de progreso entre dos llamadas tomando el envolvimiento módulo 1: `Δ = ((actual − anterior + 1.5) mod 1) − 0.5`, en (−0.5, 0.5]. `Δ > 0` es hacia adelante. |
| **Lateral** | Distancia con signo del carro al **segmento** entre la muestra elegida y su vecina más cercana (anterior o siguiente). Con `(ux, uz)` el vector unitario del segmento y `(dx, dz)` = carro − inicio del segmento: `lateral = dx*uz + dz*(−ux)` (equivale a `dx*cos(a) + dz*(−sin(a))` con la dirección del segmento). |
| **Asfalto / Piano / Pasto** | Asfalto: `|lateral| ≤ 4`. Piano: `4 < |lateral| ≤ 4.7`. **Pasto: `|lateral| > 4.7`**. |
| **Punto de control (PC)** | Umbral de progreso que hay que **cruzar hacia adelante** en orden: PC1 = 0.33, PC2 = 0.66, PC3 = meta (cruce de 0 hacia adelante, es decir de ~1 a ~0). |
| **Cruce hacia adelante de un umbral `u`** | Entre dos llamadas, `0 < Δ < 0.5` y `anterior < u ≤ actual` (en la meta: `anterior > actual` con `Δ > 0`). |
| **Cruce de meta hacia atrás** | `Δ < 0` y el progreso pasa de ~0 a ~1 (`anterior < actual`). Reinicia PC1 y PC2 de la vuelta en curso. |
| **Vuelta válida** | Cruce hacia adelante de la meta habiendo cruzado antes hacia adelante PC1 y PC2 en esa vuelta. |
| **Vuelta parcial / tiempo de vuelta** | Tiempo transcurrido entre dos cruces válidos de meta (o entre la salida y el primero). |
| **Mejor vuelta** | Menor tiempo de vuelta entre las 3 completadas. |
| **Fracción de tope** | Valor 0.4..1 que el modelo suaviza cada paso de simulación hacia 0.4 (pasto) o 1 (asfalto/piano). El visor lo aplica al `Carro` como `velMaxAdelante = velocidadMaxBase × fracción`. |
| **Paso de simulación** | Una llamada a `carro.actualizar(16)`. El visor ejecuta pasos fijos a 60 Hz con acumulador (RF-15), así que la velocidad del juego no depende de los FPS de la pantalla. |
| **Estado de carrera** | `preparando` → `cuenta` → `corriendo` → `terminada`. |

### 5.2 Clases nuevas (una por archivo, nombres en español)

| Clase | Archivo | Capa MVC | Tipo de script | Responsabilidad |
|---|---|---|---|---|
| `CarreraVueltas` | `src/model/carrera_vueltas.js` | **Modelo** | Clásico. Expone `window.CarreraVueltas` (con `try/catch` y `window.__modelErrors`) | Recibe las muestras de la ruta y, cada frame, `(px, pz, pasos)`. Calcula progreso y lateral, sabe si el carro está en el pasto, valida los puntos de control en orden, cuenta vueltas (total 3) y avisa cuándo termina. **Calcula la regla del pasto**: fracción de tope suavizada y factor de arrastre. Sin Three.js ni DOM. |
| `Cronometro` | `src/model/cronometro.js` | **Modelo** | Clásico. Expone `window.Cronometro` (con `try/catch` y `window.__modelErrors`) | Mide el tiempo total y por vuelta con un reloj inyectable (`performance.now`). Métodos `iniciar()`, `pausar()`, `reanudar()`, `marcarVuelta()`, `detener()`, `reiniciar()`. Getters: `tiempoTotalMs`, `tiempoVueltaActualMs`, `tiemposVuelta`, `mejorVueltaMs`. Formato `m:ss.cc` (centésimas truncadas) mediante el método `formatear(ms)`. |
| `VisorCarreraSolo` | `src/view/pistas/visor_carrera_solo.js` | **Vista** | Módulo ES. `extends VisorBase`, expone `window.VisorCarreraSolo` | Escena 3D de la pista: asfalto y pianos iluminados, línea central y línea de meta visibles, decoraciones, cielo, carro GLB y cámara de seguimiento con FOV ajustado a vertical. Mueve el `Carro` con pasos fijos de 60 Hz, expone pose y muestras de la ruta, avisa cada frame mediante `alActualizar(fn)` y **solo copia** al `Carro` el tope que le pasa el controlador (sin decidir la regla). |
| `HudCarrera` | `src/view/hud_carrera.js` | **Vista** | Clásico. Expone `window.HudCarrera` | Dibuja "Vuelta X/3", el cronómetro, el velocímetro (`RenderizadorVelocimetro`), la cuenta 3-2-1/¡YA! y el panel de resultado, dentro de `pantalla-carrera-solo`. Dimensiona su propio canvas al ancho de la columna. Sin lógica de negocio. |
| `ControladorCarreraSolo` | `src/controller/controlador_carrera_solo.js` | **Controlador** | Clásico. Expone `window.ControladorCarreraSolo` | Orquesta todo: crea el visor, el modelo y el HUD. Gestiona la cuenta regresiva y el ciclo por frame (callback del visor → modelo → tope al visor → HUD), el resultado y las acciones Revancha/Menú. Libera todo en `detener()`. |

**Superclase:** `VisorCarreraSolo` entra en la jerarquía `VisorBase` existente. Las otras cuatro clases no comparten interfaz con ninguna familia activa, así que no requieren superclase nueva.

### 5.3 Clases existentes reutilizadas SIN modificar (D8)

| Clase | Archivo | Uso |
|---|---|---|
| `Ruta` | `src/model/ruta.js` | `new Ruta()`, `construir(tramos, totalSegs)`, `curve` (de ella se usan `getPointAt` / `getTangentAt` de Three.js para el muestreo por longitud de arco), `inicio`, `longitud`. No se usa `muestras(n)` (es uniforme en `t`, ver R2). |
| `Carro` | `src/model/carros/carro.js` | `new Carro(inicio.x, inicio.z, inicio.angle)`. Entradas: `entradaAcel` y `entradaDireccion`. `actualizar(dt=16)` avanza **un paso fijo** por llamada (la velocidad es por paso, no se escala con `dt`). Lectura: `px`, `pz`, `velAngle`, `velocidad`, `carLean`. Tope: `velMaxAdelante` (actúa siempre vía `Math.min(maxFwd, …)`) y `constArrastre` (solo actúa cuando `entradaAcel === 0`, carro.js L81). |
| `CamaraSeguimiento` | `src/view/camaras/camara_seguimiento.js` | `new CamaraSeguimiento(aspect, {distancia, altura})`, `actualizar(px, pz, velAngle, entradaDireccion)`, `altura`, `resize(aspect)`, getter `camera` (para ajustar `fov` y llamar a `updateProjectionMatrix()`). FOV por defecto 55°. |
| `VisorBase` | `src/view/visor_base.js` | `export class` de módulo ES (L13), **no** existe `window.VisorBase`. Sus utilidades son **estáticas**: `VisorBase.cargarGLTF()`, `VisorBase.construirGrupo(gltf, tipo, color)`, `VisorBase.centrarGrupo(group, 2.6)`, `VisorBase.MAPA`. No son métodos de instancia heredados. |
| `FabricaObjetoEscena` | `src/view/objetos/fabrica_objeto_escena.js` | `crear(tipo, x, z, opciones)` para `pista.decoraciones` |
| `CieloSoleado` / `CieloNocturno` | `src/view/cielo_soleado.js`, `src/view/cielo_nocturno.js` | Según `pista.tipoCielo`: `construir(scene)`, `actualizar(camara)` y `destruir(scene)` |
| `RenderizadorVelocimetro` | `src/view/velocimetros/renderizador_velocimetro.js` | `window.RenderizadorVelocimetro.dibujar(ctx, cx, cy, r, fraccion, indice)` |
| `VistaConduccion` | `vista_conduccion.js` | `aplicarA(visor, timonModelo)`, `mostrarOverlay()`, `ocultarOverlay()`, `destruirControl()` |
| `GestorOrientacion` | `src/controller/gestor_orientacion.js` | Solo se **llama** a `GestorOrientacion.liberar()` (método estático existente) al entrar a la carrera nueva. |
| `GestorAlertas` | (existente) | `GestorAlertas.mostrar(texto, tipo)` para el aviso si el visor no carga (RF-29). |
| `ConfigPista*` | `src/model/pistas/config_pista_*.js` | `window.PISTAS[clave]`: `tramos`, `totalSegs`, `cielo`, `tipoCielo` y `decoraciones` |

### 5.4 Flujo de pantallas
```
pantalla-inicio --[Jugar Solo]--> (GestorOrientacion.liberar()) --> pantalla-carrera-solo (vertical)
      cuenta 3-2-1 → ¡YA! (900 ms, ya corriendo) → carrera 3 vueltas → panel resultado
          [Revancha] → reinicia en la misma pantalla
          [Menú]     → pantalla-inicio (detiene el visor)

pantalla-ajustes --[Clásico 2D]--> pantalla-espera → pantalla-juego (horizontal, flujo actual sin cambios)
```

## 6. Requerimientos funcionales numerados

> Cada RF indica cómo verificarlo. Los RF están agrupados por fase para que agentes distintos puedan implementarlos en paralelo o en secuencia. **Dependencias:** la Fase 2 solo necesita la interfaz pública de la Fase 1, y la Fase 3 depende de las Fases 1 y 2.

### Fase 1 — Modelo (`CarreraVueltas`, `Cronometro`)

- **RF-01** — Existe `src/model/cronometro.js` con la única clase `Cronometro`. Expone `window.Cronometro` y se envuelve en `try/catch` con `window.__modelErrors`, como las demás clases del modelo.
  *Verificación:* `new window.Cronometro()` en la consola no lanza error.
- **RF-02** — `Cronometro` mide el tiempo con los métodos `iniciar()`, `pausar()`, `reanudar()`, `marcarVuelta()`, `detener()` y `reiniciar()`.
  - `tiempoTotalMs` solo crece mientras corre.
  - Tras `pausar()` el valor no cambia hasta `reanudar()`. (El MVP no usa pausa, ver S5; `pausar()`/`reanudar()` existen para que el modelo sea completo y probable.)
  - *Verificación:* con un reloj inyectado falso (`constructor(reloj = () => performance.now())`), avanzar 1000 ms → `tiempoTotalMs === 1000`; `pausar()`, avanzar 500 ms, `reanudar()`, avanzar 200 ms → `tiempoTotalMs === 1200`.
- **RF-03** — Cada `marcarVuelta()` añade el tiempo de la vuelta en curso a `tiemposVuelta` (copia de solo lectura) y reinicia `tiempoVueltaActualMs`. `mejorVueltaMs` devuelve el mínimo, o `null` si no hay vueltas.
  *Verificación:* vueltas de 30 000, 28 000 y 29 000 → `mejorVueltaMs === 28000`.
- **RF-04** — `Cronometro.formatear(ms)` (método de instancia) devuelve el texto `m:ss.cc`. Las centésimas se **truncan** (`Math.floor(ms / 10) % 100`), igual que `Aplicacion.#formatearTiempo`; no se redondea.
  *Verificación:* `formatear(83456)` → `"1:23.45"`; `formatear(0)` → `"0:00.00"`; `formatear(59999)` → `"0:59.99"`.
- **RF-05** — Existe `src/model/carrera_vueltas.js` con la única clase `CarreraVueltas`. Expone `window.CarreraVueltas`, sin dependencias de Three.js ni del DOM, y se envuelve en `try/catch` con `window.__modelErrors`, igual que RF-01.
  - Constructor: `constructor(muestras, totalVueltas = 3)`, donde `muestras` es el array de `{x, z, angle}` que devuelve `visor.muestrasRuta(N)`. El índice inicial es **0** (la muestra 0 coincide con `ruta.inicio`) y el progreso inicial es 0.
  - *Verificación:* `new window.CarreraVueltas(circulo100)` (array sintético de 100 puntos de un círculo) no lanza error y `progreso === 0`.
- **RF-06** — `actualizar(px, pz, pasos = 1)` calcula el **progreso por proyección**:
  - Busca la muestra más cercana en una **ventana circular** de `±V` muestras alrededor del índice anterior, con `V = round(0.1 × N)` (**±40 con N = 400**; ±10 con el círculo de 100). Los índices se envuelven **módulo N**, de modo que la ventana alrededor de la meta incluye `N−1` y `0` (idx 399 → 0) y el cruce de meta se puede detectar.
  - `progreso = idx / N`. No usa la velocidad.
  - *Verificación:* en el círculo sintético de 100 puntos, avanzando de 5 en 5 muestras desde 0 hasta la 25 da `progreso === 0.25`. Mover el carro hacia atrás hace que el progreso disminuya. Desde idx 98, una posición en la muestra 1 da `progreso === 0.01` (envolvimiento).
- **RF-07** — `actualizar` calcula `lateral` (con signo) como distancia al **segmento** entre la muestra elegida y su vecina más cercana (ver glosario). Expone el getter `enPasto`, que vale `true` si `|lateral| > 4.7`.
  - **Regla del pasto (D3, lógica de modelo):** el modelo mantiene `fraccionTope` (inicial 1). En cada `actualizar` aplica `pasos` veces `fraccionTope += (objetivo − fraccionTope) × 0.05`, con `objetivo = enPasto ? 0.4 : 1`. Expone los getters `fraccionTope` (0.4..1) y `factorArrastre` (3 en el pasto, 1 fuera).
  - *Verificación:* un punto desplazado 5 u en perpendicular da `enPasto === true`; desplazado 3 u da `false`. Con un punto a mitad de un segmento largo entre dos muestras, desplazado 3 u, también da `false` (no se mide a la muestra sola). Estando en el pasto, tras `actualizar(…, 60)` → `fraccionTope ≤ 0.43`; tras otros 60 pasos → `fraccionTope < 0.41`; volviendo al asfalto, sube hacia 1 con la misma ley.
- **RF-08** — **Puntos de control en orden (D5).** Se cuentan solo **cruces hacia adelante** (glosario): PC1 se marca cuando hay cruce hacia adelante de 0.33; PC2, cuando hay cruce hacia adelante de 0.66 con PC1 ya marcado. Una vuelta se cuenta cuando hay cruce hacia adelante de la meta con PC1 y PC2 marcados; entonces PC1 y PC2 se reinician.
  - Ningún cambio con `|Δ| ≥ 0.5` marca PC ni meta (se ignora como salto inválido).
  - **Cortar** = intentar avanzar el progreso sin recorrer la pista (atajar por el césped o saltar). Con la ventana circular el progreso no puede avanzar más de `V/N = 0.1` por llamada, y no se marca ningún PC que no se haya cruzado hacia adelante.
  - *Verificación (todas las secuencias se pasan con posiciones intermedias cada 0.05, menor que la ventana):*
    - Recorrer 0 → 0.5 → 0 hacia atrás no suma vuelta.
    - Recorrer 0 → 0.34 → 0.67 → 0.99 → 0.01 suma exactamente una vuelta.
    - **Corte:** con el carro en la muestra 40 (0.1), llamar a `actualizar` con la posición de la muestra 200 (0.5) deja `progreso ≤ 0.2`, no marca PC1 y no suma vuelta.
- **RF-09** — Retroceder a través de la meta (cruce de meta hacia atrás) **no** cuenta vuelta y **reinicia PC1 y PC2** de la vuelta en curso.
  *Verificación:* la secuencia 0.05 → 0.95 → 0.05 → 0.34 → 0.67 → 0.99 → 0.01 (con pasos intermedios de 0.05) suma **exactamente 1 vuelta**: la ida 0.05 → 0.95 hacia atrás reinicia los PC, el regreso 0.95 → 0.05 cruza la meta sin PC y no cuenta, y solo el último tramo completa la vuelta.
- **RF-10** — Getters expuestos: `vueltaActual` (1..3 mientras corre; 3 al terminar), `totalVueltas`, `progreso`, `lateral`, `enPasto`, `fraccionTope`, `factorArrastre`, `terminada` y `puntoControlSiguiente` (1, 2 o 3).
  *Verificación:* tras 3 vueltas válidas, `terminada === true` y nuevas llamadas a `actualizar` no cambian `vueltaActual`.
- **RF-11** — `actualizar` devuelve un evento de texto por frame: `'nada'`, `'puntoControl'`, `'vuelta'` o `'meta'` (fin de carrera). Así el controlador sabe cuándo llamar a `Cronometro.marcarVuelta()`.
  *Verificación:* el último cruce válido devuelve `'meta'`; los dos anteriores, `'vuelta'`.
- **RF-12** — `reiniciar()` vuelve el modelo a vuelta 1, índice 0, progreso 0, `fraccionTope = 1`, `terminada = false` y puntos de control a cero, sin crear una instancia nueva.
  *Verificación:* después de terminar y llamar a `reiniciar()`, `vueltaActual === 1`, `progreso === 0` y `terminada === false`.

### Fase 2 — Vista (`VisorCarreraSolo`, `HudCarrera`)

- **RF-13** — Existe `src/view/pistas/visor_carrera_solo.js` con la única clase `VisorCarreraSolo extends VisorBase`. Llama a `super()` y termina con `window.VisorCarreraSolo = VisorCarreraSolo`.
  *Verificación:* tras cargar la página, `typeof window.VisorCarreraSolo === 'function'` y `Object.getPrototypeOf(window.VisorCarreraSolo.prototype).constructor.name === 'VisorBase'` (no existe `window.VisorBase`, así que no se usa `instanceof window.VisorBase`).
- **RF-14** — Constructor `constructor(canvas, pista)`, donde `pista` es `window.PISTAS[clave]`.
  - Construye la ruta con `new Ruta()` y `construir(pista.tramos, pista.totalSegs)`.
  - Crea `new Carro(inicio.x, inicio.z, inicio.angle)`.
  - Crea la `CamaraSeguimiento`. Si el aspecto (ancho/alto del canvas) es < 1, sube `camara.camera.fov` a **78°** y usa `{ distancia: 9, altura: 3.6 }`, y llama a `updateProjectionMatrix()`; con aspecto ≥ 1 deja los valores por defecto (55°). Todo con el getter `camera` existente, sin modificar `CamaraSeguimiento`.
  - *Verificación:* el carro aparece sobre la línea de meta mirando en el sentido de la pista y, en 390×844, se ve el ancho completo de la pista (8 u) y la curva siguiente.
- **RF-15** — Ciclo de vida igual al de los otros visores:
  - `async cargar(tipoAuto, color)` carga el GLB con las utilidades **estáticas** `VisorBase.cargarGLTF()`, `VisorBase.construirGrupo(…)` y `VisorBase.centrarGrupo(…, 2.6)`.
  - `iniciar()` arranca **el único** `requestAnimationFrame` de la carrera y la reacción al resize. El canvas se dimensiona al **contenedor** de `pantalla-carrera-solo` (`ancho = min(innerWidth, 480)`, `alto = innerHeight`), no a `innerWidth`; en el resize se recalcula igual y se vuelve a aplicar la regla de FOV de RF-14.
  - **Paso fijo de 60 Hz:** en cada RAF suma el tiempo real transcurrido (máximo 250 ms) a un acumulador y llama a `carro.actualizar(16)` mientras el acumulador sea ≥ 16.67 ms, con un **máximo de 5 pasos por frame**. Guarda el número de pasos en el getter `pasosUltimoFrame`. Congelado (RF-22) ejecuta 0 pasos y vacía el acumulador. `Carro` no se modifica.
  - `alActualizar(fn)` registra **un** callback que el visor invoca una vez por RAF, **después** de los pasos de `carro.actualizar` y **antes** de renderizar.
  - `detener()` cancela el RAF, desconecta los observadores, destruye el cielo y los objetos, hace `renderer.dispose()` y fuerza `WEBGL_lose_context`.
  - *Verificación:* tras `detener()` no quedan frames pedidos (no hay errores en la consola) y el contexto WebGL se libera. Con el RAF limitado a 30 FPS (emulación de CPU) y a 120 Hz, recorrer 100 u en recta a fondo tarda lo mismo (±5 %).
- **RF-16** — **Asfalto iluminado (D8).** El asfalto se ve gris medio desde la cámara de seguimiento, no casi negro. Para lograrlo:
  - Generar la cinta con caras orientadas hacia +Y (orden de índices `a,b,c, b,d,c`), usando la **misma polilínea por longitud de arco** que `muestrasRuta` (`getPointAt`, DIV = 800), para que el asfalto dibujado coincida con el que usa `CarreraVueltas` también en el tramo de cierre de las pistas abiertas.
  - Usar luces de nivel similar a `VisorTestdriveRuta`: Ambient ≈ 1.2, sol ≈ 2.2 y relleno ≈ 0.5.
  - *Verificación:* en una captura 390×844 (`captura.mjs` con `--use-gl=angle`, `headless:false`, Xvfb), la luminancia media de una zona de asfalto delante del carro es **≥ 70/255** y **≥ 1.5×** la de Diseño General con la misma pista y cámara.
- **RF-17** — **Línea central visible (D8).** Se dibuja una línea discontinua amarilla (`0xffee44`, ±0.22, y = 0.03, DASH 14 / GAP 10) en todo el recorrido. También se dibuja la línea de meta blanca (`-4..4`, índices 0..5). Ambas con caras hacia +Y (o `DoubleSide`) para que se vean desde arriba.
  *Verificación:* las dos se ven en la captura vertical y al recorrer la pista completa.
- **RF-18** — La escena incluye el pasto (plano en y = −0.01), los pianos rojo/blanco en ±4..±4.7 **con el mismo orden de índices `a,b,c, b,d,c`** (caras hacia +Y), las decoraciones de `pista.decoraciones` mediante `FabricaObjetoEscena.crear`, y un cielo según `pista.tipoCielo` (`CieloSoleado` o `CieloNocturno`) actualizado cada frame.
  *Verificación:* la pista Ciudad muestra postes y flechas; Costa muestra cielo soleado; los pianos se ven rojo/blanco claros, no oscuros.
- **RF-19** — Interfaz de entrada compatible con `VistaConduccion.aplicarA`:
  - Campos públicos `entradaAcel = 0` y `entradaDireccion = 0`.
  - Setter `alturaCamara`, getter `camAereaActiva` (siempre `false`) y método `toggleCamaraAerea()` (no hace nada en el MVP).
  - Antes de cada paso copia `entradaAcel` y `entradaDireccion` al `Carro`.
  - *Verificación:* con `ControlTimon` y con `ControlTeclado` el carro acelera, frena y gira.
- **RF-20** — Pose y pista expuestas solo para lectura:
  - Getters `px`, `pz`, `velocidad`, `velocidadMaxBase` (el `velMaxAdelante` original guardado al crear el carro) y `pasosUltimoFrame`.
  - Método `muestrasRuta(n)` que devuelve `n` puntos `{x, z, angle}` **por longitud de arco** (`ruta.curve.getPointAt(i/n)` y `angle = atan2(t.x, t.z)` con `getTangentAt(i/n)`), para que el controlador alimente a `CarreraVueltas`.
  - No expone `velocimetroModelo`: el controlador lo lee de `estado.velocimetroModelo` (RF-28).
  - *Verificación:* `visor.muestrasRuta(400).length === 400`, la muestra 0 coincide con `ruta.inicio` y la distancia entre muestras consecutivas es constante (±5 %) incluso en Cañón Rojo.
- **RF-21** — **Aplicación del tope de pasto (D3) sin modificar `Carro`.** El método `aplicarTope(fraccion, factorArrastre)` solo **copia** valores que calculó el modelo (RF-07): `carro.velMaxAdelante = velocidadMaxBase × fraccion` y `carro.constArrastre = arrastreBase × factorArrastre`. El visor no decide la regla ni suaviza.
  - Con ACEL pulsado, la bajada depende solo de `velMaxAdelante` vía `Math.min(maxFwd, …)` de `Carro`; `constArrastre` solo actúa sin ACEL (carro.js L81).
  - Al reemplazar el carro (RF-23) se reaplica el último tope.
  - *Verificación:* a velocidad máxima con ACEL pulsado, al entrar al pasto la velocidad baja a ≤ 43 % en 1 s y a ~40 % en 2 s (valores derivados de lerp 0.05 por paso a 60 Hz), sin caídas mayores de 3 % por paso. Al volver al asfalto se recupera el tope normal con la misma ley. No hay reinicio de posición.
- **RF-22** — `congelar(bool)`: mientras está congelado, el visor sigue renderizando pero el carro no se mueve (0 pasos, se ignoran las entradas). Se usa en la cuenta regresiva y en el resultado.
  *Verificación:* durante el 3-2-1, pulsar ACEL no mueve el carro.
- **RF-23** — `reiniciarCarro()` devuelve el carro a `ruta.inicio` con velocidad 0, creando un `Carro` nuevo en la misma escena sin recargar el GLB.
  *Verificación:* tras Revancha, el carro aparece en la meta, parado, con el mismo modelo y color.
- **RF-24** — Existe `src/view/hud_carrera.js` con la única clase `HudCarrera`. Recibe en el constructor los elementos de `pantalla-carrera-solo` (canvas del HUD, capa de cuenta y panel de resultado) y expone `window.HudCarrera`. Dimensiona su canvas al ancho de la columna (`min(innerWidth, 480)` × `innerHeight`) y lo recalcula en el resize.
  *Verificación:* se instancia sin errores con los ids de RF-36.
- **RF-25** — `HudCarrera.dibujar(vuelta, totalVueltas, textoCronometro, fraccionVel, indiceVelocimetro)`:
  - Pinta arriba "VUELTA X/3" y el cronómetro.
  - Pinta el velocímetro pequeño (r ≈ 40 px) con `window.RenderizadorVelocimetro.dibujar` en una **posición fija** en ambos modos de control: esquina inferior derecha de la columna, con centro en `(anchoColumna − 56, alto − 120 − 56)`, es decir justo encima de la banda de controles de 120 px (sobre ACEL/FRENO con timón; sobre ▶ con teclado) (D10).
  - Si `RenderizadorVelocimetro` no existe, omite el velocímetro sin error.
  - *Verificación:* captura vertical 390×844 con los tres elementos sin solaparse con el timón ni con los botones, en modo timón y en modo teclado.
- **RF-26** — `HudCarrera.mostrarCuenta(texto)` / `ocultarCuenta()` muestran "3", "2", "1" y "¡YA!" grandes y centrados sobre la pista.
  *Verificación:* "3", "2" y "1" se ven con el carro quieto; "¡YA!" se ve 900 ms con el carro ya en movimiento y luego desaparece (RF-30).
- **RF-27** — `HudCarrera.mostrarResultado(textoTotal, textoMejorVuelta, alRevancha, alMenu)` muestra el panel con el tiempo total, la mejor vuelta y los botones **Revancha** y **Menú**, que ejecutan los callbacks. `ocultarResultado()` lo esconde. El panel es `position: fixed` con `z-index` **mayor que 20** (por encima de `.ctrl-overlay`).
  *Verificación:* el panel aparece al terminar, ningún control lo tapa y cada botón dispara su callback una sola vez.

### Fase 3 — Controlador e integración (`ControladorCarreraSolo`, `index.html`, `aplicacion.js`)

- **RF-28** — Existe `src/controller/controlador_carrera_solo.js` con la única clase `ControladorCarreraSolo`. Expone `window.ControladorCarreraSolo` y su constructor es `constructor(estado, vistaConduccion, alSalir)`. Lee `estado.pista` (por defecto `'ciudad'` si no existe en `window.PISTAS`), `tipoAuto`, `color`, `timonModelo` y `velocimetroModelo` (D4).
  *Verificación:* con la pista "Cañón Rojo" elegida en ⚙→Pistas y el carro SUV rojo, la carrera usa esa pista y ese carro, y conduciendo por el asfalto dibujado (incluido el tramo de cierre) `enPasto` nunca es `true`.
- **RF-29** — `iniciar()`:
  - Si `window.VisorCarreraSolo` no existe, reintenta con `setTimeout` cada 150 ms, **máximo 40 intentos (6 s)**. Guarda el id del timeout en un campo privado. Si el flag privado `#detenido` está activo, el reintento no hace nada. Si se agotan los intentos, registra el error en `window.__modelErrors`, muestra un aviso con `GestorAlertas.mostrar(…)` y llama a `alSalir` (vuelve a `pantalla-inicio`).
  - Crea el visor (que dimensiona su canvas al contenedor, RF-15), el `CarreraVueltas` (con `visor.muestrasRuta(400)`), el `Cronometro` y el `HudCarrera`.
  - Llama a `vistaConduccion.aplicarA(visor, timonModelo)` y `mostrarOverlay()`, registra `visor.alActualizar(…)` (RF-31) y luego llama a `cargar` e `iniciar`.
  - Arranca la cuenta regresiva.
  - *Verificación:* desde Inicio → Jugar Solo se ve la pista con el carro y la cuenta empieza en menos de 3 s en una conexión normal. Bloqueando el módulo de Three.js, a los ~6 s aparece el aviso, se vuelve a Inicio y no hay bucle infinito.
- **RF-30** — **Cuenta regresiva interna:** "3", "2" y "1" cada 900 ms, con el visor congelado. Al mostrar "¡YA!", descongela el visor y llama a `cronometro.iniciar()`; "¡YA!" queda en pantalla **900 ms** con el carro ya controlable y el cronómetro corriendo, y después se llama a `hud.ocultarCuenta()`. No muestra `pantalla-espera`.
  *Verificación:* durante "3-2-1", la pantalla activa es `pantalla-carrera-solo` y el cronómetro marca 0:00.00; al aparecer "¡YA!" el cronómetro empieza a contar.
- **RF-31** — **Bucle por frame:** se usa **solo el callback del visor** (`visor.alActualizar`, RF-15); el controlador no tiene RAF propio. En cada llamada:
  - Si la carrera está corriendo, pasa `(visor.px, visor.pz, visor.pasosUltimoFrame)` a `carrera.actualizar`.
  - Llama a `visor.aplicarTope(carrera.fraccionTope, carrera.factorArrastre)`.
  - Con el evento `'vuelta'` llama a `cronometro.marcarVuelta()`; con `'meta'`, a `marcarVuelta()` y `detener()`.
  - Llama a `hud.dibujar(...)` con `fraccionVel = min(1, |velocidad| / velocidadMaxBase)` e `indiceVelocimetro = estado.velocimetroModelo`.
  - *Verificación:* el contador pasa de 1/3 a 2/3 y a 3/3 solo tras recorrer la pista completa. En el pasto la aguja baja a ~40 %.
- **RF-32** — **Fin de carrera:** con el evento `'meta'`, congela el visor, llama a `vistaConduccion.ocultarOverlay()` (el timón deja de responder y no tapa el panel) y muestra el resultado con `cronometro.formatear(tiempoTotalMs)` y `formatear(mejorVueltaMs)`.
  *Verificación:* el tiempo total mostrado coincide (±50 ms) con la suma de los tiempos de las 3 vueltas, y el timón/botones no se ven sobre el panel.
- **RF-33** — **Revancha:**
  - Oculta el resultado, llama a `carrera.reiniciar()`, `cronometro.reiniciar()` y `visor.reiniciarCarro()`, llama a `vistaConduccion.mostrarOverlay()` y vuelve a lanzar la cuenta.
  - No recrea el contexto WebGL ni vuelve a llamar a `aplicarA`.
  - *Verificación:* 5 revanchas seguidas no aumentan el número de canvas ni de contextos WebGL, no aparecen avisos de "Too many active WebGL contexts" y los controles vuelven a verse.
- **RF-34** — **Menú:** llama a `detener()` y luego al callback `alSalir`, que lleva a `pantalla-inicio`.
  *Verificación:* se ve la pantalla de inicio y el overlay del timón/botones está oculto.
- **RF-35** — `detener()`:
  - Activa `#detenido`, cancela el timeout de reintento de RF-29 y los temporizadores de la cuenta (no hay RAF propio que cancelar: el único RAF es el del visor).
  - Llama a `vistaConduccion.ocultarOverlay()` y `destruirControl()`, luego a `visor.detener()` (si existe), y deja las referencias en `null`.
  - Es idempotente.
  - *Verificación:* llamar a `detener()` dos veces no lanza errores; tras salir, `#ctrl-timon` y `#ctrl-botones` no se ven. Pulsar Menú o atrás antes de que exista `window.VisorCarreraSolo` no crea después ningún visor, contexto WebGL ni overlay.
- **RF-36** — **index.html:**
  - Añadir `<div id="pantalla-carrera-solo" class="pantalla">` antes de los controles globales (L766), en el mismo padre que `#ctrl-timon` y `#ctrl-botones`. Debe contener una columna centrada (`width: min(100vw, 480px); margin: 0 auto; height: 100%`) con el canvas 3D, el canvas del HUD, la capa de cuenta y el panel de resultado con los botones Revancha/Menú (ids: `canvas-carrera-solo`, `canvas-hud-carrera-solo`, `cuenta-carrera-solo`, `resultado-carrera-solo`, `btn-revancha-solo`, `btn-menu-solo`).
  - Añadir un `<style>` nuevo en index.html. Como los overlays están **fuera** de la pantalla, se usan selectores de hermano general, que solo aplican mientras la pantalla tiene `.activa`:
    `#pantalla-carrera-solo.activa ~ #ctrl-timon, #pantalla-carrera-solo.activa ~ #ctrl-botones { left: 50%; right: auto; transform: translateX(-50%); width: min(100vw, 480px); }`
    y `#resultado-carrera-solo { position: fixed; z-index: 30; }`. Al quitar `.activa` (salir de la pantalla) los overlays recuperan automáticamente su estilo original de `style.css`, sin código de restauración.
  - Añadir `<script type="module" src="src/view/pistas/visor_carrera_solo.js?v=11">` en el bloque de módulos (L792-797).
  - Añadir `cronometro.js`, `carrera_vueltas.js`, `hud_carrera.js` y `controlador_carrera_solo.js` como scripts clásicos antes de `aplicacion.js`, con `hud_carrera.js` después de los velocímetros.
  - *Verificación:* la consola no muestra errores 404 ni ReferenceError al cargar. Tras salir de la carrera, en Clásico 2D, Test Drive 3D y Circuito 3D, `getComputedStyle(#ctrl-timon).left === '0px'` y `transform === 'none'` (igual que antes del cambio).
- **RF-37** — **Botón "Clásico 2D"** en `.ajustes-menu` de `pantalla-ajustes`, con la misma estructura que los demás `.ajuste-item` (`id="btn-clasico-2d"`, icono, texto "Clásico 2D" y flecha ›).
  *Verificación:* el botón se ve en ⚙ Ajustes.
- **RF-38** — **aplicacion.js, `#btn-solo`:** pone `#estado.nombre` y `modoSolo = true`, llama a **`GestorOrientacion.liberar()`** (método existente; quita un posible bloqueo en horizontal que haya dejado Clásico 2D, por ejemplo al salir con el botón atrás en una PWA instalada), luego a `#mostrar('pantalla-carrera-solo')` y después crea y arranca `new ControladorCarreraSolo(this.#estado, this.#vistaConduccion, () => this.#mostrar('pantalla-inicio'))`. La instancia se guarda en un campo privado nuevo `#carreraSolo`.
  *Verificación:* pulsar "Jugar Solo" no muestra `pantalla-espera` ni `pantalla-juego`.
- **RF-39** — **aplicacion.js, `#btn-clasico-2d`:** pone `#estado.nombre` (desde `inp-nombre`, o "Jugador" si está vacío) y `modoSolo = true`, y llama a `#iniciarCuentaRegresiva()`, exactamente lo que hacía antes `btn-solo`.
  *Verificación:* el flujo y el resultado 2D son idénticos a los de la versión anterior, incluida la exigencia de horizontal.
- **RF-40** — **aplicacion.js, `#mostrar(id)` y `popstate`:**
  - Al salir de `pantalla-carrera-solo` hacia cualquier otra pantalla (también con el botón atrás del sistema o `popstate`), llama a `#carreraSolo.detener()` y pone el campo a `null`, siguiendo el patrón de `#detenerVisorDG()`.
  - Si el destino es `pantalla-carrera-solo` y `#carreraSolo` es `null` (por ejemplo, botón "adelante" del navegador o un `popstate` con ese estado), redirige a `pantalla-inicio` en lugar de mostrar una pantalla vacía.
  - *Verificación:* salir con el botón atrás del celular a mitad de carrera libera el visor (sin RAF activo ni errores) y no deja el timón en pantalla. Pulsar después "adelante" lleva a Inicio, no a una pantalla negra sin controles.
- **RF-41** — **Sin aviso de rotación (D9).** En un celular en vertical, durante toda la carrera nueva (cuenta, carrera y resultado) no aparece `#pantalla-rotar`. `GestorOrientacion` no se modifica y `pantalla-carrera-solo` no se añade a `#PANTALLAS_LANDSCAPE`. (`#mostrar` oculta `#pantalla-rotar` por ser `.pantalla`, y la regla `@media (orientation: portrait)` de style.css solo aplica dentro de `#pantalla-juego`.)
  *Verificación:* emulación móvil 390×844 con touch: `#pantalla-rotar` permanece con `display:none`. Caso adicional: jugar Clásico 2D, salir con el botón atrás del sistema y pulsar "Jugar Solo" → la carrera se ve en vertical (se llamó a `GestorOrientacion.liberar()`, RF-38).
- **RF-42** — **Layout vertical (D10):** toda la composición vive en una columna de ancho `min(innerWidth, 480)` px, centrada horizontalmente (en móvil ocupa todo el ancho; en PC deja márgenes laterales).
  - Arriba: vuelta X/3 y cronómetro.
  - Centro: pista y carro (canvas 3D del ancho de la columna).
  - Banda inferior (120 px, overlays de `VistaConduccion` centrados con el `<style>` de RF-36):
    - **Modo timón (`ControlTimon`):** timón abajo a la izquierda y ACEL/FRENO abajo a la derecha.
    - **Modo teclado (`ControlTeclado`):** se ven los botones ◀ ▲▼ ▶ que muestra `ControlTeclado.mostrarOverlay()` (sin modificarlo); se conduce con flechas/WASD.
  - Velocímetro pequeño en posición fija abajo a la derecha de la columna, encima de la banda (RF-25), en ambos modos.
  - *Verificación:* capturas 390×844 (móvil, modo timón) y 1280×960 (PC, modo teclado) muestran esa disposición sin elementos cortados y sin que los controles salgan de la columna.

## 7. Requerimientos no funcionales

- **RNF-01 — POO estricta.** Todo es una clase instanciable. Prohibido usar funciones sueltas, objetos literales como entidades o `window.X = {…}`. Los `{}` solo se permiten como variables locales temporales dentro de un método. Por ejemplo, los estados de carrera son constantes de texto internas de `CarreraVueltas`, no un objeto global.
- **RNF-02 — Una clase por archivo.** El nombre del archivo es el de la clase en snake_case español (`CarreraVueltas` → `carrera_vueltas.js`). Se crean exactamente 5 archivos nuevos de código.
- **RNF-03 — Encapsulamiento.** Todo el estado interno va en `#privados`. Solo se exponen getters y setters que otra clase necesita. Únicas excepciones públicas: `entradaAcel` y `entradaDireccion` del visor, que exige la interfaz de `ControlEntrada` y `VistaConduccion`.
- **RNF-04 — MVC.**
  - Modelo (`CarreraVueltas`, `Cronometro`): sin Three.js ni DOM. Contiene **todas** las reglas de negocio y física nueva: vueltas, puntos de control, tiempos y la regla del pasto (umbral, fracción 0.4, suavizado 0.05 por paso, factor de arrastre ×3).
  - Vista (`VisorCarreraSolo`, `HudCarrera`): sin reglas de vueltas, tiempos ni pasto. El visor solo integra el `Carro` existente con paso fijo y **copia** al `Carro` el tope que recibe (`aplicarTope`).
  - Controlador (`ControladorCarreraSolo`): sin física ni dibujo directo. El ajuste de los overlays en vertical se hace por CSS (RF-36), no desde el controlador.
- **RNF-05 — Nombres en español.** Clases, archivos, métodos, atributos e ids nuevos en español. Inglés solo en APIs externas (Three.js), acrónimos (HUD, GLB) y miembros heredados existentes (`entradaAcel`, `camAereaActiva`…).
- **RNF-06 — Herencia.** `VisorCarreraSolo extends VisorBase` y llama a `super()`. El orden de `<script>` garantiza que cada dependencia se carga antes que quien la usa.
- **RNF-07 — Cambios mínimos (D7).** Solo se modifican `index.html` y `src/controller/aplicacion.js`, y solo en lo descrito en RF-36 a RF-40.
  - No se tocan `Ruta`, `Carro`, `CamaraSeguimiento`, `VisorBase`, `FabricaObjetoEscena`, cielos, `RenderizadorVelocimetro`, `ConfigPista*`, `VisorDisenoPista`, `GestorOrientacion`, `VistaConduccion`, `ControlTimon`, `ControlTeclado`, `Juego`, `src/style.css` ni **`CLAUDE.md`** (misma lista que la sección 4).
  - *Verificación:* `git diff --stat` muestra solo esos 2 archivos modificados más los 5 nuevos (y este PRD). `CLAUDE.md` no aparece.
- **RNF-08 — Rendimiento.** ≥ 30 FPS sostenidos en un móvil de gama media en vertical. La búsqueda del punto más cercano usa una ventana local circular (±40 de 400), no recorre todas las muestras cada frame. La velocidad del juego no depende de los FPS (paso fijo de 60 Hz, RF-15). Sin fugas **dentro de una sesión de carrera**: tras 5 revanchas y salir, la memoria GPU vuelve al nivel previo. Las entradas y salidas repetidas a la pantalla heredan la fuga existente de `ControlTimon` (R12) y no forman parte de esta verificación.
- **RNF-09 — Robustez.** Los errores de carga del GLB o de una pista inexistente no rompen la app: se usa `'ciudad'` como respaldo y el error se registra en la consola o en `window.__modelErrors`. Si el módulo del visor no carga en 6 s, se avisa y se vuelve a Inicio (RF-29). El controlador funciona aunque `window.RenderizadorVelocimetro` falte.
- **RNF-10 — Compatibilidad.** Chrome/Safari móviles y Chrome/Edge/Firefox de escritorio. Funciona con `ControlTimon` (táctil) y `ControlTeclado` (flechas/WASD), según la preferencia de `VistaConduccion`.
- **RNF-11 — No regresión.** "Clásico 2D", multijugador (crear/unirse), Test Drive 3D, Diseño General y Diseño Objetos se comportan igual que antes, incluida la posición de `#ctrl-timon` y `#ctrl-botones` (RF-36).
- **RNF-12 — Verificabilidad visual.** Las capturas se toman con `captura.mjs` usando `--use-gl=angle`, `headless:false` y Xvfb (ver CLAUDE.md), en 390×844 y 1280×960.
- **RNF-13 — Flujo de trabajo.** Desarrollo en la rama `claude/system-overview-Z6Zik`, con merge y push a `main` al terminar cada cambio. No se toca código sin una orden explícita del usuario.

## 8. Criterios de aceptación del MVP

1. **Inicio vertical:** en un celular en vertical, Inicio → "Jugar Solo" abre `pantalla-carrera-solo` sin pasar por `pantalla-espera`, y **nunca** aparece "GIRA TU CELULAR". También después de haber jugado Clásico 2D y salido con el botón atrás del sistema (RF-38, RF-41).
2. **Configuración aplicada:** la carrera usa la pista elegida en ⚙→Pistas (Ciudad si no se eligió ninguna) y el carro, color, timón y velocímetro del garaje.
3. **Cuenta regresiva:** se muestra 3-2-1-¡YA! y el carro no se mueve hasta "¡YA!". El cronómetro empieza en 0:00.00 justo en ese momento y "¡YA!" desaparece a los 900 ms.
4. **Vueltas:** el HUD muestra "VUELTA 1/3", "2/3" y "3/3". Una vuelta solo cuenta tras cruzar hacia adelante el 33 %, el 66 % y la meta en orden. Ir en reversa por la meta y volver no suma vueltas (secuencia de RF-09), y **cortar** (definido en RF-08: saltar progreso sin recorrer la pista) no marca puntos de control ni suma vueltas.
5. **Pasto:** fuera de la pista la velocidad máxima baja de forma gradual al 40 % (≤ 43 % en 1 s), sin choque ni reinicio. Al volver al asfalto se recupera la velocidad normal. Conducir por el asfalto dibujado nunca activa el pasto, en ninguna pista.
6. **Visual:** el asfalto se ve gris (luminancia ≥ 70/255, RF-16) y la línea central amarilla discontinua es visible en todo el recorrido, igual que la línea de meta y los pianos.
7. **Resultado:** al completar la 3.ª vuelta el carro se detiene, los controles se ocultan y aparece el panel con el tiempo total y la mejor vuelta (`m:ss.cc`), con los botones Revancha y Menú.
8. **Revancha:** reinicia la carrera en la misma pantalla (carro en la meta, vuelta 1/3, cronómetro en 0, controles visibles) sin recargar y sin crear contextos WebGL nuevos.
9. **Menú / Atrás:** Menú o el botón atrás del sistema vuelven a Inicio, liberan el visor y ocultan el timón y los botones. El botón "adelante" no deja una pantalla negra.
10. **Layout:** en vertical se ve arriba vuelta y cronómetro; en el centro la pista; abajo a la izquierda el timón; abajo a la derecha ACEL/FRENO con el velocímetro encima. En PC con teclado, la misma composición en una columna centrada de ≤ 480 px, con los botones ◀ ▲▼ ▶ de `ControlTeclado` en la banda inferior y el velocímetro en la misma posición.
11. **Clásico 2D:** ⚙ Ajustes muestra "Clásico 2D", que abre la carrera 2D actual en horizontal, idéntica a la versión anterior (controles en su posición original).
12. **Archivos:** existen exactamente las 5 clases nuevas en sus archivos. Solo `index.html` y `aplicacion.js` tienen cambios (ni `style.css` ni `CLAUDE.md`), y no hay errores en la consola en todo el flujo.

## 9. Riesgos y supuestos

### Riesgos
| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R1 | **Solo Ciudad es un circuito cerrado** (hueco de cierre ≈ 4 u). Costa (≈ 992 u), desierto (≈ 834 u), montaña/Cañón Rojo (≈ 614 u, con giro de 144°) y volcán (≈ 818 u) no vuelven al origen. `Ruta` usa `CatmullRomCurve3(pts, true)` y une el final con el inicio con un tramo artificial que ocupa solo ~1/300 de `t`. Con muestreo uniforme en `t`, ese tramo tendría ~1 muestra y el lateral saldría enorme (pasto falso durante 600–1000 u por vuelta). | En esas pistas, la "vuelta" incluye un tramo largo artificial sin decoraciones. | Muestras y asfalto por **longitud de arco** (`getPointAt`, RF-16/RF-20) y lateral medido al **segmento** (RF-07): el tramo de cierre recibe muestras proporcionales a su longitud y el asfalto dibujado coincide con el del modelo. Verificado con Cañón Rojo (RF-28). Cerrar bien esas pistas queda fuera de alcance (requiere tocar `ConfigPista*`). |
| R2 | `Ruta.posicionEn` y `Ruta.muestras` usan `getPoint(t)`, no `getPointAt`, así que `t` no es proporcional a la distancia. | Si se usaran, PC desplazados y pasto falso (R1). | El visor no usa `ruta.muestras`: genera sus propias muestras con `getPointAt` desde `ruta.curve`, sin modificar `Ruta`. PC1/PC2 caen a 1/3 y 2/3 de la distancia real. |
| R3 | La proyección con ventana local puede "saltar" en tramos donde la pista pasa cerca de sí misma. | Progreso erróneo y vuelta falsa. | Ventana circular de ±40 de 400 alrededor del índice anterior, cruces solo hacia adelante con `|Δ| < 0.5` y PC en orden (D5, RF-08). |
| R4 | Bajar `velMaxAdelante` afecta a `sf` (agarre e inclinación) del `Carro`: más derrape en el pasto. | Sensación distinta en el pasto. | Se considera deseable. El HUD usa `velocidadMaxBase` para que la aguja no suba de forma falsa. |
| R5 | `Math.min(maxFwd, …)` de `Carro` recorta la velocidad de golpe al entrar al pasto acelerando. `constArrastre` no ayuda con ACEL pulsado. | Frenazo brusco. | Suavizado 0.05 por paso calculado en el modelo (RF-07), aplicado por el visor (RF-21): caída máxima ≈ 3 % por paso. |
| R6 | Los overlays `#ctrl-timon` / `#ctrl-botones` son `position: fixed; left: 0; right: 0; height: 120px`, globales, hermanos al final del body y **fuera** de `#pantalla-carrera-solo`. No se puede tocar `style.css`. | Timón o botones mal colocados en vertical o en PC. | `<style>` nuevo en index.html con selector de hermano `#pantalla-carrera-solo.activa ~ #ctrl-…` (RF-36), que deja de aplicar solo al salir. Validar con capturas 390×844 y 1280×960, y comprobar que en otras pantallas el estilo no cambia. |
| R7 | `#iniciarCircuito3D` pone `GestorOrientacion.saltarCheck = true` y no está claro que lo restaure. | Efectos cruzados de orientación. | La pantalla nueva no depende de `saltarCheck`: no está en `#PANTALLAS_LANDSCAPE`. No se toca. |
| R8 | `aplicacion.js` (clásico) se ejecuta antes que los módulos ES. | `window.VisorCarreraSolo` no existe todavía. | Reintento con `setTimeout` limitado a 40 × 150 ms, cancelable desde `detener()` (RF-29, RF-35). |
| R9 | La regla de CLAUDE.md "sin objetos literales" choca con `pista.decoraciones`, el retorno `{x, z, angle}` de `Ruta` y las muestras `{x, z, angle}` de `muestrasRuta`. | Discusión de cumplimiento. | Se mantiene el mismo formato que ya usa `Ruta` (datos de geometría, no entidades del juego). Se documenta como deuda existente. |
| R10 | Algunos listeners de aplicacion.js están duplicados (`btn-ir-vista-conduccion`). | Ninguno directo. | Fuera de alcance. No se corrige. |
| R11 | `screen.orientation.lock('landscape')` de `GestorOrientacion.verificar()` puede quedar activo (sobre todo en PWA instalada) si se sale de Clásico 2D con el botón atrás, porque solo `btn-menu`, `btn-exit-td3d` y `btn-exit-cir3d` llaman a `liberar()`. | "Jugar Solo" se abriría bloqueado en horizontal. | `#btn-solo` llama a `GestorOrientacion.liberar()` antes de mostrar la pantalla (RF-38). |
| R12 | Cada entrada a la carrera llama a `vistaConduccion.aplicarA` → `new ControlTimon`, y `ControlTimon.#setupCanvas` añade listeners anónimos a `#canvas-timon` y a `window` que `destruir()` no quita. `ControlTimon` no se puede modificar. | Fuga leve de listeners con muchas entradas/salidas a la pantalla. | Deuda existente (igual pasa en Test Drive y Circuito 3D). RF-33 evita repetir `aplicarA` en las revanchas; RNF-08 limita la verificación de fugas a una sesión de carrera. |
| R13 | `CLAUDE.md` mantiene la tabla de jerarquía `VisorBase` y la tabla "Visores de pista: uno por pantalla" (donde además `Aplicacion` guarda cada visor). Con este MVP, `VisorCarreraSolo` no aparece y su instancia vive en `ControladorCarreraSolo` (guardado en `#carreraSolo` de `Aplicacion`). | Documentación del proyecto desactualizada. | D7 prohíbe tocar otros archivos, así que `CLAUDE.md` no se modifica en este MVP. Se propone al usuario actualizarlo en un cambio aparte (fila `Jugar Solo → VisorCarreraSolo → pistas/visor_carrera_solo.js`). |
| R14 | Con `ControlTeclado`, `mostrarOverlay()` muestra ◀ ▲▼ ▶ sin manejadores táctiles. | Un **móvil** con preferencia "teclado" queda sin controles funcionales. | Se documenta: en móvil se recomienda el modo timón (preferencia de `VistaConduccion`). No se modifica `ControlTeclado`. |
| R15 | `CamaraSeguimiento` fija FOV vertical 55°; con aspecto 390/844 el FOV horizontal es ~27° y no cabe la pista. | Pista recortada, curvas invisibles. | FOV 78° y cámara más alejada cuando aspecto < 1, vía getter `camera` (RF-14). |

### Supuestos
- S1: `window.PISTAS[estado.pista]` existe para las claves de ⚙→Pistas. Si no, se usa `'ciudad'`.
- S2: `VisorBase.cargarGLTF()` y `vehicles_pack.glb` están disponibles igual que en los otros visores.
- S3: `VistaConduccion.aplicarA` funciona con cualquier objeto que exponga `entradaAcel`, `entradaDireccion`, `alturaCamara`, `camAereaActiva` y `toggleCamaraAerea()`.
- S4: `ruta.curve` es un `THREE.CatmullRomCurve3` con `getPointAt(u)` y `getTangentAt(u)`, así que `muestrasRuta(n)` devuelve `n` puntos `{x, z, angle}` equiespaciados por distancia.
- S5: El cronómetro usa `performance.now()`. No hay pausa en el MVP: un cambio de pestaña o el bloqueo de pantalla no pausa la carrera y el tiempo sigue corriendo.
- S6: Con paso fijo de 60 Hz (RF-15), tres vueltas en Ciudad (~1200 u por vuelta) duran entre 1 y 3 minutos en cualquier pantalla, una duración adecuada para una sesión casual.
