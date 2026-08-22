import { Button } from "@/components/ui/button";

// Placeholder Sprint 0 — la landing page complète (copywriting, direction
// créative) est livrée au Sprint 4 (section 12 du cahier des charges).
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Vorae</h1>
      <p className="text-muted-foreground">Voyez avant de choisir.</p>
      <Button>Réserver une démo</Button>
    </main>
  );
}
