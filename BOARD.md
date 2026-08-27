# Board de livraison - Vorae

Suivi d'avancement de tous les sprints et de tous les tickets du projet.
C'est le "Jira" du projet : l'état de chaque chantier, qui attend quoi, et
ce qui bloque.

Deux documents complémentaires, ne pas les confondre :

| Document | Rôle |
|---|---|
| `BOARD.md` (ce fichier) | **Où en est chaque ticket.** Statut, blocages, prochaine action. |
| `CONTEXT.md` | **Comment le projet est fait.** Architecture, écarts au cahier, pièges connus. |
| `docs/roadmap-ai-instant-3d.md` | Planification détaillée d'un chantier futur non démarré. La section 0 porte l'arbitrage du fournisseur de capture 3D. |
| `docs/scan-3d-plats-vorae.pdf` | Note de décision en trois pages sur le scan 3D des plats, avec schéma de flux. Document à partager. |

**Règle de mise à jour :** ce fichier doit être mis à jour à chaque
changement d'état d'un ticket, pas seulement en fin de sprint. Un board
faux est pire qu'aucun board.

Dernière mise à jour : Sprint 4 en revue (PR #5), Sprint 5 en développement,
Sprint 7 (capture 3D) prêt à merger, ce qui reste sur le poids des modèles
est sorti dans le Sprint 9.

**Numérotation :** les sprints sont numérotés en séquence simple (0, 1, 2,
3...), sans décimales. Les anciens noms "Sprint 4.5", "Sprint 4.6" et
"Sprint 4.7" ont existé un temps le temps d'être sortis du Sprint 4 sans
perturber sa revue ; une fois cette contrainte levée, ils ont été
renommés Sprint 5, 6 et 7, et l'ancien Sprint 5 (super admin) est devenu
Sprint 8. Si un ticket ou une branche plus ancienne porte encore un
identifiant `S45-`, `S46-` ou `S47-`, il correspond au nouvel identifiant
`S5-`, `S6-` ou `S7-` du même numéro d'ordre ci-dessous.

---

## Légende des statuts

| Statut | Signification |
|---|---|
| `TODO` | Identifié, pas encore spécifié en détail. Ne pas commencer à coder. |
| `READY` | Spécifié, dépendances levées, prêt à être pris en développement. |
| `DEV` | En cours de développement sur une branche `feature/*`. |
| `REVIEW` | Pull Request ouverte, CI verte, en attente de test et de merge par Mouhamed. |
| `DONE` | Mergé sur `main`. |
| `DEPLOYED` | Mergé et vérifié en conditions réelles (production ou preview testée sur appareil). |
| `BLOCKED` | Bloqué par une dépendance externe. La cause est toujours écrite dans la colonne Notes. |

---

## Vue d'ensemble des sprints

| Sprint | Contenu (cahier section 21) | Statut | PR |
|---|---|---|---|
| Sprint 0 | Init repo, Next.js 14, Prisma, Neon, Clerk, CI, workflow PR | `DEPLOYED` | #1 |
| Sprint 1 | Menu 2D public, fiche plat, AR + fallback 2D, i18n FR/EN | `DEPLOYED` | #2 |
| Sprint 2 | Dashboard restaurateur : CRUD plats, upload photo/3D, QR codes | `DEPLOYED` | #3 |
| Sprint 3 | Analytics par plat, système de design | `DEPLOYED` | #4 |
| Sprint 4 | Landing page complète, Stripe Billing | `REVIEW` | #5 |
| Sprint 5 | Sections avis et à propos, bandeau défilant, retour en haut | `DEV` | - |
| Sprint 6 | Refonte du dashboard et du menu public, clair et sombre | `TODO` | - |
| Sprint 7 | Capture 3D automatisée des plats (KIRI Engine) | `REVIEW` | - |
| Sprint 8 | Dashboard super admin, pilote réel Montréal | `TODO` | - |
| Sprint 9 | Modèles 3D exploitables sur mobile (poids, post-traitement) | `TODO` | - |

---

## Sprint 4 - Landing page et facturation (en cours)

Branche : `feature/s4-billing-landing-polish` - PR #5

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S4-01 | Modèle de tarification partagé (`lib/billing.ts`) | `DONE` | Source unique des prix, réutilisée par la landing et le dashboard. |
| S4-02 | Route Stripe Checkout (`POST /api/billing/checkout`) | `REVIEW` | Codé et buildé, jamais exercé contre l'API Stripe réelle. |
| S4-03 | Route portail client Stripe (`POST /api/billing/portal`) | `REVIEW` | Le changement de palier et la proratisation sont gérés par Stripe, pas par notre code. |
| S4-04 | Webhook Stripe (`POST /api/webhooks/stripe`) | `REVIEW` | Synchronise `Subscription` et `Invoice`. Signature vérifiée sur le corps brut. |
| S4-05 | Page Facturation du dashboard (section 10.6) | `REVIEW` | Palier actuel, factures, accès au portail. |
| S4-06 | Section Tarifs de la landing (section 12.1 #9) | `REVIEW` | Bascule mensuel/annuel avec indicateur coulissant. |
| S4-07 | Section FAQ de la landing (section 12.1 #10) | `REVIEW` | Accordéon, 4 questions. |
| S4-08 | Intégration des visuels réels (logo, photo hero, vidéo) | `REVIEW` | Assets générés par IA, fournis par Mouhamed. Vidéo reconvertie en H.264 sans audio. |
| S4-09 | Refonte visuelle de la landing (profondeur, dégradés, halos) | `REVIEW` | Suite au retour "trop minimaliste, on dirait du HTML". |
| S4-10 | Correction du menu mobile (superposition et scroll) | `REVIEW` | Cause : `backdrop-blur` créait un containing block pour l'overlay `fixed`. Scroll de page verrouillé à l'ouverture. |
| S4-11 | Suppression de tous les tirets longs du projet | `REVIEW` | 211 occurrences dans 49 fichiers. Exigence explicite du client. |
| S4-12 | **Créer le compte Stripe et les 8 variables d'environnement** | `BLOCKED` | **Action Mouhamed.** Checklist complète dans `CONTEXT.md` section 4. Rien de S4-02 à S4-05 n'est testable avant. |
| S4-13 | Facturation à l'usage, plats additionnels (section 15.2) | `TODO` | Hors périmètre décidé pour ce sprint. `extraDishCount` existe en base mais rien ne l'alimente. Voir `CONTEXT.md` section 4. |
| S4-14 | Relier les photos de plats au restaurant démo | `DONE` | `UPDATE` SQL exécuté dans Neon par Mouhamed. Effet non visible sur la grille du menu, voir S5-07. |
| S4-15 | Brancher le CTA "Réserver une démo" | `TODO` | Le bouton n'a aucune action. À décider : formulaire, Calendly, ou lien courriel. |
| S4-16 | Pages `/privacy` et `/terms` | `TODO` | Liens du footer en ancre `#` en attendant. Requis par la Loi 25 (section 17.4) avant la vraie mise en production. |

---

## Sprint 5 - Sections de landing supplémentaires (en cours)

Anciennement nommé "Sprint 4.5" (voir la note de numérotation en tête de
ce fichier) : sorti du Sprint 4 volontairement, la PR #5 était déjà à 25
fichiers et mélangeait facturation, landing, design et nettoyage
typographique. La section 4.3 du cahier interdit les PR fourre-tout. Ce
découpage permet aussi de merger le Sprint 4 sans attendre ce travail.

Branche : `feature/s45-landing-sections`, partant de la branche du Sprint 4.

Design repris de webglow.ca (l'agence du client, dont le dépôt a été
fourni), couleurs adaptées aux tokens Vorae.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S5-01 | Bandeau défilant sous le hero | `DEV` | Masque en dégradé, désaturation levée au survol, pause au survol. Contenu : types d'établissement, pas de fausses marques clientes. |
| S5-02 | Section avis, mur d'avis | `DEV` | Deux bandeaux en sens opposés, halo en coeur, pastilles d'initiales. **Avis inventés, à remplacer avant production.** |
| S5-03 | Section à propos | `DEV` | Badge, titre en trois parties dont une en dégradé, particules flottantes en CSS pur (pas de dépendance canvas). |
| S5-04 | Bouton fusée retour en haut | `DEV` | Apparaît après 500px, réacteur animé au décollage. |
| S5-05 | Lien Avis dans la navigation | `DEV` | Ancre `#reviews`, ajoutée au menu desktop et mobile. |
| S5-06 | Remplacer les avis de démonstration par de vrais avis | `TODO` | **Bloquant avant la mise en production.** Voir la ligne rouge éditoriale du cahier, section 12.3. |
| S5-07 | Afficher les photos de plats sur la grille du menu public | `FAIT` | Absorbé par `S6-03`. `imageUrl` était bien chargé et bien typé dans `MenuDish`, mais aucune balise ne l'affichait : les photos n'existaient que sur la fiche plat. La grille est désormais construite autour de la photo. |
| S5-08 | Section globe en pointillés | `DEV` | Canvas 2D, projection orthographique, rotation lente, marqueur pulsant sur Montréal. Reprise de la section "dotted across the globe" de reflect.app, fournie en vidéo. Aucune dépendance ajoutée. |
| S5-09 | Rejouer les animations d'apparition dans les deux sens | `DEV` | Elles ne se déclenchaient qu'une fois. Deux seuils pour éviter le clignotement au ras de la limite. |
| S5-10 | Remplacer les photos de plats des fonctionnalités par des champs défilants | `DEV` | Les photos illustraient mal le propos : une assiette de pâtes pour parler de barrière de langue. Remplacées par un champ de mots défilants qui dit littéralement le bénéfice (questions en salle, allergènes, langues), technique de la section "Hardened security" de reflect.app. |
| S5-11 | Maquette du produit dans le hero | `DEV` | Remplace la photo de plat, jugée hors sujet : elle ne montrait pas le produit. Maquette du menu convive reconstituée en HTML, pas une capture, donc nette à toutes les densités et traduite. |
| S5-12 | Corriger la visibilité des calques `-z-10` (particules, halos) | `DEV` | Bug transverse découvert en ajoutant les étoiles filantes : plusieurs sections (`about`, `reviews`, hero, `features`, `pricing`, globe) ne créaient pas leur propre contexte d'empilement, si bien que leurs calques décoratifs en `-z-10` se peignaient sous le fond opaque du wrapper racine au lieu de derrière le texte de la section, invisibles à l'écran bien que présents dans le DOM. Corrigé en ajoutant `isolate` sur chaque section concernée. Voir CONTEXT.md. |
| S5-13 | Étoiles filantes en fond, sections À propos et Avis | `DEV` | CSS pur (`shooting-stars.tsx` + `.shooting-star` dans globals.css), positions figées en dur, très discret. A révélé S5-12. |
| S5-14 | Halo en coeur (Avis) : trait lumineux qui parcourt le contour | `DEV` | `pathLength="1"` sur le path SVG pour exprimer dasharray/dashoffset en fraction du tracé, boucle exacte quelle que soit la courbe. Masqué en dégradé pour ne garder que les 3/5 supérieurs du coeur. |
| S5-15 | Bordure animée sur la carte Croissance (tarifs) | `DEV` | `.border-gradient-animated`, dégradé conique qui tourne via la propriété enregistrée `--border-angle` (`@property`). |
| S5-16 | Avatars générés à la place des initiales (Avis) | `DEV` | Identicon déterministe (grille symétrique dérivée d'un hachage), pas une photo : le principe d'honnêteté de S5-02 tient toujours, juste un cran plus riche visuellement. |
| S5-17 | Globe électrique | `DEV` | Balayage lumineux (conic gradient + trait net) qui tourne bien plus vite que la sphère, et "détecte" Montréal à son passage (flash sur le marqueur). Fait le lien avec le scan, plutôt qu'une simple animation décorative. |
| S5-18 | Ligne de liaison mobile, section Comment ça marche | `DEV` | Version verticale de la ligne desktop, pour les 3 cartes empilées. |
| S5-19 | Défilement retour en haut plus doux | `DEV` | `scrollTo({behavior:"smooth"})` remplacé par un défilement mesuré (durée fixe, easing) : le défilement natif du navigateur pouvait être très rapide sur une page longue. Le rejeu des animations d'apparition (S5-09) est aussi suspendu le temps du défilement, sinon chaque section traversée clignotait. |
| S5-20 | Pages Confidentialité et Conditions, FR et EN | `DEV` | Contenu de gabarit réaliste (Clerk, Stripe, Cloudinary, Neon, Loi 25, LPRPDE), **à faire valider par un juriste avant la mise en production** : bandeau d'avertissement en tête des deux pages. Section globe déplacée juste avant la FAQ à la demande de Mouhamed. |
| S5-21 | Favicon | `DONE` | `favicon.ico` régénéré depuis le logo V actuel : l'ancien triangle remplacé au Sprint 4 traînait encore dans ce fichier précis. |
| S5-22 | Vitesse du champ de mots "Service" corrigée | `DEV` | La vitesse de `Reveal` avait été ralentie par erreur pour toute la section, sans toucher au vrai défilement interne du champ de mots, qui restait rapide. Toutes les rangées ont maintenant la même durée, environ 5x plus lente qu'avant. |
| S5-23 | Maquette du hero interactive | `DEV` | Les filtres de catégorie (Tout/Plats/Entrées) filtrent réellement la liste, et le badge AR d'un plat ouvre un écran de prévisualisation AR illustratif dans le téléphone (surface détectée, plat qui flotte, contrôles de rotation), avec retour à la liste. Ajout d'un 4e plat pour peupler la catégorie Plats. Légère inclinaison 3D qui suit la souris. |
| S5-24 | Badges flottants autour du hero | `DEV` | Trois badges (AR, 12 langues, zéro application) positionnés en dehors du téléphone via `calc(100% + Npx)` plutôt qu'un décalage négatif fixe, qui laissait le badge chevaucher l'écran quand le texte était plus long qu'en anglais. Visibles à partir de `lg` seulement, l'espace autour du téléphone étant insuffisant en dessous. |
| S5-25 | Globe : rotation au glisser, pression, balayage revu | `DEV` | Le globe se laisse maintenant tourner à la souris/au doigt (persiste après relâchement, la rotation automatique reprend de là), et réagit à la pression (déformation locale façon éponge, qui reprend sa forme lentement). Le balayage électrique est ralenti (4s → 16s par tour) et fait apparaître de petits points radar sur des points existants de la sphère à son passage, en plus de la réaction déjà en place sur Montréal. |
| S5-26 | CTA du globe rendu pertinent | `DEV` | Remplacé le lien qui ne faisait que défiler vers une section déjà vue par un vrai lien vers `/dashboard` ("Commencer"), cohérent avec le CTA du tarif. |
| S5-27 | Bandeau des types de restaurants | `DEV` | Police agrandie, espace doublé avant la carte d'offre de lancement. |
| S5-28 | Trois cartes "Pourquoi Vorae" différenciées | `DEV` | Remplace le champ de mots unique (identique sur les trois cartes) par trois mécaniques distinctes : bulles de question qui montent (Service), anneau de pastilles d'allergènes qui s'illuminent à tour de rôle (Allergènes), bascule façon panneau d'aéroport entre les langues (Langues). `feature-field.tsx` supprimé, plus utilisé. |
| S5-29 | Refonte du footer | `DEV` | Wordmark "VORAE" géant et très pâle en fond, ligne d'accent animée en haut, troisième colonne "Entreprise" (à propos, contact), CTA répété. |
| S5-30 | Carte Service : retour au champ défilant | `DEV` | La variante en bulles de conversation donnait un empilement illisible. Retour exact à l'ancien champ de mots, avec la vitesse uniforme et 5x plus lente demandée (325s par rangée, sens toujours alternés). |
| S5-31 | Carte Langues : bascule réparée | `DEV` | Les 12 langues s'affichaient toutes en même temps, superposées et sans animation : les pourcentages de `@keyframes` se comptent sur le cycle entier, pas sur le créneau d'une langue, donc une dizaine restaient à `opacity: 1`. Alternance repassée en JavaScript (index qui avance, transition CSS), correcte quel que soit le nombre de langues. |
| S5-32 | Erreur 500 en production locale, invisible au build | `DEV` | Rendre la carte Langues cliente faisait passer une icône lucide (un `forwardRef`) en prop depuis un Server Component : `next build` passait, mais la page renvoyait 500 à l'exécution. Icône importée directement dans le composant client. Documenté dans CONTEXT.md. |
| S5-33 | Collision dans l'anneau d'allergènes | `DEV` | La pastille du bas passait sous le libellé de la carte, surtout en mobile. Rayon vertical de l'anneau resserré, design inchangé par ailleurs. |
| S5-34 | Contenu animé des cartes Service et Sécurité traduit | `DEV` | Les questions en salle et les allergènes étaient codés en dur en français. Déplacés dans les fichiers de traduction (`Landing.fields`). La carte Langues garde sa liste en dur : c'est le fait qu'elle ne change pas qui illustre le propos. |
| S5-35 | Carte Accessibilité : flash-back puis lecture posée | `DEV` | Deux balayages rapides de toutes les langues (~80ms chacune, léger flou), puis lecture langue par langue (~2,2s), en boucle. Mesuré au navigateur : phase rapide de 0 à 2,3s, puis pas de ~2,2s. |
| S5-36 | Aperçu du hero réellement navigable | `DEV` | Chaque plat ouvre sa fiche (photo, nom, prix, description, allergènes, bouton AR ou mention que la vue AR n'existe pas encore), avec retour en arrière et défilement à l'intérieur du cadre. Un 5e plat ajouté pour que la liste dépasse vraiment l'écran (543px de contenu pour 460px de cadre). |
| S5-37 | Boutons incliquables dans la maquette du hero | `DEV` | `transformStyle: preserve-3d` sur le châssis faussait le test de collision : `mousedown` allait au conteneur et `mouseup` au bouton, donc le `click` partait sur l'ancêtre commun. Invisible en test JS (`element.click()` marchait), diagnostiqué en comparant les cibles des événements au niveau du document. Documenté dans CONTEXT.md. |
| S5-38 | Nom et prix invisibles sur la fiche plat | `DEV` | Le bloc texte, statique et remonté par `-mt-6`, passait derrière le conteneur `relative` de la photo. Repéré en relisant les captures, pas par un test : le texte était bien présent dans le DOM. |
| S5-39 | Vidéo de la section Expérience qui s'arrêtait | `DEV` | `loop` ne couvre que la fin de lecture, pas une mise en pause : les navigateurs mettent la vidéo en pause hors écran, en arrière-plan ou en économie d'énergie, et rien ne la relançait. Nouveau composant `LoopingVideo` qui relance à la visibilité et met en pause hors écran pour ne pas chauffer la batterie. |
| S5-40 | Globe : éponge plus marquée et retour bien plus lent | `DEV` | Creux élargi (0,22 à 0,5 du rayon), chute en cosinus pour un raccord sans cassure, ondes de choc émises à l'appui et au relâchement (anneau + points soulevés au passage du front), et retour en oscillation amortie sur 3s. Mesuré : les points se rapprochent de 6,6px à l'appui, repassent au repos vers 600ms, bombent jusqu'à 2400ms, se stabilisent à 3000ms. |
| S5-41 | Carte Accessibilité : flash-back relancé au scroll | `DEV` | Le cycle tournait en continu dès le montage : un visiteur qui scrollait jusqu'à la carte arrivait souvent en pleine phase lente et ratait le flash-back (fenêtre de ~2,3s sur un cycle total de ~24s). `IntersectionObserver` sur la carte qui remet `step` à 0 à chaque entrée dans le cadre, pour que le flash-back se rejoue systématiquement au moment où le visiteur la découvre. |
| S5-42 | Globe : rotation au glisser retirée | `DEV` | Le glisser déplaçait la sphère en même temps que le point de pression suivait le curseur, ce qui perturbait visiblement les ondes de choc, et un glisser rapide provoquait un bug (cf. S5-43). Rotation manuelle (`dragOffset`) et son état associé retirés en gardant la pression et les ondes, qui n'en dépendaient pas. Le globe ne tourne plus qu'automatiquement (~60s/tour) ; `cursor: grab/grabbing` retiré aussi, il n'a plus de sens sans glisser. |
| S5-43 | Globe : plantage sur glisser rapide (rayon négatif) | `DEV` | Reproduit en testant S5-42 : un glisser rapide faisait planter le rendu du globe (`IndexSizeError`, rayon négatif passé à `ctx.arc`). Cause réelle sans rapport avec le glisser lui-même : `ripple.start` (posé avec `performance.now()` dans le gestionnaire d'événement) peut tomber très légèrement après le `now` du prochain `requestAnimationFrame`, rendant `age` négatif et le rayon de l'onde négatif. `age` maintenant borné à `[0, 1]`. Documenté dans CONTEXT.md, reproduit et vérifié disparu via Playwright (glisser rapide répété, avant/après). |

---

## Sprint 6 - Refonte du dashboard et du menu public

Anciennement nommé "Sprint 4.6" (voir la note de numérotation en tête de
ce fichier). Demandé par le client : porter la qualité visuelle de la
landing sur les écrans que voient le restaurateur et le convive.

Contrainte forte qui distingue ce chantier de la landing : **la landing
force le mode sombre**, alors que le dashboard et le menu public doivent
fonctionner en **sombre et en clair**, dans les **deux langues**. Le mode
clair n'a jamais été réellement éprouvé jusqu'ici, d'où le ticket S6-01
en premier.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S6-01 | Établir une vraie palette claire | `DEV` | Fait. Palette reconstruite autour du violet de marque au lieu d'une inversion mécanique du sombre, et chaque paire texte/fond vérifiée en contraste WCAG AA via `scripts/check-contrast.mjs`. **Reste à valider visuellement sur la preview Vercel** : la base locale étant factice, le dashboard et le menu ne s'affichent pas dans cet environnement. |
| S6-02 | Fiche plat dans le dashboard | `FAIT` (non stylé) | **Signalé par Mouhamed en testant : cliquer sur un plat ne faisait rien.** La liste n'ouvrait que le formulaire d'édition, il n'existait aucun écran pour simplement regarder un plat. Nouvelle page `/dashboard/dishes/[dishId]` : photo, modèle 3D avec le même visualiseur que le menu public, prix, catégorie, temps de préparation, disponibilité, description, ingrédients, allergènes, et les actions (modifier, statistiques, voir sur le menu public). Les médias et le panneau de scan y sont déplacés depuis la page d'édition, qui ne sert plus qu'à modifier les champs. Reste à styler avec le reste du dashboard. |
| S6-03 | Refonte du menu public et de la fiche plat | `DEV` | Écran vu par le convive, le plus critique commercialement. **Grille refondue autour de la photo** (absorbe `S5-07`) : cliché en 4:3, voile dégradé pour que le nom reste lisible sur une assiette claire, prix en pastille, badge AR en cube, et repli élégant sur l'initiale du plat quand la photo manque. **Barre de filtres collée en haut**, catégories en défilement horizontal pour ne pas repousser les plats sous la ligne de flottaison sur un téléphone, filtre allergènes replié avec compteur. **Fiche plat** hiérarchisée : visualiseur AR au ratio des cartes pour éviter le saut visuel, allergènes traités en encart dédié plutôt qu'en ligne de détail (c'est une décision de santé), ingrédients et temps de préparation en tableau. Nouveaux utilitaires `surface-menu`, `photo-scrim`, `menu-aurora`, `menu-sticky-bar` : ceux de la landing sont en `white/0.06` et invisibles en mode clair, alors que le menu doit tenir dans les deux thèmes. Reste à valider au rendu réel (`S6-06`). |
| S6-07 | Sélecteur de langue sur le menu public | `DEV` | **Manque découvert en refondant le menu** : le menu est bilingue depuis le Sprint 1 (F06), mais aucun moyen de changer de langue n'existait côté convive. Or `localeDetection` est volontairement désactivé pour respecter la Loi 96, donc un anglophone qui scanne le QR arrivait en français sans issue. Bascule FR/EN dans l'en-tête du menu et de la fiche plat, conservant le plat consulté plutôt que de renvoyer à la racine. |
| S6-04 | Refonte de la coquille du dashboard | `TODO` | Navigation, en-tête, mise en page générale. |
| S6-05 | Refonte des écrans du dashboard | `TODO` | Vue d'ensemble, plats, QR codes, analytics, facturation. Le panneau de scan 3D (Sprint 7) et la fiche plat (S6-02) attendent ce ticket pour n'être stylés qu'une seule fois. |
| S6-06 | Vérifier chaque écran en clair et en sombre, en FR et en EN | `TODO` | Quatre combinaisons par écran, à valider au rendu réel et pas seulement au build. |

---

## Sprint 7 - Capture 3D automatisée des plats

Anciennement nommé "Sprint 4.7" (voir la note de numérotation en tête de
ce fichier). Fait suite à l'arbitrage documenté dans
`docs/roadmap-ai-instant-3d.md` (section 0) et `docs/scan-3d-plats-vorae.pdf` :
photogrammétrie managée via l'API KIRI Engine, en remplacement de l'upload
manuel de `.glb` par le restaurateur.

**Self-service, dans le dashboard du restaurant, pas dans le super admin** :
c'est le restaurateur qui filme son propre plat, il n'y a pas
d'intermédiaire Vorae dans ce flux (contrairement au service de capture
professionnel de la section 15.3, qui lui resterait piloté par Vorae s'il
est construit un jour).

Le backend (S7-02 à S7-10) ne dépendait d'aucun design et a pu démarrer
immédiatement, en parallèle du Sprint 6. Le style de l'interface (S7-11)
attend volontairement `S6-05` (refonte des écrans du dashboard) pour
n'être stylée qu'une seule fois.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S7-01 | Compte KIRI Engine et clé API | `FAIT` | Clé créée, stockée dans `.env` local (`KIRI_ENGINE_API_KEY`, jamais commitée) et ajoutée à `.env.example`. Testée en direct sur `GET /v1/open/balance` : solde confirmé à 10 crédits. |
| S7-02 | Modèle Prisma `ScanJob` | `FAIT` | Statut, fournisseur, algorithme, `externalJobId` (= `serialize` côté KIRI), type de média source, format demandé, coût, code et message d'erreur. `npx prisma generate` validé ; reste à pousser le schéma sur Neon (`npx prisma db push`, action Mouhamed comme pour les changements précédents). |
| S7-03 | Adaptateur `lib/scan3d.ts` | `FAIT` | Interface `Scan3dProvider` sur le modèle de `lib/billing.ts`, avec les 6 endpoints réels (un par algorithme x type de média). Se fie au champ `ok` de la réponse, pas à `code`. RealityScan 2.1 non implémenté, reste le plan B. |
| S7-04 | `POST /api/dishes/[id]/scan/upload-url` | `FAIT` | Renvoie une signature Cloudinary pour un upload direct client, sans jamais faire transiter le fichier par la Function. Nécessaire suite à S7-05. |
| S7-05 | `POST /api/dishes/[id]/scan` | `FAIT` | **Corrigé en cours de test réel** : reçoit désormais `{ videoUrl }` ou `{ imageUrls }` en JSON, plus le fichier en multipart - les Vercel Functions refusent tout corps entrant au-delà de ~4,5 Mo (`FUNCTION_PAYLOAD_TOO_LARGE`), constaté avec une vraie vidéo de 13,6 Mo pourtant conforme aux critères KIRI. La route télécharge elle-même le média depuis l'URL Cloudinary (appel sortant, pas soumis à cette limite). Valide les bornes (20-300 images), crée le `ScanJob` avant l'appel KIRI, distingue le 403 (crédit insuffisant, renvoyé en 402) du 401 (clé invalide, renvoyé en 500). `tsc`/`lint`/`build` verts. Voir `CONTEXT.md` section 5 et `D-06`. |
| S7-06 | Normalisation de la vidéo avant envoi à KIRI | `FAIT` | **Découvert en test réel** : une capture d'iPhone est refusée par KIRI en code 2009 (« The video does not meet the requirements »), la contrainte étant 3 min et 1920x1080 maximum. Exiger du restaurateur qu'il convertisse lui-même n'est pas tenable, et la vidéo est déjà chez Cloudinary : la route demande donc une version dérivée conforme (`c_limit,w_1920,h_1080,eo_180,f_mp4,vc_h264`). `c_limit` ne fait que réduire et préserve le cadrage, y compris en portrait ; `f_mp4` écarte au passage le doute sur le conteneur `.mov`. Cloudinary répond 423 le temps de calculer une transformation inédite, d'où une reprise espacée côté route. `maxDuration` relevé à 60 s : deux transferts de plusieurs dizaines de Mo ne tiennent pas dans les 10 s par défaut. |
| S7-07 | `POST /api/webhooks/kiri` | `FAIT` | Reçoit `{status, serialize}`, retrouve le `ScanJob`, délègue le traitement à `lib/scan-finalize.ts` (partagé avec le suivi), répond HTTP 200 comme KIRI l'exige. **Authentifié par un jeton placé dans l'URL de callback** (`?token=<KIRI_WEBHOOK_SECRET>`) : la doc KIRI mentionne un secret de signature sans préciser l'en-tête ni l'algorithme, et deviner un mécanisme donnerait une fausse impression de sécurité. Comme c'est nous qui choisissons l'URL enregistrée chez eux, un jeton dans cette URL protège aussi bien sans rien supposer de leur implémentation. Comparaison à durée constante. Refus strict même si le secret n'est pas configuré : le webhook n'est plus indispensable depuis S7-08, donc le fermer ne fait rien perdre, alors qu'un webhook ouvert laisse n'importe qui déclarer un scan réussi. Les en-têtes restent journalisés pour adopter la vraie signature le jour où KIRI la documentera (`S9-04`). |
| S7-08 | `GET /api/dishes/[id]/scan` et suivi affiché | `FAIT` | Renvoie l'état du dernier `ScanJob` du plat et **interroge KIRI** plutôt que de se fier à ce que la base contient : une notification perdue ou un callback mal configuré laisserait sinon le restaurateur devant un job éternellement « en cours » alors que son modèle est prêt. Le traitement du résultat (zip, extraction, téléversement) vit désormais dans `lib/scan-finalize.ts`, partagé avec le webhook, pour qu'il n'existe qu'une seule façon d'en tirer les fichiers. Le panneau affiche l'état en permanence et se rafraîchit toutes les 15 s tant que le job est actif, puis recharge la fiche quand le modèle arrive. |
| S7-09 | Configurer le webhook dans le dashboard KIRI | `FAIT` (preview) | Enregistré par Mouhamed sur l'URL de la branche pour le test. **À repointer vers `https://vorae-menu.vercel.app/api/webhooks/kiri` au passage en production** : il n'y a qu'un seul webhook pour tout le compte, celui de preview cessera de recevoir quoi que ce soit d'utile une fois la branche supprimée. Secret à générer et stocker dans `KIRI_WEBHOOK_SECRET` quand la vérification de signature sera implémentée (S7-07). |
| S7-10 | Garde-fous d'usage | `FAIT` | Deux verrous, tous deux **avant** toute lecture du média pour ne rien télécharger inutilement. (1) Quota mensuel par restaurant, dérivé du palier souscrit (`lib/scan-quota.ts`, 15/45/100 scans, 10 sans abonnement actif, aligné sur les crédits offerts par KIRI). Seuls les crédits réellement débités comptent : un job échoué avant l'appel fournisseur n'a rien coûté. Le quota est affiché sous le bouton avant le clic, pas seulement en cas de refus. (2) Un seul scan actif par plat : un double clic ou un onglet rouvert ne peut plus déclencher deux scans facturés. **Le palier prestige inclut un nombre illimité de plats AR (section 15.1), ce qui ne peut pas signifier un nombre illimité de scans payants** : son plafond de 100 est un garde-fou contre l'emballement, à relever si un client légitime l'atteint. **Le coût réel par plat reste suspendu à la question ouverte sur `fileFormat`** (1 $/plat si un appel suffit pour glb+usdz, 2 $/plat sinon) : les chiffres ci-dessus sont à revoir dès que le premier scan réel aura tranché. |
| S7-11 | Interface de capture sur la fiche plat | `FAIT` (fonctionnel, non stylé) | Sélection de la vidéo, fenêtre de progression pendant l'envoi et la préparation, avertissement de ne pas quitter la page, puis suivi permanent de l'état du job (S7-08). La barre suit la progression réelle pendant l'envoi ; la préparation n'offrant aucune mesure, elle y avance sur une estimation **plafonnée avant la fin de la phase**, pour ne jamais annoncer un achèvement qui n'a pas eu lieu. Coexiste avec l'upload manuel, ne le supprime pas. **Séquencé après `S6-05`** pour n'être stylé qu'une fois ; la validation côté client des contraintes vidéo (durée, résolution) reste à faire à ce moment-là, même si la normalisation serveur (S7-06) couvre déjà le cas en pratique. |
| S7-12 | Premier scan réel de bout en bout | `FAIT` | Le 26 août 2026 : vidéo de test envoyée depuis un iPhone, acceptée par KIRI (`Featureless Scan`, tâche `637b2629a8d044a4980fff80e36f956c`), **1 crédit débité, solde 10 → 9**, confirmé dans l'historique d'usage du compte. Valide toute la chaîne : signature Cloudinary, upload direct, normalisation vidéo, création du `ScanJob`, appel fournisseur. Reste à observer le retour du modèle. |
| S7-16 | **Question `fileFormat` tranchée : un appel KIRI = un seul format** | `FAIT` (constat) | Le premier scan mené à son terme le 26 août 2026 le prouve : le zip résultat ne contenait **que le `.glb`**, aucun `.usdz`, alors que le code cherchait explicitement les deux extensions. **Conséquence directe sur le produit : sur iPhone, le bouton AR n'apparaît pas sans `.usdz`.** Vérifié sur les données de démonstration, qui isolent parfaitement la variable : « Bol signature » (astronaute, glb **+ usdz**) affiche le cube AR ; « Assiette du chef » (robot, glb seul, `usdz: undefined`) ne l'affiche pas ; le plat scanné (glb seul) non plus. Apple n'accepte que l'USDZ pour Quick Look, le GLB ne sert qu'à l'aperçu 3D manipulable. **Le coût par plat est donc de 2 $ et non 1 $** si on passe par un second appel KIRI, sauf à convertir nous-mêmes (`D-03`). Décision à prendre, voir `S7-17`. Les quotas de `S7-10` (15/45/100) sont à réviser en conséquence. |
| S7-17 | Obtenir l'USDZ : second appel KIRI | `FAIT` | Arbitré avec Mouhamed en faveur du second appel plutôt que d'une conversion maison, qu'aucune bibliothèque JavaScript mûre ne permet. Les deux appels partent de la même requête avec le média déjà en mémoire. Coût porté à 2 $/plat, quota ajusté en conséquence. |
| S7-18c | **Mesure : les réglages de qualité KIRI n'ont eu aucun effet** | `FAIT` (constat négatif) | Poids relevés dans le tableau de bord Vercel Blob après le scan du 27 août mené avec `modelQuality: 1` et `textureQuality: 2` : **GLB 93,8 Mo, USDZ 61,1 Mo**, contre 90 Mo pour le scan précédent sans aucun réglage. Aucune réduction, légèrement plus lourd. **Le déploiement était bien actif** : le commit `9ab9073` date de 01:19 heure de Montréal, le scan de 01:26, et ce même scan a produit les deux formats, fonctionnalité livrée à 01:16 seulement. L'hypothèse est donc écartée : soit ces paramètres ne s'appliquent pas à l'algorithme `featureless`, soit la correspondance des valeurs notée dans `lib/scan3d.ts` (0=High, 1=Medium...) est fausse. **Ne pas dépenser d'autres crédits à tâtonner sur ces paramètres sans réponse de KIRI.** Le levier restant est le post-traitement (`S7-18`). |
| S7-18b | Baisser la qualité demandée à KIRI | `FAIT` (sans effet, voir S7-18c) | Premier levier sur le poids, sans post-traitement de notre part : la route ne transmettait aucun réglage de qualité, KIRI appliquait donc ses valeurs par défaut, orientées qualité maximale. Passé à `modelQuality: 1` (Medium) et `textureQuality: 2` (1K, contre 4K par défaut). La texture domine le poids d'un modèle de photogrammétrie, et 4K vers 1K divise sa surface par seize. Surchargeable par requête pour pouvoir remonter sur un plat vitrine sans toucher au code. **Le gain réel reste à mesurer** : il faut un nouveau scan (2 crédits) pour connaître le poids obtenu, et vérifier au passage que la qualité visuelle reste acceptable sur une assiette. |
| S7-19 | **Chaîne complète validée en réalité augmentée sur iPhone** | `FAIT` | Le 27 août 2026, sur le plat « Riz Jolof » : vidéo filmée au téléphone, normalisation, deux appels KIRI (GLB + USDZ), stockage Vercel Blob, rattachement au plat, cube AR affiché, **et réalité augmentée réellement fonctionnelle sur iPhone**. Premier bout-en-bout complet du Sprint 7. Le contraste avec « Entrée classique », scanné avant l'allègement (S7-18b) et dont l'AR fait toujours planter Safari, isole proprement la variable : c'est bien le poids du modèle qui bloquait, et les réglages de qualité abaissés le corrigent. |
| S7-14 | Corriger la perte de résultat après un succès KIRI | `FAIT` | **Découvert sur le premier scan réel (S7-12)** : KIRI avait réussi (statut brut 2), mais le job s'est retrouvé marqué `failed` avec le message inutile "Erreur inconnue". Deux causes cumulées. (1) Le SDK Cloudinary rejette parfois avec un objet simple plutôt qu'une vraie instance `Error`, que `err instanceof Error` ne détecte pas : le vrai message se perdait. Erreur normalisée dans `uploadBuffer`. (2) Plus grave : cet échec marquait le `ScanJob` `failed`, un statut que le suivi ne resonde plus jamais - alors que la génération avait réussi côté KIRI, seul notre traitement du résultat (zip, téléversement) avait raté. Nouveau statut `finalize_failed`, qui reste actif : le prochain sondage retente le même traitement sans dépenser un nouveau crédit. La liste des statuts actifs, dupliquée entre la route et le composant client, est désormais partagée via `lib/scan-status.ts`. **Le mécanisme s'est prouvé lui-même en conditions réelles** : la reprise automatique a bien retenté seule et révélé l'erreur suivante (S7-15), sans nécessiter de relancer un scan ni de reprendre la main manuellement en base. |
| S7-15 | Modèle 3D trop volumineux pour un envoi Cloudinary simple | `FAIT` | **Révélé par la reprise automatique de S7-14** : `File size too large. Got 89973380. Maximum is 10485760.` Deux correctifs Cloudinary tentés, tous deux insuffisants : `upload_large_stream` n'existe pas réellement sur `v2.uploader` dans cette version du SDK (2.10.1), et l'envoi fractionné en morceaux de 6 Mo a échoué sur `Got 12582912` - exactement deux morceaux cumulés, preuve que le plafond de 10 Mo porte sur le fichier total, pas par requête. Un plan Cloudinary supérieur ne suffit pas non plus (Plus à 99 $/mois, encore 20 Mo). **Décidé avec Mouhamed** : les modèles 3D issus du scan migrent vers **Vercel Blob** (`lib/blob-storage.ts`), plutôt qu'AWS S3 (prévu par la section 7 du cahier mais aucun compte n'existe), parce que Vercel Blob s'active depuis les réglages du projet déjà en place, sans nouveau compte externe. Les photos de plats et la vidéo source du scan restent sur Cloudinary. **Action requise avant de tester** : créer un store Blob de type **public** (ce choix ne peut plus changer ensuite) dans Vercel - Storage > Create Database > Blob - puis le connecter au projet sur les environnements Preview et Production (onglet Projects du store > Connect to Project). L'authentification se fait par OIDC, injectée automatiquement à la connexion : aucune variable à copier à la main. |

---

## Sprint 8 - Dashboard super admin et pilote réel

Anciennement nommé "Sprint 5" (voir la note de numérotation en tête de ce
fichier). Rien n'est démarré. Périmètre issu des sections 11 et 21 du
cahier.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S8-01 | Rôle et garde d'accès SuperAdmin (section 18) | `TODO` | Aucune route `/superadmin` n'existe. Le middleware la protège déjà par anticipation. |
| S8-02 | Vue d'ensemble revenus : MRR, ARR, churn (section 11.1) | `TODO` | Dépend de S4-12 : sans données Stripe réelles, aucun revenu à afficher. |
| S8-03 | Gestion des restaurants : liste, filtres, suspension (section 11.2) | `TODO` | Inclut le mode support "impersonate" avec traçabilité. |
| S8-04 | Facturation globale et codes promo (section 11.3) | `TODO` | Dépend de S4-12. |
| S8-05 | Statistiques produit cross-restaurants (section 11.4) | `TODO` | Réutilise `lib/analytics.ts` en élargissant la portée à tous les restaurants. |
| S8-06 | Notes de support internes (section 11.5) | `TODO` | Modèle `SuperAdminNote` déjà présent dans le schéma depuis le Sprint 0. |
| S8-07 | Vrai flux d'invitation d'équipe (section 10.7) | `TODO` | Remplace l'auto-provisionnement actuel, voir `CONTEXT.md` section 6. Bloquant avant d'ouvrir à plusieurs restaurants. |
| S8-08 | Pilote réel avec un restaurant montréalais | `TODO` | Objectif de fin de sprint selon la section 23. Nécessite de vrais modèles 3D de plats. |

---

## Sprint 9 - Modèles 3D exploitables sur mobile

Sorti du Sprint 7 pour ne pas retenir un travail qui fonctionne. La
chaîne de capture est complète et validée (S7-19) : vidéo filmée au
téléphone, deux formats générés, stockage, réalité augmentée effective
sur iPhone. Ce qui reste n'est pas de la finition, c'est **le seul
obstacle entre le produit et un vrai restaurant** : les modèles pèsent
environ 94 Mo, ce qui fait planter Safari et serait de toute façon
intéléchargeable en salle.

Le levier côté fournisseur a été essayé et écarté par la mesure
(`S7-18c`) : les réglages de qualité de KIRI n'ont eu aucun effet. Le
travail restant est donc du post-traitement, chez nous.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S9-01 | Comprendre d'où viennent les 94 Mo | `TODO` | **À faire avant d'écrire du code.** Ouvrir le `.glb` produit et regarder ce qu'il contient réellement : 94 Mo pour une seule assiette est anormalement élevé, et l'hypothèse la plus probable est que le maillage inclut la table et l'arrière-plan malgré `isMask: true`. Selon la réponse, la solution n'est pas la même : recadrer la capture, ou décimer le maillage, ou compresser les textures. Mesurer la répartition entre géométrie et textures avant de choisir. |
| S9-02 | Alléger le modèle après réception | `TODO` | Dépend de `S9-01`. Décimation du maillage et compression des textures (Draco ou meshopt, textures redimensionnées), en visant quelques Mo. **Difficulté réelle à anticiper** : traiter un fichier de 94 Mo dans une Vercel Function plafonnée à 60 s et à quelques centaines de Mo de mémoire est à la limite du faisable, et pourrait imposer une architecture différente pour cette seule étape. |
| S9-03 | Demander à KIRI ce que font vraiment `modelQuality` et `textureQuality` | `TODO` | La mesure de `S7-18c` prouve qu'ils n'ont aucun effet sur l'algorithme `featureless`, contrairement à ce que laissait entendre la documentation. Une réponse de leur support éviterait peut-être tout le post-traitement de `S9-02`. À poser avant de se lancer dans `S9-02`, c'est gratuit et ça peut tout changer. |
| S9-04 | Remplacer le jeton d'URL par la vraie signature KIRI | `TODO` | Le webhook est aujourd'hui authentifié par un jeton placé dans l'URL de callback (`S7-07`), ce qui protège efficacement sans rien supposer du mécanisme de KIRI. Si leur support documente la signature réelle, la remplacer : une signature sur le corps résiste au rejeu et à une fuite d'URL dans des journaux, contrairement à un jeton en clair dans l'URL. Les en-têtes reçus sont déjà journalisés pour ça. |
| S9-05 | Repointer le webhook vers la production | `TODO` | Il n'y a qu'un seul webhook pour tout le compte KIRI, aujourd'hui réglé sur l'URL de la branche de preview. Au passage en production : `https://vorae-menu.vercel.app/api/webhooks/kiri?token=<KIRI_WEBHOOK_SECRET>`. Sans ça, celui de preview cessera de recevoir quoi que ce soit d'utile dès la suppression de la branche. |
| S9-06 | Styler le panneau de capture et la fiche plat | `TODO` | Fonctionnels mais bruts (`S7-11`, `S6-02`). **Séquencé après `S6-05`** pour n'être stylés qu'une fois, avec le reste du dashboard. |
| S9-07 | Validation côté client avant l'appel API | `TODO` | Durée et résolution de la vidéo vérifiées dans le navigateur avant l'envoi, pour ne jamais engager 2 crédits sur une requête vouée à échouer. En pratique la normalisation serveur (`S7-06`) couvre déjà le cas, d'où la faible priorité. |
| S9-08 | Test réel sur le restaurant pilote | `TODO` | Sur de vrais plats, pas des photos de stock ni des objets de décoration. **Bloqué par `S9-02`** : inutile de faire scanner un restaurateur tant que le résultat ne s'affiche pas sur son téléphone. Condition de passage à l'échelle. |

---

## Chantiers hors cahier des charges

| # | Ticket | Statut | Notes |
|---|---|---|---|
| X-01 | Capture 3D automatisée des plats | `DÉPLACÉ` | N'est plus hors cahier des charges : arbitré et planifié en détail dans le **Sprint 7**, ci-dessus. Décision et schéma de flux dans `docs/scan-3d-plats-vorae.pdf`. |

---

## Dette technique connue

Ces points ne bloquent rien aujourd'hui mais deviendront bloquants à
l'échelle. Détail et raisonnement dans `CONTEXT.md` section 4.

| # | Sujet | Statut | Devient bloquant quand |
|---|---|---|---|
| D-01 | Onboarding auto-provisionné (premier compte Clerk devient owner) | `TODO` | Dès le 2e restaurant client. |
| D-02 | Rate limiting en mémoire (`lib/scan.ts`) | `TODO` | Dès un déploiement multi-instance. |
| D-03 | Pas de conversion automatique `.glb` vers `.usdz` | `TODO` | Dès que les restaurateurs uploadent leurs propres modèles sans passer par le service de capture. |
| D-04 | Modèles 3D sur Cloudinary au lieu d'un stockage adapté aux gros fichiers | `BLOQUANT` | **Confirmé, plus seulement théorique** (voir `S7-15`) : le premier modèle réel produit par KIRI pèse environ 86 Mo, et le plafond de 10 Mo du compte Cloudinary porte sur la taille totale du fichier `raw`, pas sur chaque requête - un envoi fractionné en petits morceaux ne le contourne donc pas. **La piste d'un plan Cloudinary supérieur est écartée** : vérifié en direct dans le tableau de bord, le plan Plus à 99 $/mois plafonne toujours les fichiers `raw` à 20 Mo, soit dix fois trop petit. Il faudrait un plan Entreprise sur devis, disproportionné pour ce besoin. Bloque la suite du Sprint 7 (S7-13, le pilote réel) : les vrais plats produiront très probablement des modèles de taille comparable. |
| D-05 | Aucun test automatisé sur les routes API de facturation | `TODO` | Avant la première vraie transaction client. |
| D-06 | `POST /api/dishes/[id]/model3d` accepte jusqu'à 15 Mo dans son propre code, au-dessus de la limite réelle de Vercel (~4,5 Mo, `FUNCTION_PAYLOAD_TOO_LARGE`) | `TODO` | Découvert en corrigeant le même problème sur `/scan` (Sprint 7, voir `CONTEXT.md` section 5). Tout `.glb`/`.usdz` entre 4,5 et 15 Mo échoue probablement déjà en production. Même correctif à appliquer : upload direct client vers Cloudinary. |

---

## Actions en attente côté Mouhamed

Récapitulatif de tout ce qui est bloqué et qui ne peut pas avancer sans
une action extérieure.

1. **Créer le compte Stripe** et renseigner les 8 variables d'environnement (S4-12). Checklist pas à pas dans `CONTEXT.md` section 4. C'est le seul blocage réel du Sprint 4.
2. **Tester et merger la PR #5** une fois la preview Vercel vérifiée.
3. L'`UPDATE` SQL dans Neon a été exécuté (S4-14). Attention, son effet n'est pas encore visible sur la grille du menu public : celle-ci n'affiche pas les photos de plats, voir S5-07.
4. **Créer le compte KIRI Engine** et transmettre la clé API (S7-01). 10 crédits offerts à l'inscription (1 crédit = 1 scan = 1 $), de quoi tester la qualité sur de vrais plats sans rien payer. Au-delà, la recharge minimale est de 500 crédits (500 $) : à budgéter avant de dépasser 10 plats, pas maintenant. Bloquait tout le Sprint 7, désormais fait.
5. **Créer et connecter un store Vercel Blob** (`D-04`, `S7-15`). `FAIT` le 27 août : store `vorae-models` public, connecté au projet sur Preview et Production. Un modèle KIRI de 94 Mo y est stocké sans problème, là où Cloudinary plafonnait à 10 Mo. Rien de plus à faire.
6. **Renseigner `KIRI_WEBHOOK_SECRET`** dans les variables d'environnement Vercel (Production et Preview), puis mettre à jour l'URL de callback dans le tableau de bord KIRI sous la forme `https://<domaine>/api/webhooks/kiri?token=<le secret>`. Sans ça le webhook refuse tous les appels (`S7-07`). **Ce n'est pas bloquant** : le suivi interroge KIRI directement (`S7-08`), le modèle arrive de toute façon, simplement au prochain sondage plutôt qu'instantanément.
7. **Régénérer le jeton du store Blob** (`BLOB_READ_WRITE_TOKEN`) : il a été collé en clair dans une conversation le 27 août. Rien n'indique une fuite, mais un jeton de lecture-écriture qui a quitté son environnement doit être considéré comme compromis.
