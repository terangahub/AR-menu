"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

// Le sélecteur de fichier natif est laid, sa largeur varie d'un navigateur
// à l'autre, et sur mobile il poussait le bouton d'envoi hors de l'écran.
// Il est donc masqué : c'est un bouton du produit qui l'ouvre, et le nom du
// fichier choisi s'affiche à côté, ce que le contrôle natif ne garantit pas
// une fois tronqué.
function FilePicker({
  accept,
  inputRef,
  chooseLabel,
  emptyLabel,
  fileName,
  onPick,
}: {
  accept: string;
  inputRef: React.RefObject<HTMLInputElement>;
  chooseLabel: string;
  emptyLabel: string;
  fileName: string | null;
  onPick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onPick} />
      <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
        {chooseLabel}
      </Button>
      <span
        className={`min-w-0 flex-1 truncate text-xs ${
          fileName ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {fileName ?? emptyLabel}
      </span>
    </div>
  );
}

export function DishMedia({
  dishId,
  imageUrl,
  model3dGlbUrl,
  model3dUsdzUrl,
}: {
  dishId: string;
  imageUrl: string | null;
  model3dGlbUrl: string | null;
  model3dUsdzUrl: string | null;
}) {
  const t = useTranslations("Dashboard.dishForm");
  const router = useRouter();
  const photoInput = useRef<HTMLInputElement>(null);
  const glbInput = useRef<HTMLInputElement>(null);
  const usdzInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"photo" | "model3d" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<{ photo?: string; glb?: string; usdz?: string }>({});

  function pick(key: "photo" | "glb" | "usdz", ref: React.RefObject<HTMLInputElement>) {
    setError(null);
    setNames((prev) => ({ ...prev, [key]: ref.current?.files?.[0]?.name }));
  }

  async function uploadPhoto() {
    const file = photoInput.current?.files?.[0];
    // Sans ce message, le bouton semble cassé : il ne se passait
    // strictement rien quand aucun fichier n'était choisi.
    if (!file) {
      setError(t("noPhotoSelected"));
      return;
    }
    setUploading("photo");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/dishes/${dishId}/photo`, { method: "POST", body: formData });

    setUploading(null);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    setNames((prev) => ({ ...prev, photo: undefined }));
    router.refresh();
  }

  async function uploadModel() {
    const glb = glbInput.current?.files?.[0];
    // Le cas qui a dérouté Mouhamed : une photo choisie plus haut, ce
    // bouton pressé, et rien ne se passe. Ce bouton n'envoie que le
    // modèle 3D, la photo a le sien.
    if (!glb) {
      setError(t("noGlbSelected"));
      return;
    }
    setUploading("model3d");
    setError(null);

    const formData = new FormData();
    formData.append("glb", glb);
    const usdz = usdzInput.current?.files?.[0];
    if (usdz) formData.append("usdz", usdz);

    const res = await fetch(`/api/dishes/${dishId}/model3d`, { method: "POST", body: formData });

    setUploading(null);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    setNames((prev) => ({ ...prev, glb: undefined, usdz: undefined }));
    router.refresh();
  }

  return (
    <div className="surface-panel flex flex-col gap-6 p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base leading-tight">{t("mediaTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("mediaHint")}</p>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{t("photo")}</span>
          <StatusPill present={Boolean(imageUrl)} yes={t("mediaPresent")} no={t("mediaMissing")} />
        </div>
        <div className="flex items-start gap-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-xl border border-border/60 object-cover"
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <FilePicker
              accept="image/png,image/jpeg,image/webp"
              inputRef={photoInput}
              chooseLabel={t("chooseFile")}
              emptyLabel={t("noFileChosen")}
              fileName={names.photo ?? null}
              onPick={() => pick("photo", photoInput)}
            />
            <Button
              type="button"
              size="sm"
              disabled={uploading === "photo"}
              onClick={uploadPhoto}
              className="w-fit"
            >
              {uploading === "photo" ? t("saving") : t("savePhoto")}
            </Button>
          </div>
        </div>
      </section>

      {/* Les URL brutes des modèles étaient affichées telles quelles : une
          adresse de stockage de deux cents caractères ne dit rien à un
          restaurateur. Seule l'information utile reste, présent ou absent. */}
      <section className="flex flex-col gap-3 border-t border-border/60 pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{t("model3dGlb")}</span>
          <StatusPill
            present={Boolean(model3dGlbUrl)}
            yes={t("mediaPresent")}
            no={t("mediaMissing")}
          />
        </div>
        <FilePicker
          accept=".glb"
          inputRef={glbInput}
          chooseLabel={t("chooseFile")}
          emptyLabel={t("noFileChosen")}
          fileName={names.glb ?? null}
          onPick={() => pick("glb", glbInput)}
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-sm font-medium">{t("model3dUsdz")}</span>
          <StatusPill
            present={Boolean(model3dUsdzUrl)}
            yes={t("mediaPresent")}
            no={t("mediaMissing")}
          />
        </div>
        <FilePicker
          accept=".usdz"
          inputRef={usdzInput}
          chooseLabel={t("chooseFile")}
          emptyLabel={t("noFileChosen")}
          fileName={names.usdz ?? null}
          onPick={() => pick("usdz", usdzInput)}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">{t("usdzHint")}</p>

        <Button
          type="button"
          size="sm"
          disabled={uploading === "model3d"}
          onClick={uploadModel}
          className="w-fit"
        >
          {uploading === "model3d" ? t("saving") : t("saveModel")}
        </Button>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function StatusPill({ present, yes, no }: { present: boolean; yes: string; no: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${
        present
          ? "border-border/70 text-muted-foreground"
          : "border-dashed border-border/70 text-muted-foreground/70"
      }`}
    >
      {present ? yes : no}
    </span>
  );
}
