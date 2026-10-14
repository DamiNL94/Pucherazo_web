import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  // Los paquetes del workspace se consumen como TS y se empaquetan dentro.
  noExternal: [/^@pucherazo\//],
});
