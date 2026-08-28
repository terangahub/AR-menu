"use client";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "@/components/dashboard/nav-icons";

// Supprimer était un `ghost` : du texte nu, que Mouhamed n'a pas reconnu
// comme un bouton en testant. C'est pourtant la seule action irréversible
// de ces écrans. Elle doit se voir comme un bouton et se lire comme un
// danger, sans pour autant peser plus lourd que Modifier, qui est l'action
// courante : d'où le contour rouge plutôt qu'un aplat rouge.
//
// Partagé entre la liste des plats et celle des QR codes, pour que la
// suppression ait exactement la même allure partout dans le dashboard.
export function DeleteButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="shrink-0 border-destructive/30 px-2.5 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
    >
      <TrashIcon className="h-4 w-4" />
    </Button>
  );
}
