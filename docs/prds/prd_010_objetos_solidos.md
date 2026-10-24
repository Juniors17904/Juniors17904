# PRD 010 — Objetos sólidos a tamaño real (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B15 (`docs/BACKLOG.md`) |
| Depende de | PRD 009 (escala: 1 unidad = 1 metro, `MedidasEscena`) |
| Reemplaza | Ver D9 |
| Serie | 2 de 4: siguen el PRD 011 (señalética) y el PRD 012 (relieves y espesores) |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Entran solo el **árbol**, el **poste de alumbrado** y la **señal de curva**: su tamaño, su tamaño de choque y su distancia a la pista. Flechas, balizas y arcos son del PRD 011; relieves y espesores del piso, del PRD 012. |
| D2 | Alcance | El tamaño nuevo se ve en todas las pantallas donde aparecen esos objetos (Jugar Solo, Diseño General y Diseño de Objetos). Los choques siguen siendo solo de Jugar Solo (PRD 008, D7). |
| D3 | Usuarios | Medidas reales: **árbol** de unos 7 m de alto con tronco de 0,3 m de radio, conservando el tamaño propio de cada árbol de la pista; **poste** de 8 m de alto y 0,15 m de radio, con brazo y lámpara en proporción; **señal** con palo de 2,2 m y 0,05 m de radio, y cartel de 0,7 × 0,7 m con 3 cm de grosor. |
| D4 | Usuarios | El carro choca solo con lo que toca a su altura: el tronco, el poste o el palo de la señal. La copa del árbol no cuenta. |
| D5 | Dominio | Postes y señales pasan de 5,5 m a **6,0 m** del centro de la pista, para que ningún carro los roce mientras está en el asfalto (cierra el PRD 009, D11). Los árboles quedan donde están. |
| D6 | Dominio | Las medidas de los objetos viven en `MedidasEscena`, junto a las del carro y la pista. Las usan los objetos que se dibujan (vista) y los objetos sólidos (modelo). |
| D7 | Técnico | La distancia de postes y señales se lee de `MedidasEscena`: las pistas (`ConfigPista*`) dejan de tener el 5,5 escrito. |
| D8 | Técnico | Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D9 | Dominio | **Reemplaza:** del PRD 001, los objetos de escena en su D8 y `FabricaObjetoEscena` y `ConfigPista*` en su lista. Del PRD 002, `ArbolSolido`, `PosteSolido` y `SenalCurvaSolida` dentro de "todas las clases de la carrera 3D". Del PRD 004 y del PRD 005, "el comportamiento y el aspecto del juego" (solo los tres objetos de D1). Del PRD 008, los tamaños de choque de su D2 y `ConfigPista*` y `FabricaObjetoEscena` en su lista. Del PRD 009, `ConfigPista*`, `FabricaObjetoEscena` y sus objetos de escena en su lista (solo los tres objetos de D1). Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Con la escala del PRD 009 (1 unidad = 1 metro), los objetos junto a la pista quedan chicos y no chocan donde se ven: el árbol mide 2,4 m de tronco y choca como un círculo fijo de 0,9 m sin importar su tamaño; el poste mide 5 m y 7 cm de grosor pero choca como si midiera 30 cm; la señal de curva tiene un cartel plano sin grosor y choca como si midiera 40 cm. Además, postes y señales están a 5,5 m del centro, y la SUV y la pickup los rozan estando todavía en el asfalto.

## 2. Objetivo
Que el árbol, el poste y la señal de curva tengan tamaño real, choquen exactamente donde se ven y estén a una distancia de la pista que no moleste al manejar.

