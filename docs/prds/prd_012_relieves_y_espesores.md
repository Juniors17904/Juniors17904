# PRD 012 — Relieves y espesores del piso (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — implementado |
| Fecha | 2026-10-24 |
| Backlog | B18 (`docs/BACKLOG.md`) |
| Depende de | PRD 009 (escala y `MedidasEscena`) |
| Reemplaza | Ver D11 |
| Serie | 4 de 4: cierra la serie de medidas reales (PRD 009 a 012) |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Entran el **piano**, el **borde del asfalto**, la **línea central**, las **líneas de borde** y la **línea de meta**, en las 5 pantallas de manejo: Jugar Solo (`VisorCarreraSolo`), Test Drive recto (`VisorTestdriveRecto`), Test Drive con ruta (`VisorTestdriveRuta`), Diseño de Pistas (`VisorCarreraUrbana`) y Diseño General (`VisorDisenoPista`). |
| D2 | Alcance | El relieve del piano es **solo visual**: el carro no salta ni se sacude. Lo que frena en el piano ya lo hace su rozamiento (PRD 008). |
| D3 | Usuarios | **Piano** de 0,7 m de ancho, con unos **8 cm sobre el asfalto** en su borde exterior y bajando hacia el asfalto, con franjas rojas y blancas de 1 m. *(v2: medido sobre el asfalto, aprobado)* |
| D4 | Usuarios | **Asfalto** 8 cm sobre el pasto: **el pasto se queda a nivel 0, el asfalto sube 8 cm y el carro sube con él**, así los objetos de la pista no flotan. *(v2: aprobado)* |
| D5 | Usuarios | **Línea central** amarilla discontinua, igual en las 5 pantallas: 0,15 m de ancho, trazos de 3 m y huecos de 6 m. |
| D6 | Usuarios | **Líneas de borde** blancas continuas de 0,15 m, en las 5 pantallas. |
| D7 | Usuarios | **Línea de meta** a cuadros blancos y negros, de 1 m de largo y todo el ancho del asfalto, en las 5 pantallas. La línea de salida de la recta queda blanca, del ancho del asfalto. |
| D8 | Dominio | Todas las medidas de D3 a D7, y la altura del asfalto, viven en `MedidasEscena`. |
| D9 | Técnico | **Una sola pieza de entrada**, en `src/view/pistas/comun/`, dibuja el piso para las 5 pantallas; puede apoyarse en clases ayudantes (piano, líneas, meta). Reemplaza el dibujo del piso de `ConstructorCircuitoCarreraSolo`, `MallaPistaDiseno` y los visores de Test Drive, y reusa o reemplaza `GeometriaCinta` y `PerpendicularRuta`. |
| D10 | Técnico | Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D11 | Dominio | **Reemplaza:** del PRD 001, amplía su RF-14 (línea central de otras medidas, meta a cuadros, pianos con relieve). Del PRD 002, `VisorCarreraSolo`, `ConstructorCircuitoCarreraSolo`, `GeometriaCinta` y `PerpendicularRuta` dentro de "todas las clases de la carrera 3D". Del PRD 004, "el comportamiento y el aspecto del juego", y del PRD 005, "el comportamiento y el aspecto del juego 3D" (solo el piso) y los 5 visores. Del PRD 008, los 4 visores de su D7 en su lista (solo el dibujo del piso y la altura del carro). Del PRD 010, "de los visores solo cambia la lectura de las medidas nuevas" (también cambia cómo dibujan el piso). Esos PRD llevan una nota que lo indica. *(v2: completa)* |

## 1. Contexto y problema
El piso de la pista se ve plano y distinto en cada pantalla. El piano es una lámina plana a 4 cm en Jugar Solo, Diseño General y Test Drive con ruta, y solo la recta de Test Drive le da 6 cm de relieve. El asfalto queda 1 cm sobre el pasto, así que no se ve el borde. La línea central mide 0,44, 0,24 o 0,14 m según la pantalla (y en la ruta es blanca), las líneas de borde solo existen en la recta y la meta es una franja blanca, salvo en la recta, que ya tiene cuadros. Hoy el piso se dibuja en `ConstructorCircuitoCarreraSolo`, `MallaPistaDiseno` (con el pasto en `VisorDisenoPista`), `VisorTestdriveRecto` y `VisorTestdriveRuta` (también para `VisorCarreraUrbana`), apoyados en `GeometriaCinta` y `PerpendicularRuta`.

## 2. Objetivo
Que el piso de la pista tenga relieve y grosor reales y se vea igual en las 5 pantallas, dibujado por una sola pieza.

## 3. Público objetivo y usuarios
- **Jugador:** ve una pista creíble, con el borde marcado, pianos con volumen y una meta reconocible.
- **Desarrollador y agentes:** cambian el piso en un solo lugar y las 5 pantallas quedan iguales.

## 4. Alcance
**In scope:** D1 a D11.

**Out of scope:** objetos junto a la pista (PRD 010 y 011); que el piano afecte al carro más allá de su rozamiento (D2); colores del asfalto y del pasto de cada pista; el tramo de calle de Diseño de Objetos (`VisorDisenoObjetos`); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, la superficie y los choques (PRD 006 a 011): los anchos del asfalto y del piano no cambian.
- Las vueltas, los puntos de control, `Cronometro` y `MuestraRuta`: la meta a cuadros es solo dibujo.
- Los datos de cada pista (`ConfigPista*`), los objetos de escena y la señalética, que siguen apoyados en el pasto (nivel 0).
- La cámara, los cielos, `HudCarrera` y `src/style.css`. *(`HudCarrera` y `src/style.css` —solo agregar reglas— cambian según el PRD 013, D9: posición y tabla.)* *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Piano | Borde rojo y blanco entre el asfalto y el pasto. |
| Relieve | Altura que se ve sobre el piso; aquí es solo visual (D2). |
| Línea de borde | Línea blanca continua que marca el límite del asfalto. |
| Piso de la pista | Asfalto, pianos y líneas, dibujados por una sola pieza (D9). |

