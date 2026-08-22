"use client";

import { ArViewer } from "./ar-viewer";

export function DishArSection({
  dishId,
  qrCodeId,
  glbUrl,
  usdzUrl,
  imageUrl,
  alt,
}: {
  dishId: string;
  qrCodeId?: string;
  glbUrl?: string | null;
  usdzUrl?: string | null;
  imageUrl?: string | null;
  alt: string;
}) {
  function handleArActivated() {
    if (!qrCodeId) return;
    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCodeId, dishId, arActivated: true }),
    }).catch(() => undefined);
  }

  return (
    <ArViewer
      glbUrl={glbUrl}
      usdzUrl={usdzUrl}
      imageUrl={imageUrl}
      alt={alt}
      onArActivated={handleArActivated}
    />
  );
}
