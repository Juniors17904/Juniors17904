# PRD 007 — Carros con personalidad (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v5 — implementado y verificado (Verificador PRD ✅), con pruebas en `pruebas/` |
| Fecha | 2026-10-24 |
| Backlog | B12 (`docs/BACKLOG.md`) |
| Depende de | PRD 006 (física de manejo) |
| Reemplaza | Ver D8 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | El carro guardado en el garaje usa su propia física en las 5 pantallas del PRD 006 (D2). Hoy todos manejan igual. *(v2: suma Diseño de Pistas)* |
| D2 | Alcance | Cada tipo de carro tiene masa (cuánto le cuesta acelerar y frenar) y agarre (cuánto derrapa). |
| D3 | Usuarios | Las diferencias se notan, pero ninguno queda injugable: en Ciudad, el más lento termina la vuelta a menos de 15 % del más rápido. |
| D4 | Usuarios | El garaje muestra barras de velocidad, aceleración y agarre del carro **marcado**; la carrera usa el carro **guardado** con "Seleccionar". *(v2)* |
| D5 | Dominio | Un registro del modelo decide qué física corresponde a cada modelo del garaje. |
| D6 | Dominio | Hay 6 modelos (deportivo, SUV, muscle, fórmula, pickup y clásico) y solo 3 físicas (`CarroDeportivo`, `CarroSUV`, `CarroMusculo` para "muscle"). Se crean las 3 que faltan y las 3 existentes se rehacen con `#privados` y sin diferencias de turbo. *(v2)* |
| D7 | Técnico | El turbo por tipo de carro no entra; es B9. |
| D8 | Dominio | **Reemplaza:** del PRD 001, `VisorDisenoPista` y `src/style.css` en su lista de lo que no se modifica (amplía su D4: el carro del garaje también trae su física). Del PRD 002, `Garaje`, `VisorCarreraSolo`, `ControladorCarreraSolo` y `src/style.css` en su lista. Del PRD 004, "el comportamiento y el aspecto del juego" (solo el manejo y el garaje) y `src/style.css`. Del PRD 005, "el comportamiento y el aspecto del juego 3D" (solo el manejo y el garaje), `src/style.css`, los 5 visores del PRD 006 (D2) y los controladores que les pasan el carro (`ControladorCarreraSolo`, `ControladorTestDrive3D`, `ControladorDisenoPistas`, `ControladorDisenoGeneral`) y `ControladorGaraje`. Del PRD 006, `src/style.css`. Esos PRD llevan una nota que lo indica. *(v2: completa)* |
| D9 | Técnico | `src/style.css` solo puede **agregar** los estilos de las barras. *(v2)* |
| D10 | Técnico | La familia `Carro` y sus 6 subclases se agrega a la tabla de jerarquías de `CLAUDE.md`. Lo nuevo va en clases aparte; los visores solo las llaman, para no pasar de 400 líneas. *(v2)* |

## 1. Contexto y problema
En el garaje se elige entre 6 carros, pero todos manejan igual: los visores siempre crean el mismo `Carro` básico. `CarroDeportivo`, `CarroSUV` y `CarroMusculo` existen y nadie las usa. Elegir carro solo cambia el aspecto.

## 2. Objetivo
Que elegir carro sea una decisión de juego: cada uno se maneja distinto y el garaje muestra en qué se diferencia.

## 3. Público objetivo y usuarios
- **Jugador:** elige el carro por cómo se maneja, no solo por cómo se ve.
- **Jugador nuevo:** entiende las diferencias mirando las barras del garaje.

## 4. Alcance
**In scope:** D1 a D10, salvo D7.

**Out of scope:** turbo por carro (B9), mejoras o compras de carros, pasto y choques (PRD 008) y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- Las reglas de física del PRD 006 (giro, aire y aceleración): cada carro solo cambia sus números.
- `CarreraVueltas`, `Cronometro`, `MuestraRuta` y la regla del pasto (este PRD no los toca; el pasto lo cambia el PRD 008).
- `PerfilCarro` y sus subclases, y los modelos 3D de los carros.
- `ControlTimon`, `ControlTeclado`, `CamaraSeguimiento`, los cielos y los velocímetros.
- Las reglas que ya existen en `src/style.css` (D9).

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Masa | Cuánto le cuesta al carro ganar y perder velocidad. |
| Agarre | Cuánto se pega el carro al piso en curva; menos agarre = más derrape. |
| Física del carro | Subclase de `Carro` con los números de un tipo (por ejemplo, `CarroPickup`). |
| Registro de carros | Clase del modelo que entrega la física que corresponde a un modelo del garaje. |
| Carro marcado / guardado | Marcado: el que se está mirando en el garaje. Guardado: el que se confirmó con "Seleccionar". |

