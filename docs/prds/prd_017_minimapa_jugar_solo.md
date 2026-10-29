# PRD 017 — Minimapa en Jugar Solo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — programado y en `main` |
| Fecha | 2026-10-25 |
| Backlog | B22 (`docs/BACKLOG.md`) |
| Depende de | PRD 013 (rivales), PRD 014 (camino de vuelta), PRD 015 (diseños) y PRD 016 (controles) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Solo Jugar Solo, en los dos diseños (vertical y horizontal). Los minimapas de las otras pantallas no cambian. |
| D2 | Alcance | El mapa muestra el recorrido entero de la pista (con el camino de vuelta de las pistas abiertas, PRD 014), la línea de meta y un punto por cada carro, cada uno con el color de su auto. |
| D3 | Usuarios | El punto del jugador se distingue: es más grande, tiene borde blanco y siempre se dibuja encima de los rivales. |
| D4 | Usuarios | El mapa va arriba a la derecha, debajo de la barra de vuelta, posición y tiempo, en los dos diseños. No tapa el velocímetro, la posición, el tiempo ni los controles. Cada diseño dice su tamaño: en vertical, unos 90×120 px (como los mapas que ya existen); en horizontal, un poco más grande. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* |
| D5 | Usuarios | El mapa es fijo: no gira con el carro. |
| D6 | Usuarios | Se ve desde la cuenta 3-2-1 y se oculta cuando aparece el panel de resultado. Su fondo es semitransparente para no tapar la pista. No se puede ocultar con un toque. |
| D7 | Técnico | Una clase nueva de la vista, `MinimapaCarrera`, que hereda de `MinimapBase` y vive en `src/view/minimapas/` (con su ayudante `PuntoCarroMapa`). No nombra Jugar Solo: sirve para cualquier carrera 3D, también el multijugador futuro (B3). Los puntos salen de la posición real de cada carro en la pista. El modelo no cambia y `VisorCarreraSolo` no crece. Pruebas en navegador real en 390×844 y 844×390, con capturas. |
| D8 | Dominio | **Reemplaza:** del PRD 001, el HUD de su In scope (vuelta, tiempo y velocímetro), y su D10 (lo que va arriba en vertical): ahora suma el mapa. Del PRD 015, su D4, su RF-01 y "el diseño vertical" en su lista: en vertical se suma el mapa; también crece la interfaz de `DisenoCarrera` con el tamaño del mapa. `ControladorCarreraSolo` en las listas de los PRD 002 ("todas las clases de la carrera 3D"), 005 y 016: crea el mapa y le pasa los carros. De los PRD 004 y 005, "el comportamiento y el aspecto del juego" (solo el mapa de Jugar Solo). El lugar del mapa se agrega en los estilos de Jugar Solo de `index.html`, que ningún PRD protege; `src/style.css` no cambia. `CLAUDE.md` suma `MinimapaCarrera` a la jerarquía de `MinimapBase`, `PuntoCarroMapa` (el lugar y el color de un carro) a la carpeta `src/view/minimapas/` y el tamaño del mapa a la interfaz de `DisenoCarrera`. `MinimapBase` suma una forma de pasar un lugar de la pista a un punto del mapa, sin cambiar a sus otras subclases. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
En Jugar Solo se corre contra 4 rivales (PRD 013), pero no hay forma de ver la pista entera ni dónde va cada uno. Solo se sabe la posición (por ejemplo, "2.º/5"). Las pantallas Diseño de Pistas y Diseño General ya tienen minimapa; Jugar Solo no.

## 2. Objetivo
Que el jugador vea de un vistazo la forma de la pista y por dónde va él y cada rival.

## 3. Público objetivo y usuarios
- **Jugador:** sabe qué curva viene y a qué distancia están los rivales, sin dejar de mirar la pista.
- **Desarrollador y agentes:** reusan el mismo mapa en otra carrera 3D (por ejemplo, el multijugador).

## 4. Alcance
**In scope:** D1 a D8.

