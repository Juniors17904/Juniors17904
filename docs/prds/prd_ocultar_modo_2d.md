# PRD — Ocultar el modo 2D (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para implementar |
| Fecha | 2026-10-21 |
| Backlog | B1 (`docs/BACKLOG.md`) |
| Reemplaza | D1 y RF-02 del PRD Carrera Solo (`prd_carrera_solo_vertical.md`), sin editar ese PRD |

## Decisiones bloqueadas

Las decisiones se tomaron con el usuario y son definitivas. Si algún requerimiento choca con ellas, mandan las decisiones.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se ocultan "Clásico 2D" y "Test Drive" (2D). "Jugar Solo" y "Test Drive 3D" se quedan. |
| D2 | Alcance | "Multijugador" y "Únete" siguen visibles, pero desactivados y con la etiqueta "Próximamente". No entran al 2D. |
| D3 | Usuarios | Quien llegue a una pantalla oculta, por el botón atrás o por un enlace viejo, vuelve a Inicio. |
| D4 | Usuarios | El selector Botones / Timón / Giroscopio de Inicio se oculta, porque solo lo usa el 2D. |
| D5 | Dominio | Ocultar significa que no se ve ni se abre. El código 2D se queda en el repo; borrarlo es B2. |
| D6 | Dominio | Este PRD reemplaza la D1 y el RF-02 del PRD Carrera Solo. |
| D7 | Técnico | "GIRA TU CELULAR" se quita de la página y ninguna pantalla visible lo activa. No se modifica ninguna clase existente fuera de las que nombra la lista única. |
| D8 | Técnico | Una sola clase nueva, `ModosDisponibles`, decide qué modos se muestran. Se permite ajustar las pruebas que esperan el 2D. |

## 1. Contexto y problema
El juego tiene dos motores. El 2D ya no se quiere en el juego: el clásico 2D, el Test Drive 2D y el multijugador, que corre en 2D y además no funciona porque faltan las claves de Supabase. El 2D también es la única parte que muestra "GIRA TU CELULAR", un aviso sin salida (lección 17).

## 2. Objetivo
Que el jugador solo vea modos 3D en vertical, que nunca aparezca "GIRA TU CELULAR" y que el multijugador quede visible como "Próximamente" hasta que se rehaga en 3D (B3), todo sin afectar el juego 3D.

## 3. Público objetivo y usuarios
- **Jugador en celular:** solo ve modos 3D y nunca tiene que girar el teléfono.
- **Jugador en PC:** ve las mismas opciones que en el celular.
- **Jugador curioso del multijugador:** ve el botón, pero sabe que todavía no está disponible.

## 4. Alcance
**In scope:**
- Ocultar "Clásico 2D", "Test Drive" (2D) y el selector de control de Inicio.
- Mostrar "Multijugador" y "Únete" desactivados, con la etiqueta "Próximamente".
- Redirigir a Inicio desde cualquier pantalla 2D.
- Quitar "GIRA TU CELULAR".
- Crear la clase `ModosDisponibles`.

**Out of scope:**
- Borrar el código 2D (B2).
- Multijugador 3D (B3).
- Configurar Supabase.
- Cambios en la carrera 3D, el garaje, las pistas, los timones o los velocímetros.

**Lista única de lo que NO se modifica:** `Juego`, `Pista`, `Segmento`, `Carro2D`, `RenderizadorPista`, `RenderizadorAuto`, `PantallaJuego`, `Controles`, `MultiJugador`, `GestorOrientacion`, `ConfigPista*` y `PISTAS`, timones, velocímetros, `Garaje`, todas las clases de la carrera 3D y `src/style.css`. Solo cambian `index.html`, `src/controller/aplicacion.js`, el archivo nuevo de `ModosDisponibles` y `pruebas/`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Modo 2D | Cualquier flujo que usa el motor 2D: Clásico 2D, Test Drive 2D y el multijugador actual. |
| Modo disponible | Un modo que el jugador puede ver y abrir. Lo decide `ModosDisponibles`. |
| Modo "Próximamente" | Un modo que se ve pero no se puede abrir. |
| Pantalla oculta | Una pantalla de un modo 2D que ya no se puede mostrar. |

## 6. Requerimientos funcionales
- **RF-01:** En ⚙ no aparecen "Clásico 2D" ni "Test Drive" (2D).
- **RF-02:** En ⚙ siguen apareciendo y funcionando "Test Drive 3D" y el resto de opciones 3D: garaje, pistas, controles, velocímetro, vista de conducción y diseño.
- **RF-03:** "Jugar Solo" funciona igual que antes, con la carrera 3D vertical.
- **RF-04:** "Multijugador" se ve en Inicio con la etiqueta "Próximamente" y al tocarlo no pasa nada.
- **RF-05:** "¿Tienes un código? Únete" se ve con la etiqueta "Próximamente" y al tocarlo no pasa nada.
- **RF-06:** El selector Botones / Timón / Giroscopio no aparece en Inicio.
- **RF-07:** "GIRA TU CELULAR" no aparece nunca, ni en vertical ni en horizontal, en ninguna pantalla.
- **RF-08:** Si se llega a una pantalla 2D (espera, juego 2D o resultado 2D) con atrás, adelante o un enlace, se muestra Inicio.
- **RF-09:** Ningún flujo visible crea la carrera 2D.
- **RF-10:** Para cambiar qué modos están disponibles basta con modificar un solo lugar: `ModosDisponibles`.
- **RF-11:** No aparecen errores nuevos en la consola en ninguna pantalla.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto:** se cumple `CLAUDE.md`: `ModosDisponibles` es una clase en su propio archivo, con nombre en español, campos `#privados`, sin `{ }` guardados y sin `if` por strings para elegir modos.
- **RNF-02, sin romper el 3D:** las pruebas actuales de la carrera 3D siguen en verde.
- **RNF-03, pruebas:** `npm run test:todo` termina en verde, incluida una prueba nueva para RF-01 a RF-09.

## 8. Criterios de aceptación del MVP
1. En celular y en PC, ⚙ no muestra modos 2D.
2. "Multijugador" y "Únete" se ven con la etiqueta "Próximamente" y no abren nada.
3. "GIRA TU CELULAR" no aparece en ningún caso.
4. "Jugar Solo" y "Test Drive 3D" funcionan igual que antes.
5. `npm run test:todo` termina en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Código 2D sin usar:** queda en el repo como código muerto hasta B2. Se acepta de forma temporal.
- **Pruebas que esperan el 2D:** la prueba que comprueba que "Clásico 2D" abre la carrera 2D cambia para comprobar que ese botón ya no está (D8).
- **Service worker:** puede mostrar un `index.html` viejo hasta que se actualice la caché. Se acepta.

### Historial
- **v1** (2026-10-21): primera versión. Usa el PRD CREATOR v2 y aplica las lecciones 1 a 20.
