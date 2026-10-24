# PRD 006 — Física de manejo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B11 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D8 |
| Siguientes | PRD 007 (carros con personalidad) y PRD 008 (superficie y choques) se apoyan en este |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Entran tres cambios de física: el giro depende de la velocidad, el aire frena más cuanto más rápido se va y la aceleración baja al acercarse al tope. |
| D2 | Alcance | Se aplica a los 4 visores que usan `Carro`: Jugar Solo, Test Drive recto, Test Drive con ruta y Diseño General. |
| D3 | Usuarios | La velocidad máxima y el tiempo de una vuelta en Ciudad quedan casi igual que hoy (±10 %). |
| D4 | Usuarios | El derrape y la inclinación se sienten como ahora: se ajustan números, no la idea. |
| D5 | Dominio | La física usa el tiempo real de cada paso, no "por paso". El paso fijo de 60 Hz se mantiene. |
| D6 | Técnico | Se borra `MovimientoLibre` (`movimiento_libre.js`, nadie lo crea) y su reexportación en `model_fisica.js`. El ejemplo MVC de `CLAUDE.md` que lo nombra pasa a nombrar `Carro`. |
| D7 | Técnico | Las constantes de la física viven en una clase propia del modelo, para que `Carro` no crezca. |
| D8 | Dominio | **Reemplaza:** del PRD 001, `Carro` en la D8 y en su lista de lo que no se modifica. Del PRD 005, `model_fisica.js` y `movimiento_libre.js` de su lista de lo que no se modifica. Los PRD 001 y 005 llevan una nota que lo indica. |

## 1. Contexto y problema
Hoy el carro se maneja como un arcade simple: acelera, frena y se frena solo con valores fijos, y gira igual a 10 km/h que a 200 km/h. Se siente plano y poco creíble. Además, `MovimientoLibre` es una copia vieja de `Carro` que nadie usa.

## 2. Objetivo
Que el carro responda como uno de verdad (gira cerrado a poca velocidad, abierto a mucha, y le cuesta llegar al tope) sin cambiar la dificultad del juego.

## 3. Público objetivo y usuarios
- **Jugador:** siente que el carro tiene peso e inercia, pero sigue siendo fácil de manejar.
- **Desarrollador y agentes:** encuentran la física en un solo lugar y sin copias.

## 4. Alcance
**In scope:** los tres cambios de D1, la física con tiempo real (D5), la clase de constantes (D7) y el borrado de `MovimientoLibre` (D6).

**Out of scope:** masa y agarre por tipo de carro (PRD 007), pasto y choques (PRD 008), turbo en el HUD (B9) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- `CarreraVueltas`, `Cronometro`, `MuestraRuta` y la regla del pasto al 40 % (PRD 001, D3).
- Los controles (`ControlTimon`, `ControlTeclado`), la cámara, los cielos y los velocímetros.
- El HUD, la cuenta 3-2-1 y el resultado de Jugar Solo.
- Los visores 3D, salvo lo mínimo para usar la física nueva.
- El modo "movimiento libre" de Test Drive con ruta (botón y tecla M): es otra cosa y no depende de la clase `MovimientoLibre`.
- `Ruta` y su reexportación en `model_fisica.js`.
- `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Giro según velocidad | A poca velocidad el carro gira cerrado; a mucha, el mismo giro del timón da una curva más abierta. |
| Arrastre del aire | Lo que frena al carro al soltar el pedal. Crece con la velocidad. |
| Aceleración decreciente | El carro empuja fuerte al arrancar y cada vez menos cerca del tope. |
| Constantes de física | Clase del modelo con los números que definen cómo se maneja un carro. |

## 6. Requerimientos funcionales
- **RF-01 (D1):** con el timón al máximo, el carro da una curva más cerrada a baja velocidad que a velocidad alta.
- **RF-02 (D1):** detenido, el carro no gira aunque se mueva el timón (igual que hoy).
- **RF-03 (D1):** al soltar el pedal, el carro pierde velocidad más rápido cuando va rápido que cuando va lento, y termina detenido.
- **RF-04 (D1):** acelerando a fondo desde cero, el carro gana velocidad más rápido al principio que cerca del tope.
- **RF-05 (D3):** la velocidad máxima en recta queda dentro de ±10 % de la actual.
- **RF-06 (D3):** una vuelta en Ciudad, con el mismo recorrido de prueba, tarda dentro de ±10 % de lo que tarda hoy.
- **RF-07 (D1):** frenar y la reversa funcionan como hoy: el freno detiene el carro y luego da marcha atrás con un tope menor.
- **RF-08 (D4):** el carro sigue derrapando en curvas rápidas y se inclina hacia afuera de la curva.
- **RF-09 (D5):** con el mismo recorrido, el carro llega al mismo lugar en una pantalla de 30, 60 o 120 Hz (PRD 001, RF-15).
- **RF-10 (D2):** Jugar Solo, Test Drive recto, Test Drive con ruta y Diseño General usan la física nueva.
- **RF-11 (D6):** en el proyecto no queda la clase `MovimientoLibre`, y el botón de movimiento libre de Test Drive con ruta sigue funcionando.
- **RF-12 (D8):** los PRD 001 y 005 tienen la nota de D8 y el backlog enlaza B11 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7), reglas del proyecto:** todo lo nuevo cumple `CLAUDE.md`: una clase por archivo, español, `#privados`, sin `{ }` como entidad, MVC y la regla anti-monolito.
- **RNF-02 (D5), pruebas:** las pruebas de física corren en el modelo con reloj controlado (lección 9), sin depender de la GPU.
- **RNF-03, entrega:** el cambio llega a `main` solo cuando cumple "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo el carro gira cerrado al ir lento y abierto al ir rápido.
2. Soltar el pedal a alta velocidad frena más que a baja velocidad.
3. Una vuelta en Ciudad tarda casi lo mismo que hoy.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Cambiar la sensación de manejo:** si al jugador le cuesta más, se ajustan las constantes sin tocar los RF.
- **Pruebas que esperan los números viejos:** se ajustan a los nuevos rangos y citan su RF (lección 10).
- **Timón táctil:** se supone que la entrada sigue llegando de -1 a 1; si no, se anota y no se cambia aquí.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario y los choques con los PRD 001 y 005 resueltos en D8.
