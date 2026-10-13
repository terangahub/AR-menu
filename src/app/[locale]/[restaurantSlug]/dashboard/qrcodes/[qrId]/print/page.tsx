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
// Le carton est toujours noir sur blanc, quel que soit le thème : un QR
// code doit être foncé sur clair pour rester lisible par un téléphone, et
// une page imprimée depuis le mode sombre sortait en pleine encre. La
// neutralisation de la page elle-même vit dans `globals.css` (@media
// print) ; ici on ne s'occupe que du gabarit.
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
    include: { restaurant: { select: { name: true, logoUrl: true } } },
  });

  if (!qrCode || !restaurantUser || qrCode.restaurantId !== restaurantUser.restaurantId) {
    notFound();
  }

  const png = await generateQrPngDataUrl(absoluteMenuUrl(qrCode.targetUrl));

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10 text-neutral-900 print:min-h-0 print:p-0">
      <AutoPrint />

      {/* Le carton occupe la feuille au lieu de flotter au milieu : à
          l'impression il faisait un timbre entouré de vide. Les
          proportions sont celles d'un chevalet de table A5, et le QR code
          est dimensionné en millimètres, pas en pixels, pour qu'il sorte
          à une taille scannable quelle que soit la résolution.

          Bordure en pointillé : c'est un trait de coupe, il annonce ce
          qu'on découpe. Un cadre plein se lirait comme une décoration. */}
      <div className="flex w-full max-w-[420px] flex-col items-center gap-7 rounded-[28px] border border-dashed border-neutral-300 px-10 py-12 text-center print:max-w-none print:rounded-none">
        <div className="flex flex-col items-center gap-4">
          {qrCode.restaurant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCode.restaurant.logoUrl}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
          )}
          <p className="font-heading text-[28px] leading-tight">{qrCode.restaurant.name}</p>
        </div>

        {/* La consigne passe AVANT le code : on dit au convive quoi faire,
            puis on lui donne la cible. L'inverse le laissait deviner. */}
        <p className="text-balance text-[15px] leading-relaxed text-neutral-600">
          {t("printInstruction")}
        </p>

        {/* Marge blanche autour du code, la "quiet zone" du standard QR :
            sans elle, un lecteur peine à détecter les repères quand le
            carton est posé sur une nappe foncée. */}
        <div className="bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={png} alt="" className="h-[62mm] w-[62mm] print:h-[62mm] print:w-[62mm]" />
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-[13px] font-medium uppercase tracking-[0.22em] text-neutral-500">
              {t("table")} {qrCode.tableNumber}
            </span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-neutral-400">
            {t("printFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}
