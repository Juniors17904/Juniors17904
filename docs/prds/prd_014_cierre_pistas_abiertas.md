# PRD 014 — Cierre suave de las pistas abiertas (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3 — implementado |
| Fecha | 2026-10-25 |
| Backlog | B19 (`docs/BACKLOG.md`) |
| Depende de | PRD 011 (flechas de curva) y PRD 012 (piso de la pista) |
| Reemplaza | Ver D11 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se arregla el cierre de las **4 pistas abiertas** (Costa, Desierto, Montaña y Volcán) en todas las pantallas que las dibujan: Jugar Solo, Diseño General, Diseño de Pistas, Test Drive con ruta y el mapa de la pantalla Pistas. **Ciudad no cambia.** Una pista es abierta si su trazado termina a más de 50 m de la largada. |
| D2 | Alcance | Las curvas y rectas que ya tiene cada pista **no cambian de forma ni de lugar**: solo se reemplaza la recta de cierre. Los árboles, postes, señales y flechas de cada pista quedan donde están. |
| D3 | Usuarios | El cierre pasa a ser un **camino de vuelta que rodea la pista por fuera**, con las curvas y rectas que hagan falta, sin cruzarla ni acercarse a ella. *(v2: aprobado; reemplaza "curva, recta, curva", que cruzaba la pista en las 4)* |
| D4 | Usuarios | Las curvas del camino de vuelta tienen un **radio mínimo de 40 m**. |
| D5 | Usuarios | Las curvas del camino de vuelta **llevan flechas**, igual que las demás. Las arma la clase nueva del cierre, con el mismo formato de datos que las de las pistas: la excepción del PRD 010 (D7, B16) se amplía a esa clase. No lleva árboles ni postes nuevos. *(v2: aprobado)* |
| D6 | Dominio | El camino de vuelta lo **calcula el programa** a partir de la forma de cada pista. Los datos de las pistas (`ConfigPista*`) **no se tocan**. |
| D7 | Dominio | La vuelta se alarga **entre 5 % y 9 %** (Costa 2360 m, Desierto 2203 m, Montaña 1899 m, Volcán 2169 m; *v3: medido, la v2 tenía una estimación de 8 % a 10 %*). El conteo de vueltas y los puntos de control salen solos del recorrido nuevo, sin reglas nuevas. |
| D8 | Usuarios | Los **minimapas** (Diseño General, Diseño de Pistas) y el **mapa de la pantalla Pistas** dibujan el recorrido nuevo, con el camino de vuelta. *(v2: aprobado)* |
| D9 | Técnico | El cálculo del cierre va en **clases nuevas del modelo**. El recorrido entero, con el camino de vuelta, lo arma `TrazadoVuelta` (modelo); `Ruta` y los mapas lo leen de ahí en vez de rehacerlo desde los tramos. *(v3: precisado)* |
| D10 | Técnico | Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D11 | Dominio | **Reemplaza:** del PRD 001, `Ruta` en su D8 y en su lista, y "cerrar las pistas abiertas" en su Out of scope. Del PRD 002, `Ruta`, los visores y los minimapas dentro de "todas las clases de la carrera 3D" y "los elementos dibujados en 2D". De los PRD 004 y 005, "el comportamiento y el aspecto del juego" (solo el cierre), y del PRD 005 los minimapas ("solo cambia cómo piden una pista"). Del PRD 006, `Ruta` en su lista. Del PRD 008, "sin tocar `Ruta`" de su D5 (el ancho del piano no cambia). Del PRD 011, la excepción del quiebre en su RF-04 y en su historial v3. Del PRD 013 (rivales, sin código), `Ruta` en su lista: los rivales siguen el recorrido nuevo. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Ciudad es un circuito cerrado. Costa, Desierto, Montaña y Volcán son pistas abiertas: la ruta las cierra con una recta de 600 a 1000 m (34 % a 45 % de la vuelta), con giros de golpe de 106° a 153° en cada punta. Además las pistas zigzaguean a los dos lados de esa recta, que ya pasa a 1–2 m de la pista en un punto de cada una. Ahí el carro no puede seguir la pista, el piso se dobla y un carro ancho roza la última flecha (PRD 011, RF-04).

