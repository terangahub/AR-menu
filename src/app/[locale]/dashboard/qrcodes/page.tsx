import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentRestaurantUser } from "@/lib/auth";
import { QrCodeList } from "@/components/dashboard/qrcode-list";

// Génération de QR codes par table (section 10.4).
export default async function DashboardQrCodesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Dashboard.qrcodes");
  const restaurantUser = await getCurrentRestaurantUser();

  if (!restaurantUser) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const qrCodes = await prisma.qrCode.findMany({
    where: { restaurantId: restaurantUser.restaurantId },
    orderBy: { tableNumber: "asc" },
    select: { id: true, tableNumber: true, scansCount: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <QrCodeList qrCodes={qrCodes} />
    </div>
  );
}
