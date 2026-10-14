import { describe, expect, it } from "vitest";
import { RoomCodeSchema } from "../src/index";

describe("protocol", () => {
  it("valida códigos de sala de 6 letras", () => {
    expect(RoomCodeSchema.safeParse("ABCDEF").success).toBe(true);
    expect(RoomCodeSchema.safeParse("abc123").success).toBe(false);
  });
});
