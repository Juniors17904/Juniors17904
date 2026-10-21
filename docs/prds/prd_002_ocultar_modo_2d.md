# PRD 002 — Ocultar el modo 2D (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — listo para implementar |
| Fecha | 2026-10-21 |
| Backlog | B1 (`docs/BACKLOG.md`) |
| Reemplaza | Del PRD 001: la D1, el RF-02, el botón "Clásico 2D" del In scope y el criterio de aceptación 4. El PRD 001 no se edita. |

## Decisiones bloqueadas

Las decisiones se tomaron con el usuario y son definitivas. Si algún requerimiento choca con ellas, mandan las decisiones.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se ocultan "Clásico 2D" y "Test Drive" (2D). "Jugar Solo" y "Test Drive 3D" se quedan. |
| D2 | Alcance | "Multijugador" y "Únete" quedan visibles, desactivados y con el texto "Próximamente". No entran al 2D. |
| D3 | Usuarios | Si alguien llega con atrás, adelante o un enlace a crear sala, unirse, espera o resultado 2D, o a la pantalla de juego sin una carrera 3D activa, vuelve a Inicio. |
| D4 | Usuarios | El selector Botones / Timón / Giroscopio de Inicio se queda visible. Conectarlo a la carrera 3D (y el giroscopio en 3D) es B4 del backlog. |
| D5 | Dominio | "Ocultar" significa que no se ve ni se abre. El código 2D se queda en el repo; borrarlo es B2. |
| D6 | Dominio | Del PRD 001, este PRD reemplaza la D1, el RF-02, el botón "Clásico 2D" del In scope y el criterio de aceptación 4. |
| D7 | Técnico | "GIRA TU CELULAR" se oculta: el aviso sigue en la página, pero no se muestra nunca porque `aplicacion.js` deja de llamar a `GestorOrientacion`. `GestorOrientacion` no se modifica. |
| D8 | Técnico | Una sola clase nueva, `ModosDisponibles`, decide qué modos se muestran. Se permite ajustar las pruebas que esperan el 2D. |

## 1. Contexto y problema
El juego todavía tiene el modo de juego 2D, la carrera clásica vieja, que ya no se quiere en el juego. También es la única parte que muestra "GIRA TU CELULAR", un aviso que no tiene salida (lección 17). El multijugador corre en 2D y no funciona, porque faltan las claves de Supabase.

"Modo 2D" es solo esa carrera clásica. Los elementos dibujados en 2D que usa el juego 3D (timón, velocímetro, HUD, minimapa, botones y selector de control) se quedan como están.

## 2. Objetivo
Que el jugador solo encuentre modos de juego 3D, que nunca aparezca "GIRA TU CELULAR" y que el multijugador se vea como "Próximamente" hasta que se rehaga en 3D (B3), sin afectar el juego 3D.

## 3. Público objetivo y usuarios
- **Jugador en celular:** solo encuentra modos 3D y nunca tiene que girar el teléfono.
- **Jugador en PC:** ve las mismas opciones que en el celular.
- **Jugador curioso del multijugador:** ve el botón y entiende que todavía no está disponible.

## 4. Alcance
**In scope:**
- Ocultar "Clásico 2D" y "Test Drive" (2D).
- Mostrar "Multijugador" y "Únete" desactivados, con el texto "Próximamente".
- Redirigir a Inicio desde las pantallas de los modos ocultos.
- Ocultar "GIRA TU CELULAR".
- Crear la clase `ModosDisponibles`.

**Out of scope:**
- Borrar el código 2D (B2).
- Multijugador 3D (B3).
- Conectar el selector de control al 3D y el giroscopio 3D (B4).
- Configurar Supabase.
- Cambiar los elementos dibujados en 2D del juego 3D.

