/** Bots (fácil / normal / difícil) sobre el motor. Se implementan en las Fases 4 y 5. */
export const BOT_LEVELS = ["easy", "normal", "hard"] as const;
export type BotLevel = (typeof BOT_LEVELS)[number];
