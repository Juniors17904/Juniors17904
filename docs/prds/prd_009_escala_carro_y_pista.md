# PRD 009 — Escala del carro y la pista (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B14 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D9 |
| Serie | 1 de 4: este PRD fija la escala; los PRD 010 (objetos sólidos), 011 (señalética) y 012 (relieves y espesores) la usan |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | La escala oficial del juego 3D es **1 unidad = 1 metro**. Se escribe en `CLAUDE.md` y vale para los PRD 010 a 012. |
| D2 | Alcance | Entran solo el carro (largo, ancho y alto) y el ancho de la pista (asfalto y piano). Objetos, señalética y relieves quedan para los PRD 010 a 012. |
| D3 | Usuarios | El carro pasa de 2,6 m a unos **4,5 m de largo**, con ancho y alto en proporción. Cada modelo del garaje conserva la forma de su modelo 3D. |
| D4 | Usuarios | La pista **sigue en 8 m de asfalto y 0,7 m de piano** por lado: no cambian las pistas, el pasto ni las vueltas. |
| D5 | Dominio | Las medidas (largo, ancho y alto del carro, medio ancho del asfalto y ancho del piano) viven en una sola clase del modelo, `MedidasEscena`. La usan la vista (carro 3D y pista), `DetectorSuperficie` y `DetectorChoques` (tamaño del carro). |
| D6 | Dominio | La cámara de seguimiento se aleja y sube en proporción al carro, para que en pantalla el carro se vea parecido a hoy y se siga viendo el camino delante. |
| D7 | Técnico | La física no cambia de unidades: un carro más grande no va más rápido. La vuelta en Ciudad sigue dentro del ±10 % del PRD 006 (D3). |
| D8 | Técnico | Aplica en las 5 pantallas 3D (`VisorCarreraSolo`, `VisorTestdriveRecto`, `VisorTestdriveRuta`, `VisorCarreraUrbana`, `VisorDisenoPista`) y en la vista previa del garaje (`Visor3D`). |
| D9 | Dominio | **Reemplaza:** del PRD 001, la cámara en su D8 y `CamaraSeguimiento`, `VisorBase` y `VisorDisenoPista` en su lista de lo que no se modifica (amplía su RF-14: cambia cómo se ve el carro). Del PRD 002, `VisorCarreraSolo` y `ConstructorCircuitoCarreraSolo` dentro de "todas las clases de la carrera 3D". Del PRD 004 y del PRD 005, "el comportamiento y el aspecto del juego" (solo el tamaño del carro y la cámara) y los 5 visores. Del PRD 006, `CamaraSeguimiento` en su lista. Del PRD 007, "los modelos 3D de los carros" (solo su escala) y `CamaraSeguimiento`. Del PRD 008, `CamaraSeguimiento` y los 4 visores de su D7 en su lista, y las medidas que hoy viven dentro de `DetectorSuperficie` y `DetectorChoques`. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El carro mide 2,6 unidades de largo y la pista 8 de ancho. Si 1 unidad es 1 metro, el carro tiene la mitad del tamaño real y la pista parece una autopista enorme. Además, el ancho de la pista está escrito por separado en la vista (en tres lugares) y en el modelo, y el tamaño del carro para los choques es otro número suelto: pueden separarse sin que nadie lo note.

## 2. Objetivo
Que el carro y la pista tengan tamaños reales y coherentes, guardados en un solo lugar, sin cambiar cómo se juega.

