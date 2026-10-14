/** Nombre de fichero → slug ASCII estable ("Años de vacas gordas.jpeg" → "anos-de-vacas-gordas"). */
export function slugify(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
