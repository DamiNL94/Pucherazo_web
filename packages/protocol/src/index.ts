import { z } from "zod";

/** Mensajes cliente↔servidor. Se completan en la Fase 6. */
export const RoomCodeSchema = z.string().regex(/^[A-Z]{6}$/, "código de sala de 6 letras");
export type RoomCode = z.infer<typeof RoomCodeSchema>;
