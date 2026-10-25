# PRD 011 — Señalética a tamaño real (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v3.1 — implementado y revisado (forma corta) |
| Fecha | 2026-10-24 |
| Backlog | B17 (`docs/BACKLOG.md`) |
| Depende de | PRD 009 (escala y `MedidasEscena`) y PRD 010 (objetos sólidos, postes y señales a 6,0 m) |
| Reemplaza | Ver D11 |
| Serie | 3 de 4: sigue el PRD 012 (relieves y espesores) |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Entran las **flechas de curva**, los **arcos de meta y de salida** y el **cartel de aviso**. |
| D2 | Alcance | Se **borra la baliza chevron**: el archivo `src/view/objetos/baliza_chevron_escena.js` (`BalizaChevronEscena`) y el botón "Chevrón" de Diseño de Objetos (`do-sel-baliza-chevron` en `index.html`), que hoy no muestra nada. *(v2: también el botón, aprobado)* |
| D3 | Alcance | Se **agrega un arco de meta en Jugar Solo**, sobre la línea de meta (hoy solo hay una línea pintada), girado con la pista. |
| D4 | Usuarios | **Flecha de curva**: tablero de pista de carreras de 2,4 × 0,8 m, con su borde de abajo a 0,9 m del piso, 3 cm de grosor y dos palos de 0,05 m de radio. |
| D5 | Usuarios | Las flechas salen del piano: pasan de 4,3 m a **5,4 m** del centro. Se **espacian para que no se toquen**: una cada 3 m más o menos, la mitad que hoy. *(v2: espaciado aprobado)* |
| D6 | Usuarios | Fuera del piano, **las flechas pasan a ser sólidas** en Jugar Solo: el carro choca con su tablero. |
| D7 | Usuarios | **Arcos de meta y de salida** a la medida de la pista: postes a **6,0 m** del centro, como los postes y señales del PRD 010, y unos 5,5 m de altura libre. *(v2: 6,0 m, aprobado)* |
| D8 | Usuarios | **Cartel de aviso**: ya mide 3 m de palo y 1,4 × 0,75 m de cartel con grosor; solo se mueven sus medidas a `MedidasEscena`. |
| D9 | Dominio | Todas las medidas de D4 a D8 viven en `MedidasEscena`. Los datos de las pistas dejan de tener el 4,3 y el paso de las flechas escritos; siguen siendo `{ }` por la excepción del PRD 010 (D7, B16). |
| D10 | Técnico | **Cada objeto sólido sabe calcular su propio choque** (redondo o tablero), así `DetectorChoques` sirve para cualquier forma. Cambia la interfaz de `ObjetoSolido` en `CLAUDE.md`. Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. *(v2: aprobado)* |
| D11 | Dominio | **Reemplaza:** del PRD 001, los objetos de escena en su D8 y `FabricaObjetoEscena` y `ConfigPista*` en su lista (amplía su RF-14: además de la línea de meta hay un arco). Del PRD 002, `VisorCarreraSolo`, `ConstructorCircuitoCarreraSolo`, `DetectorChoques`, `FabricaObjetosSolidos`, `ObjetoSolido` y `FlechaCurvaEscena` dentro de "todas las clases de la carrera 3D". Del PRD 004 y del PRD 005, "el comportamiento y el aspecto del juego" (solo la señalética de D1), y del PRD 005 también `VisorCarreraSolo` en su lista de visores. Del PRD 008, su D2 y su RF-06 ("las flechas no son sólidas"), "sin cambiar esos datos" de su D6 (distancia y paso de las flechas) y `ConfigPista*` y `FabricaObjetoEscena` en su lista. Del PRD 009, `ConfigPista*`, `FabricaObjetoEscena` y sus objetos de escena en su lista. Del PRD 010, `FlechaCurvaEscena`, `BalizaChevronEscena`, `MetaEscena`, `SalidaEscena` y `AvisoEscena` en su lista, `VisorCarreraSolo` en su línea de visores y su RF-10. Esos PRD llevan una nota que lo indica. *(v2: completa)* |

