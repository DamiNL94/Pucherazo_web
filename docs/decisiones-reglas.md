# Decisiones de reglas

El reglamento deja varios puntos abiertos. Aquí está cada uno con el **valor por defecto** que usará el motor. Los valores numéricos viven en `content/rules.config.json`.

Estado: ✅ confirmado por el autor · 🟡 propuesto, a validar en playtest · ❓ pendiente

## A. Economía

| # | Tema | Decisión por defecto | Estado |
|---|---|---|---|
| A1 | Número en la esquina de la carta de candidato | Monedas que aporta al presupuesto inicial | 🟡 |
| A2 | Coste de un interventor | **1 moneda** (`overseerCost`) | 🟡 |
| A3 | Coste de una carta de Campaña | **2 monedas** (`campaignCardCost`); se compra **a ciegas** del mazo común | 🟡 |
| A4 | Monedas del distrito en el mapa (Villa Nueva 2, Cabeza de Partido 4, Vega 3) | Ambos jugadores las reciben al iniciar la Precampaña de ese distrito (`districtCoinsMode: "both_at_start"`; alternativa `"winner"`) | 🟡 |
| A5 | Presupuesto sobrante | Se conserva entre distritos | 🟡 |
| A6 | Reserva aporta monedas | No (regla base) | ✅ |

## B. Interventores

| # | Tema | Decisión | Estado |
|---|---|---|---|
| B1 | ¿Pasan de un distrito a otro? | No: son del distrito; al terminar, se descartan | 🟡 |
| B2 | Límite de compra | Sin límite salvo presupuesto | ✅ |
| B3 | Amortizar 5 → −1 dado rival | Mínimo 1 dado | ✅ |
| B4 | Cierre de colegio | Diferencia ≥ 6 interventores no amortizados; se puede declarar en cualquier momento de la fase de Campaña en tu turno | 🟡 |
| B5 | Anular carta (3) | Elimina el modificador pendiente de esa carta (incluidas monedas que hubiera dado) | 🟡 |

## C. Votación

| # | Tema | Decisión | Estado |
|---|---|---|---|
| C1 | Afinidad | +1 voto por cada atributo que coincida con el distrito (ideología, grupo social, religión) | 🟡 |
| C2 | Dados | Se suman todos (d6) | 🟡 |
| C3 | "Suma a la tirada" en cartas | Se trata como modificador de votos en el recuento (excepto en el desempate por dados, que usa dados sin bonificar) | 🟡 |
| C4 | Empate total | Dados sin bonificar → repetir tirada | ✅ |
| C5 | Empate final en diputados | Más votos acumulados. (El mapa de Peñahonda suma 5 diputados, así que no puede empatar) | 🟡 |

## D. Cartas y mazos

| # | Tema | Decisión | Estado |
|---|---|---|---|
| D1 | Color de carta de candidato → partido | **Azul = Conservador, Rojo = Liberal** (deducido de las Tramas "Tiempo de…") | 🟡 |
| D2 | Mano de Campaña | Persiste entre distritos, sin límite | 🟡 |
| D3 | Mazo de Campaña | Común a ambos jugadores; si se agota, se baraja el descarte | 🟡 |
| D4 | ¿Qué cartas son Amaño? | Ninguna de las 6 actuales lo indica. Campo `isRigging` en el JSON; por defecto `false` | ❓ |
| D5 | "Candidatos conservadores/liberales" en Tramas | Se refiere al **partido** del candidato, no a la ideología | 🟡 |
| D6 | Tramas contradictorias | Si se revela una incompatible con una activa ("Tiempo de liberales" vs "de conservadores"), se descarta y se roba otra. Cada Trama lleva `tags` y `conflictsWith` | 🟡 |
| D7 | "Años de vacas gordas" retira Tramas "contradictorias con la prosperidad" | Las que tengan tag `austerity` (de momento: "Las arcas, en números rojos") | 🟡 |
| D8 | Pedro Calero (grupo social X) | Elige grupo social al iniciar la Campaña; la afinidad se recalcula en ese momento | 🟡 |
| D9 | Raimundo: "paga 1 para ignorar efectos negativos de Tramas" | Se ofrece una vez por distrito, al iniciar la Precampaña de su distrito; cubre todas las Tramas negativas para él en ese distrito | 🟡 |
| D10 | Andrés Valera: rival elige "perder 1 voto o revelar mano" | −1 voto en el recuento del distrito actual; "revelar mano" la hace visible al rival hasta el final del distrito | 🟡 |
| D11 | Bartolomé: el rival "puede robar" | Robo gratis del mazo de Campaña; si acepta, Bartolomé recibe 1 interventor gratis | 🟡 |
| D12 | "Al inicio de la partida, el Partido X roba 1 Campaña adicional" | Robo gratis tras revelar las Tramas | 🟡 |
| D13 | "Las arcas": "la primera vez que un jugador gane monedas en cada distrito, gana 1 menos" | Se cuenta por jugador y por distrito; las monedas del mapa (A4) cuentan | 🟡 |

## E. Contenido que falta

| # | Tema | Decisión | Estado |
|---|---|---|---|
| E1 | Atributos de los distritos (el mapa no los muestra) | Propuesta en `maps.json` según el texto del mapa: Villa Nueva = Progresista/Industriales/Secular; Cabeza de Partido = Moderado/Terratenientes/Confesional; Vega de los Molinos = Progresista/Campesinos/Confesional | ❓ |
| E2 | Orden de distritos | Villa Nueva → Cabeza de Partido → Vega de los Molinos (sigue el camino del mapa) | 🟡 |
| E3 | Candidatos insuficientes (hacen falta 4 por partido) | 2 placeholders por partido sin habilidad, marcados `placeholder: true` | 🟡 |
| E4 | Tamaño del mazo de Campaña | 3 copias de cada una de las 6 cartas (18) | 🟡 |
| E5 | Valores posibles de atributos | Ideología: Reaccionario, Moderado, Progresista · Grupo social: Campesinos, Industriales, Terratenientes, Comerciantes · Religión: Confesional, Secular | ❓ |
| E6 | Trama "Orden recibida desde la capital" (citada en el reglamento) | No hay carta; no se implementa hasta tener su texto | ❓ |
