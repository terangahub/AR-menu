import { redirect } from "@/i18n/navigation";

// Vue d'ensemble complète (section 10.1) : Sprint 3. Pour l'instant, le
// dashboard démarre directement sur la gestion des plats.
export default async function DashboardIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/dashboard/dishes", locale });
}
