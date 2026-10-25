# PRD 013 — Rivales de la PC en Jugar Solo (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — escrito, falta la revisión única (forma corta) |
| Fecha | 2026-10-25 |
| Backlog | B5 (`docs/BACKLOG.md`) |
| Depende de | PRD 011 (señalética): se programa cuando llegue a `main`, porque también toca Jugar Solo |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Solo en Jugar Solo: **4 rivales de la PC y el jugador**, 5 carros en total. Las otras 4 pantallas 3D no cambian. |
| D2 | Usuarios | 4 personalidades fijas, cada una con nombre visible, carro y color distintos: **Prudente** (frena antes de las curvas, casi no se equivoca), **Agresivo** (rápido, frena tarde, a veces se sale), **Novato** (lento e irregular, pisa pasto) y **Experto** (el más rápido, con errores muy raros). |
| D3 | Usuarios | Manejo natural: cada rival sigue la pista con pequeñas variaciones y comete errores al azar según su personalidad. Nunca hace trampa: usa la misma física, el mismo pasto y los mismos choques que el jugador. |
| D4 | Usuarios | Llegada natural: al terminar, los 5 llegan separados por entre 2 y 15 segundos entre uno y el siguiente. Un rival muy adelantado afloja un poco y uno muy atrasado se esfuerza un poco, sin que se note. |
| D5 | Usuarios | Arriba se ve la posición en vivo ("2.º/5"). Al terminar, una tabla muestra los 5 puestos con nombre y tiempo. |
| D6 | Dominio | Cada rival es una clase: una superclase `PilotoPC` y una subclase por personalidad (`PilotoPrudente`, `PilotoAgresivo`, `PilotoNovato`, `PilotoExperto`). El piloto decide cuánto acelerar y girar (las entradas del carro); no mueve el carro. Cada rival tiene su propio `Carro`, su `CarreraVueltas` y su `Cronometro`, sin modificar esas clases. |
| D7 | Técnico | Los carros chocan entre sí y rebotan, como con los árboles. Se agrega a `DetectorChoques` sin cambiar los choques que ya existen. |
| D8 | Técnico | Lo nuevo va en clases aparte. `VisorCarreraSolo` (383 líneas) solo crea y dibuja a los rivales; ningún archivo pasa de 400 líneas. |
| D9 | Dominio | **Reemplaza:** de las listas de lo que no se modifica, `VisorCarreraSolo` (PRD 001, 002 y 010) y `ControladorCarreraSolo` (PRD 002), solo para crear, mover y dibujar a los rivales; `DetectorChoques` (PRD 002), solo para agregar los choques entre carros; y `HudCarrera` (PRD 006, 010, 011 y 012), solo para la posición y la tabla final. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
En Jugar Solo el jugador corre sin nadie al lado: solo compite contra el reloj, y la carrera no se siente como una competencia. El multijugador en línea (B3) todavía no existe porque faltan las claves de Supabase.

## 2. Objetivo
Que Jugar Solo sea una carrera de verdad contra 4 rivales que manejan como personas distintas y llegan a la meta de forma natural, sin depender de internet.

## 3. Público objetivo y usuarios
- **Jugador:** tiene contra quién correr, ve en qué puesto va y a veces gana y a veces no.
- **Desarrollador y agentes:** agregan o ajustan una personalidad creando una subclase de `PilotoPC`.

## 4. Alcance
**In scope:** D1 a D9.

**Out of scope:** el multijugador en línea (B3); elegir la cantidad de rivales o su dificultad; rivales en las otras 4 pantallas; sonido (B6); récords (B7); turbo (B9); y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- La física: `Carro`, `ConstantesFisica` y las 6 físicas de carro. Los rivales las usan tal cual.
- `CarreraVueltas`, `Cronometro`, `MuestraRuta`, `Ruta` y `DetectorSuperficie`: se crea una instancia por rival.
- Los choques con árboles, postes y señales (PRD 008 y 010).
- La pista, sus objetos, el piso (PRD 012) y la señalética (PRD 011).
- La cámara, los controles del jugador, los cielos y `src/style.css` (solo se agregan reglas para la posición y la tabla).

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Rival | Un carro de la PC con su propio piloto, vueltas y tiempo. |
| Piloto PC | La clase que decide cómo maneja un rival (acelerar, frenar, girar). Hay una por personalidad. |
| Error natural | Una equivocación al azar del piloto: abrirse en una curva, frenar tarde o pisar el pasto. |
| Ajuste de ritmo | El pequeño cambio de ritmo que evita que un rival quede demasiado lejos o demasiado cerca de los demás. |
| Posición | El puesto de cada carro según vueltas y avance en la pista. |

