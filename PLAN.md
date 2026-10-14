# Pucherazo Web — Plan de desarrollo

> Documento de trabajo para desarrollar con **Claude Code**. Léelo junto a `CLAUDE.md` (convenciones) y `docs/decisiones-reglas.md` (huecos del reglamento y valores por defecto).
> Fuente de verdad del juego: `Pucherazo - Reglamento .pdf` + imágenes de cartas y mapa de esta carpeta.

---

## 1. Visión

PWA de Pucherazo para 2 jugadores (Liberal vs Conservador) con tres modos:

1. **Contra la máquina** — funciona offline (el motor corre en el navegador).
2. **Multijugador online** — sala con código de 6 letras, servidor autoritativo.
3. **Partida local (hot-seat)** — dos personas en el mismo dispositivo (sale casi gratis con el motor).

Hoja de ruta de despliegue: Docker local → Railway (playtest con amigos) → APK en Play Store.

---

## 2. Stack elegido

| Capa | Tecnología | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** en todo el monorepo | Un solo motor de reglas para cliente, servidor e IA |
| Monorepo | **pnpm workspaces** (+ Turborepo opcional) | Paquetes compartidos sin publicar nada |
| Motor de reglas | `packages/engine` — TS puro, **sin dependencias**, determinista | Testeable, reutilizable por IA y servidor |
| Contenido | `packages/content` — JSON + esquemas **zod** | Cartas y reglas ajustables sin tocar código |
| Frontend | **React 19 + Vite**, **Zustand**, React Router, **Motion** (animaciones), CSS Modules o Tailwind | Lo elegido; ligero y rápido |
| PWA | **vite-plugin-pwa** (Workbox) | Instalable + precache de assets para jugar offline vs IA |
| Servidor | **Node 22 LTS + Fastify + Socket.IO** | WebSockets maduros, reconexión, salas |
| BD | **PostgreSQL + Prisma** | Partidas, log de acciones, estadísticas; Railway lo ofrece nativo |
| Tests | **Vitest** + **fast-check** (property tests) + **Playwright** (E2E) | |
| Contenedores | Docker multi-stage + docker-compose | |
| Móvil | **Capacitor (Android)** | Empaqueta la web; el modo IA funciona sin red |
| CI | GitHub Actions (lint, typecheck, test, build) | |

**Sobre PHP:** con la arquitectura elegida no hace falta. Si más adelante quieres un panel de administración o estadísticas en PHP (Laravel), puede leer la misma base de datos Postgres sin tocar el juego. No entra en el MVP.

---

## 3. Arquitectura

```
pucherazo/
├─ apps/
│  ├─ web/          React + Vite + PWA (UI, modo IA y hot-seat en local)
│  ├─ server/       Fastify + Socket.IO (salas, partidas online, persistencia). Sirve también el build de web
│  └─ mobile/       Proyecto Capacitor (fase 10)
├─ packages/
│  ├─ engine/       Motor de reglas puro (estado, acciones, fases, efectos de cartas, RNG con semilla)
│  ├─ ai/           Bots (fácil / normal / difícil) que usan engine
│  ├─ content/      JSON de cartas, mapas y rules.config + esquemas zod + imágenes optimizadas
│  └─ protocol/     Tipos de mensajes cliente↔servidor (zod)
├─ docs/
├─ docker-compose.yml
└─ Dockerfile
```

### 3.1 Principios del motor (lo más importante del proyecto)

- **Reducer puro:** `apply(state, action) → { state, events }`. Nada de `Math.random`, `Date`, ni E/S.
- **RNG con semilla dentro del estado** (p. ej. mulberry32/xoshiro). Misma semilla + mismas acciones = misma partida → replays, depuración y tests reproducibles.
- **`legalActions(state, player)`**: lista de acciones válidas. La usan la UI (botones habilitados), el servidor (validación) y la IA (búsqueda).
- **Máquina de estados explícita** por distrito: `SETUP → PRECAMPAIGN(reveal → plots → candidate → buyOverseers → buyCampaign) → CAMPAIGN → VOTING(roll → postRoll → tally) → AWARD → siguiente distrito | GAME_OVER`.
- **Decisiones pendientes** (`pendingChoice`): cuando un efecto obliga a elegir (Andrés Valera: "perder 1 voto o revelar mano"; Pedro Calero: elegir base social; Bartolomé: "¿robas carta?"), el estado se detiene esperando la acción de *ese* jugador.
- **Efectos de carta como código registrado por id**, no un DSL genérico: `cards/effects/<id>.ts` que se enganchan a *triggers* (`onReveal`, `onCampaignStart`, `onOpponentPlaysCampaign`, `onOwnCampaignPlayed`, `modifyOverseerCost`, `modifyCoinGain`, `preTally`, `onDistrictWon`, `onEnterPlay`…). El JSON guarda textos y atributos; el código, el comportamiento.
- **Los efectos de Campaña se resuelven como modificadores pendientes** que se aplican en el recuento. Así "anular carta" (3 interventores) solo elimina el modificador. Las tiradas propias de una carta (Debate, Mitin) se hacen al jugarla y se guarda el resultado.
- **Vista por jugador:** `projectView(state, player)` oculta mano rival, candidatos boca abajo, orden de mazos y semilla. El cliente online solo recibe vistas.
- **Log de eventos** legible ("Liberal compra 3 interventores (−3 monedas)") para la UI y para depurar.

