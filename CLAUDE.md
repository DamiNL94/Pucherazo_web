# CLAUDE.md — Pucherazo Web

Juego de mesa docente para 2 jugadores (Liberal vs Conservador) ambientado en elecciones caciquiles de principios del s. XX. PWA con modos: vs IA (offline), online y hot-seat.

Lee siempre antes de trabajar: `PLAN.md` (fases y checklist), `docs/decisiones-reglas.md` (reglas fijadas y valores por defecto).

## Stack
pnpm workspaces · TypeScript estricto · React 19 + Vite + vite-plugin-pwa · Zustand · Node 22 + Fastify + Socket.IO · Prisma + PostgreSQL · Vitest + fast-check + Playwright · Docker · Capacitor (Android).

## Comandos
- `pnpm dev` — web + server en desarrollo
- `pnpm test` — todos los tests
- `pnpm lint` / `pnpm typecheck`
- `pnpm build`
- `docker compose up --build` — entorno local completo

## Reglas de oro
1. **`packages/engine` es puro**: sin dependencias, sin `Math.random`, `Date.now`, `console` ni E/S. Toda aleatoriedad sale del RNG con semilla del estado.
2. **Toda regla nueva o cambiada lleva test.** Los ejemplos del reglamento (§6.1, §7.2C, §8.3) son tests de regresión obligatorios.
3. **Contenido en JSON** (`packages/content`), validado con zod. Valores numéricos de balance en `rules.config.json`, nunca hardcodeados en el motor.
4. **Efectos de carta** en `packages/engine/src/cards/effects/<cardId>.ts`, uno por fichero, registrados por id.
5. **El servidor nunca confía en el cliente**: valida cada acción con `legalActions` y envía solo `projectView(state, player)`.
6. La UI decide qué botones mostrar a partir de `legalActions`, nunca reimplementa reglas.
7. **No reproducir el marco de las cartas prototipo** (imita a Magic: The Gathering). Las cartas se dibujan con el componente `<Card>`; usa solo la ilustración, nunca la imagen completa de la carta.
8. Si una regla es ambigua: no inventes en silencio. Usa el valor de `docs/decisiones-reglas.md`; si no está, añádelo allí como "PENDIENTE" con tu propuesta.

## Convenciones
- Identificadores en inglés; textos de UI en español (preparado para i18n con un fichero `es.json`).
- Glosario de dominio (español → código):
  | Juego | Código |
  |---|---|
  | Partido Liberal / Conservador | `Party.Liberal` / `Party.Conservative` |
  | Distrito | `District` |
  | Diputados | `seats` |
  | Presupuesto / monedas | `budget` / `coins` |
  | Interventor | `Overseer` |
  | Amortizar | `spendOverseers` |
  | Cerrar el colegio | `closePollingStation` |
  | Carta de Candidato | `Candidate` |
  | Carta de Campaña | `CampaignCard` |
  | Amaño | `isRigging` |
  | Carta de Trama | `PlotCard` |
  | Reserva | `reserve` |
  | Iniciativa | `initiative` |
  | Afinidad | `affinity` |
- Commits pequeños por tarea; mensajes en español en imperativo.
- Componentes React en PascalCase, un componente por fichero.
