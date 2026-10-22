# PRD 002 — Ocultar el modo 2D (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — cerrado y verificado (Verificador PRD ✅). Listo para implementar |
| Fecha | 2026-10-21 |
| Backlog | B1 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D6 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con ellas, mandan las decisiones.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se ocultan "Clásico 2D" y "Test Drive" (2D). "Jugar Solo" y "Test Drive 3D" se quedan. |
| D2 | Alcance | "Multijugador" y "Únete" siguen visibles, pero desactivados y con el texto "Próximamente". No entran al 2D. |
| D3 | Usuarios | Si alguien llega con atrás, adelante o un enlace a la pantalla de un modo oculto, vuelve a Inicio. Las entradas normales de los modos 3D nunca se redirigen. |
| D4 | Usuarios | El selector Botones / Timón / Giroscopio de Inicio sigue visible. Conectarlo a la carrera 3D es B4. |
| D5 | Dominio | Ocultar significa que el modo no se ve ni se abre. El código 2D se queda en el repo; borrarlo es B2. |
| D6 | Dominio | Del PRD 001, este PRD reemplaza la D1, el RF-02, el botón "Clásico 2D" del In scope y el criterio de aceptación 4. |
| D7 | Técnico | "GIRA TU CELULAR" se oculta. El aviso queda en la página, pero nunca se muestra porque `aplicacion.js` deja de llamar a `GestorOrientacion`. |
| D8 | Técnico | Cada modo es una clase: una superclase `Modo` y una subclase por modo (`ModoJugarSolo`, `ModoTestDrive3D`, `ModoClasico2D`, `ModoTestDrive2D`, `ModoMultijugador`, `ModoUnirse`), cada una en su propio archivo dentro de `src/controller/modos/`. `ModosDisponibles` las registra y es el único lugar que decide si un modo está disponible, en "Próximamente" u oculto. Se pueden ajustar las pruebas que esperan el 2D. |

## 1. Contexto y problema
El juego todavía tiene el modo de juego 2D, la carrera clásica antigua. Ya no se quiere en el juego, y además es la única parte que muestra "GIRA TU CELULAR", un aviso sin salida (lección 17). El multijugador corre en 2D y no funciona porque faltan las claves de Supabase. Los elementos dibujados en 2D que usa el juego 3D no son "modo 2D" (ver §5).

## 2. Objetivo
Que el jugador solo encuentre modos 3D, que nunca aparezca "GIRA TU CELULAR" y que el multijugador se vea como "Próximamente" hasta que se rehaga en 3D (B3), sin afectar el juego 3D.

## 3. Público objetivo y usuarios
- **Jugador en celular:** solo encuentra modos 3D y nunca tiene que girar el teléfono.
- **Jugador en PC:** ve las mismas opciones que en el celular.
- **Jugador curioso del multijugador:** ve el botón y entiende que todavía no está disponible.

## 4. Alcance
**In scope:**
- Ocultar los modos 2D.
- Mostrar "Multijugador" y "Únete" como "Próximamente".
- Redirigir a Inicio desde las pantallas de modos ocultos.
- Ocultar "GIRA TU CELULAR".
- Crear las clases de modo y `ModosDisponibles`.

**Out of scope:**
- Borrar el código 2D (B2).
- Multijugador 3D (B3).
- Conectar el selector de control al 3D y el giroscopio 3D (B4).
- Configurar Supabase.
- Cambiar los elementos dibujados en 2D del juego 3D.