## 1. Contexto y problema
Con la escala real (PRD 009), la señalética no tiene medidas creíbles. Hay 1350 flechas de curva en las 5 pistas: son un cartel plano sin grosor sobre palitos de 4 cm, están encima del piano (a 4,3 m) y se montan una sobre otra (una cada 1,2 m con tableros de 2,2 m). En Jugar Solo no hay arco de meta, solo una línea pintada; los arcos de meta y salida solo se ven en Diseño de Objetos, con postes a 4,5 m, dentro del piano. La baliza chevron no la usa nadie y su botón en Diseño de Objetos no muestra nada.

## 2. Objetivo
Que la señalética necesaria tenga tamaño real, grosor y un lugar correcto, que Jugar Solo tenga su arco de meta y que no quede código sin uso.

## 3. Público objetivo y usuarios
- **Jugador:** ve flechas de curva creíbles que avisan la curva y no se atraviesan, y un arco al cruzar la meta.
- **Desarrollador y agentes:** encuentran todas las medidas en `MedidasEscena` y una pieza menos sin uso.

## 4. Alcance
**In scope:** D1 a D11.

**Out of scope:** relieves y espesores del piso (PRD 012); árbol, poste y señal de curva (PRD 010); barreras y guardarraíles; pasar los datos de las pistas a clases (B16); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, la forma de choque del carro, las vueltas, los puntos de control y `Cronometro`: el arco de meta es solo un adorno sobre la meta que ya existe.
- La forma, los tramos, el nombre, los colores y los demás objetos de cada pista: de `ConfigPista*` solo cambian la distancia y el paso de las flechas.
- `ArbolEscena`, `PosteEscena`, `SenalCurvaEscena`, `BarreraEscena` y `GuardarrailEscena`.
- La cámara de las pantallas de manejo, los cielos, `HudCarrera` y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Flecha de curva | Tablero con chevrones que avisa hacia dónde dobla la curva. |
| Arco de meta / de salida | Portón sobre la pista que marca dónde termina o empieza la vuelta. |
| Altura libre | Distancia del piso al borde de abajo del travesaño del arco. |
| Forma de choque | Lo que cada objeto sólido sabe de sí mismo para saber si el carro lo toca. |