### 3.2 Flujo online

1. Cliente crea sala → servidor devuelve código + token de jugador (guardado en localStorage).
2. Rival se une con el código; se eligen partidos; servidor genera semilla y estado inicial.
3. Cliente envía `action` → servidor valida con `legalActions` → `apply` → guarda acción en BD → emite a cada jugador su `projectView` + eventos.
4. Reconexión: con el token, el servidor reenvía la vista actual. Sala abandonada > N min → partida cerrada.
5. Persistencia: tabla `games` (semilla, estado snapshot, estado), `game_actions` (log ordenado). El log permite reconstruir cualquier partida.

### 3.3 IA

- **Fácil:** acción legal aleatoria con sesgo hacia comprar/jugar lo que suma votos.
- **Normal:** heurística — estima la probabilidad de ganar el distrito (distribución de dados + modificadores conocidos), gasta presupuesto según el peso del distrito (diputados en juego / restantes), usa amortizaciones cuando dan ventaja clara, cierra colegio si puede.
- **Difícil:** Monte Carlo con determinización (rellena la información oculta con muestras plausibles y simula con el propio motor N veces por acción candidata). Corre en un **Web Worker** para no bloquear la UI.
- La IA nunca lee el estado completo: recibe `projectView` como un jugador humano.

---

## 4. Fases de desarrollo

Cada fase acaba en algo que se puede ejecutar y comprobar. Las casillas son el checklist para Claude Code.

### Fase 0 — Esqueleto del repo (½ día)
- [x] Monorepo pnpm con `apps/*` y `packages/*`, TS estricto, ESLint + Prettier, Vitest.
- [x] Scripts raíz: `dev`, `build`, `test`, `lint`, `typecheck`.
- [x] GitHub Actions con lint + typecheck + test.
- [x] Copiar las imágenes originales a `packages/content/assets/raw/` y script que genere WebP optimizados (sharp) en varios tamaños.
- **Hecho cuando:** `pnpm test` y `pnpm build` pasan en limpio.

### Fase 1 — Contenido (1 día)
- [ ] Esquemas zod: `Candidate`, `CampaignCard`, `PlotCard`, `ProvinceMap`, `RulesConfig`.
- [ ] Importar los JSON ya preparados en `content/` (esta carpeta) y validar en test.
- [ ] Añadir candidatos y copias de campaña **placeholder** (marcados `placeholder: true`) para que cada partido tenga ≥ distritos+1 candidatos (ver decisiones).
- **Hecho cuando:** un test carga todo el contenido y lo valida.

### Fase 2 — Motor base sin efectos de cartas (3–4 días)
- [ ] Tipos de estado y acciones. RNG con semilla.
- [ ] Preparación: elegir partido, robar distritos+1 candidatos, asignar, reserva, presupuesto inicial, 2 Tramas.
- [ ] Ciclo de distrito completo con todas las fases del reglamento (§6–§9).
- [ ] Interventores: compra, voto +1, amortización 3 (anular), 5 (−1 dado, mínimo 1), cierre de colegio (≥6 de diferencia).
- [ ] Recuento y desempates (dados sin bonificar → repetir tirada).
- [ ] Iniciativa: azar en el 1.º, ganador anterior después.
- [ ] Fin de partida y desempate final.
- [ ] `legalActions`, `projectView`, log de eventos.
- **Tests obligatorios:** el ejemplo del §8.3 (A=15, B=12), el ejemplo de cierre de colegio (9 vs 2), afinidad del §6.1 (2 coincidencias), property tests (monedas nunca < 0, la partida siempre termina, `legalActions` nunca vacío salvo en GAME_OVER).

