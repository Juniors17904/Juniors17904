# PRD 010 — Objetos sólidos a tamaño real (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — implementado, con pruebas en `pruebas/` |
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
| D2 | Alcance | El tamaño nuevo se ve en todas las pantallas donde aparecen esos objetos (Jugar Solo, Diseño General y Diseño de Objetos). En Diseño de Objetos la cámara se ajusta para que el objeto se vea completo al abrir la pantalla. Los choques siguen siendo solo de Jugar Solo (PRD 008, D7). *(v2: cámara aprobada)* |
| D3 | Usuarios | Medidas reales, con tamaño propio 1: **árbol** de 7 m de alto y tronco de 0,3 m de radio en la base, sin raíces más anchas que el tronco y con la copa empezando por encima de 2,3 m para cualquier tamaño propio; **poste** de 8 m de alto y 0,15 m de radio, con brazo de 1,5 m y lámpara de 0,25 m de radio; **señal** con palo de 2,2 m y 0,05 m de radio, y cartel de 0,7 × 0,7 m y 3 cm de grosor apoyado encima del palo. El alto y el radio del árbol se multiplican por su tamaño propio. *(v2: detalles)* |
| D4 | Usuarios | El carro choca solo con lo que toca a su altura: el tronco, el poste o el palo de la señal. La copa y el cartel quedan por encima del carro más alto y no cuentan. |
| D5 | Dominio | Postes y señales pasan de 5,5 m a **6,0 m** del centro de la pista, para que ningún carro alineado con la pista los roce mientras está en el asfalto (cierra el PRD 009, D11). Los árboles quedan donde están. |
| D6 | Dominio | Las medidas de los objetos viven en `MedidasEscena`, junto a las del carro y la pista. Las usan los objetos que se dibujan (vista) y los objetos sólidos (modelo). |
| D7 | Técnico | La distancia de postes y señales se lee de `MedidasEscena`. Los datos de las pistas (`ConfigPista*`) siguen siendo objetos `{ }` por excepción aprobada: solo cambia de dónde sale la distancia, y pasarlos a clases queda en el backlog (B16). *(v2: excepción aprobada)* |
| D8 | Técnico | Lo nuevo va en clases aparte; ningún archivo pasa de 400 líneas. |
| D9 | Dominio | **Reemplaza:** del PRD 001, los objetos de escena en su D8 y `FabricaObjetoEscena` y `ConfigPista*` en su lista. Del PRD 002, `ArbolSolido`, `PosteSolido`, `SenalCurvaSolida`, `ArbolEscena`, `PosteEscena` y `SenalCurvaEscena` dentro de "todas las clases de la carrera 3D". Del PRD 004 y del PRD 005, "el comportamiento y el aspecto del juego" (solo los tres objetos de D1), y del PRD 005 también `VisorDisenoObjetos` (solo su encuadre). Del PRD 008, los tamaños de choque de su D2, "sin cambiar esos datos" de su D6 (solo la distancia de postes y señales) y `ConfigPista*` y `FabricaObjetoEscena` en su lista. Del PRD 009, `ConfigPista*`, `FabricaObjetoEscena` y sus objetos de escena en su lista (solo los tres objetos de D1). Esos PRD llevan una nota que lo indica. *(v2: completa)* |

## 1. Contexto y problema
Con la escala del PRD 009 (1 unidad = 1 metro), los objetos junto a la pista quedan chicos y no chocan donde se ven. El árbol mide 2,4 m de tronco, tiene raíces que sobresalen y choca con un radio fijo de 0,9 m sin importar su tamaño. El poste mide 5 m con 0,07 m de radio, pero choca con 0,3 m. La señal tiene un cartel plano sin grosor y choca con 0,4 m. A 5,5 m del centro, la SUV y la pickup rozan postes y señales estando en el asfalto, y el muscle y el fórmula rozan las señales.

## 2. Objetivo
Que el árbol, el poste y la señal de curva tengan tamaño real, choquen exactamente donde se ven y estén a una distancia de la pista que no moleste al manejar.