**Lista única de lo que NO se modifica:** `Juego`, `Pista`, `Segmento`, `Carro2D`, `RenderizadorPista`, `RenderizadorAuto`, `PantallaJuego`, `Controles`, `MultiJugador`, `GestorOrientacion`, `ConfigPista*` y `PISTAS`, timones, velocímetros, `Garaje`, todas las clases de la carrera 3D y `src/style.css`. Solo cambian `index.html`, `src/controller/aplicacion.js`, el archivo nuevo de `ModosDisponibles` y `pruebas/`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Modo 2D | La carrera clásica vieja: "Clásico 2D", "Test Drive" 2D y el multijugador actual. |
| Elemento dibujado en 2D | Una pieza de la interfaz del juego 3D, como el timón o el velocímetro. No es modo 2D. |
| Modo disponible | Un modo que el jugador puede ver y abrir. Lo decide `ModosDisponibles`. |
| Modo "Próximamente" | Un modo que se ve, pero no se puede abrir. |
| Pantalla de modo oculto | Una pantalla a la que ya no se puede llegar: crear sala, unirse, espera, resultado 2D o juego 2D. |

## 6. Requerimientos funcionales
- **RF-01:** En ⚙ no aparecen "Clásico 2D" ni "Test Drive" (2D).
- **RF-02:** En ⚙ siguen apareciendo y funcionando "Test Drive 3D" y las demás opciones: garaje, pistas, controles, velocímetro, vista de conducción y diseño.
- **RF-03:** "Jugar Solo" funciona igual que antes, con la carrera 3D vertical.
- **RF-04:** "Multijugador" se ve en Inicio con el texto "Próximamente" y al tocarlo no pasa nada.
- **RF-05:** "¿Tienes un código? Únete" se ve con el texto "Próximamente" y al tocarlo no pasa nada.
- **RF-06:** El selector Botones / Timón / Giroscopio sigue visible en Inicio y su pestaña "Timón" sigue abriendo el diseño del timón.
- **RF-07:** "GIRA TU CELULAR" no aparece nunca, ni en vertical ni en horizontal, en ninguna pantalla.
- **RF-08:** Si se llega con atrás, adelante o un enlace a crear sala, unirse, espera o resultado 2D, se muestra Inicio.
- **RF-09:** Si se llega a la pantalla de juego sin una carrera 3D activa, se muestra Inicio. El Test Drive 3D y Diseño de Pistas siguen usando esa pantalla con normalidad.
- **RF-10:** Ningún flujo visible crea la carrera 2D.
- **RF-11:** Para cambiar qué modos están disponibles basta con modificar un solo lugar: `ModosDisponibles`.
- **RF-12:** No aparecen errores nuevos en la consola en ninguna pantalla.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto:** se cumple `CLAUDE.md`. `ModosDisponibles` es una clase en su propio archivo, con nombre en español y campos `#privados`, sin `{ }` guardados y sin `if` por strings para elegir modos.
- **RNF-02, sin romper el 3D:** las pruebas actuales de la carrera 3D siguen en verde.
- **RNF-03, pruebas:** `npm run test:todo` pasa en verde, con una prueba nueva para RF-01 a RF-10.

## 8. Criterios de aceptación del MVP
1. En celular y en PC, ⚙ no muestra modos 2D.
2. "Multijugador" y "Únete" se ven con el texto "Próximamente" y no abren nada.
3. "GIRA TU CELULAR" no aparece en ningún caso.
4. Nadie puede entrar a un modo oculto con atrás, adelante o un enlace.
5. "Jugar Solo", "Test Drive 3D", el selector de control y los elementos dibujados en 2D funcionan igual que antes.
6. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Código 2D sin usar:** queda en el repo como código muerto hasta B2. Se acepta temporalmente.
- **Selector de control:** sigue visible, pero en la carrera 3D todavía no manda, porque manda la "Vista de conducción". Se resuelve en B4.
- **Pruebas que esperan el 2D:** la prueba que comprueba que "Clásico 2D" abre la carrera 2D se cambia para comprobar que ese botón ya no está (D8).
- **Service worker:** puede mostrar un `index.html` viejo hasta que se actualice la caché. Se acepta.

### Historial
- **v1** (2026-10-21): primera versión.
- **v2** (2026-10-21): tras el Verificador PRD y la conversación con el usuario. "Modo 2D" pasa a ser solo la carrera clásica; el selector de control se queda (D4, RF-06, B4); se amplía lo que se reemplaza del PRD 001 (D6); "GIRA TU CELULAR" se oculta en vez de quitarse (D7); la redirección cubre todas las pantallas de modos ocultos (D3, RF-08, RF-09).
