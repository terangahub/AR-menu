"use client";

import { useParams } from "next/navigation";
import { dashboardPath } from "@/lib/dashboard-path";

// Version client de `dashboardPath` : lit le slug dans l'URL courante, qui
// a déjà été validée par le layout du dashboard (un slug étranger y est
// redirigé vers celui du compte). Le slug ne sert qu'à construire des
// liens, jamais à charger des données.
export function useDashboardPath(): (path?: string) => string {
  const params = useParams();
  const slug = typeof params?.restaurantSlug === "string" ? params.restaurantSlug : "";
  return (path = "") => dashboardPath(slug, path);
}
