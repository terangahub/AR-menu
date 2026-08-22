import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

// Placeholder Sprint 0 — la landing page complète (copywriting, direction
// créative) est livrée au Sprint 4 (section 12 du cahier des charges).
export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("tagline")}</p>
      <Button>{t("cta")}</Button>
    </main>
  );
}