**Lista única de lo que NO se modifica:** `Juego`, `Pista`, `Segmento`, `Carro2D`, `RenderizadorPista`, `RenderizadorAuto`, `PantallaJuego`, `Controles`, `MultiJugador`, `GestorOrientacion`, `ConfigPista*` y `PISTAS`, timones, velocímetros, `Garaje`, todas las clases de la carrera 3D, los elementos dibujados en 2D y `src/style.css`. Solo cambian `index.html`, `src/controller/aplicacion.js`, la carpeta nueva `src/controller/modos/` y `pruebas/`. *(`VisorDisenoPista`, `VisorCarreraSolo` y `Garaje` se reordenan por dentro según el PRD 004, D9.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Modo | Una forma de jugar con nombre propio. Es una clase (`Modo`) con una subclase por modo (D8). |
| Modo 2D | La carrera clásica antigua: `ModoClasico2D`, `ModoTestDrive2D` y el multijugador actual. |
| Elemento dibujado en 2D | Una pieza de la interfaz del juego 3D, como el timón, el velocímetro, el HUD, el minimapa, los botones o el selector de control. No es un modo 2D. |
| Estado de un modo | Disponible (se ve y se abre), "Próximamente" (se ve pero no se abre) u oculto (ni se ve ni se abre). Lo decide `ModosDisponibles`. |
| Pantalla de modo oculto | Crear sala, unirse, espera, resultado 2D, o la pantalla de juego cuando no hay ningún visor 3D cargado ni arrancando. |

## 6. Requerimientos funcionales
- **RF-01 (D1):** En ⚙ no aparecen "Clásico 2D" ni "Test Drive" (2D).
- **RF-02 (D1):** En ⚙ siguen apareciendo y funcionando "Test Drive 3D" y las demás opciones: garaje, pistas, controles, velocímetro, vista de conducción y diseño.
- **RF-03 (D1):** "Jugar Solo" funciona igual que antes, con la carrera 3D vertical.
- **RF-04 (D2):** "Multijugador" se ve en Inicio con el texto "Próximamente" y al tocarlo no pasa nada.
- **RF-05 (D2):** "¿Tienes un código? Únete" se ve con el texto "Próximamente" y al tocarlo no pasa nada.
- **RF-06 (D4):** El selector Botones / Timón / Giroscopio sigue visible en Inicio y su pestaña "Timón" sigue abriendo el diseño del timón.
- **RF-07 (D7):** "GIRA TU CELULAR" no aparece nunca, ni en vertical ni en horizontal, en ninguna pantalla.
- **RF-08 (D3):** Si se llega con atrás, adelante o un enlace a crear sala, unirse, espera o resultado 2D, se muestra Inicio.
- **RF-09 (D3):** Si se llega con atrás, adelante o un enlace a la pantalla de juego sin ningún visor 3D cargado ni arrancando, se muestra Inicio. Entrar de forma normal a Test Drive 3D o a Diseño de Pistas → Entrar nunca redirige a Inicio.
- **RF-10 (D5):** Ningún flujo visible crea la carrera 2D.
- **RF-11 (RNF-03):** No aparecen errores nuevos en la consola en ninguna pantalla.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto (D8):** se cumple `CLAUDE.md`. Cada modo es una clase en su propio archivo con nombre en español y campos `#privados`. Las subclases extienden `Modo` y llaman a `super()`. No hay `{ }` guardados ni `if` por textos para elegir modos. Para cambiar el estado de un modo basta con tocar `ModosDisponibles`.
- **RNF-02, sin romper el 3D:** las pruebas actuales de la carrera 3D siguen en verde.
- **RNF-03, pruebas:** `npm run test:todo` pasa en verde e incluye una prueba nueva en navegador real para RF-01 a RF-11, donde los errores de consola cuentan como fallo. Esa prueba comprueba también que "Jugar Solo", "Test Drive 3D" y "Diseño de Pistas → Entrar" no se redirigen a Inicio, y revisa la pantalla de Inicio en vertical y en horizontal. Cada prueba indica el PRD y el RF que cubre (por ejemplo, "PRD 002 RF-01").

## 8. Criterios de aceptación del MVP
1. En celular y en PC, ⚙ no muestra modos 2D.
2. "Multijugador" y "Únete" se ven con el texto "Próximamente" y no abren nada.
3. "GIRA TU CELULAR" no aparece en ningún caso.
4. Nadie entra a un modo oculto con atrás, adelante o un enlace.
5. "Jugar Solo", "Test Drive 3D", "Diseño de Pistas", el selector de control y los elementos dibujados en 2D funcionan igual que antes.
6. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Código 2D sin usar:** queda en el repo como código muerto hasta B2. Se acepta de forma temporal.
- **Selector de control:** sigue visible, pero en la carrera 3D todavía manda la "Vista de conducción". Se resuelve en B4.
- **Prueba que espera el 2D:** la prueba que comprueba que "Clásico 2D" abre la carrera 2D pasa a comprobar que ese botón ya no está, y su etiqueta pasa a citar "PRD 002 RF-01" (D8, lección 10).
- **Redirección de la pantalla de juego:** es el caso con más riesgo de romper el 3D (lección 6), por eso RNF-03 exige probarlo en navegador real.
- **Service worker:** puede mostrar un `index.html` viejo hasta que se actualice la caché. Se acepta.

### Historial
- **v1** (2026-10-21): primera versión.
- **v2** (2026-10-21): "modo 2D" pasa a significar solo la carrera clásica; el selector de control se mantiene (B4); se amplía D6; el aviso se oculta en vez de quitarse; la redirección cubre todas las pantallas.
- **v3** (2026-10-21): correcciones de 4 agentes revisores. D8 pasa a una clase por modo (`Modo` y subclases); D3 y RF-09 aclaran que las entradas normales del 3D nunca se redirigen; cada RF cita su decisión; se quitan textos repetidos de la lista única; el antiguo RF-11 (`ModosDisponibles`) pasa a RNF-01; RNF-03 pide errores de consola, el caso de redirección del 3D y la revisión de Inicio en navegador real.
- **Cierre** (2026-10-21): Verificador PRD ✅; se agrega al PRD 001 una nota en los 4 puntos reemplazados.
