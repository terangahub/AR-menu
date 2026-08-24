// Halo "horizon d'evenement" : un dome de lumiere dont seul le bord est
// incandescent, creuse en son centre par un coeur sombre pose sur la
// ligne d'horizon. Repris de reflect.app, qui l'utilise a la fois
// derriere son hero et au-dessus de son footer.
//
// Entierement en degrades CSS, aucune image ni canvas : net a toutes les
// tailles d'ecran, et il suit le theme puisqu'il lit les tokens.
//
// Le piege de cet effet : ce n'est pas une tache violette floutee, c'est
// un anneau. Le degrade du dome part donc de `transparent` au centre,
// monte jusqu'au blanc vers 76 % du rayon, puis redescend. L'interieur
// du dome reste sombre, et c'est ce contraste qui donne la profondeur.
//
// Les couches, de l'arriere vers l'avant :
//   0. la nappe violette d'ambiance
//   1. les ailes qui filent a l'horizontale le long de l'horizon
//   2. un arc concentrique, tres discret, au-dessus du dome
//   3. le bord du dome (l'anneau lumineux)
//   4. la flaque de lumiere posee sur l'horizon
//   5. le coeur sombre qui occulte le centre de la flaque
//   6. le trait d'horizon
//
// Deux geometries : le dome du hero est plus haut et plus etroit que
// celui du footer, comme dans la reference.
const DOME = {
  hero: "h-[68%] w-[34%] min-w-[280px]",
  footer: "h-[62%] w-[46%] min-w-[320px]",
};

export function EventHorizon({
  className = "",
  intensity = 1,
  variant = "footer",
}: {
  className?: string;
  intensity?: number;
  variant?: keyof typeof DOME;
}) {
  const i = intensity;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* 0. Nappe d'ambiance. Volontairement sans flou : un `blur` sur un
             bloc plus grand que le conteneur laisse un bord droit visible
             la ou `overflow-hidden` le coupe. C'est la chute du degrade
             qui adoucit, pas le flou. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 46% 105% at 50% 100%, hsl(var(--secondary) / ${0.7 * i}) 0%, hsl(var(--secondary) / ${0.34 * i}) 32%, hsl(var(--secondary) / ${0.12 * i}) 55%, transparent 78%)`,
        }}
      />

      {/* 1. Ailes de l'horizon */}
      <div
        className="absolute bottom-0 left-0 h-[30%] w-full"
        style={{
          background: `radial-gradient(ellipse 40% 100% at 50% 100%, hsl(var(--secondary) / ${0.6 * i}) 0%, hsl(var(--secondary) / ${0.2 * i}) 42%, transparent 76%)`,
        }}
      />

      {/* Boite du dome : les couches 2 a 5 se dimensionnent en pourcentage
          de cette boite, ce qui garde leurs proportions entre elles quelle
          que soit la taille de l'ecran. */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${DOME[variant]}`}
      >
        {/* 2. Arc concentrique */}
        <div
          className="absolute bottom-0 left-1/2 h-[128%] w-[132%] -translate-x-1/2 rounded-[50%] border"
          style={{
            borderColor: `hsl(var(--primary) / ${0.055 * i})`,
            maskImage: "linear-gradient(to bottom, #000 25%, transparent 85%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 25%, transparent 85%)",
          }}
        />

        {/* 3. Bord du dome */}
        <div
          className="absolute inset-0 blur-[6px]"
          style={{
            background: `radial-gradient(ellipse 50% 100% at 50% 100%, transparent 0%, transparent 68%, hsl(var(--secondary) / ${0.5 * i}) 73%, hsl(var(--primary) / ${0.95 * i}) 79%, hsl(var(--primary) / ${0.2 * i}) 83%, hsl(var(--secondary) / ${0.75 * i}) 88%, hsl(var(--secondary) / ${0.12 * i}) 96%, transparent 100%)`,
          }}
        />

        {/* 4. Flaque de lumiere sur l'horizon */}
        <div
          className="absolute bottom-[-7%] left-1/2 h-[38%] w-[34%] -translate-x-1/2 blur-[11px]"
          style={{
            background: `radial-gradient(ellipse 50% 100% at 50% 100%, hsl(var(--primary)) 0%, hsl(var(--primary) / ${0.95 * i}) 30%, hsl(var(--primary) / ${0.45 * i}) 54%, hsl(var(--secondary) / ${0.6 * i}) 74%, transparent 94%)`,
          }}
        />

        {/* 5. Coeur sombre. Peu floute, sinon il n'occulte rien. */}
        <div
          className="absolute bottom-[-6%] left-1/2 aspect-square w-[10%] -translate-x-1/2 rounded-full blur-[5px]"
          style={{
            background: `radial-gradient(closest-side, hsl(var(--background)) 0%, hsl(var(--background)) 62%, hsl(var(--background) / 0.8) 84%, transparent 100%)`,
          }}
        />
      </div>

      {/* 6. Trait d'horizon */}
      <div
        className="absolute bottom-0 left-1/2 h-px w-[92%] -translate-x-1/2"
        style={{
          background: `linear-gradient(to right, transparent, hsl(var(--secondary) / ${0.8 * i}) 22%, hsl(var(--primary) / ${0.9 * i}) 45%, hsl(var(--primary)) 50%, hsl(var(--primary) / ${0.9 * i}) 55%, hsl(var(--secondary) / ${0.8 * i}) 78%, transparent)`,
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 h-8 w-[52%] -translate-x-1/2 blur-lg"
        style={{
          background: `linear-gradient(to right, transparent, hsl(var(--primary) / ${0.5 * i}) 50%, transparent)`,
        }}
      />
    </div>
  );
}
