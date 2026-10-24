# PRD 011 — Señalética a tamaño real (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
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
| D2 | Alcance | Se **borra la baliza chevron** (`BalizaChevronEscena`): ninguna pantalla la usa. |
| D3 | Alcance | Se **agrega un arco de meta en Jugar Solo**, sobre la línea de meta (hoy solo hay una línea pintada). |
| D4 | Usuarios | **Flecha de curva**: tablero de pista de carreras de 2,4 × 0,8 m, a 0,9 m del piso, con 3 cm de grosor, sobre dos palos de 0,05 m de radio. |
| D5 | Usuarios | Las flechas salen del piano: pasan de 4,3 m a **5,4 m** del centro, entre el piano (4,7 m) y los postes y señales (6,0 m, PRD 010). |
| D6 | Usuarios | Fuera del piano, **las flechas pasan a ser sólidas** en Jugar Solo: el carro choca con su tablero. |
| D7 | Usuarios | **Arcos de meta y de salida** a la medida de la pista: postes fuera de los pianos, a 5,2 m del centro, y unos 5,5 m de altura libre. |
| D8 | Usuarios | **Cartel de aviso**: palo de 3 m y cartel de 1,4 × 0,75 m; conserva su grosor. |
| D9 | Dominio | Todas las medidas de D4 a D8 viven en `MedidasEscena`. Los datos de las pistas dejan de tener el 4,3 escrito; siguen siendo `{ }` por la misma excepción del PRD 010 (D7, B16). |
| D10 | Técnico | Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D11 | Dominio | **Reemplaza:** del PRD 001, los objetos de escena en su D8 y `FabricaObjetoEscena` y `ConfigPista*` en su lista (amplía su RF-14: además de la línea de meta hay un arco). Del PRD 002, `VisorCarreraSolo`, `ConstructorCircuitoCarreraSolo`, `DetectorChoques`, `FabricaObjetosSolidos` y `FlechaCurvaEscena` dentro de "todas las clases de la carrera 3D". Del PRD 004 y del PRD 005, "el comportamiento y el aspecto del juego" (solo la señalética de D1). Del PRD 008, su D2 y su RF-06 ("las flechas no son sólidas"), "sin cambiar esos datos" de su D6 (solo la distancia de las flechas) y `ConfigPista*` y `FabricaObjetoEscena` en su lista. Del PRD 009 y del PRD 010, `ConfigPista*`, `FabricaObjetoEscena` y sus objetos de escena en su lista, y del PRD 010 también `FlechaCurvaEscena`, `BalizaChevronEscena`, `MetaEscena`, `SalidaEscena` y `AvisoEscena`. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Con la escala real (PRD 009), la señalética no tiene medidas creíbles. Las flechas de curva (cientos, en las 5 pistas) son un cartel plano sin grosor sobre palitos de 4 cm, y están encima del piano, a 4,3 m del centro: el carro las atraviesa. En Jugar Solo no hay arco de meta, solo una línea pintada; los arcos de meta y salida y el cartel de aviso existen, pero solo se ven en Diseño de Objetos, y sus medidas no siguen el ancho de la pista. La baliza chevron no la usa nadie.

## 2. Objetivo
Que la señalética necesaria tenga tamaño real, grosor y un lugar correcto, que Jugar Solo tenga su arco de meta y que no quede código sin uso.

## 3. Público objetivo y usuarios
- **Jugador:** ve flechas de curva creíbles junto a la pista, que avisan la curva y no se atraviesan, y un arco de meta al cruzar.
- **Desarrollador y agentes:** encuentran todas las medidas en `MedidasEscena` y una pieza menos sin uso.

## 4. Alcance
**In scope:** D1 a D11.

