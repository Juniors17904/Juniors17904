# PRD 006 — Física de manejo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v5 — implementado y verificado (Verificador PRD ✅), con pruebas en `pruebas/` |
| Fecha | 2026-10-24 |
| Backlog | B11 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D8 |
| Siguientes | PRD 007 (carros con personalidad) y PRD 008 (superficie y choques) se apoyan en este |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Entran tres cambios de física: el giro depende de la velocidad, el aire frena más cuanto más rápido se va y la aceleración baja al acercarse al tope. |
| D2 | Alcance | Se aplica a las 5 pantallas que manejan un `Carro`: Jugar Solo (`VisorCarreraSolo`), Test Drive recto (`VisorTestdriveRecto`), Test Drive con ruta (`VisorTestdriveRuta`), Diseño de Pistas → Entrar (`VisorCarreraUrbana`) y Diseño General (`VisorDisenoPista`). *(v2: suma Diseño de Pistas)* |
| D3 | Usuarios | Con el carro básico de referencia, la velocidad máxima y el tiempo de una vuelta en Ciudad quedan casi igual que hoy (±10 %). Las diferencias entre carros son del PRD 007. *(v2)* |
| D4 | Usuarios | El derrape y la inclinación se sienten como ahora: se ajustan números, no la idea. |
| D5 | Dominio | La física usa el tiempo real de cada paso. Los 5 visores avanzan con paso fijo de 60 Hz reutilizando `BuclePasoFijo`, que se mueve de `src/view/pistas/carrera_solo/` a `src/view/pistas/comun/`; hoy solo Jugar Solo lo usa. *(v2; v4 aprobado por el usuario)* |
| D6 | Técnico | Se borra la clase `MovimientoLibre` (`movimiento_libre.js`, nadie la crea) y su reexportación en `model_fisica.js`. Se quita de `CLAUDE.md` (ejemplo MVC) y de los comentarios de `carro.js` que la nombran. |
| D7 | Técnico | Las constantes de la física viven en una clase propia del modelo. Se borran sus copias en `get physics()` de `VisorTestdriveRecto` y `VisorTestdriveRuta` (la distancia de cámara `camDist` se queda en el visor), y los paneles de depuración (`PanelDatosTestDriveRecto`, `PanelDatosCircuito3D`) leen las del carro activo. *(v2)* |
| D8 | Dominio | **Reemplaza:** del PRD 001, `Carro` en la D8 y `Carro` y `VisorDisenoPista` en su lista de lo que no se modifica. Del PRD 002, `VisorCarreraSolo` y `BuclePasoFijo` dentro de "todas las clases de la carrera 3D". Del PRD 004, "el comportamiento y el aspecto del juego", solo en el manejo. Del PRD 005, "el comportamiento y el aspecto del juego 3D" (solo el manejo), `model_fisica.js`, `movimiento_libre.js` y los 5 visores de D2; también `ControlesCircuito3D` (solo el renombre de RNF-02). Del PRD 002, también `PanelDatosTestDriveRecto` y `PanelDatosCircuito3D` dentro de "los elementos dibujados en 2D" (D7). Esos PRD llevan una nota que lo indica. *(v2: completa; v5 suma controles y paneles)* |
| D9 | Técnico | Lo nuevo va en clases aparte; los visores solo las llaman, para no pasar de 400 líneas. *(v2)* |

## 1. Contexto y problema
Hoy el carro se maneja como un arcade simple: acelera, frena y se frena solo con valores fijos, y gira igual a 10 km/h que a 200 km/h. Se siente plano y poco creíble. Además, `MovimientoLibre` es una copia vieja de `Carro` que nadie usa, dos visores tienen copias de las constantes y solo Jugar Solo avanza con paso fijo.

## 2. Objetivo
Que el carro responda como uno de verdad (gira cerrado a poca velocidad, abierto a mucha, y le cuesta llegar al tope) sin cambiar la dificultad del juego.

