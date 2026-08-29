"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel } from "@/components/dashboard/ui";
import { DeleteButton } from "@/components/dashboard/delete-button";

export type QrCodeItem = {
  id: string;
  tableNumber: string | null;
  scansCount: number;
};

export function QrCodeList({ qrCodes: initial }: { qrCodes: QrCodeItem[] }) {
  const t = useTranslations("Dashboard.qrcodes");
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState(initial);
  const [tableNumber, setTableNumber] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!tableNumber.trim()) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/qrcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableNumber }),
    });

    setCreating(false);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    const created = await res.json();
    // Ajout optimiste + refresh du Server Component (pour rester cohérent
    // si un autre onglet a aussi modifié la liste) plutôt que de se fier
    // uniquement à l'un ou l'autre.
    setQrCodes((prev) => [...prev, created]);
    setTableNumber("");
    router.refresh();
  }

  async function handleDelete(qrCode: QrCodeItem) {
    if (!confirm(t("confirmDelete"))) return;
    setError(null);
    const previous = qrCodes;
    setQrCodes((prev) => prev.filter((q) => q.id !== qrCode.id));

    const res = await fetch(`/api/qrcodes/${qrCode.id}`, { method: "DELETE" });
    if (!res.ok) {
      setQrCodes(previous);
      setError(t("error"));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title={t("createTitle")} description={t("createHint")}>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{t("tableNumber")}</span>
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder={t("tableNumberPlaceholder")}
              className="input"
            />
          </label>
          <Button type="submit" disabled={creating}>
            {creating ? t("generating") : t("generate")}
          </Button>
        </form>
      </Panel>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {qrCodes.length === 0 ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyHint")} />
      ) : (
        <ul className="surface-panel divide-y divide-border/60">
          {qrCodes.map((qr) => (
            <li
              key={qr.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium">
                  {t("table")} {qr.tableNumber}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t("scans", { count: qr.scansCount })}
                </span>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`/api/qrcodes/${qr.id}/png`}>{t("download")}</a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/qrcodes/${qr.id}/print`}>{t("print")}</Link>
                </Button>
                <DeleteButton label={t("delete")} onClick={() => handleDelete(qr)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
