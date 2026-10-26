# PRD 019 — Peso del carro al girar (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — escrito, falta la revisión única (forma corta) |
| Fecha | 2026-10-26 |
| Backlog | B24 (`docs/BACKLOG.md`) |
| Depende de | PRD 006 (física), PRD 007 (masa y agarre), PRD 013 y PRD 018 (rivales y dificultad) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Vale en las 5 pantallas 3D, porque todas usan la misma física (PRD 006). |
| D2 | Usuarios | **Soltar el acelerador:** el carro gira hasta un **15 % más cerrado**. El efecto entra en unos 0,3 s y se va de a poco al volver a acelerar. |
| D3 | Usuarios | **Acelerar a fondo en una curva:** el carro gira un **5 % menos** (se abre un poco). |
| D4 | Usuarios | **Frenar:** el carro gira hasta un **25 % más cerrado**. Un carro de poco agarre puede derrapar un poco más, pero sin perder el control. |
| D5 | Dominio | Cada carro lo siente según su **masa y su agarre** (PRD 007): el más pesado lo nota menos y el de menos agarre, más. |
| D6 | Dominio | Una clase nueva del modelo, `TransferenciaPeso`, calcula cuánto peso pasa adelante o atrás según el pedal. `Carro` solo la usa al calcular el giro. Los rivales de la PC la usan igual que el jugador, porque manejan el mismo `Carro`. |
| D7 | Técnico | Los tiempos de vuelta no cambian más de **±5 %** con el mismo piloto automático, y los rivales siguen llegando separados de 2 a 15 s (PRD 013) en cada dificultad (PRD 018). Si hace falta, se ajusta el manejo de los pilotos, no la regla del peso. |
| D8 | Técnico | Pruebas en el modelo: la misma curva con el acelerador a fondo, sin pedal y frenando, comparando el radio de giro de cada carro. |
| D9 | Dominio | **Reemplaza:** el giro de `Carro` en las listas de lo que no se modifica de los PRD 006, 007, 009, 010, 011, 012, 013, 014, 015, 016, 017 y 018 (la física), solo para sumar la transferencia de peso. Del PRD 006, su RF-01 se amplía: el giro depende de la velocidad **y del pedal**. Del PRD 013 y del PRD 018, se pueden ajustar los pilotos y el ritmo para mantener sus llegadas. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
Hoy el carro gira según la velocidad: cuanto más rápido, más abierta la curva (PRD 006). Soltar el acelerador apenas se nota, porque el carro solo gira mejor a medida que frena. En un carro de verdad, al soltar el acelerador el peso pasa adelante, las ruedas de adelante agarran más y el carro entra mejor en la curva. Los pilotos lo usan, y el juego no lo permite.

## 2. Objetivo
Que soltar el acelerador o frenar ayude a meter el carro en la curva, y que acelerar a fondo lo abra, como en un carro de verdad, sin cambiar los tiempos de vuelta ni las carreras contra los rivales.

## 3. Público objetivo y usuarios
- **Jugador:** puede soltar el acelerador o frenar un poco para doblar mejor, y siente que cada carro reacciona distinto.
- **Rivales de la PC:** manejan con la misma regla, sin trampa.
- **Desarrollador y agentes:** encuentran la regla del peso en una sola clase, `TransferenciaPeso`.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** el giroscopio y el selector de control (B4), el turbo (B9), los sonidos (B6), el derrape visual nuevo (humo o marcas) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La velocidad máxima, la aceleración, el freno, el aire y la rodadura de cada carro (`ConstantesFisica` y las 6 físicas).
- El pasto, el piano y los choques (PRD 008, 010 y 011).
- Las vueltas, `Cronometro`, `MuestraRuta` y `Ruta`.
- La cámara, los controles, el HUD y `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Transferencia de peso | Cuánto peso pasa a las ruedas de adelante (al soltar o frenar) o de atrás (al acelerar). |
| Giro más cerrado | Para la misma posición del volante y la misma velocidad, el carro dobla en menos espacio. |
| Radio de giro | El tamaño de la curva que hace el carro con el volante a fondo. |
| Base | El giro de hoy, sin la transferencia de peso. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** a la misma velocidad y con el volante a fondo, el carro sin pedal gira entre un 10 % y un 15 % más cerrado que la base (el giro de hoy, sin la transferencia de peso).
- **RF-02 (D2):** el efecto de soltar el acelerador llega en unos 0,3 s y se va de a poco al volver a acelerar, sin saltos bruscos en el giro.
- **RF-03 (D3):** con el acelerador a fondo, el carro gira alrededor de un 5 % menos que la base.
- **RF-04 (D4):** frenando, el carro gira entre un 20 % y un 25 % más cerrado que la base.
- **RF-05 (D4):** frenando y girando a fondo, ningún carro da un trompo: sigue apuntando hacia adelante y se puede enderezar.
- **RF-06 (D5):** el carro más pesado nota menos la diferencia que el más liviano, y el de menos agarre derrapa más al frenar en curva.
- **RF-07 (D7):** con el piloto automático, el tiempo de vuelta en Ciudad cambia menos de un 5 % para los 6 carros.
- **RF-08 (D7):** los rivales siguen terminando la carrera y llegando separados de 2 a 15 s en las 3 dificultades, como piden los PRD 013 y 018.
- **RF-09 (D1, D6):** las 5 pantallas 3D y los rivales usan la misma regla; en Test Drive se nota igual que en Jugar Solo.
- **RF-10 (D9):** los PRD de D9 tienen su nota, `CLAUDE.md` nombra `TransferenciaPeso` en `src/model/carros/` y el backlog enlaza B24 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6), reglas del proyecto:** `TransferenciaPeso` es una clase en su propio archivo, en español y con campos `#privados`; sus números viven en ella o en `ConstantesFisica`, sin repetirse. Ningún archivo pasa de 400 líneas.
- **RNF-02 (D8), pruebas:** las pruebas del modelo miden el radio de giro con pasos fijos de 60 Hz; a 30, 60 y 120 cuadros por segundo el resultado es el mismo (PRD 006). Citan los RF de este PRD.
- **RNF-03, entrega:** llega a `main` con la forma corta de `CLAUDE.md` y la lista "Antes de llevar algo a main".

## 8. Criterios de aceptación del MVP
1. Soltar el acelerador o frenar en una curva hace doblar más cerrado, y acelerar a fondo la abre un poco.
2. Ningún carro da trompos al frenar y girar.
3. Los tiempos de vuelta y las carreras contra los rivales quedan como antes.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Rivales:** al girar mejor sin pedal, los pilotos pueden ir más rápido o más lento en las curvas; se vuelven a medir las llegadas (RF-08).
- **Pedal todo o nada:** el acelerador del juego es 1, 0 o -1, por eso el efecto entra y sale de a poco (RF-02) para que no se sienta a saltos.
- **Celulares:** el cálculo nuevo es pequeño; no debería bajar los cuadros por segundo.

### Historial
- **v1** (2026-10-26): primera versión, con las 8 decisiones aceptadas por el usuario (opción A).
