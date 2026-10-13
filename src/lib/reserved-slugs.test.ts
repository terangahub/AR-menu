import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, isReservedSlug } from "./reserved-slugs";
import { dashboardPath } from "./dashboard-path";

describe("slugs réservés", () => {
  // Garde-fou plutôt qu'exemple : toute page fixe ajoutée sous
  // `src/app/[locale]/` partage le niveau d'adresse des slugs de
  // restaurant, et Next.js la fait passer devant eux. Oublier de la
  // réserver laisserait un restaurant du même nom perdre son menu. Ce test
  // échoue dès qu'une telle page apparaît sans être réservée.
  it("couvre chaque page fixe sous [locale]", () => {
    const localeDir = join(__dirname, "..", "app", "[locale]");
    const staticSegments = readdirSync(localeDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("[") && !entry.name.startsWith("("))
      .map((entry) => entry.name);

    expect(staticSegments.length).toBeGreaterThan(0);
    for (const segment of staticSegments) {
      expect(RESERVED_SLUGS.has(segment), `"${segment}" doit être réservé`).toBe(true);
    }
  });

  it("ignore la casse", () => {
    expect(isReservedSlug("Dashboard")).toBe(true);
    expect(isReservedSlug("teranga")).toBe(false);
  });
});

describe("dashboardPath", () => {
  it("place l'administration sous le slug du restaurant", () => {
    expect(dashboardPath("teranga")).toBe("/teranga/dashboard");
    expect(dashboardPath("teranga", "/dishes/42/edit")).toBe("/teranga/dashboard/dishes/42/edit");
  });
});