## 3. Público objetivo y usuarios
- **Jugador:** ve objetos creíbles junto a la pista y choca solo cuando de verdad los toca.
- **Desarrollador y agentes:** encuentran las medidas de los objetos en `MedidasEscena`, junto a las demás.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** flechas, balizas y arcos (PRD 011); relieves y espesores del piso (PRD 012); barreras y guardarraíles; pasar los datos de las pistas a clases (B16); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física (`Carro`, `ConstantesFisica` y las 6 físicas) y la forma de choque del carro (PRD 009, D6). *(El giro y el derrape de `Carro` suman el peso del carro según el PRD 019, D9.)* *(Cambia según el PRD 024, D8: arranque más vivo, freno de motor y deslizar entre pedales.)*
- Las vueltas, los puntos de control, `Cronometro` y `MuestraRuta`.
- La forma, los tramos, el nombre, los colores y los árboles de cada pista: de `ConfigPista*` solo cambia de dónde sale la distancia de postes y señales (D7). *(La distancia de las flechas cambia según el PRD 011, D11.)*
- `FlechaCurvaEscena`, `BalizaChevronEscena`, `MetaEscena`, `SalidaEscena`, `BarreraEscena`, `GuardarrailEscena` y `AvisoEscena`. *(Cambian según el PRD 011, D11; `BalizaChevronEscena` se borra.)*
- La cámara de las pantallas de manejo, los cielos, `HudCarrera` y `src/style.css`. De los visores solo cambia la lectura de las medidas nuevas y, en `VisorDisenoObjetos`, el encuadre (D2). *(Los visores también cambian cómo dibujan el piso según el PRD 012, D11.)* *(`VisorCarreraSolo` cambia también según el PRD 011, D11: arco de meta y flechas.)* *(`VisorCarreraSolo`, `HudCarrera` y `src/style.css` —solo agregar reglas— cambian según el PRD 013, D9: rivales, posición y tabla.)* *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(Cambia según el PRD 018, D8: modos de carrera y dificultad.)* *(Cambia según el PRD 020, D7: récords por pista.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Objeto sólido | Árbol, poste o señal de curva que el carro no atraviesa (PRD 008). |
| Tamaño de choque | La parte del objeto que el carro toca a su altura: tronco, poste o palo. |
| Tamaño propio del árbol | El factor de tamaño de cada árbol en los datos de la pista (de 0,8 a 1,4). |

## 6. Requerimientos funcionales
- **RF-01 (D3):** con tamaño propio 1, el árbol mide 7 m de alto y su tronco 0,3 m de radio en la base; ninguna raíz sobresale del tronco.
- **RF-02 (D3):** el poste mide 8 m de alto y 0,15 m de radio, con un brazo de 1,5 m y una lámpara de 0,25 m de radio arriba, hacia la pista; su luz sale de la lámpara e ilumina el asfalto como hoy.
- **RF-03 (D3):** el cartel de la señal mide 0,7 × 0,7 m, tiene 3 cm de grosor, se apoya encima del palo de 2,2 m y se ve también de costado.
- **RF-04 (D2):** los tres objetos se ven con su tamaño nuevo en Jugar Solo, Diseño General y Diseño de Objetos; en Diseño de Objetos se ven completos al abrir la pantalla.
- **RF-05 (D4):** en Jugar Solo el carro choca con el tronco, el poste o el palo cuando lo toca (±0,1 m).
- **RF-06 (D3, D4):** el alto y el radio del tronco crecen con el tamaño propio de cada árbol, y su choque también.
- **RF-07 (D4):** ningún carro atraviesa a la vista la copa de un árbol (para cualquier tamaño propio) ni el cartel de una señal.
- **RF-08 (D5):** las señales de las 5 pistas y los postes de Ciudad están a 6,0 m del centro.
- **RF-09 (D5):** con el carro alineado con la pista, ninguno de los 6 carros toca un poste o una señal mientras su centro está en el asfalto.
- **RF-10 (D1):** flechas, balizas, arcos, barreras y guardarraíles se ven y se comportan como antes. *(Reemplazado por PRD 011, D11: flechas, baliza y arcos cambian.)*
- **RF-11 (D9):** los PRD de D9 tienen su nota; `CLAUDE.md` dice que en `MedidasEscena` también viven las medidas de los objetos y que los objetos sólidos los crea `FabricaObjetosSolidos`; el backlog enlaza B15 con este PRD y agrega B16.

## 7. Requerimientos no funcionales
- **RNF-01 (D6, D7), reglas del proyecto:** las medidas de los tres objetos y la distancia de postes y señales están solo en `MedidasEscena`; ningún objeto de escena, objeto sólido ni pista repite esos números. Lo nuevo cumple `CLAUDE.md`. **Excepción declarada:** las decoraciones de `ConfigPista*` siguen siendo `{ }` (D7, B16).
- **RNF-02 (D6), MVC:** las medidas son del modelo; la vista las lee para dibujar y el modelo para chocar.
- **RNF-03 (D8), anti-monolito:** ningún archivo pasa de 400 líneas (`VisorCarreraSolo` está en 383).
- **RNF-04, pruebas:** tamaños, distancias y choques se prueban en el modelo; el aspecto y la luz, en navegador real con captura de cerca y de costado (lecciones 13 y 16). Las pruebas que usan los radios viejos se ajustan y citan los RF de este PRD (lección 10).
- **RNF-05, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md` y "Antes de llevar algo a main".

## 8. Criterios de aceptación del MVP
1. En Jugar Solo los árboles, postes y señales se ven de tamaño real y la señal se ve de costado.
2. El carro choca justo al tocar el tronco, el poste o el palo, y nunca atraviesa copas ni carteles.
3. Ningún carro alineado con la pista roza postes ni señales mientras va por el asfalto.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Orden de carga:** las pistas se cargan antes que `MedidasEscena`; deben leer la distancia recién al pedir sus decoraciones, no al crearse.
- **Luz del poste:** al subir la lámpara llega menos luz al asfalto; se compensa con la intensidad, no con el alcance.
- **Carro cruzado:** un carro muy girado respecto de la pista puede tocar un poste con el centro aún en el asfalto; se acepta (RF-09 es con el carro alineado).
- **Copas en el encuadre:** con árboles de 7 m la copa puede verse en la cámara; se acepta.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): revisión única (forma corta). Decisiones aprobadas por el usuario: excepción para los `{ }` de las pistas con B16 (D7) y cámara de Diseño de Objetos (D2). Detalles: medidas con tamaño propio, raíces, copa sobre 2,3 m, brazo y lámpara, cartel encima del palo, luz, postes solo en Ciudad, carro alineado, D9 completa (vistas de los objetos, D6 del PRD 008, `VisorDisenoObjetos`), contexto corregido, lecciones 13 y 16.