## 2. Objetivo
Que las 4 pistas abiertas vuelvan a la largada por un camino que se puede manejar, sin giros de golpe y sin cruzar la pista.

## 3. Público objetivo y usuarios
- **Jugador:** maneja la vuelta entera, también el regreso, y lo ve en los mapas.
- **Desarrollador y agentes:** el cierre se calcula en un solo lugar y todas las pantallas leen el mismo recorrido.

## 4. Alcance
**In scope:** D1 a D11.

**Out of scope:** cambiar la forma o el lugar de las curvas que ya existen (D2); árboles o postes en el camino de vuelta (D5); carreras de punto a punto; Ciudad; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- Los datos de las 5 pistas (`ConfigPista*`): tramos, decoraciones, nombre y colores.
- La física, la superficie y los choques (PRD 006 a 011): `Carro`, `DetectorSuperficie`, `DetectorChoques` y `FabricaObjetosSolidos`. De `MedidasEscena` no cambian las medidas que ya tiene; solo se agregan las del cierre (RNF-01). *(El giro y el derrape de `Carro` suman el peso del carro según el PRD 019, D9.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*
- Las reglas de la carrera: `CarreraVueltas`, `Cronometro` y `MuestraRuta` (solo leen el recorrido nuevo, D7).
- La cámara, los cielos, `HudCarrera` y `src/style.css`. *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(Cambia según el PRD 020, D7: récords por pista.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Pista abierta | Pista cuyo trazado termina a más de 50 m de la largada (D1). |
| Camino de vuelta | Tramo que el programa agrega por fuera de la pista para unir el final con la largada. |
| Radio de curva | Qué tan cerrada es una curva: menos metros, más cerrada. |

## 6. Requerimientos funcionales
- **RF-01 (D3, D4):** en las 4 pistas abiertas la ruta vuelve a la largada sin giros de golpe: las curvas del camino de vuelta tienen al menos 40 m de radio, y las uniones con la pista no tienen quiebres.
- **RF-02 (D2):** el trazado propio de cada pista no cambia (solo puede ajustarse el último tramo de 4 m, donde empieza el camino de vuelta), y sus árboles, postes, señales y flechas quedan en el mismo lugar.
- **RF-03 (D1):** Ciudad queda igual que hoy.
- **RF-04 (D3):** el camino de vuelta no cruza la pista ni pasa a menos de 20 m de ella, salvo en los primeros y últimos 50 m, donde se une.
- **RF-05 (D5):** las curvas del camino de vuelta tienen flechas, con las mismas medidas, distancia y separación que las demás (PRD 011), y son sólidas en Jugar Solo.
- **RF-06 (D7):** en Jugar Solo la vuelta se cuenta completa, con el camino de vuelta incluido.
- **RF-07 (D1, D8):** Diseño General, Diseño de Pistas y Test Drive con ruta muestran el mismo recorrido que Jugar Solo, y sus minimapas y el mapa de la pantalla Pistas dibujan el camino de vuelta. *(Hoy Diseño General y Test Drive con ruta siempre abren Ciudad, que no cambia; usan el mismo código, así que con una pista abierta mostrarían el camino de vuelta.)*
- **RF-08 (PRD 011, RF-04):** con el carro alineado con la pista, ningún carro toca una flecha mientras su centro está en el asfalto, en toda la vuelta de las 5 pistas, sin excepción.
- **RF-09 (D11):** los PRD de D11 tienen su nota; `CLAUDE.md` dice que en `MedidasEscena` también vive el radio mínimo del cierre; el backlog enlaza B19 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6, D9), reglas del proyecto:** las medidas del cierre viven en `MedidasEscena` (radio mínimo, 50 m de pista abierta, margen del rodeo, 20 m de distancia mínima, 50 m de unión, separación del contorno y radio y largo con que una curva lleva flechas); el cálculo del cierre es una clase del modelo en su propio archivo. Se cumple `CLAUDE.md`. **Excepción declarada:** las decoraciones de `ConfigPista*` y las flechas del camino de vuelta siguen el formato `{ }` del PRD 010 (D7, B16).
- **RNF-02, MVC:** el recorrido es del modelo (`Ruta` y la clase del cierre); las pantallas y los mapas solo lo dibujan.
- **RNF-03 (D10), anti-monolito:** ningún archivo pasa de 400 líneas (`VisorCarreraSolo` está en 383).
- **RNF-04, pruebas:** radio, cruces, distancias, flechas, lugar de las decoraciones y conteo de vueltas se prueban en el modelo; el aspecto y los mapas, en navegador real con captura del camino de vuelta en las 4 pistas (lecciones 13 y 16). La prueba del PRD 011 deja de excluir el quiebre del cierre.
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En Costa, Desierto, Montaña y Volcán se maneja la vuelta entera, sin giros de golpe ni cruces.
2. Ciudad, las curvas que ya existían y sus decoraciones se ven igual que antes.
3. Los mapas muestran el camino de vuelta.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Lugar de las decoraciones:** hoy cada decoración se ubica por su fracción del trazado. Si el camino de vuelta agrega puntos a la ruta y esa fracción no se mantiene, todo se corre de lugar; RF-02 lo prueba.
- **Uniones:** al agregar el camino de vuelta, el último tramo de la pista puede ajustarse un poco (RF-02).
- **Rivales (PRD 013):** siguen la misma ruta, así que heredan el camino de vuelta.

### Historial
- **v1** (2026-10-25): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-25): revisión única (forma corta). Decisiones aprobadas por el usuario: el camino de vuelta rodea la pista por fuera (D3, la forma "curva, recta, curva" cruzaba la pista en las 4), las flechas las arma la clase del cierre con la excepción del PRD 010 ampliada (D5) y los mapas, también el de la pantalla Pistas, muestran el camino de vuelta (D8). Detalles: regla de pista abierta (50 m), el recorrido entero lo entrega `Ruta` (D9), largo nuevo de cada vuelta (D7), RF-02 con las decoraciones en su lugar, RF-04 sin las uniones, minimapas nombrados, contradicción de `MedidasEscena` resuelta, D11 completa (PRD 002, 004, 005 y 013, Out of scope del 001, historial del 011).
- **v3** (2026-10-25): implementado. Clases del modelo en `src/model/cierre/` (`PoseCierre`, `TrayectoDubins`, `ContornoPista`, `CierrePistaAbierta`, `FlechasCierre`) y `TrazadoVuelta` (`src/model/trazado_vuelta.js`), que arma la vuelta entera para `Ruta` y los 3 mapas. `Ruta.posicionEn` sigue midiendo en fracción de la pista y `posicionVuelta` recorre la vuelta entera; `Ruta.decoracionesCon` suma las flechas del camino de vuelta. Medidas del cierre en `MedidasEscena`. El camino de vuelta pasa a 36–43 m de la pista. Pruebas: `pruebas/modelo/prueba_cierre_pistas.js` y `pruebas/navegador/prueba_cierre_pantallas.mjs`; la prueba del PRD 011 ya no excluye el quiebre.
- **v3.1** (2026-10-25): revisión después de programar (código, pruebas y contradicciones). Se corrige: el panel de datos de Diseño de Pistas mide el tramo con la fracción de la pista; las medidas sueltas del cierre pasan a `MedidasEscena`; `TrayectoDubins` no devuelve objetos `{ }`; `CierrePistaAbierta.valido` avisa si una pista no se puede rodear por fuera; D9 y RNF-01 precisados; nota en RF-07 (Diseño General y Test Drive con ruta abren Ciudad). Pruebas nuevas: rivales en Costa terminan la carrera por el camino de vuelta, `posicionVuelta` y `fraccionPista`, Diseño de Pistas igual que Jugar Solo en las 4 pistas, notas buscadas como "PRD 014".