### Fase 3 — Efectos de cartas (2–3 días)
- [ ] Registro de efectos + triggers + `pendingChoice`.
- [ ] Las 4 cartas de candidato, 5 Tramas y 6 Campañas actuales, cada una con su test.
- [ ] Interacciones: "Años de vacas gordas" retira "Las arcas, en números rojos"; "Tiempo de liberales/conservadores" incompatibles entre sí; "Observadores internacionales" + Amaño; Raimundo paga 1 para ignorar Tramas negativas.
- **Hecho cuando:** partidas aleatorias bot-vs-bot (1.000 semillas) terminan sin errores.

### Fase 4 — UI jugable local + PWA (5–7 días) ⭐ primer hito jugable
- [ ] Pantallas: inicio, elegir modo/partido, asignar candidatos (arrastrar a distritos), tablero, fin de partida.
- [ ] Tablero: mapa de Peñahonda con distritos clicables, distrito activo resaltado, marcador de diputados, presupuesto, interventores, mano, Tramas activas, log lateral.
- [ ] Paneles por fase con acciones habilitadas según `legalActions`.
- [ ] Componente `<Card>` que **dibuja el marco con código** (React/CSS) a partir del JSON + la ilustración recortada. Nunca usar las imágenes completas de las cartas prototipo en la app: el marco debe poder sustituirse en un solo sitio (ver Fase 9b).
- [ ] Dados animados, revelado de candidato con giro de carta, desglose del recuento (dados + afinidad + cartas + interventores).
- [ ] Modo hot-seat (pantalla de "pasa el dispositivo" para ocultar la mano) y vs IA fácil.
- [ ] Mobile-first (vertical, pulgares), manifest, iconos, service worker, funciona offline vs IA.
- **Hecho cuando:** se juega una partida completa en el móvil instalada como PWA y en modo avión.

### Fase 5 — IA normal y difícil (3–4 días)
- [ ] Bots en `packages/ai`, ejecutados en Web Worker.
- [ ] Script de torneo bot-vs-bot que da % de victoria por partido y por bot → sirve también para **balancear** cartas.
- **Hecho cuando:** Normal gana a Fácil > 70 %, Difícil a Normal > 60 %.

### Fase 6 — Multijugador online (4–5 días)
- [ ] Servidor Fastify + Socket.IO; mensajes validados con zod (`packages/protocol`).
- [ ] Salas con código, elección de partido, inicio, acciones, reconexión por token, abandono.
- [ ] Prisma + Postgres: `games`, `game_actions`, `players` (invitado con alias; cuentas reales más adelante).
- [ ] El servidor sirve el build de `apps/web` (un solo servicio en Railway).
- [ ] Rate limit básico y validación estricta (nunca confiar en el cliente).
- **Hecho cuando:** dos navegadores distintos juegan online y uno puede recargar a mitad sin perder la partida.

