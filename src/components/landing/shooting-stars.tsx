// Étoiles filantes très discrètes, posées au fond fond du décor (sections
// À propos et Avis). CSS pur, pas de canvas : chaque étoile est un point
// dont la traînée est un dégradé porté par ::before (cf. la classe
// `.shooting-star` dans globals.css), qui glisse en diagonale puis
// s'efface, en boucle.
//
// Positions, angles et durées figés en dur plutôt que Math.random() :
// une valeur aléatoire différente entre le rendu serveur et le rendu
// client provoquerait une erreur d'hydratation React (même raison que
// les particules de la section À propos).
const STARS = [
  { top: "10%", left: "18%", angle: -20, duration: 7, delay: 0 },
  { top: "24%", left: "68%", angle: -16, duration: 9, delay: 3.2 },
  { top: "58%", left: "84%", angle: -22, duration: 8, delay: 5.6 },
  { top: "70%", left: "12%", angle: -18, duration: 10, delay: 1.4 },
  { top: "40%", left: "46%", angle: -24, duration: 11, delay: 6.8 },
];

export function ShootingStars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="absolute"
          style={{ top: star.top, left: star.left, transform: `rotate(${star.angle}deg)` }}
        >
          <span
            className="shooting-star block h-[2px] w-[2px] rounded-full bg-foreground/90"
            style={{
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
