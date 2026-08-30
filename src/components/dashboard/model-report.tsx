"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatBytes, type GlbReport } from "@/lib/glb-inspect";

type Report = GlbReport & { usdzBytes: number | null };

// Panneau de diagnostic du modèle 3D (ticket S9-01).
//
// Un modèle KIRI d'une seule assiette pèse environ 94 Mo, ce qui est
// anormal, et la suite du chantier dépend entièrement de la cause : réduire
// les textures, décimer le maillage, ou recadrer la capture ne sont pas le
// même travail. Ce panneau existe pour répondre à cette question **sur un
// vrai fichier**, depuis un téléphone, sans terminal.
//
// Il restera utile après : c'est lui qui dira si le post-traitement de
// `S9-02` a effectivement allégé le modèle, et de combien.
export function ModelReport({ dishId }: { dishId: string }) {
  const t = useTranslations("Dashboard.modelReport");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/dishes/${dishId}/model-report`);
    setLoading(false);

    if (!res.ok) {
      // Le corps est lu en texte puis interprété : un 500 de l'App Router
      // et un 504 de la plateforme arrivent **sans JSON**, et un
      // `res.json()` qui échoue effaçait la seule information disponible,
      // laissant un message générique qui n'oriente vers rien. Le code
      // HTTP est toujours affiché, parce qu'il distingue déjà une session
      // expirée d'une adresse morte ou d'un dépassement de délai.
      const raw = await res.text().catch(() => "");
      let detail = raw.slice(0, 300);
      try {
        detail = (JSON.parse(raw) as { detail?: string }).detail ?? detail;
      } catch {
        // Corps non JSON : on garde le texte brut, tronqué.
      }
      setError(`${t("error")} (HTTP ${res.status}${detail ? ` : ${detail}` : ""})`);
      return;
    }
    setReport((await res.json()) as Report);
  }

  const share = (bytes: number) =>
    report && report.fileBytes > 0
      ? `${((bytes / report.fileBytes) * 100).toFixed(1)} %`
      : "";

  return (
    <div className="surface-panel flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-base leading-tight">{t("title")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("hint")}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={run} disabled={loading}>
          {loading ? t("running") : report ? t("rerun") : t("run")}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {report && (
        <div className="flex flex-col gap-4">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Row label={t("file")} value={formatBytes(report.fileBytes)} />
            {report.usdzBytes != null && (
              <Row label={t("usdz")} value={formatBytes(report.usdzBytes)} />
            )}
            <Row
              label={t("textures")}
              value={`${formatBytes(report.textureBytes)} · ${share(report.textureBytes)}`}
            />
            <Row
              label={t("geometry")}
              value={`${formatBytes(report.geometryBytes)} · ${share(report.geometryBytes)}`}
            />
            <Row label={t("triangles")} value={report.triangles.toLocaleString()} />
            <Row label={t("generator")} value={report.generator ?? t("unknown")} />
          </dl>

          {report.images.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("images")}
              </span>
              <ul className="flex flex-col gap-1 text-sm">
                {report.images.map((image, index) => (
                  <li key={index} className="flex justify-between gap-4 tabular-nums">
                    <span className="text-muted-foreground">{image.mimeType}</span>
                    <span>{formatBytes(image.bytes)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.dimensions && (
            <div className="flex flex-col gap-1.5 border-t border-border/60 pt-4">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("sizeInAr")}
              </span>
              {/* Un GLB est interprété en mètres : ces dimensions sont
                  littéralement la taille que prendra le plat sur la table
                  du convive. C'est la mesure qui tranche `S9-09`. */}
              <p className="font-heading text-2xl leading-none tabular-nums">
                {(report.dimensions.x * 100).toFixed(0)} x{" "}
                {(report.dimensions.y * 100).toFixed(0)} x{" "}
                {(report.dimensions.z * 100).toFixed(0)} cm
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {report.hasNodeTransforms ? t("sizeWithTransform") : t("sizeHint")}
              </p>
            </div>
          )}

          {/* La conclusion est calculée, pas laissée à l'interprétation :
              c'est elle qui décide du contenu de S9-02. */}
          <p className="rounded-xl border border-border/60 bg-foreground/[0.03] p-3 text-sm leading-relaxed">
            {report.textureBytes > report.geometryBytes * 2
              ? t("verdictTextures")
              : report.geometryBytes > report.textureBytes * 2
                ? t("verdictGeometry")
                : t("verdictBoth")}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