## 3. Público objetivo y usuarios
- **Jugador:** ve un carro del tamaño correcto respecto de la calle, sin que cambie la dificultad.
- **Desarrollador y agentes:** encuentran todas las medidas en una clase y una escala escrita en `CLAUDE.md`.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** árboles, postes y señales (PRD 010), flechas, balizas y arcos (PRD 011), relieve del piano y espesores (PRD 012), cambios de física (PRD 006) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física de `Carro`, `ConstantesFisica` y las 6 físicas del PRD 007 (D7).
- Las vueltas, los puntos de control, `Cronometro` y `MuestraRuta`.
- Los datos de cada pista (`ConfigPista*`) y los objetos de escena (`FabricaObjetoEscena` y sus objetos).
- Los archivos de los modelos 3D (GLB): solo cambia la escala con que se dibujan.
- `ControlTimon`, `ControlTeclado`, los cielos, los velocímetros, `HudCarrera`, `PerfilCarro` y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Escala | Cuántos metros mide una unidad del juego 3D: 1 unidad = 1 metro. |
| `MedidasEscena` | Clase del modelo con las medidas del carro y de la pista. |
| Medio ancho del asfalto | Distancia del centro de la pista al borde del asfalto: 4 m. |
| Encuadre de cámara | Qué tan grande se ve el carro en pantalla y cuánto camino se ve delante. |

## 6. Requerimientos funcionales
- **RF-01 (D3, D8):** en las 5 pantallas 3D el carro mide 4,5 m de largo (±5 %).
- **RF-02 (D3):** cada modelo del garaje mantiene la proporción largo/ancho/alto de su modelo 3D.
- **RF-03 (D4):** el asfalto mide 8 m de ancho y cada piano 0,7 m, en las 5 pantallas 3D.
- **RF-04 (D3, D4):** el ancho del carro ocupa entre un 20 % y un 30 % del ancho del asfalto.
- **RF-05 (D5):** el carro pasa de asfalto a piano y de piano a pasto justo en los bordes que se ven dibujados (±0,1 m).
- **RF-06 (D5):** en Jugar Solo el carro choca con un objeto cuando su costado lo toca, ni antes ni después (±0,2 m).
- **RF-07 (D6):** en Jugar Solo, en vertical y en horizontal, el carro ocupa en pantalla un ancho parecido al de hoy (±15 %).
- **RF-08 (D6):** en las 5 pantallas se ve el camino delante del carro: al menos 30 m de pista hacia adelante.
- **RF-09 (D6):** el deslizador de altura de cámara de Test Drive sigue funcionando en todo su rango.
- **RF-10 (D8):** la vista previa del garaje muestra el carro completo y centrado.
- **RF-11 (D7):** la velocidad máxima, el velocímetro y el tiempo de una vuelta en Ciudad no cambian por la escala (±2 %).
- **RF-12 (D1, D9):** `CLAUDE.md` dice "1 unidad = 1 metro", los PRD 001, 002, 004, 005, 006, 007 y 008 tienen la nota de D9 y el backlog enlaza B14 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D5), reglas del proyecto:** `MedidasEscena` es una clase en su archivo, con `#privados` y solo los getters que se usan. No queda ningún número de medida del carro ni del ancho de la pista repetido fuera de ella. Se cumple `CLAUDE.md` y la regla anti-monolito.
- **RNF-02 (D5), MVC:** las medidas son datos del modelo; la vista las lee para dibujar y el modelo para superficie y choques.
- **RNF-03, pruebas:** las medidas y los bordes se prueban en el modelo; el encuadre y la vista previa, en navegador real con captura (lección 13).
- **RNF-04, entrega:** llega a `main` solo cumpliendo "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo el carro se ve del tamaño de un auto real respecto de la calle.
2. El carro se ve en pantalla de un tamaño parecido al de hoy y se ve el camino delante.
3. Pasto, piano y choques ocurren justo en los bordes que se ven.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Sensación de velocidad:** con un carro más grande la pista "se achica" y puede parecer más lento; si pasa, se ajusta la cámara, no la física (D7).
- **Choques con el carro más ancho:** el carro rozará más los postes que están a 5,5 m del centro; se acepta, y los PRD 010 a 012 revisan la posición de los objetos.
- **Medidas repetidas en la vista:** hoy el ancho de la pista aparece en `ConstructorCircuitoCarreraSolo`, `MallaPistaDiseno` y la recta de `VisorTestdriveRecto`; las tres pasan a leer `MedidasEscena`.
- **Supuesto:** los modelos GLB tienen el frente a lo largo del eje Z, como hoy.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario y los choques con los PRD 001, 002, 004, 005, 006, 007 y 008 resueltos en D9.