**Out of scope:** ocultar o agrandar el mapa con un toque; un mapa que gire con el carro; el minimapa de las otras pantallas; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, los choques, las vueltas, el cronómetro y los rivales (PRD 006 a 014): el mapa solo lee dónde está cada carro. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(El giro y el derrape suman el peso del carro, y el manejo de los rivales se puede ajustar, según el PRD 019, D9.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*
- `VisorCarreraSolo` (no crece) y `HudCarrera`. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(Cambia según el PRD 020, D7: récords por pista.)* *(Cambia según el PRD 026, D8: pantallas con estilo de juego de carreras.)*
- Los controles de Jugar Solo (PRD 016) y el velocímetro. *(Cambia según el PRD 022, D8: sonido en Jugar Solo.)* *(Los controles cambian según el PRD 021, D9: estilos de timón y pedales.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*
- Los minimapas de las otras pantallas (`MinimapaDisenoGeneral`, `MinimapaCircuito3D`, `MapaDetallePista` y los de Test Drive).
- Las otras pantallas: Test Drive, Diseño de Pistas, Diseño General, Diseño de Objetos y el garaje. *(Cambia según el PRD 024, D8: la física nueva también llega a ellas.)* *(Cambia según el PRD 026, D8: pantallas con estilo de juego de carreras.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Minimapa | Dibujo chico de la pista entera, visto desde arriba, con un punto por carro. |
| Punto de carro | Marca en el mapa en el lugar real del carro, con el color de su auto. |

## 6. Requerimientos funcionales
- **RF-01 (D1, D2):** al empezar Jugar Solo, el mapa muestra el recorrido entero de la pista elegida, también el camino de vuelta en las pistas abiertas, y la línea de meta.
- **RF-02 (D2):** el mapa tiene 5 puntos: el jugador y los 4 rivales, cada uno con el color de su auto. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)*
- **RF-03 (D2, D7):** los puntos se mueven a medida que cada carro avanza y marcan su lugar real en la pista, no solo cuánto avanzó en la vuelta.
- **RF-04 (D3):** el punto del jugador es más grande que el de los rivales, tiene borde blanco y queda encima si se cruzan.
- **RF-05 (D4):** en vertical (390×844) y en horizontal (844×390) el mapa está arriba a la derecha, debajo de la barra de vuelta, posición y tiempo, sin taparla, y no toca el velocímetro ni los controles. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)*
- **RF-06 (D4):** en horizontal el mapa ocupa más lugar que en vertical: es más ancho y un poco más bajo, para dejar lugar al velocímetro. Al girar el celular cambia de tamaño sin cortar la carrera.
- **RF-07 (D5):** el mapa no gira cuando gira el carro.
- **RF-08 (D6):** el mapa se ve durante la cuenta 3-2-1 y la carrera, y se oculta cuando aparece el panel de resultado; con Revancha vuelve a aparecer.
- **RF-09 (D6):** detrás del mapa se ve la pista (fondo semitransparente).
- **RF-10 (D1):** en las otras pantallas no aparece este mapa y sus minimapas siguen igual.
- **RF-11 (D8):** los PRD de D8 tienen su nota; `CLAUDE.md` suma `MinimapaCarrera` a la jerarquía de `MinimapBase`, `PuntoCarroMapa` (el lugar y el color de un carro) a la carpeta `src/view/minimapas/` y el tamaño del mapa a la interfaz de `DisenoCarrera`; el backlog enlaza B22 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7), reglas del proyecto:** `MinimapaCarrera` es una clase de la vista en su propio archivo, hereda de `MinimapBase` y no nombra Jugar Solo; el tamaño del mapa lo da cada diseño (PRD 015). Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** el modelo no cambia; el controlador de Jugar Solo le pasa al mapa dónde está cada carro y el mapa solo dibuja.
- **RNF-03 (D7), anti-monolito:** `VisorCarreraSolo` no crece y ningún archivo pasa de 400 líneas.
- **RNF-04 (D7), pruebas:** sin navegador (Node), el cálculo del lugar de cada punto en `MinimapaCarrera`; en navegador real en 390×844 y 844×390, la ubicación, los 5 puntos, el ocultarse con el resultado y capturas (lecciones 13 y 16). *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)*
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo se ve un mapa chico con la pista entera y 5 puntos que se mueven. *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)*
2. El jugador se distingue de los rivales.
3. El mapa no tapa nada importante, en vertical ni en horizontal.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Pistas largas o angostas:** el recorrido se achica para entrar entero en el mapa; en pistas muy alargadas puede verse fino.
- **Rendimiento:** dibujar el mapa en cada cuadro es poco trabajo; el recorrido se calcula una sola vez por carrera.
- **Pantallas bajas en horizontal:** con 390 px de alto, el velocímetro queda cerca de la esquina de arriba a la derecha; por eso el mapa crece a lo ancho y no a lo alto (RF-06). RF-05 manda. En pantallas acostadas de menos de 390 px de alto el mapa puede rozar el velocímetro; queda fuera de este PRD.
- **Pasto en el mapa:** a esta escala el pasto queda a 1 px o menos del recorrido dibujado, así que no se nota en el mapa; RF-03 pide el lugar real, que se prueba con números.

### Historial
- **v1** (2026-10-25): primera versión, con las 8 decisiones aprobadas por el usuario (opción A).
- **v2** (2026-10-25): revisión única (forma corta). Detalles: D8 completa (PRD 001 D10 y `src/style.css`, PRD 015 RF-01 y lista, `ControladorCarreraSolo` en los PRD 002 y 005, aspecto del juego en los PRD 004 y 005, sin `index.html`, y `MinimapBase`); RF-03 pide el lugar real (el pasto no se nota a esta escala); RF-06: en horizontal el mapa crece a lo ancho, porque a lo alto choca con el velocímetro; RNF-04 prueba sin navegador la clase de la vista.
- **v3** (2026-10-25): programado. D8 dice dónde va el lugar del mapa (los estilos de Jugar Solo en `index.html`; `src/style.css` no cambia) y suma `PuntoCarroMapa`; sin notas en los PRD que solo protegían `src/style.css`. La meta es un cuadrado chico, visible hacia donde vaya la pista.
