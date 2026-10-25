# PRD 009 — Escala del carro y la pista (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v4 — implementado, con pruebas en `pruebas/` |
| Fecha | 2026-10-24 |
| Backlog | B14 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D12 |
| Serie | 1 de 4: este PRD fija la escala; los PRD 010 (objetos sólidos), 011 (señalética) y 012 (relieves y espesores) la usan |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | La escala oficial del juego 3D es **1 unidad = 1 metro**. Se escribe en `CLAUDE.md` y vale para los PRD 010 a 012. |
| D2 | Alcance | Entran las medidas de los carros, el ancho de la pista (asfalto y piano), el encuadre de la cámara y la vista previa del garaje. Objetos, señalética y relieves quedan para los PRD 010 a 012. *(v2)* |
| D3 | Usuarios | Cada carro tiene su **largo real**: deportivo 4,5 m, muscle 4,8 m, fórmula 5,0 m, SUV 4,5 m, pickup 4,5 m y clásico (limusina) 6,0 m. Ancho y alto salen de la forma de su modelo 3D; el ancho queda entre el 15 % y el 32 % del asfalto. *(v2, aprobado por el usuario; v4: SUV y pickup a 4,5 m para no pasar del 32 %, aprobado)* |
| D4 | Usuarios | La pista mide **8 m de asfalto y 0,7 m de piano** por lado en las 5 pantallas. La recta de Test Drive pasa su piano de 0,6 m a 0,7 m, pegado al asfalto. No cambian las pistas, el pasto ni las vueltas. *(v2: piano de la recta, aprobado)* |
| D5 | Dominio | Las medidas viven en una sola clase del modelo, `MedidasEscena`: largo y ancho **de cada tipo de carro**, medio ancho del asfalto y ancho del piano. La usan la vista, `DetectorSuperficie`, `DetectorChoques` y el minimapa `RecorridoTestDriveRecto`. *(v2: por tipo, aprobado)* |
| D6 | Dominio | Los choques usan la **forma rectangular** (largo × ancho) del carro que se maneja, no un círculo: de costado choca con el costado y de frente con el parachoques. *(v2, aprobado)* |
| D7 | Dominio | La cámara multiplica su distancia y su altura por el tamaño del carro. La altura que guardó el jugador y los rangos de los deslizadores no cambian. *(v2, aprobado)* |
| D8 | Técnico | Los cielos y la niebla no se tocan: con la cámara más atrás se acepta un poco más de niebla, siempre que se vean 30 m delante. *(v2, aprobado)* |
| D9 | Técnico | La física no cambia de unidades: un carro más grande no va más rápido. La vuelta en Ciudad sigue dentro del ±10 % del PRD 006 (D3). |
| D10 | Técnico | Aplica en las 5 pantallas 3D (`VisorCarreraSolo`, `VisorTestdriveRecto`, `VisorTestdriveRuta`, `VisorCarreraUrbana`, `VisorDisenoPista`) y en la vista previa del garaje (`Visor3D`). |
| D11 | Alcance | Dónde van los postes y las señales (hoy a 5,5 m del centro) lo decide el PRD 010. *(v2, aprobado)* |
| D12 | Dominio | **Reemplaza:** del PRD 001, la cámara en su D8 y `CamaraSeguimiento`, `VisorBase` y `VisorDisenoPista` en su lista (amplía su RF-14: cambia cómo se ve el carro). Del PRD 002, `VisorCarreraSolo`, `ConstructorCircuitoCarreraSolo`, `CamaraSeguimiento`, `VisorBase`, `DetectorSuperficie` y `DetectorChoques` dentro de "todas las clases de la carrera 3D". Del PRD 004, "el comportamiento y el aspecto del juego" (tamaño del carro, cámara y piano de la recta). Del PRD 005, ese mismo punto, los 5 visores, `Visor3D` y `RecorridoTestDriveRecto`. Del PRD 006, `CamaraSeguimiento`. Del PRD 007, la escala de "los modelos 3D de los carros" y `CamaraSeguimiento`. Del PRD 008, `CamaraSeguimiento` y los 4 visores de su D7 en su lista, y en su D5 dónde viven las medidas de la superficie. Esos PRD llevan una nota que lo indica. *(v2: completa)* |

