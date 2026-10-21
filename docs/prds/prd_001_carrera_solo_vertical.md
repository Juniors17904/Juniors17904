# PRD 001 — Carrera Solo 3D en vertical (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v4 — implementado y con pruebas en `pruebas/`. Partes reemplazadas por el PRD 002 (D6) |
| Fecha | 2026-10-21 |

## Decisiones bloqueadas

Las decisiones se tomaron con el usuario y son definitivas. Si algún requerimiento choca con ellas, mandan las decisiones.

| # | Decisión |
|---|---|
| D1 | "Jugar Solo" abre una carrera 3D **en vertical**. La carrera 2D se conserva intacta en ⚙ con el botón "Clásico 2D", que sigue en horizontal. *(Reemplazado por PRD 002, D6.)* |
| D2 | El MVP tiene 3 vueltas, cuenta 3-2-1, cronómetro, velocímetro, contador de vuelta y un resultado (tiempo total y mejor vuelta) con los botones Revancha y Menú. |
| D3 | Salirse al pasto baja la velocidad máxima al 40 %. No hay choques ni reinicio. |
| D4 | Se usan la pista elegida en ⚙ → Pistas (Ciudad por defecto) y el carro, el color, el timón y el velocímetro del garaje. |
| D5 | Una vuelta solo vale si se pasan 3 puntos de control en orden: 33 %, 66 % y meta. |
| D6 | Clases nuevas, una por archivo: `CarreraVueltas`, `Cronometro` y `MuestraRuta` en el modelo; `VisorCarreraSolo` y `HudCarrera` en la vista; `ControladorCarreraSolo` en el controlador. |
| D7 | De los archivos existentes del juego solo cambian `index.html` y `aplicacion.js`. También pueden cambiar `pruebas/`, `package.json` (comandos `npm test`) y, con permiso del usuario, `CLAUDE.md`. |
| D8 | Se reutilizan sin modificarlas `Ruta`, `Carro`, la cámara, los objetos de escena, los cielos y el velocímetro. |
| D9 | La carrera tiene su propia pantalla, así que nunca aparece "GIRA TU CELULAR". `GestorOrientacion` no se modifica. |
| D10 | Distribución en vertical: arriba la vuelta y el tiempo, al centro la pista, abajo el timón a la izquierda y ACEL/FRENO a la derecha, con el velocímetro encima. En PC es igual, centrado, y usa los botones del teclado. |

## 1. Contexto y problema
Al tocar "Jugar Solo" en el celular, la carrera 2D exige girar el teléfono a horizontal y se queda trabada en "GIRA TU CELULAR". Por otro lado, la pista 3D de Diseño General ya se puede manejar, pero no tiene meta, vueltas ni tiempo, así que no es un juego.

## 2. Objetivo
Que "Jugar Solo" sea una carrera 3D de 3 vueltas que se juega con el celular derecho, con un objetivo claro: terminar en el menor tiempo posible.

## 3. Público objetivo y usuarios
- **Jugador en celular:** juega en vertical con el timón táctil y los botones ACEL/FRENO.
- **Jugador en PC:** juega con el teclado (flechas o WASD) y ve la misma composición, centrada.
- **Jugador que personaliza:** ve en la carrera la pista, el carro y el color que eligió.

## 4. Alcance
**In scope:** carrera 3D vertical de 3 vueltas, cuenta regresiva, HUD (vuelta, tiempo y velocímetro), puntos de control, penalización por pasto, resultado con Revancha y Menú, botón "Clásico 2D" *(Reemplazado por PRD 002, D6.)* y mejoras visuales de la pista (más luz, línea central y línea de meta).

**Out of scope:** rivales, récords guardados, choques o daños, pausa, turbo en el HUD, modo horizontal de la carrera nueva, cerrar las pistas abiertas y cambios en el multijugador.

