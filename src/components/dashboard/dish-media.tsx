"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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
    const res = await fetch(`/api/dishes/${dishId}/photo`, {
      method: "POST",
      body: formData,
    });

    setUploading(null);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
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

    const res = await fetch(`/api/dishes/${dishId}/model3d`, {
      method: "POST",
      body: formData,
    });

    setUploading(null);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("photo")}</span>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-32 w-32 rounded-md object-cover" />
        )}
        {/* flex-wrap et max-w-full : sur mobile, le sélecteur de fichier
            natif est large et poussait le bouton hors de l'écran, si bien
            qu'on ne voyait plus qu'un seul des deux boutons Enregistrer. */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={photoInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="max-w-full"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading === "photo"}
            onClick={uploadPhoto}
          >
            {uploading === "photo" ? t("saving") : t("savePhoto")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("model3dGlb")}</span>
        {model3dGlbUrl && (
          <p className="truncate text-xs text-muted-foreground">{model3dGlbUrl}</p>
        )}
        <input ref={glbInput} type="file" accept=".glb" className="max-w-full" />

        <span className="text-sm font-medium">{t("model3dUsdz")}</span>
        {model3dUsdzUrl && (
          <p className="truncate text-xs text-muted-foreground">{model3dUsdzUrl}</p>
        )}
        <input ref={usdzInput} type="file" accept=".usdz" className="max-w-full" />

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading === "model3d"}
          onClick={uploadModel}
          className="w-fit"
        >
          {uploading === "model3d" ? t("saving") : t("saveModel")}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