## 6. Requerimientos funcionales
- **RF-01 (D3):** en las 5 pantallas, el piano mide 0,7 m de ancho, sube hasta unos 8 cm sobre el asfalto en su borde exterior y tiene franjas rojas y blancas de 1 m, todas del mismo largo.
- **RF-02 (D3, D4):** en las 5 pantallas, el asfalto queda 8 cm sobre el pasto y el costado exterior del piano se ve como el borde de la pista.
- **RF-03 (D4):** en las 5 pantallas, el carro se apoya sobre el asfalto (ni hundido ni flotando) y los árboles, postes y señales siguen apoyados en el pasto.
- **RF-04 (D5):** en las 5 pantallas, la línea central es amarilla, mide 0,15 m de ancho y alterna trazos de 3 m con huecos de 6 m.
- **RF-05 (D6):** en las 5 pantallas, hay líneas de borde blancas continuas de 0,15 m a cada lado del asfalto.
- **RF-06 (D7):** en las 5 pantallas, la línea de meta es a cuadros blancos y negros, de 1 m de largo y todo el ancho del asfalto.
- **RF-07 (D2):** al pasar por el piano el carro no salta ni se sacude; solo frena por su rozamiento, como hoy.
- **RF-08 (D9):** cambiar una medida del piso cambia el dibujo en las 5 pantallas a la vez.
- **RF-09:** el piso no parpadea de cerca, de lejos ni con la cámara aérea (las capas no se pisan).
- **RF-10 (D11):** los PRD de D11 tienen su nota; `CLAUDE.md` nombra la pieza del piso en `src/view/pistas/comun/`; el backlog enlaza B18 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D8, D9), reglas del proyecto:** las medidas del piso están solo en `MedidasEscena` (incluida la altura del piano que hoy tiene `GeometriaCinta`) y el piso lo dibuja una sola pieza; ninguna pantalla repite esas medidas. Se cumple `CLAUDE.md`.
- **RNF-02, MVC:** la pieza del piso es vista: lee las medidas del modelo y no decide nada del juego.
- **RNF-03 (D10), anti-monolito:** ningún archivo pasa de 400 líneas; ningún visor crece (`VisorCarreraSolo` está en 383 y su cambio es mínimo).
- **RNF-04, pruebas:** medidas en el modelo; aspecto, relieve y parpadeo en navegador real con capturas de cerca, de lejos y con la cámara aérea, en las 5 pantallas (lecciones 13 y 16). Las pruebas que leen los archivos del piso de hoy se ajustan.
- **RNF-05, rendimiento:** Jugar Solo sigue a 30 FPS o más en un celular de gama media (franjas y trazos agrupados en pocas mallas).
- **RNF-06, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En las 5 pantallas el piso se ve igual: borde del asfalto, pianos con relieve, líneas y meta a cuadros.
2. El carro va apoyado en el asfalto y no salta en el piano.
3. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Recta y curvas:** la pieza del piso sirve para la recta (abierta) y para las pistas (cerradas); no debe unir el final con el inicio en la recta.
- **Franjas parejas:** el piso se recorre por distancia para que franjas y trazos midan lo mismo en toda la pista.
- **Luz del asfalto:** al unificar, el asfalto de la ruta puede verse algo distinto; se revisa con capturas.
- **Parpadeo:** las líneas pegadas al asfalto se separan con el orden de dibujo, no solo subiéndolas.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): revisión única (forma corta). Decisiones aprobadas por el usuario: piano 8 cm sobre el asfalto (D3), pasto a nivel 0 con el asfalto y el carro 8 cm arriba (D4). Detalles: 5 pantallas nombradas, meta y salida de la recta, pieza de entrada con ayudantes, `GeometriaCinta` y `PerpendicularRuta`, D11 completa (PRD 008), Diseño de Objetos fuera, parpadeo con la cámara aérea.
- **v3** (2026-10-24): implementado en 3 fases. Fase 1: medidas del piso en `MedidasEscena` y `ConstructorPisoPista` con sus ayudantes en `src/view/pistas/comun/`. Fase 2: las 5 pantallas dibujan el piso con esa pieza y el carro va a `alturaAsfalto`. Fase 3: pasto de Jugar Solo a nivel 0, se borran `GeometriaCinta` y `PerpendicularRuta` (sin uso), pruebas `pruebas/modelo/prueba_piso_pista.js`, `prueba_escala_carro_pista.js` (RNF-01, RF-08) y `pruebas/navegador/prueba_piso_pantallas.mjs` (capturas en las 5 pantallas).
- **v3.1** (2026-10-24): revisión después de programar (código y pruebas). Se corrige: la línea central ajusta su paso para cerrar pareja la vuelta en las pistas cerradas (RF-04); la línea de salida de la recta queda pegada al asfalto con orden de dibujo, sin el `+0.01` (RNF-01, RF-09); `TrazadoPiso` entra a la tabla de jerarquías de `CLAUDE.md`. Pruebas nuevas: números del PRD fijos, colores, pendiente del piano y orden de dibujo; objetos apoyados en el pasto (RF-03) y carro sin saltar en el piano (RF-07) en navegador; notas y documentos (RF-10). RF-09 (parpadeo) se sigue revisando con capturas.