## 1. Contexto y problema
Todos los carros miden 2,6 unidades de largo y la pista 8 de ancho: con 1 unidad = 1 metro, el carro tiene la mitad del tamaño real. Las medidas están repetidas y sueltas: el ancho de la pista y sus derivados (bordes, límite suave, arcos) aparecen en `ConstructorCircuitoCarreraSolo`, `MallaPistaDiseno`, `VisorTestdriveRecto`, `VisorTestdriveRuta`, `RecorridoTestDriveRecto` y `DetectorSuperficie`, y el tamaño del carro es 2,6 en los visores, 3,2 en `Visor3D` y un círculo de 0,8 en `DetectorChoques`.

## 2. Objetivo
Que cada carro y la pista tengan tamaños reales y coherentes, guardados en un solo lugar, sin cambiar cómo se juega.

## 3. Público objetivo y usuarios
- **Jugador:** ve cada carro del tamaño correcto respecto de la calle y choca donde se ve el golpe.
- **Desarrollador y agentes:** encuentran todas las medidas en una clase y la escala escrita en `CLAUDE.md`.

## 4. Alcance
**In scope:** D1 a D12.

**Out of scope:** árboles, postes y señales y su posición (PRD 010), flechas, balizas y arcos (PRD 011), relieve del piano y espesores (PRD 012), cambios de física (PRD 006) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física: `Carro`, `ConstantesFisica` y las 6 físicas del PRD 007 (D9).
- Las vueltas, los puntos de control, `Cronometro` y `MuestraRuta`.
- Los datos de cada pista (`ConfigPista*`), `FabricaObjetoEscena` y sus objetos de escena. *(Cambian según el PRD 010, D9: árbol, poste, señal y su distancia.)* *(También según el PRD 011, D11: señalética.)*
- Los archivos de los modelos 3D (GLB) y `PerfilCarro`.
- Los cielos y su niebla (D8).
- `VistaConduccion`, `DeslizadorAlturaCamara` y los rangos de los deslizadores de altura (D7).
- `ControlTimon`, `ControlTeclado`, los velocímetros, `HudCarrera` y `src/style.css`. *(`HudCarrera` y `src/style.css` —solo agregar reglas— cambian según el PRD 013, D9: posición y tabla.)* *(Según el PRD 015, D12: de `ControlTimon`, `ControlTeclado` y los velocímetros solo cambia su ubicación; `HudCarrera` y `src/style.css` cambian para el diseño horizontal.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Escala | 1 unidad del juego 3D = 1 metro. |
| `MedidasEscena` | Clase del modelo con las medidas de cada tipo de carro y de la pista. |
| Forma del carro para choques | Rectángulo del largo y el ancho del carro, girado con él. |
| Encuadre de cámara | Qué tan grande se ve el carro en pantalla y cuánto camino se ve delante. |

## 6. Requerimientos funcionales
- **RF-01 (D3, D10):** en las 5 pantallas y en la vista previa, cada carro mide su largo de D3 (±5 %).
- **RF-02 (D3):** cada carro mantiene la proporción de su modelo 3D y su ancho queda entre el 15 % y el 32 % del asfalto.
- **RF-03 (D4):** en las 5 pantallas el asfalto mide 8 m y cada piano 0,7 m, pegado al asfalto.
- **RF-04 (D5):** en Jugar Solo, el centro del carro pasa de asfalto a piano y de piano a pasto justo en los bordes dibujados (±0,1 m).
- **RF-05 (D6):** en Jugar Solo, de costado el carro choca cuando su costado toca el objeto (±0,2 m), con el ancho del carro que se maneja.
- **RF-06 (D6):** de frente, el carro choca cuando su parachoques toca el objeto (±0,3 m); el objeto nunca se ve dentro del carro.
- **RF-07 (D7):** en Jugar Solo, en vertical y en horizontal, el deportivo ocupa en pantalla un ancho parecido al de hoy (±15 %).
- **RF-08 (D7, D8):** en las 5 pantallas se ven al menos 30 m de pista delante del carro.
- **RF-09 (D7):** los deslizadores de altura de cámara funcionan en todo su rango y la altura que guardó el jugador conserva su valor.
- **RF-10 (D10):** la vista previa del garaje muestra el carro completo y centrado, y la cámara nunca entra en el carro.
- **RF-11 (D5):** el límite suave de los Test Drive y el minimapa de la recta usan el mismo ancho de pista que se dibuja.
- **RF-12 (D9):** la velocidad máxima, el velocímetro y el tiempo de una vuelta en Ciudad no cambian por la escala (±2 %).
- **RF-13 (D1, D12):** `CLAUDE.md` dice "1 unidad = 1 metro" y suma `Visor3D` a la fila de `VisorBase`; los PRD de D12 tienen su nota y el backlog enlaza B14 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D5), reglas del proyecto:** `MedidasEscena` es una clase en su archivo, con `#privados` y solo los getters que se usan, y se puede leer desde los scripts clásicos y desde los módulos. No queda ningún número de medida del carro, del ancho de la pista ni derivado de ellos (bordes, límite suave, arcos) repetido fuera de ella. Se cumple `CLAUDE.md`.
- **RNF-02 (D5, D6), MVC:** las medidas y la forma de choque son del modelo; la vista solo las lee para dibujar.
- **RNF-03, anti-monolito:** lo nuevo va en clases aparte; ningún visor pasa de 400 líneas (`VisorTestdriveRuta` está en 392).
- **RNF-04, pruebas:** medidas, bordes y choques se prueban en el modelo; encuadre y vista previa, en navegador real con captura (lección 13). Las pruebas que hoy usan 0,8 o 2,8 se ajustan y citan su RF (lección 10).
- **RNF-05, entrega:** llega a `main` solo cumpliendo "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo cada carro se ve del tamaño de un auto real respecto de la calle.
2. El deportivo se ve en pantalla de un tamaño parecido al de hoy y se ve el camino delante.
3. Pasto, piano y choques ocurren donde se ven, de costado y de frente.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Sensación de velocidad:** con carros más grandes la pista "se achica"; si parece lento se ajusta la cámara, no la física (D9).
- **SUV y pickup junto a postes y señales:** con su ancho rozarán objetos a 5,5 m estando todavía en el asfalto; lo resuelve el PRD 010 (D11).
- **Ruedas:** al crecer el carro, su giro dibujado se ve más rápido; se ajusta con el tamaño de cada carro.
- **Supuesto:** los modelos GLB tienen el frente a lo largo del eje Z, como hoy.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): Reparador PRD, vuelta 1. Decisiones aprobadas por el usuario: largo real por carro (D3), piano de la recta a 0,7 (D4), medidas por tipo (D5), choque rectangular (D6), cámara proporcional sin tocar preferencias (D7), cielos sin tocar (D8), postes al PRD 010 (D11). Detalles: D2 suma cámara y vista previa, D12 completa (`Visor3D`, `RecorridoTestDriveRecto`, PRD 002), lista de lugares con medidas, RF-04 solo en Jugar Solo y desde el centro.
- **v3** (2026-10-24): implementado (`MedidasEscena`, `MedidaCarro`, choque rectangular, cámara con escala, anchos de pista y vista previa). Pendiente de decisión: con su largo de D3 y la forma de su modelo 3D, la SUV queda en 32,1 % y la pickup en 37,0 % del asfalto, fuera del 15–32 % de D3 y RF-02.
- **v4** (2026-10-24): decisión aprobada por el usuario: SUV y pickup pasan a 4,5 m de largo (con su forma, a 4,6 y 5,3 m pasaban del 32 % del asfalto).