### Fase 7 — Docker local (1 día)
- [ ] `Dockerfile` multi-stage (build con pnpm → imagen runtime node:22-slim).
- [ ] `docker-compose.yml`: `db` (postgres:16) + `app`; migraciones Prisma al arrancar.
- [ ] `.env.example`, healthcheck `/health`.
- **Hecho cuando:** `docker compose up` y se juega online desde otro dispositivo de tu red local (http://IP:3000).

### Fase 8 — Railway + playtest con amigos (1–2 días + pruebas)
- [ ] Servicio desde el repo de GitHub usando el Dockerfile; añadir plugin Postgres; variables `DATABASE_URL`, `PORT`, `NODE_ENV`.
- [ ] Dominio `*.up.railway.app` (HTTPS, necesario para PWA).
- [ ] Botón "Enviar feedback" en la app + registro de partidas para analizar balance (quién gana, qué cartas se usan).
- [ ] Guía de playtest para amigos (qué probar, cómo reportar).

### Fase 9 — Pulido (iterativo)
- [ ] Tutorial guiado del primer distrito (recomendación §12 del reglamento).
- [ ] Sonido, ajustes de animación, modo daltónico (no depender solo de rojo/azul), accesibilidad (contraste, tamaños táctiles, lector de pantalla en lo básico).
- [ ] Rendimiento: imágenes WebP, lazy loading, Lighthouse PWA ≥ 90.
- [ ] Aplicar cambios de reglas salidos del playtest en `rules.config.json`.

### Fase 9b — Rediseño del marco de carta e identidad visual (3–5 días) ⚠️ obligatoria antes de la Fase 10
Las cartas prototipo imitan muy de cerca la maquetación de *Magic: The Gathering*. Antes de publicar en la Play Store hay que sustituirla por un diseño propio para evitar reclamaciones de propiedad intelectual (derechos de autor / imagen comercial).

**Elementos a eliminar o transformar:**
- [ ] Círculo de coste arriba a la derecha (estilo maná) → p. ej. moneda acuñada, sello o timbre fiscal con el valor.
- [ ] Barra de tipo a media carta con símbolo de expansión a la derecha → otra ubicación y otro recurso gráfico.
- [ ] Marco biselado con esquinas inferiores redondeadas tipo "lápida" → forma propia.
- [ ] Pie con año, número de colección, "• ES", artista e icono → pie distinto (o créditos solo en una pantalla de créditos).
- [ ] Tipografía del título (comprobar si es Beleren u otra similar) → fuente libre de época (p. ej. de Google Fonts, licencia OFL).
- [ ] Estructura "nombre de habilidad en negrita + línea + ambientación en cursiva" → reorganizar la jerarquía del texto.

**Dirección de arte propuesta (época 1900–1930):**
- [ ] Explorar 2–3 propuestas: cartel electoral de época, papeleta / acta con sellos, recorte de prensa, ornamento modernista.
- [ ] Elegir una y definir *design tokens* (colores por partido, papel, tinta, tipografías, iconos de atributo: ideología, grupo social, religión).
- [ ] Implementar el nuevo marco en `<Card>` para los tres tipos (Candidato, Campaña, Trama) y revisar el tablero/mapa con la misma estética.
- [ ] Iconografía propia para monedas, interventores, diputados y dados.
- [ ] Prueba de legibilidad en móvil (texto de habilidad a tamaño real) y en modo daltónico.

**Derechos sobre las ilustraciones:**
- [ ] Confirmar autoría y licencia de cada ilustración; si se generaron con IA, revisar las condiciones de la herramienta usada.
- [ ] Revisar que ningún retrato se parezca demasiado a una persona real reconocible.
- [ ] Pantalla de créditos con autores y licencias (incluidas fuentes y librerías).
- **Hecho cuando:** ninguna pantalla de la app contiene el marco prototipo y la lista de comprobación de arriba está cerrada.

### Fase 10 — APK y Play Store
- [ ] `apps/mobile` con Capacitor: copia el build web, configura URL del servidor para el modo online.
- [ ] Icono adaptativo, splash, orientación, botón atrás de Android.
- [ ] Firma (keystore guardado fuera del repo) → **AAB** firmado.
- [ ] Play Console: cuenta de desarrollador (pago único), ficha, capturas, política de privacidad (URL pública), formulario de Seguridad de los datos, clasificación de contenido.
- [ ] ⚠️ Las cuentas personales nuevas deben pasar una **prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de publicar en producción. Planificad a los amigos del playtest como testers.
- [ ] Comprobar el *target API level* que exija Google en ese momento.

---

## 5. Riesgos y cómo mitigarlos

| Riesgo | Mitigación |
|---|---|
| Reglas ambiguas o incompletas | `docs/decisiones-reglas.md` + `rules.config.json`; cada decisión con test |
| Solo hay 4 candidatos (hacen falta 8 para el mapa de 3 distritos) | Placeholders marcados hasta tener las cartas reales |
| Efectos de carta que interactúan de forma rara | Triggers con orden definido (iniciativa primero) + tests de interacción |
| Trampas en online | Servidor autoritativo + vistas proyectadas; el cliente nunca ve la semilla |
| Maquetación de cartas parecida a *Magic: The Gathering* | Marco dibujado por código desde la Fase 4 y rediseño propio en la Fase 9b, antes de la Store |
| Derechos de las ilustraciones | Confirmar autoría/licencia de cada imagen en la Fase 9b |
| Requisito de 12 testers | Reclutarlos durante el playtest de Railway |

---

## 6. Cómo trabajar con Claude Code

1. Crea una carpeta de repo (p. ej. `pucherazo-web`), copia dentro `PLAN.md`, `CLAUDE.md`, `docs/` y `content/`, y haz `git init`.
2. Abre Claude Code en esa carpeta y pide **una fase cada vez**:
   > "Lee PLAN.md, CLAUDE.md y docs/decisiones-reglas.md. Implementa la Fase 0. Al terminar, marca las casillas y resume qué falta."
3. Para fases grandes, pide primero el plan en modo plan y apruébalo antes de que escriba código.
4. Tras cada fase: `pnpm test`, commit, y prueba manual.
5. Cuando cambies una regla, edita `docs/decisiones-reglas.md` y `rules.config.json` y pide a Code que actualice los tests.

**Estimación total hasta playtest en Railway:** ~4–6 semanas a ritmo de tarde/fin de semana.
