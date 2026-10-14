import { describe, expect, it } from "vitest";
import { slugify } from "../src/slug";

describe("slugify", () => {
  it("quita acentos, signos y extensión", () => {
    expect(slugify("Años de vacas gordas.jpeg")).toBe("anos-de-vacas-gordas");
    expect(slugify("Andrés Valera Asensio .jpeg")).toBe("andres-valera-asensio");
    expect(slugify("Las arcas, en números rojos.jpeg")).toBe("las-arcas-en-numeros-rojos");
    expect(slugify("Mapa. Provincia de Peñahonda.png")).toBe("mapa-provincia-de-penahonda");
  });
});