**Out of scope:** relieves y espesores del piso (PRD 012); árbol, poste y señal de curva (PRD 010); barreras y guardarraíles; pasar los datos de las pistas a clases (B16); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física, la forma de choque del carro y las vueltas, puntos de control y `Cronometro`: el arco de meta es solo un adorno sobre la meta que ya existe.
- La forma, los tramos, el nombre, los colores y los demás objetos de cada pista: de `ConfigPista*` solo cambia de dónde sale la distancia de las flechas.
- `ArbolEscena`, `PosteEscena`, `SenalCurvaEscena`, `BarreraEscena` y `GuardarrailEscena`.
- La cámara, los cielos, `HudCarrera` y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Flecha de curva | Tablero con chevrones que avisa hacia dónde dobla la curva. |
| Arco de meta / de salida | Portón sobre la pista que marca dónde termina o empieza la vuelta. |
| Altura libre | Distancia del piso al borde de abajo del travesaño del arco. |

## 6. Requerimientos funcionales
- **RF-01 (D4):** cada flecha de curva mide 2,4 × 0,8 m, tiene 3 cm de grosor, está a 0,9 m del piso y se ve también de costado.
- **RF-02 (D5):** en las 5 pistas, las flechas están a 5,4 m del centro, fuera del piano.
- **RF-03 (D6):** en Jugar Solo el carro choca con el tablero de una flecha cuando lo toca (±0,1 m) y nunca lo atraviesa.
- **RF-04 (D6):** con las flechas sólidas, Jugar Solo sigue a 30 FPS o más en un celular de gama media.
- **RF-05 (D3, D7):** en Jugar Solo hay un arco de meta sobre la línea de meta, con sus postes fuera de los pianos y 5,5 m de altura libre.
- **RF-06 (D3):** el arco de meta no cambia cómo se cuentan las vueltas ni el tiempo.
- **RF-07 (D7):** los arcos de meta y de salida de Diseño de Objetos tienen las mismas medidas que el de Jugar Solo.
- **RF-08 (D8):** el cartel de aviso tiene un palo de 3 m y un cartel de 1,4 × 0,75 m con grosor.
- **RF-09 (D2):** la baliza chevron ya no existe en el proyecto y ninguna pantalla cambia por eso.
- **RF-10 (D1):** árbol, poste, señal de curva, barreras y guardarraíles se ven y se comportan como antes.
- **RF-11 (D11):** los PRD de D11 tienen su nota; `CLAUDE.md` suma a la tabla de `ObjetoSolido` la flecha sólida; el backlog enlaza B17 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D9), reglas del proyecto:** las medidas de la señalética están solo en `MedidasEscena`; ningún objeto de escena, objeto sólido ni pista las repite. Lo nuevo cumple `CLAUDE.md`. **Excepción declarada:** las decoraciones de `ConfigPista*` siguen siendo `{ }` (PRD 010 D7, B16).
- **RNF-02, MVC:** las medidas y los choques son del modelo; la vista solo dibuja.
- **RNF-03 (D10), anti-monolito:** ningún archivo pasa de 400 líneas (`VisorCarreraSolo` está en 383).
- **RNF-04, pruebas:** medidas, distancias y choques se prueban en el modelo; el aspecto y los FPS, en navegador real con captura de cerca y de costado (lecciones 13 y 16). Las pruebas que hoy dicen "las flechas no son sólidas" o usan 4,3 se ajustan y citan los RF de este PRD (lección 10).
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo las flechas de curva se ven de tamaño real, con grosor, fuera del piano, y el carro choca con ellas.
2. En Jugar Solo hay un arco de meta y las vueltas se cuentan igual.
3. La baliza chevron no está en el proyecto.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Muchas flechas sólidas:** son cientos; si cuesta FPS, el modelo revisa solo las cercanas al carro (RF-04).
- **Postes del arco de meta:** quedan a 5,2 m, en el pasto; se espera que el jugador pase por el asfalto. Si se atraviesan a la vista, se decide en otro PRD si son sólidos.
- **Orden de carga:** las pistas leen la distancia de las flechas recién al pedir sus decoraciones, como en el PRD 010.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario (D2 borrar la baliza, D3 arco de meta en Jugar Solo, D6 flechas sólidas) y los choques con los PRD 001, 002, 004, 005, 008, 009 y 010 resueltos en D11.
