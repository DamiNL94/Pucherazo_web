import { describe, expect, it } from "vitest";
import { BOT_LEVELS } from "../src/index";

describe("ai", () => {
  it("define tres niveles de bot", () => {
    expect(BOT_LEVELS).toEqual(["easy", "normal", "hard"]);
  });
});
