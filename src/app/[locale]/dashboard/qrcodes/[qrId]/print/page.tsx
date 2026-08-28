import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { absoluteMenuUrl, generateQrPngDataUrl } from "@/lib/qrcode";
import { AutoPrint } from "@/components/dashboard/auto-print";

// Export imprimable en un clic (section 10.4) - utilise l'impression
// navigateur native ("Enregistrer en PDF") plutôt qu'une librairie PDF
// dédiée, pas de nouvelle dépendance pour un simple gabarit une page.
//
// Cette page ne suit pas le thème du dashboard : elle est **toujours noire
// sur blanc**. Un carton imprimé depuis le mode sombre sortait en blanc sur
// fond sombre, c'est-à-dire une page entière d'encre, et un QR code doit de
// toute façon être foncé sur clair pour rester lisible par un téléphone.
export default async function PrintQrCodePage({
  params,
}: {
  params: Promise<{ qrId: string }>;
}) {
  const { qrId } = await params;
  const t = await getTranslations("Dashboard.qrcodes");
  const restaurantUser = await getCurrentRestaurantUser();

  const qrCode = await prisma.qrCode.findUnique({
    where: { id: qrId },
    include: { restaurant: { select: { name: true, city: true, logoUrl: true } } },
  });

  if (!qrCode || !restaurantUser || qrCode.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const png = await generateQrPngDataUrl(absoluteMenuUrl(qrCode.targetUrl));

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-8 print:min-h-screen print:py-0">
      <AutoPrint />

      {/* Le carton lui-même, aux proportions d'un chevalet de table.
          `border` visible à l'écran pour montrer ce qui sera découpé,
          conservée à l'impression comme trait de coupe. */}
      <div className="flex w-[340px] flex-col items-center gap-5 rounded-3xl border border-neutral-300 bg-white px-8 py-10 text-center text-neutral-900 print:rounded-none print:border-neutral-400 print:shadow-none">
        {qrCode.restaurant.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrCode.restaurant.logoUrl}
            alt=""
            className="h-14 w-14 rounded-2xl border border-neutral-200 object-cover"
          />
        )}

        <div className="flex flex-col gap-1">
          <p className="font-heading text-2xl leading-tight">{qrCode.restaurant.name}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            {t("table")} {qrCode.tableNumber}
          </p>
        </div>

        {/* Marge blanche autour du code : sans elle, un lecteur peine à
            détecter les repères quand le carton est posé sur une nappe
            foncée. C'est la "quiet zone" du standard QR. */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={png} alt="" className="h-56 w-56" />
        </div>

        <p className="text-balance text-sm leading-relaxed text-neutral-700">
          {t("printInstruction")}
        </p>

        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
          {t("printFooter")}
        </p>
      </div>
    </div>
  );
}
