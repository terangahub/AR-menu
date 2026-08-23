"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

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

  async function handleDownload(qrCode: QrCodeItem) {
    setError(null);
    const res = await fetch(`/api/qrcodes/${qrCode.id}/png`);
    if (!res.ok) {
      setError(t("error"));
      return;
    }
    const { png } = await res.json();
    const a = document.createElement("a");
    a.href = png;
    a.download = `vorae-qr-table-${qrCode.tableNumber ?? qrCode.id}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("tableNumber")}</span>
          <input
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="input"
          />
        </label>
        <Button type="submit" disabled={creating}>
          {t("generate")}
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {qrCodes.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">
                  {t("table")} {qr.tableNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("scans", { count: qr.scansCount })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(qr)}>
                  {t("download")}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/qrcodes/${qr.id}/print`}>{t("print")}</Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(qr)}>
                  {t("delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
