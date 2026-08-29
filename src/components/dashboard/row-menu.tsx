"use client";

import { useEffect, useRef, useState } from "react";

// Menu d'actions secondaires d'une ligne de liste.
//
// Sur un téléphone, poser l'interrupteur, Modifier et Supprimer sur la même
// ligne que le nom du plat ne tient pas : soit le nom se réduit à sa
// première lettre, soit les actions descendent sur une deuxième ligne et
// chaque plat occupe 200 px de haut, ce qui vide la vue liste de sa raison
// d'être. Les actions rares passent donc derrière ce menu, et seul
// l'interrupteur de disponibilité, qui sert tous les jours, reste visible.
export function RowMenu({
  label,
  children,
}: {
  label: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    // `pointerdown` et non `click` : sur un menu ouvert, un clic hors de
    // lui doit le fermer avant que la cible ne réagisse, sinon le premier
    // geste ne sert qu'à fermer et l'utilisateur doit tout refaire.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={container} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground ${
          open ? "bg-foreground/[0.06] text-foreground" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-4 w-4">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="surface-panel absolute right-0 top-full z-20 mt-1 flex w-44 flex-col p-1 shadow-xl"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function RowMenuItem({
  onClick,
  children,
  destructive = false,
}: {
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-foreground/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}