## 3. Público objetivo y usuarios
- **Jugador:** siente que el carro tiene peso e inercia, pero sigue siendo fácil de manejar.
- **Desarrollador y agentes:** encuentran la física en un solo lugar y sin copias.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** masa y agarre por tipo de carro (PRD 007), pasto y choques (PRD 008), el turbo de `Carro` (sigue como está hasta B9) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- `CarreraVueltas`, `Cronometro`, `MuestraRuta` y la regla del pasto (este PRD no los toca; el pasto lo cambia el PRD 008).
- `ControlTimon`, `ControlTeclado`, `CamaraSeguimiento`, los cielos y los velocímetros. *(`CamaraSeguimiento` sale de esta lista según el PRD 009, D12.)* *(Los timones y los velocímetros: solo su ubicación cambia según el PRD 015, D12.)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)*
- `HudCarrera`, la cuenta 3-2-1 y el resultado de Jugar Solo. *(`HudCarrera` y el resultado cambian según el PRD 013, D9: posición y tabla.)* *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)*
- El modo "movimiento libre" de Test Drive con ruta (botón y tecla M): no depende de la clase `MovimientoLibre`.
- `Ruta` y su reexportación en `model_fisica.js`. *(`Ruta` cambia según el PRD 014, D9: cierre suave de las pistas abiertas.)*
- `src/style.css`. *(Solo agregar estilos de las barras del garaje, según el PRD 007, D8.)* *(Solo agregar reglas de la posición y la tabla, según el PRD 013, D9.)* *(Cambia según el PRD 015, D12: Jugar Solo en vertical y en horizontal.)* *(Los controles de Jugar Solo cambian según el PRD 016, D11.)* *(El minimapa de Jugar Solo se suma según el PRD 017, D8.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Giro según velocidad | A poca velocidad el carro gira cerrado; a mucha, el mismo giro del timón da una curva más abierta. |
| Arrastre del aire | Lo que frena al carro al soltar el pedal. Crece con la velocidad. |
| Aceleración decreciente | El carro empuja fuerte al arrancar y cada vez menos cerca del tope. |
| Carro básico de referencia | El `Carro` sin tipo, con el que se compara la física de hoy. |
| Constantes de física | Clase del modelo con los números que definen cómo se maneja un carro. |

## 6. Requerimientos funcionales
- **RF-01 (D1):** con el timón al máximo, el carro da una curva más cerrada a baja velocidad que a velocidad alta.
- **RF-02 (D1):** detenido, el carro no gira aunque se mueva el timón (igual que hoy).
- **RF-03 (D1):** al soltar el pedal, el carro pierde velocidad más rápido cuando va rápido que cuando va lento, y termina detenido.
- **RF-04 (D1):** acelerando a fondo desde cero, el carro gana velocidad más rápido al principio que cerca del tope.
- **RF-05 (D3):** con el carro básico, la velocidad máxima en recta queda dentro de ±10 % de la actual.
- **RF-06 (D3):** con el carro básico, una vuelta en Ciudad, con el mismo recorrido de prueba, tarda dentro de ±10 % de lo que tarda hoy.
- **RF-07 (D1):** frenar y la reversa funcionan como hoy: el freno detiene el carro y luego da marcha atrás con un tope menor.
- **RF-08 (D4):** el carro sigue derrapando en curvas rápidas y se inclina hacia afuera de la curva.
- **RF-09 (D5):** en las 5 pantallas de D2, con el mismo recorrido, el carro llega al mismo lugar en una pantalla de 30, 60 o 120 Hz.
- **RF-10 (D2):** las 5 pantallas de D2 se manejan con la física nueva.
- **RF-11 (D7):** los paneles de depuración de Test Drive muestran los valores de física del carro que se está manejando.
- **RF-12 (D6):** el botón y la tecla M de movimiento libre en Test Drive con ruta siguen funcionando.
- **RF-13 (D8):** los PRD 001, 002, 004 y 005 tienen la nota de D8 y el backlog enlaza B11 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D7, D9), reglas del proyecto:** se cumple `CLAUDE.md`: una clase por archivo, español, `#privados`, sin `{ }` como entidad, MVC y la regla anti-monolito. Ningún visor pasa de 400 líneas.
- **RNF-02 (D6), limpieza:** en el proyecto no quedan la clase `MovimientoLibre`, su archivo ni menciones a ella en `CLAUDE.md` o en comentarios. El modo "movimiento libre" de Test Drive se conserva; su método en inglés pasa a español (`CLAUDE.md`). *(v4 aprobado por el usuario)*
- **RNF-03 (D5), pruebas:** las pruebas de física corren en el modelo con reloj controlado (lección 9), sin depender de la GPU.
- **RNF-04, entrega:** el cambio llega a `main` solo cuando cumple "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. En Jugar Solo el carro gira cerrado al ir lento y abierto al ir rápido.
2. Soltar el pedal a alta velocidad frena más que a baja velocidad.
3. Con el carro básico, una vuelta en Ciudad tarda casi lo mismo que hoy.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Cambiar la sensación de manejo:** si al jugador le cuesta más, se ajustan las constantes sin tocar los RF.
- **Pruebas que esperan los números viejos:** se ajustan a los nuevos rangos y citan su RF (lección 10).
- **Visores al borde de 400 líneas** (`VisorCarreraSolo` 393, `VisorTestdriveRuta` 392): D9 obliga a sacar código a clases nuevas.
- **Campos públicos de `Carro`** que hoy escriben y leen los visores (tope, arrastre y escala del velocímetro): pasan a la clase de constantes con acceso controlado (lección 11).

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): Reparador PRD, vuelta 1. Decisiones aprobadas por el usuario: D3 aplica al carro básico, D2 suma Diseño de Pistas, D5 da paso fijo a los 5 visores, D7 borra las copias de constantes y conecta los paneles, D9 clases aparte. Detalles: D8 completa con los PRD 002 y 004; RF-11 de código pasa a RNF-02.
- **v3** (2026-10-24): Reparador PRD, vuelta 2. Detalles: `camDist` se queda, D8 entra al In scope, turbo de `Carro` fuera de alcance, nota del PRD 007 en `src/style.css`, RNF-02 aclara los nombres del modo, riesgos de lecturas públicas y de `BuclePasoFijo`.
- **v4** (2026-10-24): cierre con el usuario. Decisiones aprobadas: `BuclePasoFijo` se mueve a `src/view/pistas/comun/` (D5) y el método en inglés del modo movimiento libre pasa a español (RNF-02). Detalles: D8 nombra `Carro` en la lista del PRD 001 y `BuclePasoFijo` en el PRD 002; historial ordenado.
- **v5** (2026-10-24): implementado. Verificador PRD: D8 nombra `ControlesCircuito3D` y los dos paneles de datos; estado al día.