## 3. Público objetivo y usuarios
- **Jugador:** ve objetos creíbles junto a la pista y choca solo cuando de verdad los toca.
- **Desarrollador y agentes:** encuentran las medidas de los objetos en `MedidasEscena`, junto a las demás.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** flechas, balizas y arcos, incluido el arco de meta (PRD 011); relieves y espesores del piso (PRD 012); barreras y guardarraíles; cambios de física y de choques que no sean el tamaño; y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física (`Carro`, `ConstantesFisica` y las 6 físicas) y la forma de choque del carro (PRD 009, D6).
- Las vueltas, los puntos de control, `Cronometro` y `MuestraRuta`.
- La forma, los tramos, el nombre, los colores y los árboles de cada pista: de `ConfigPista*` solo cambia de dónde sale la distancia de postes y señales.
- `FlechaCurvaEscena`, `BalizaChevronEscena`, `MetaEscena`, `SalidaEscena`, `BarreraEscena`, `GuardarrailEscena` y `AvisoEscena`.
- La cámara, los cielos, los visores (salvo leer las medidas nuevas), `HudCarrera` y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Objeto sólido | Árbol, poste o señal de curva que el carro no atraviesa (PRD 008). |
| Tamaño de choque | La parte del objeto que el carro toca a su altura: tronco, poste o palo. |
| Tamaño propio del árbol | El factor de tamaño de cada árbol en los datos de la pista (de 0,8 a 1,4). |

## 6. Requerimientos funcionales
- **RF-01 (D3):** el árbol mide unos 7 m de alto (por su tamaño propio) y su tronco tiene 0,3 m de radio.
- **RF-02 (D3):** el poste mide 8 m de alto y 0,15 m de radio, y su brazo y lámpara quedan arriba, hacia la pista.
- **RF-03 (D3):** el cartel de la señal de curva mide 0,7 × 0,7 m, tiene 3 cm de grosor y se ve también de costado.
- **RF-04 (D2):** los tres objetos se ven con su tamaño nuevo en Jugar Solo, Diseño General y Diseño de Objetos.
- **RF-05 (D4):** en Jugar Solo el carro choca con el tronco, el poste o el palo cuando lo toca (±0,1 m), y nunca con la copa.
- **RF-06 (D3, D4):** un árbol más grande choca con un tronco más grueso, según su tamaño propio.
- **RF-07 (D5):** en las 5 pistas, postes y señales están a 6,0 m del centro.
- **RF-08 (D5):** ningún carro del garaje toca un poste o una señal mientras su centro está en el asfalto.
- **RF-09 (D1):** flechas, balizas, arcos, barreras y guardarraíles se ven y se comportan como antes.
- **RF-10 (D9):** los PRD 001, 002, 004, 005, 008 y 009 tienen la nota de D9 y el backlog enlaza B15 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6, D7), reglas del proyecto:** las medidas de los tres objetos y la distancia de postes y señales están solo en `MedidasEscena`; ningún objeto de escena, objeto sólido ni pista repite esos números. Se cumple `CLAUDE.md` (clases, `#privados`, sin `{ }` guardados, nombres en español).
- **RNF-02 (D6), MVC:** las medidas son del modelo; la vista las lee para dibujar y el modelo para chocar.
- **RNF-03 (D8), anti-monolito:** ningún archivo pasa de 400 líneas.
- **RNF-04, pruebas:** tamaños, distancias y choques se prueban en el modelo; el aspecto, en navegador real con captura de cerca y de costado (lección 13).
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md` y "Antes de llevar algo a main".

## 8. Criterios de aceptación del MVP
1. En Jugar Solo los árboles, postes y señales se ven de tamaño real y la señal se ve de costado.
2. El carro choca justo al tocar el tronco, el poste o el palo, y pasa bajo la copa sin chocar.
3. Ningún carro roza postes ni señales mientras va por el asfalto.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Postes más altos y luces:** la luz de la lámpara sube con el poste; si ilumina menos el asfalto, se ajusta su alcance sin cambiar su altura.
- **Pruebas que usan 5,5 m o los radios viejos** (0,9, 0,3 y 0,4): se ajustan y citan los RF de este PRD (lección 10).
- **Copas que tapan la cámara:** con árboles de 7 m la copa puede quedar en el encuadre; se acepta.
- **Supuesto:** los datos de cada árbol siguen trayendo su tamaño propio, como hoy.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario y los choques con los PRD 001, 002, 004, 005, 008 y 009 resueltos en D9.
