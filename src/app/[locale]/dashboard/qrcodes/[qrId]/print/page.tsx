import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { absoluteMenuUrl, generateQrPngDataUrl } from "@/lib/qrcode";
import { AutoPrint } from "@/components/dashboard/auto-print";

// Export imprimable en un clic (section 10.4) — utilise l'impression
// navigateur native ("Enregistrer en PDF") plutôt qu'une librairie PDF
// dédiée, pas de nouvelle dépendance pour un simple gabarit une page.
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
    include: { restaurant: { select: { name: true } } },
  });

  if (!qrCode || !restaurantUser || qrCode.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const png = await generateQrPngDataUrl(absoluteMenuUrl(qrCode.targetUrl));

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center print:min-h-screen">
      <AutoPrint />
      <h1 className="text-xl font-semibold">{qrCode.restaurant.name}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={png} alt="" className="h-72 w-72" />
      <p className="text-lg font-medium">
        {t("table")} {qrCode.tableNumber}
      </p>
    </div>
  );
}
