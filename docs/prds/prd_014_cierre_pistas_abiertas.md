# PRD 014 — Cierre suave de las pistas abiertas (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — escrito, falta la revisión única (forma corta) |
| Fecha | 2026-10-25 |
| Backlog | B19 (`docs/BACKLOG.md`) |
| Depende de | PRD 011 (flechas de curva) y PRD 012 (piso de la pista) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se arregla el cierre de las **4 pistas abiertas** (Costa, Desierto, Montaña y Volcán) en todas las pantallas que dibujan esas pistas: Jugar Solo, Diseño General y Diseño de Pistas (y Test Drive con ruta, que usa la misma ruta). **Ciudad no cambia.** |
| D2 | Alcance | Las curvas y rectas que ya tiene cada pista **no cambian de forma**: solo se reemplaza la recta de cierre. |
| D3 | Usuarios | El cierre pasa a ser un **camino de vuelta con curvas suaves** (curva, recta, curva), como las curvas normales de la pista, sin giros de golpe. |
| D4 | Usuarios | Las curvas del cierre tienen un **radio mínimo de 40 m**. |
| D5 | Usuarios | Las curvas del cierre **llevan flechas**, igual que las demás curvas. No llevan árboles ni postes nuevos. |
| D6 | Dominio | El camino de vuelta lo **calcula el programa** a partir de dónde termina y dónde empieza cada pista. Los datos de las pistas (`ConfigPista*`) **no se tocan**. |
| D7 | Dominio | La vuelta cambia de largo, y con ella el **conteo de vueltas, los puntos de control y el minimapa**. Eso sale solo del recorrido nuevo, sin reglas nuevas. |
| D8 | Técnico | El cálculo del cierre va en una **clase nueva del modelo**. Una prueba revisa que el camino de vuelta **no se cruce ni se acerque** a la pista en ninguna de las 4. Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D9 | Dominio | **Reemplaza:** del PRD 001, `Ruta` en su D8 y en su lista de lo que no se modifica. Del PRD 006, `Ruta` en su lista. Del PRD 008, "sin tocar `Ruta`" de su historial v4 (el ancho del piano sigue igual; cambia la ruta que se lee). Del PRD 011, la excepción del quiebre de cierre en su RF-04 y en su historial v3. Esos PRD llevan una nota que lo indica. El PRD 013 (rivales, sin código) sigue la ruta nueva. |

## 1. Contexto y problema
Ciudad es un circuito cerrado. Costa, Desierto, Montaña y Volcán son pistas abiertas: la ruta las cierra con una recta de 600 a 1000 m, que es entre el 34 % y el 45 % de la vuelta. En cada punta de esa recta la pista gira entre 106° y 153° de golpe, casi una vuelta en U sin curva. Ahí el carro no puede seguir la pista, el piso se dobla y un carro ancho pegado al borde roza la última flecha (PRD 011, RF-04).

| Pista | Recta de cierre | Giro al entrar | Giro al salir |
|---|---|---|---|
| Costa | 989 m (45 %) | 153° | 146° |
| Desierto | 831 m (41 %) | 145° | 137° |
| Montaña | 613 m (34 %) | 110° | 106° |
| Volcán | 816 m (41 %) | 142° | 128° |

## 2. Objetivo
Que las 4 pistas abiertas vuelvan a la largada con curvas que se pueden manejar, sin giros de golpe.

## 3. Público objetivo y usuarios
- **Jugador:** maneja la vuelta entera, también el regreso, sin quiebres imposibles.
- **Desarrollador y agentes:** el cierre se calcula en un solo lugar, sin tocar los datos de cada pista.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** cambiar la forma de las curvas que ya existen (D2); árboles o postes en el cierre (D5); convertir las pistas en carreras de punto a punto; Ciudad; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- Los datos de las 5 pistas (`ConfigPista*`): tramos, decoraciones, nombre y colores.
- La física, la superficie y los choques (PRD 006 a 011), y las medidas de `MedidasEscena`.
- Las reglas de la carrera: `CarreraVueltas`, `Cronometro` y `MuestraRuta` (solo leen el recorrido nuevo, D7).
- La cámara, los cielos, `HudCarrera` y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Pista abierta | Pista cuyo trazado no termina donde empieza. |
| Camino de vuelta | Tramo que el programa agrega para unir el final con la largada. |
| Radio de curva | Qué tan cerrada es una curva: menos metros, más cerrada. |

## 6. Requerimientos funcionales
- **RF-01 (D1, D3):** en las 4 pistas abiertas, la ruta vuelve a la largada sin ningún giro de golpe: en toda la vuelta la curva más cerrada tiene al menos 40 m de radio (D4), salvo las curvas que la pista ya tenía.
- **RF-02 (D2):** las curvas y rectas que ya tenía cada pista conservan su forma y su lugar.
- **RF-03 (D1):** Ciudad queda igual que hoy.
- **RF-04 (D8):** en las 4 pistas, el camino de vuelta no cruza la pista ni pasa a menos de 20 m de ella.
- **RF-05 (D5):** las curvas del camino de vuelta tienen flechas, con las mismas medidas, distancia y separación que las demás (PRD 011).
- **RF-06 (D7):** en Jugar Solo la vuelta se cuenta completa, con el camino de vuelta incluido, y el minimapa lo muestra.
- **RF-07 (D1):** Diseño General, Diseño de Pistas y Test Drive con ruta muestran el mismo recorrido que Jugar Solo.
- **RF-08 (PRD 011, RF-04):** con el carro alineado con la pista, ningún carro toca una flecha mientras su centro está en el asfalto, en toda la vuelta de las 5 pistas, sin excepción.
- **RF-09 (D9):** los PRD de D9 tienen su nota; el backlog enlaza B19 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6, D8), reglas del proyecto:** el radio mínimo vive en `MedidasEscena`; el cálculo del cierre es una clase del modelo en su propio archivo. Se cumple `CLAUDE.md`. Las decoraciones de `ConfigPista*` siguen siendo `{ }` por la excepción del PRD 010 (D7, B16).
- **RNF-02, MVC:** el recorrido es del modelo; las pantallas solo lo dibujan.
- **RNF-03 (D8), anti-monolito:** ningún archivo pasa de 400 líneas (`VisorCarreraSolo` está en 383 y no debería cambiar).
- **RNF-04, pruebas:** radio, cruces, flechas y conteo de vueltas se prueban en el modelo; el aspecto, en navegador real con captura del camino de vuelta en las 4 pistas (lecciones 13 y 16). Las pruebas del PRD 011 dejan de excluir el quiebre del cierre.
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En Costa, Desierto, Montaña y Volcán se maneja la vuelta entera sin giros de golpe.
2. Ciudad y las curvas que ya existían se ven igual que antes.
3. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Cruces:** en alguna pista el camino de vuelta más corto podría pasar cerca de la pista; RF-04 lo detecta y esa pista se decide aparte con el usuario.
- **Vueltas más largas:** el regreso con curvas puede alargar la vuelta; se acepta (D7).
- **Rivales (PRD 013):** siguen la misma ruta, así que heredan el cierre nuevo sin cambios propios.

### Historial
- **v1** (2026-10-25): primera versión, con las decisiones aceptadas por el usuario.