## 6. Requerimientos funcionales
- **RF-01 (D1, D6):** cada uno de los 6 modelos del garaje tiene su propia física.
- **RF-02 (D1):** en las 5 pantallas del PRD 006 (D2) se maneja con la física del carro guardado.
- **RF-03 (D5):** si el modelo guardado no tiene física registrada, se usa la del carro básico y se registra el error en la consola.
- **RF-04 (D2):** un carro con más masa tarda más en llegar al tope y en frenar que uno con menos masa.
- **RF-05 (D2):** en la misma curva y a la misma velocidad, un carro con menos agarre derrapa más.
- **RF-06 (D3):** en Ciudad, la vuelta del carro más lento tarda menos de 15 % más que la del más rápido.
- **RF-07 (D3):** todos los carros pueden completar las 3 vueltas de Jugar Solo sin quedar trabados en ninguna curva.
- **RF-08 (D4):** el garaje muestra tres barras (velocidad, aceleración y agarre) del carro marcado, y cambian al marcar otro.
- **RF-09 (D4, D9):** las barras se ven completas en vertical y en horizontal, sin tapar el carro ni los botones.
- **RF-10 (D8, D10):** los PRD 001, 002, 004, 005 y 006 tienen la nota de D8, `CLAUDE.md` tiene la familia `Carro` y el backlog enlaza B12 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D5, D6, D10), reglas del proyecto:** cada física es una clase en su archivo dentro de `src/model/carros/`; el registro es una clase, no un `{ }`; todo con `#privados`. Se cumple `CLAUDE.md` y la regla anti-monolito.
- **RNF-02 (D4), MVC:** las barras son vista; salen de la física del carro, no de valores escritos aparte, y no calculan física.
- **RNF-03 (D3), pruebas:** las pruebas comparan los carros en el modelo con reloj controlado (lección 9). Las barras se prueban en navegador real (lección 13).
- **RNF-04, entrega:** llega a `main` solo cumpliendo "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. Cambiar de carro en el garaje cambia cómo se maneja en Jugar Solo.
2. El garaje muestra las 3 barras y cambian con el carro marcado.
3. Todos los carros pueden terminar una carrera en Ciudad.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Balance:** un carro puede quedar demasiado bueno; se ajustan sus números sin tocar los RF.
- **Orden de carga:** hoy los 4 visores que crean un carro (`VisorCarreraUrbana` lo hereda de `VisorTestdriveRuta`) lo crean antes de saber qué modelo se guardó; hay que crearlo después. `Carro` guarda además el modelo de velocímetro, que hoy se pone justo después de cargar: al crear el carro de nuevo no debe perderse.
- **Garaje clásico y física en módulos:** el garaje usa scripts con `window.*` y la física son módulos; el registro debe estar disponible al abrir el garaje.
- **Depende del PRD 006:** sin masa ni aire en la física base, los carros solo se diferenciarían por el tope.

### Historial
- **v1** (2026-10-24): primera versión, con las decisiones aceptadas por el usuario.
- **v2** (2026-10-24): Reparador PRD, vuelta 1. Decisiones aprobadas por el usuario: D1 suma Diseño de Pistas, D4 marcado/guardado, D9 solo agregar estilos, D10 tabla de `CLAUDE.md` y clases aparte. Detalles: D6 nombra las subclases y su arreglo, D8 completa con los PRD 001, 002, 004 y 006.
- **v3** (2026-10-24): Reparador PRD, vuelta 2. Detalles: D8 libera los controladores del PRD 005, D8 entra al In scope, RF-09 de código pasa a RNF-02, riesgo de orden de carga en los 5 visores y del modelo de velocímetro.
- **v4** (2026-10-24): cierre con el usuario. Detalles: D8 libera `ControladorCarreraSolo` del PRD 002, riesgo de orden de carga con 4 visores, historial ordenado.
- **v5** (2026-10-24): implementado y verificado con el Verificador PRD; estado al día.