**No se modifican:** `Ruta`, `Carro`, `CamaraSeguimiento`, `VisorBase`, `FabricaObjetoEscena`, los cielos, `RenderizadorVelocimetro`, `ConfigPista*`, `VisorDisenoPista`, `GestorOrientacion`, `VistaConduccion`, `ControlTimon`, `ControlTeclado`, `Juego`, `GestorAlertas` ni `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Progreso | Qué tan lejos va el carro a lo largo de la vuelta, de 0 a 1. |
| Punto de control | Una marca al 33 % y otra al 66 % de la vuelta. Solo cuentan si se cruzan hacia adelante y en orden. |
| Pasto | Cualquier zona fuera del asfalto y de los pianos. |
| Vuelta válida | Cruzar la meta hacia adelante después de pasar los dos puntos de control. |
| Muestra de ruta (`MuestraRuta`) | Uno de los puntos de la pista que el modelo usa para calcular el progreso. |

## 6. Requerimientos funcionales
- **RF-01:** "Jugar Solo" abre la carrera en vertical y en ningún momento muestra "GIRA TU CELULAR".
- **RF-02:** "Clásico 2D" en ⚙ abre la carrera 2D de siempre, en horizontal. *(Reemplazado por PRD 002, D6.)*
- **RF-03:** La carrera usa la pista, el carro y el color elegidos. Si la pista no existe, usa Ciudad y registra el error.
- **RF-04:** Hay una cuenta 3-2-1-¡YA! con unos 900 ms por número. El carro no se mueve hasta ¡YA!, aunque se acelere.
- **RF-05:** Arriba se ven "Vuelta X/3" y el cronómetro en formato `m:ss.cc`.
- **RF-06:** La vuelta solo cuenta si se pasan los puntos de control en orden y hacia adelante. Cortar camino o cruzar la meta en reversa no suma.
- **RF-07:** En el pasto la velocidad máxima baja de forma gradual hasta el 40 %, y al volver al asfalto se recupera.
- **RF-08:** El velocímetro se ve pequeño, encima de los botones, sin taparlos.
- **RF-09:** Los controles (timón y ACEL/FRENO, o las flechas en PC) se ven completos, sin cortes y dentro de la columna.
- **RF-10:** Al terminar las 3 vueltas aparece un panel con el tiempo total y la mejor vuelta, con Revancha y Menú, por encima de los controles.
- **RF-11:** Revancha reinicia la carrera desde la salida, con velocidad 0 y en la misma pantalla. Menú vuelve a Inicio.
- **RF-12:** Al salir con Menú o con el botón atrás no queda nada corriendo, y volver con "adelante" no deja una pantalla vacía.
- **RF-13:** Si la carrera no carga en 6 s, aparece un aviso y se vuelve a Inicio.
- **RF-14:** La pista se ve bien en vertical: asfalto iluminado, línea central amarilla, línea de meta, pianos, decoraciones y cielo.
- **RF-15:** El juego va a la misma velocidad en cualquier pantalla, sea de 30, 60 o 120 Hz.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto:** se cumple `CLAUDE.md`: una clase por archivo, nombres en español, campos `#privados` y nada de `{ }` guardados. `VisorCarreraSolo` extiende `VisorBase`.
- **RNF-02, MVC:** las reglas de vueltas, tiempo y pasto viven en el modelo. El visor solo dibuja y aplica lo que el modelo calcula, según la excepción de visores 3D de `CLAUDE.md`.
- **RNF-03, rendimiento:** al menos 30 FPS en un celular de gama media.
- **RNF-04, pruebas:** `npm run test:todo` termina en verde antes de llevar cualquier cambio a `main`.

## 8. Criterios de aceptación del MVP
1. En un celular en vertical se puede jugar una carrera completa de 3 vueltas, de "Jugar Solo" hasta el resultado, sin el aviso de rotación.
2. Cortar camino o ir en reversa no suma vueltas.
3. Salirse al pasto frena el carro, y Revancha y Menú funcionan.
4. "Clásico 2D" sigue funcionando igual que antes. *(Reemplazado por PRD 002, D6.)*
5. Las pruebas de `pruebas/` pasan y la consola no muestra errores de la carrera.

## 9. Riesgos y supuestos
- **Pistas abiertas:** solo Ciudad es un circuito cerrado. En las demás pistas la meta y la salida no coinciden.
- **iPhone:** Safari no permite bloquear la orientación, pero como la carrera ya es vertical no hace falta.
- **Detalle técnico:** las fórmulas, los tiempos y los nombres de métodos viven en el código y en `pruebas/`, no en este PRD.

### Historial
- **v1–v3:** versión técnica de unas 375 líneas, corregida con el Verificador PRD. Está en el historial de git, en el commit `17e1152`.
- **v4:** reducida a 2 páginas, con los requerimientos de comportamiento renumerados de RF-01 a RF-15.