## 6. Requerimientos funcionales
- **RF-01 (D4):** cada flecha mide 2,4 × 0,8 m, tiene 3 cm de grosor, su borde de abajo está a 0,9 m del piso y se ve también de costado.
- **RF-02 (D5):** en las 5 pistas las flechas están a 5,4 m del centro, fuera del piano, y ningún tablero toca a otro.
- **RF-03 (D6, D10):** en Jugar Solo el carro choca con el tablero de una flecha cuando lo toca (±0,1 m) y nunca lo atraviesa.
- **RF-04 (D5):** con el carro alineado con la pista, ninguno de los 6 carros toca una flecha mientras su centro está en el asfalto, salvo en el quiebre donde las pistas abiertas empiezan su tramo de cierre (ver v3).
- **RF-05 (D6):** con las flechas sólidas, Jugar Solo sigue a 30 FPS o más en un celular de gama media.
- **RF-06 (D3, D7):** en Jugar Solo hay un arco de meta sobre la línea de meta, girado con la pista, con sus postes a 6,0 m del centro y 5,5 m de altura libre, en las 5 pistas.
- **RF-07 (D3):** el arco de meta no cambia cómo se cuentan las vueltas ni el tiempo.
- **RF-08 (D7):** los arcos de meta y de salida de Diseño de Objetos tienen las mismas medidas que el de Jugar Solo y se ven completos al abrir la pantalla.
- **RF-09 (D8):** el cartel de aviso mide 3 m de palo y 1,4 × 0,75 m de cartel, con grosor, como hoy.
- **RF-10 (D2):** la baliza chevron y su botón ya no existen; Diseño de Objetos sigue mostrando todos los demás objetos.
- **RF-11 (D1):** árbol, poste, señal de curva, barreras y guardarraíles se ven y se comportan como antes.
- **RF-12 (D10, D11):** los PRD de D11 tienen su nota; `CLAUDE.md` suma la flecha sólida y la nueva interfaz a la tabla de `ObjetoSolido`; el backlog enlaza B17 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D9), reglas del proyecto:** las medidas de la señalética están solo en `MedidasEscena`; ningún objeto de escena, objeto sólido ni pista las repite. Lo nuevo cumple `CLAUDE.md`. **Excepción declarada:** las decoraciones de `ConfigPista*` siguen siendo `{ }` (PRD 010 D7, B16).
- **RNF-02, MVC:** las medidas y los choques son del modelo; la vista solo dibuja.
- **RNF-03 (D10), anti-monolito:** ningún archivo pasa de 400 líneas (`VisorCarreraSolo` está en 383: el arco se agrega con lo mínimo).
- **RNF-04, rendimiento y pruebas:** el modelo revisa solo los objetos cercanos al carro; la prueba de costo por paso del PRD 008 (menos de 0,05 ms con Ciudad) sigue pasando con las flechas sólidas y es la forma de comprobar RF-05. Medidas, distancias y choques se prueban en el modelo; el aspecto, en navegador real con captura (lecciones 13 y 16). Las pruebas que hoy dicen "las flechas no son sólidas" se ajustan y citan los RF de este PRD (lección 10).
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo las flechas se ven de tamaño real, con grosor, separadas, fuera del piano, y el carro choca con ellas.
2. En Jugar Solo hay un arco de meta en las 5 pistas y las vueltas se cuentan igual.
3. La baliza chevron y su botón no están en el proyecto.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Postes del arco de meta:** a 6,0 m quedan en el pasto; no son sólidos. Si se atraviesan a la vista, se decide en otro PRD.
- **Texturas de las flechas:** hoy cada flecha crea su propia textura; si cuesta FPS, se comparten.
- **Orden de carga:** las pistas leen la distancia y el paso de las flechas recién al pedir sus decoraciones, como en el PRD 010.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): revisión única (forma corta). Decisiones aprobadas por el usuario: quitar también el botón Chevrón (D2), flechas espaciadas (D5), postes del arco a 6,0 m (D7), choque propio de cada objeto sólido (D10). Detalles: borde de abajo a 0,9 m, arco girado con la pista, carro alineado, costo por paso, aviso que ya cumple, D11 completa.
- **v3** (2026-10-25): implementado. Medidas de la señalética en `MedidasEscena`; `ConfigPista` lee la distancia (5,4 m) y el paso (3 m) de las flechas; `FlechaCurvaEscena` con tablero de 2,4 × 0,8 × 0,03 m; arcos de meta y salida con postes a 6,0 m y 5,5 m de altura libre; arco de meta en Jugar Solo (`ConstructorCircuitoCarreraSolo`); `AvisoEscena` con sus medidas en `MedidasEscena`; baliza chevron y su botón borrados. Choques (D10): cada `ObjetoSolido` da su `puntoCercano` contra el `RectanguloCarro` y su `alcance`; `FlechaCurvaSolida` choca con todo el tablero. Pruebas: `pruebas/modelo/prueba_senaletica.js` y `pruebas/navegador/prueba_senaletica_pantallas.mjs`. **Nota de RF-04:** se cumple en todas las curvas de las 5 pistas; en el quiebre donde las pistas abiertas (Costa, Desierto, Montaña y Volcán) empiezan su tramo de cierre la ruta gira con menos de 1 m de radio y ahí un carro ancho puede rozar la última flecha; la prueba deja ese quiebre fuera.
- **v3.1** (2026-10-25): revisión después de programar (código, pruebas y contradicciones). Se corrige: `ObjetoEscena.destruir` libera listas de materiales y sus texturas (el tablero de la flecha no dejaba salir de Jugar Solo ni cambiar de objeto en Diseño de Objetos); en Jugar Solo no se dibuja el poste de alumbrado que cae dentro de un poste del arco (opción A, aprobada por el usuario; solo pasa en Ciudad); medidas de dibujo (bandera, palos, cajas de luz) a `MedidasEscena`; RF-04 nombra la excepción del quiebre. Pruebas nuevas: salir de Jugar Solo y cambiar de objeto tras la flecha, arco en las 5 pistas y girado con la pista (RF-06), el carro pasa bajo el arco sin chocar y el cronómetro sigue (RF-07), aviso dibujado (RF-09) y largo de segmento igual en `Ruta` y `MedidasEscena`.
