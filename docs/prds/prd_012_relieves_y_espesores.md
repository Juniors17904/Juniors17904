# PRD 012 — Relieves y espesores del piso (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B18 (`docs/BACKLOG.md`) |
| Depende de | PRD 009 (escala y `MedidasEscena`) |
| Reemplaza | Ver D11 |
| Serie | 4 de 4: cierra la serie de medidas reales (PRD 009 a 012) |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Entran el **piano**, el **borde del asfalto**, la **línea central**, las **líneas de borde** y la **línea de meta**, en las 5 pantallas 3D. |
| D2 | Alcance | El relieve del piano es **solo visual**: el carro no salta ni se sacude. Lo que frena en el piano ya lo hace su rozamiento (PRD 008). |
| D3 | Usuarios | **Piano** de 0,7 m de ancho, con unos 8 cm de alto en su borde exterior y bajando hacia el asfalto, con franjas rojas y blancas de 1 m. |
| D4 | Usuarios | **Asfalto** unos 8 cm por encima del pasto, para que se vea el borde de la pista. |
| D5 | Usuarios | **Línea central** amarilla discontinua, igual en todas las pantallas: 0,15 m de ancho, trazos de 3 m y huecos de 6 m. |
| D6 | Usuarios | **Líneas de borde** blancas continuas de 0,15 m, en las 5 pantallas. |
| D7 | Usuarios | **Línea de meta** a cuadros blancos y negros, de 1 m de largo y todo el ancho del asfalto. |
| D8 | Dominio | Todas las medidas de D3 a D7 viven en `MedidasEscena`. |
| D9 | Técnico | **Una sola clase compartida** dibuja el piso (asfalto, piano y líneas) para las 5 pantallas, en `src/view/pistas/comun/`. Las pantallas dejan de dibujar el piso cada una a su manera. |
| D10 | Técnico | Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D11 | Dominio | **Reemplaza:** del PRD 001, amplía su RF-14 (línea central de otras medidas, meta a cuadros, pianos con relieve). Del PRD 002, `VisorCarreraSolo` y `ConstructorCircuitoCarreraSolo` dentro de "todas las clases de la carrera 3D". Del PRD 004 y del PRD 005, "el comportamiento y el aspecto del juego" (solo el piso), y del PRD 005 también los 5 visores. Del PRD 010, "de los visores solo cambia la lectura de las medidas nuevas" (también cambia cómo dibujan el piso). Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El piso de la pista se ve plano y distinto en cada pantalla. El piano está pintado en el piso en Jugar Solo, Diseño General y Test Drive con ruta, y solo la recta de Test Drive le da 6 cm de relieve. El asfalto queda 1 cm sobre el pasto, así que no se ve el borde. La línea central mide 0,44 m, 0,24 m o 0,14 m según la pantalla, las líneas de borde solo existen en la recta y la meta es una franja blanca sin cuadros. Hoy el piso se dibuja en 4 lugares: `ConstructorCircuitoCarreraSolo`, `MallaPistaDiseno`, `VisorTestdriveRecto` y `VisorTestdriveRuta` (este último también para `VisorCarreraUrbana`).

## 2. Objetivo
Que el piso de la pista tenga relieve y grosor reales y se vea igual en las 5 pantallas, dibujado por una sola pieza.

## 3. Público objetivo y usuarios
- **Jugador:** ve una pista creíble, con el borde marcado, pianos con volumen y una meta reconocible.
- **Desarrollador y agentes:** cambian el piso en un solo lugar y las 5 pantallas quedan iguales.

## 4. Alcance
**In scope:** D1 a D11.

**Out of scope:** objetos junto a la pista (PRD 010 y 011); que el piano afecte al carro más allá de su rozamiento (D2); colores del asfalto y del pasto de cada pista; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, la superficie y los choques (PRD 006 a 010): los anchos del asfalto y del piano no cambian.
- Las vueltas, los puntos de control, `Cronometro` y `MuestraRuta`: la meta a cuadros es solo dibujo.
- Los datos de cada pista (`ConfigPista*`), los objetos de escena y la señalética.
- La cámara, los cielos, `HudCarrera` y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Piano | Borde rojo y blanco entre el asfalto y el pasto. |
| Relieve | Altura que se ve sobre el piso; aquí es solo visual (D2). |
| Línea de borde | Línea blanca continua que marca el límite del asfalto. |
| Piso de la pista | Asfalto, pianos y líneas, dibujados por una sola clase (D9). |

## 6. Requerimientos funcionales
- **RF-01 (D3):** en las 5 pantallas, el piano mide 0,7 m de ancho, sube hasta unos 8 cm en su borde exterior y tiene franjas rojas y blancas de 1 m.
- **RF-02 (D4):** en las 5 pantallas, el asfalto queda unos 8 cm por encima del pasto y su borde se ve.
- **RF-03 (D5):** en las 5 pantallas, la línea central es amarilla, mide 0,15 m de ancho y alterna trazos de 3 m con huecos de 6 m.
- **RF-04 (D6):** en las 5 pantallas, hay líneas de borde blancas continuas de 0,15 m a cada lado del asfalto.
- **RF-05 (D7):** la línea de meta es a cuadros blancos y negros, de 1 m de largo y todo el ancho del asfalto.
- **RF-06 (D2):** al pasar por el piano el carro no salta ni se sacude; solo frena por su rozamiento, como hoy.
- **RF-07 (D9):** cambiar una medida del piso cambia el dibujo en las 5 pantallas a la vez.
- **RF-08:** el piso no parpadea al mirarlo de lejos ni de cerca (las capas no se pisan).
- **RF-09 (D11):** los PRD de D11 tienen su nota y el backlog enlaza B18 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D8, D9), reglas del proyecto:** las medidas del piso están solo en `MedidasEscena` y el piso lo dibuja una sola clase; ninguna pantalla repite esas medidas. Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** la clase del piso es vista: lee las medidas del modelo y no decide nada del juego.
- **RNF-03 (D10), anti-monolito:** ningún archivo pasa de 400 líneas; los visores quedan más chicos al dejar de dibujar el piso.
- **RNF-04, pruebas:** medidas en el modelo; aspecto, relieve y parpadeo en navegador real con capturas de cerca, de lejos y en las 5 pantallas (lecciones 13 y 16).
- **RNF-05, rendimiento:** Jugar Solo sigue a 30 FPS o más en un celular de gama media.
- **RNF-06, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En las 5 pantallas el piso se ve igual: borde del asfalto, pianos con relieve, líneas y meta a cuadros.
2. Manejar sobre el piano no hace saltar al carro.
3. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Carro y relieve:** el carro sigue a la altura del asfalto; sobre el piano puede verse un poco hundido y en el pasto un poco alto (8 cm). Se acepta porque el relieve es solo visual (D2).
- **Recta y curvas:** la clase del piso tiene que servir para la recta de Test Drive y para las pistas con curvas.
- **Parpadeo:** capas muy juntas pueden parpadear de lejos; se separan lo justo (RF-08).

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario (D2 relieve solo visual, D9 una sola clase para el piso) y los choques con los PRD 001, 002, 004, 005 y 010 resueltos en D11.