## 6. Requerimientos funcionales
- **RF-01 (D1):** al arrancar Jugar Solo hay 5 carros en la salida: el jugador y 4 rivales, todos esperando la cuenta 3-2-1-¡YA!
- **RF-02 (D2):** cada rival tiene nombre, carro y color distintos, y su nombre se ve sobre el carro o en la tabla.
- **RF-03 (D3):** los 4 rivales completan las 3 vueltas sin quedarse atascados ni salirse de la pista para siempre.
- **RF-04 (D2, D3):** en 10 carreras de prueba, el Experto termina en promedio antes que el Novato, y el Novato pisa el pasto más veces que el Prudente.
- **RF-05 (D3):** dos carreras seguidas no son iguales: los tiempos de cada rival cambian de una a otra.
- **RF-06 (D3):** los rivales sufren el mismo freno del pasto y los mismos choques que el jugador.
- **RF-07 (D4):** al terminar, la diferencia entre un carro y el siguiente está entre 2 y 15 segundos en al menos 8 de cada 10 carreras de prueba.
- **RF-08 (D4):** un jugador que maneja bien puede ganar, y uno que maneja muy lento queda último.
- **RF-09 (D5):** durante la carrera se ve la posición del jugador ("2.º/5") y cambia al adelantar o ser adelantado.
- **RF-10 (D5):** al terminar se ve una tabla con los 5 puestos, nombres y tiempos. Revancha vuelve a correr contra los mismos 4 rivales y Menú vuelve a Inicio.
- **RF-11 (D7):** el jugador y los rivales no se atraviesan: al tocarse rebotan y pierden algo de velocidad.
- **RF-12 (D1):** las otras 4 pantallas 3D se ven y se manejan igual que antes.
- **RF-13 (D9):** los PRD de D9 tienen su nota, `CLAUDE.md` agrega la jerarquía `PilotoPC` y el backlog enlaza B5 con este PRD.

## 7. Requerimientos no funcionales
- **RNF-01 (D6, D8), reglas del proyecto:** todo lo nuevo cumple `CLAUDE.md`: una clase por archivo, español, `#privados`, MVC (los pilotos son del modelo) y ningún archivo de más de 400 líneas.
- **RNF-02, rendimiento:** con 5 carros, Jugar Solo mantiene al menos 30 cuadros por segundo en un celular común.
- **RNF-03, pruebas:** el manejo, las llegadas y las posiciones se prueban en el modelo con carreras simuladas; la posición en vivo, la tabla y los choques entre carros, en navegador real en vertical. Las pruebas citan los RF de este PRD.
- **RNF-04, entrega:** llega a `main` cumpliendo la forma corta de `CLAUDE.md` y la lista "Antes de llevar algo a main".

## 8. Criterios de aceptación del MVP
1. Jugar Solo arranca con 5 carros y los 4 rivales terminan la carrera.
2. Cada rival maneja distinto y comete errores propios de su personalidad.
3. Las llegadas quedan separadas de forma natural y se ve la posición y la tabla final.
4. `npm run test:todo` pasa en verde.

## 9. Riesgos y supuestos
- **Límite de líneas:** `VisorCarreraSolo` está en 383 líneas; crear, mover y dibujar a los rivales va en clases nuevas.
- **Choque con el PRD 011:** se está implementando en otra sesión y toca Jugar Solo; este PRD se programa después.
- **Ajuste de ritmo visible:** si es muy fuerte, el jugador nota que los rivales lo esperan; se prueba con carreras simuladas.
- **Rendimiento:** 4 carros más con sus modelos 3D pueden bajar los cuadros por segundo en celulares viejos.

### Historial
- **v1** (2026-10-25): primera versión, con las 8 decisiones aceptadas por el usuario (4 rivales más el jugador).
