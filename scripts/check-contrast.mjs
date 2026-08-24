// Verifie les ratios de contraste WCAG de la palette claire proposee.
function hsl2rgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
function lum([r, g, b]) {
  const c = x => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
function ratio(a, b) {
  const [l1, l2] = [lum(hsl2rgb(...a)), lum(hsl2rgb(...b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const P = {
  background: [250, 40, 99],
  foreground: [250, 45, 11],
  card: [0, 0, 100],
  primary: [264, 70, 45],
  primaryFg: [0, 0, 100],
  secondaryFg: [264, 70, 30],
  secondary: [264, 55, 95],
  mutedFg: [250, 12, 42],
  destructive: [0, 65, 45],
  success: [152, 55, 32],
  border: [250, 18, 84],
};
const checks = [
  ["texte principal sur fond", P.foreground, P.background, 4.5],
  ["texte principal sur carte", P.foreground, P.card, 4.5],
  ["texte secondaire sur fond", P.mutedFg, P.background, 4.5],
  ["texte secondaire sur carte", P.mutedFg, P.card, 4.5],
  ["texte primaire (liens) sur fond", P.primary, P.background, 4.5],
  ["blanc sur bouton primaire", P.primaryFg, P.primary, 4.5],
  ["texte sur chip secondaire", P.secondaryFg, P.secondary, 4.5],
  ["texte alerte sur fond", P.destructive, P.background, 4.5],
  ["texte succes sur fond", P.success, P.background, 4.5],
  ["bordure sur fond (non-texte)", P.border, P.background, 1.4],
];
let ok = true;
for (const [name, fg, bg, min] of checks) {
  const r = ratio(fg, bg);
  const pass = r >= min;
  if (!pass) ok = false;
  console.log(`${pass ? "OK  " : "ECHEC"} ${r.toFixed(2).padStart(5)} (min ${min})  ${name}`);
}
console.log(ok ? "\nToute la palette claire passe." : "\nDes valeurs sont a corriger.");
