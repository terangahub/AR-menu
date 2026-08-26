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

Dernière mise à jour : Sprint 4 en revue (PR #5), Sprint 4.5 en développement.

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
| Sprint 4.5 | Sections avis et à propos, bandeau défilant, retour en haut | `DEV` | - |
| Sprint 4.6 | Refonte du dashboard et du menu public, clair et sombre | `TODO` | - |
| Sprint 5 | Dashboard super admin, pilote réel Montréal | `TODO` | - |
| Hors cahier | Génération 3D instantanée par IA (photo vers 3D) | `TODO` | - |

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
| S4-14 | Relier les photos de plats au restaurant démo | `DONE` | `UPDATE` SQL exécuté dans Neon par Mouhamed. Effet non visible sur la grille du menu, voir S45-07. |
| S4-15 | Brancher le CTA "Réserver une démo" | `TODO` | Le bouton n'a aucune action. À décider : formulaire, Calendly, ou lien courriel. |
| S4-16 | Pages `/privacy` et `/terms` | `TODO` | Liens du footer en ancre `#` en attendant. Requis par la Loi 25 (section 17.4) avant la vraie mise en production. |

---

## Sprint 4.5 - Sections de landing supplémentaires (en cours)

Branche : `feature/s45-landing-sections`, partant de la branche du Sprint 4.

Sorti du Sprint 4 volontairement : la PR #5 était déjà à 25 fichiers et
mélangeait facturation, landing, design et nettoyage typographique.
La section 4.3 du cahier interdit les PR fourre-tout. Ce découpage permet
aussi de merger le Sprint 4 sans attendre ce travail.

Numéroté 4.5 et non 5 ou 6 : le Sprint 5 du cahier est réservé au
dashboard super admin, et ce travail ne dépend pas de lui.

Design repris de webglow.ca (l'agence du client, dont le dépôt a été
fourni), couleurs adaptées aux tokens Vorae.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S45-01 | Bandeau défilant sous le hero | `DEV` | Masque en dégradé, désaturation levée au survol, pause au survol. Contenu : types d'établissement, pas de fausses marques clientes. |
| S45-02 | Section avis, mur d'avis | `DEV` | Deux bandeaux en sens opposés, halo en coeur, pastilles d'initiales. **Avis inventés, à remplacer avant production.** |
| S45-03 | Section à propos | `DEV` | Badge, titre en trois parties dont une en dégradé, particules flottantes en CSS pur (pas de dépendance canvas). |
| S45-04 | Bouton fusée retour en haut | `DEV` | Apparaît après 500px, réacteur animé au décollage. |
| S45-05 | Lien Avis dans la navigation | `DEV` | Ancre `#reviews`, ajoutée au menu desktop et mobile. |
| S45-06 | Remplacer les avis de démonstration par de vrais avis | `TODO` | **Bloquant avant la mise en production.** Voir la ligne rouge éditoriale du cahier, section 12.3. |
| S45-07 | Afficher les photos de plats sur la grille du menu public | `TODO` | Découvert en vérifiant l'`UPDATE` Neon : la grille du menu n'affiche que le texte et le prix, jamais `Dish.imageUrl`. Les photos ne sont donc visibles que sur la fiche plat. Repris dans le Sprint 4.6. |
| S45-09 | Section globe en pointillés | `DEV` | Canvas 2D, projection orthographique, rotation lente, marqueur pulsant sur Montréal. Reprise de la section "dotted across the globe" de reflect.app, fournie en vidéo. Aucune dépendance ajoutée. |
| S45-10 | Rejouer les animations d'apparition dans les deux sens | `DEV` | Elles ne se déclenchaient qu'une fois. Deux seuils pour éviter le clignotement au ras de la limite. |
| S45-08 | Remplacer les photos de plats des fonctionnalités par des champs défilants | `DEV` | Les photos illustraient mal le propos : une assiette de pâtes pour parler de barrière de langue. Remplacées par un champ de mots défilants qui dit littéralement le bénéfice (questions en salle, allergènes, langues), technique de la section "Hardened security" de reflect.app. |
| S45-11 | Maquette du produit dans le hero | `DEV` | Remplace la photo de plat, jugée hors sujet : elle ne montrait pas le produit. Maquette du menu convive reconstituée en HTML, pas une capture, donc nette à toutes les densités et traduite. |
| S45-13 | Corriger la visibilité des calques `-z-10` (particules, halos) | `DEV` | Bug transverse découvert en ajoutant les étoiles filantes : plusieurs sections (`about`, `reviews`, hero, `features`, `pricing`, globe) ne créaient pas leur propre contexte d'empilement, si bien que leurs calques décoratifs en `-z-10` se peignaient sous le fond opaque du wrapper racine au lieu de derrière le texte de la section, invisibles à l'écran bien que présents dans le DOM. Corrigé en ajoutant `isolate` sur chaque section concernée. Voir CONTEXT.md. |
| S45-14 | Étoiles filantes en fond, sections À propos et Avis | `DEV` | CSS pur (`shooting-stars.tsx` + `.shooting-star` dans globals.css), positions figées en dur, très discret. A révélé S45-13. |
| S45-15 | Halo en coeur (Avis) : trait lumineux qui parcourt le contour | `DEV` | `pathLength="1"` sur le path SVG pour exprimer dasharray/dashoffset en fraction du tracé, boucle exacte quelle que soit la courbe. Masqué en dégradé pour ne garder que les 3/5 supérieurs du coeur. |
| S45-16 | Bordure animée sur la carte Croissance (tarifs) | `DEV` | `.border-gradient-animated`, dégradé conique qui tourne via la propriété enregistrée `--border-angle` (`@property`). |
| S45-17 | Avatars générés à la place des initiales (Avis) | `DEV` | Identicon déterministe (grille symétrique dérivée d'un hachage), pas une photo : le principe d'honnêteté de S45-02 tient toujours, juste un cran plus riche visuellement. |
| S45-18 | Globe électrique | `DEV` | Balayage lumineux (conic gradient + trait net) qui tourne bien plus vite que la sphère, et "détecte" Montréal à son passage (flash sur le marqueur). Fait le lien avec le scan, plutôt qu'une simple animation décorative. |
| S45-19 | Ligne de liaison mobile, section Comment ça marche | `DEV` | Version verticale de la ligne desktop, pour les 3 cartes empilées. |
| S45-20 | Défilement retour en haut plus doux | `DEV` | `scrollTo({behavior:"smooth"})` remplacé par un défilement mesuré (durée fixe, easing) : le défilement natif du navigateur pouvait être très rapide sur une page longue. Le rejeu des animations d'apparition (S45-10) est aussi suspendu le temps du défilement, sinon chaque section traversée clignotait. |
| S45-21 | Pages Confidentialité et Conditions, FR et EN | `DEV` | Contenu de gabarit réaliste (Clerk, Stripe, Cloudinary, Neon, Loi 25, LPRPDE), **à faire valider par un juriste avant la mise en production** : bandeau d'avertissement en tête des deux pages. Section globe déplacée juste avant la FAQ à la demande de Mouhamed. |
| S45-22 | Favicon | `DONE` | `favicon.ico` régénéré depuis le logo V actuel : l'ancien triangle remplacé au Sprint 4 traînait encore dans ce fichier précis. |
| S45-23 | Vitesse du champ de mots "Service" corrigée | `DEV` | La vitesse de `Reveal` avait été ralentie par erreur pour toute la section (S45-inclus dans le lot précédent) sans toucher au vrai défilement interne du champ de mots, qui restait rapide. Toutes les rangées ont maintenant la même durée, environ 5x plus lente qu'avant. |
| S45-24 | Maquette du hero interactive | `DEV` | Les filtres de catégorie (Tout/Plats/Entrées) filtrent réellement la liste, et le badge AR d'un plat ouvre un écran de prévisualisation AR illustratif dans le téléphone (surface détectée, plat qui flotte, contrôles de rotation), avec retour à la liste. Ajout d'un 4e plat pour peupler la catégorie Plats. Légère inclinaison 3D qui suit la souris. |
| S45-25 | Badges flottants autour du hero | `DEV` | Trois badges (AR, 12 langues, zéro application) positionnés en dehors du téléphone via `calc(100% + Npx)` plutôt qu'un décalage négatif fixe, qui laissait le badge chevaucher l'écran quand le texte était plus long qu'en anglais. Visibles à partir de `lg` seulement, l'espace autour du téléphone étant insuffisant en dessous. |
| S45-26 | Globe : rotation au glisser, pression, balayage revu | `DEV` | Le globe se laisse maintenant tourner à la souris/au doigt (persiste après relâchement, la rotation automatique reprend de là), et réagit à la pression (déformation locale façon éponge, qui reprend sa forme lentement). Le balayage électrique est ralenti (4s → 16s par tour) et fait apparaître de petits points radar sur des points existants de la sphère à son passage, en plus de la réaction déjà en place sur Montréal. |
| S45-27 | CTA du globe rendu pertinent | `DEV` | Remplacé le lien qui ne faisait que défiler vers une section déjà vue par un vrai lien vers `/dashboard` ("Commencer"), cohérent avec le CTA du tarif. |
| S45-28 | Bandeau des types de restaurants | `DEV` | Police agrandie, espace doublé avant la carte d'offre de lancement. |
| S45-29 | Trois cartes "Pourquoi Vorae" différenciées | `DEV` | Remplace le champ de mots unique (identique sur les trois cartes) par trois mécaniques distinctes : bulles de question qui montent (Service), anneau de pastilles d'allergènes qui s'illuminent à tour de rôle (Allergènes), bascule façon panneau d'aéroport entre les langues (Langues). `feature-field.tsx` supprimé, plus utilisé. |
| S45-30 | Refonte du footer | `DEV` | Wordmark "VORAE" géant et très pâle en fond, ligne d'accent animée en haut, troisième colonne "Entreprise" (à propos, contact), CTA répété. |
| S45-31 | Carte Service : retour au champ défilant | `DEV` | La variante en bulles de conversation donnait un empilement illisible. Retour exact à l'ancien champ de mots, avec la vitesse uniforme et 5x plus lente demandée (325s par rangée, sens toujours alternés). |
| S45-32 | Carte Langues : bascule réparée | `DEV` | Les 12 langues s'affichaient toutes en même temps, superposées et sans animation : les pourcentages de `@keyframes` se comptent sur le cycle entier, pas sur le créneau d'une langue, donc une dizaine restaient à `opacity: 1`. Alternance repassée en JavaScript (index qui avance, transition CSS), correcte quel que soit le nombre de langues. |
| S45-33 | Erreur 500 en production locale, invisible au build | `DEV` | Rendre la carte Langues cliente faisait passer une icône lucide (un `forwardRef`) en prop depuis un Server Component : `next build` passait, mais la page renvoyait 500 à l'exécution. Icône importée directement dans le composant client. Documenté dans CONTEXT.md. |
| S45-34 | Collision dans l'anneau d'allergènes | `DEV` | La pastille du bas passait sous le libellé de la carte, surtout en mobile. Rayon vertical de l'anneau resserré, design inchangé par ailleurs. |
| S45-35 | Contenu animé des cartes Service et Sécurité traduit | `DEV` | Les questions en salle et les allergènes étaient codés en dur en français. Déplacés dans les fichiers de traduction (`Landing.fields`). La carte Langues garde sa liste en dur : c'est le fait qu'elle ne change pas qui illustre le propos. |
| S45-36 | Carte Accessibilité : flash-back puis lecture posée | `DEV` | Deux balayages rapides de toutes les langues (~80ms chacune, léger flou), puis lecture langue par langue (~2,2s), en boucle. Mesuré au navigateur : phase rapide de 0 à 2,3s, puis pas de ~2,2s. |
| S45-37 | Aperçu du hero réellement navigable | `DEV` | Chaque plat ouvre sa fiche (photo, nom, prix, description, allergènes, bouton AR ou mention que la vue AR n'existe pas encore), avec retour en arrière et défilement à l'intérieur du cadre. Un 5e plat ajouté pour que la liste dépasse vraiment l'écran (543px de contenu pour 460px de cadre). |
| S45-38 | Boutons incliquables dans la maquette du hero | `DEV` | `transformStyle: preserve-3d` sur le châssis faussait le test de collision : `mousedown` allait au conteneur et `mouseup` au bouton, donc le `click` partait sur l'ancêtre commun. Invisible en test JS (`element.click()` marchait), diagnostiqué en comparant les cibles des événements au niveau du document. Documenté dans CONTEXT.md. |
| S45-39 | Nom et prix invisibles sur la fiche plat | `DEV` | Le bloc texte, statique et remonté par `-mt-6`, passait derrière le conteneur `relative` de la photo. Repéré en relisant les captures, pas par un test : le texte était bien présent dans le DOM. |
| S45-40 | Vidéo de la section Expérience qui s'arrêtait | `DEV` | `loop` ne couvre que la fin de lecture, pas une mise en pause : les navigateurs mettent la vidéo en pause hors écran, en arrière-plan ou en économie d'énergie, et rien ne la relançait. Nouveau composant `LoopingVideo` qui relance à la visibilité et met en pause hors écran pour ne pas chauffer la batterie. |
| S45-41 | Globe : éponge plus marquée et retour bien plus lent | `DEV` | Creux élargi (0,22 à 0,5 du rayon), chute en cosinus pour un raccord sans cassure, ondes de choc émises à l'appui et au relâchement (anneau + points soulevés au passage du front), et retour en oscillation amortie sur 3s. Mesuré : les points se rapprochent de 6,6px à l'appui, repassent au repos vers 600ms, bombent jusqu'à 2400ms, se stabilisent à 3000ms. |
| S45-42 | Carte Accessibilité : flash-back relancé au scroll | `DEV` | Le cycle tournait en continu dès le montage : un visiteur qui scrollait jusqu'à la carte arrivait souvent en pleine phase lente et ratait le flash-back (fenêtre de ~2,3s sur un cycle total de ~24s). `IntersectionObserver` sur la carte qui remet `step` à 0 à chaque entrée dans le cadre, pour que le flash-back se rejoue systématiquement au moment où le visiteur la découvre. |
| S45-43 | Globe : rotation au glisser retirée | `DEV` | Le glisser déplaçait la sphère en même temps que le point de pression suivait le curseur, ce qui perturbait visiblement les ondes de choc, et un glisser rapide provoquait un bug (cf. S45-44). Rotation manuelle (`dragOffset`) et son état associé retirés en gardant la pression et les ondes, qui n'en dépendaient pas. Le globe ne tourne plus qu'automatiquement (~60s/tour) ; `cursor: grab/grabbing` retiré aussi, il n'a plus de sens sans glisser. |
| S45-44 | Globe : plantage sur glisser rapide (rayon négatif) | `DEV` | Reproduit en testant S45-43 : un glisser rapide faisait planter le rendu du globe (`IndexSizeError`, rayon négatif passé à `ctx.arc`). Cause réelle sans rapport avec le glisser lui-même : `ripple.start` (posé avec `performance.now()` dans le gestionnaire d'événement) peut tomber très légèrement après le `now` du prochain `requestAnimationFrame`, rendant `age` négatif et le rayon de l'onde négatif. `age` maintenant borné à `[0, 1]`. Documenté dans CONTEXT.md, reproduit et vérifié disparu via Playwright (glisser rapide répété, avant/après). |

---

## Sprint 4.6 - Refonte du dashboard et du menu public

Rien n'est démarré. Demandé par le client : porter la qualité visuelle de
la landing sur les écrans que voient le restaurateur et le convive.

Contrainte forte qui distingue ce chantier de la landing : **la landing
force le mode sombre**, alors que le dashboard et le menu public doivent
fonctionner en **sombre et en clair**, dans les **deux langues**. Le mode
clair n'a jamais été réellement éprouvé jusqu'ici, d'où le ticket S46-01
en premier.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S46-01 | Établir une vraie palette claire | `DEV` | Fait. Palette reconstruite autour du violet de marque au lieu d'une inversion mécanique du sombre, et chaque paire texte/fond vérifiée en contraste WCAG AA via `scripts/check-contrast.mjs`. **Reste à valider visuellement sur la preview Vercel** : la base locale étant factice, le dashboard et le menu ne s'affichent pas dans cet environnement. |
| S46-05 | Fiche plat dans le dashboard | `FAIT` (non stylé) | **Signalé par Mouhamed en testant : cliquer sur un plat ne faisait rien.** La liste n'ouvrait que le formulaire d'édition, il n'existait aucun écran pour simplement regarder un plat. Nouvelle page `/dashboard/dishes/[dishId]` : photo, modèle 3D avec le même visualiseur que le menu public, prix, catégorie, temps de préparation, disponibilité, description, ingrédients, allergènes, et les actions (modifier, statistiques, voir sur le menu public). Les médias et le panneau de scan y sont déplacés depuis la page d'édition, qui ne sert plus qu'à modifier les champs. Reste à styler avec le reste du dashboard. |
| S46-02 | Refonte du menu public et de la fiche plat | `TODO` | Écran vu par le convive, le plus critique commercialement. Absorbe S45-07 (photos sur la grille). |
| S46-03 | Refonte de la coquille du dashboard | `TODO` | Navigation, en-tête, mise en page générale. |
| S46-04 | Refonte des écrans du dashboard | `TODO` | Vue d'ensemble, plats, QR codes, analytics, facturation. |
| S46-05 | Vérifier chaque écran en clair et en sombre, en FR et en EN | `TODO` | Quatre combinaisons par écran, à valider au rendu réel et pas seulement au build. |

---

## Sprint 4.7 - Capture 3D automatisée des plats

Rien n'est démarré. Fait suite à l'arbitrage documenté dans
`docs/roadmap-ai-instant-3d.md` (section 0) et `docs/scan-3d-plats-vorae.pdf` :
photogrammétrie managée via l'API KIRI Engine, en remplacement de l'upload
manuel de `.glb` par le restaurateur.

**Self-service, dans le dashboard du restaurant, pas dans le super admin** :
c'est le restaurateur qui filme son propre plat, il n'y a pas
d'intermédiaire Vorae dans ce flux (contrairement au service de capture
professionnel de la section 15.3, qui lui resterait piloté par Vorae s'il
est construit un jour).

Le backend (S47-02 à S47-06) ne dépend d'aucun design et peut démarrer
immédiatement, en parallèle du Sprint 4.6. L'interface (S47-07) attend
volontairement `S46-04` (refonte des écrans du dashboard) pour n'être
stylée qu'une seule fois.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S47-01 | Compte KIRI Engine et clé API | `FAIT` | Clé créée, stockée dans `.env` local (`KIRI_ENGINE_API_KEY`, jamais commitée) et ajoutée à `.env.example`. Testée en direct sur `GET /v1/open/balance` : solde confirmé à 10 crédits. |
| S47-02 | Modèle Prisma `ScanJob` | `FAIT` | Statut, fournisseur, algorithme, `externalJobId` (= `serialize` côté KIRI), type de média source, format demandé, coût, code et message d'erreur. `npx prisma generate` validé ; reste à pousser le schéma sur Neon (`npx prisma db push`, action Mouhamed comme pour les changements précédents). |
| S47-03 | Adaptateur `lib/scan3d.ts` | `FAIT` | Interface `Scan3dProvider` sur le modèle de `lib/billing.ts`, avec les 6 endpoints réels (un par algorithme x type de média). Se fie au champ `ok` de la réponse, pas à `code`. RealityScan 2.1 non implémenté, reste le plan B. |
| S47-04a | `POST /api/dishes/[id]/scan/upload-url` | `FAIT` | Renvoie une signature Cloudinary pour un upload direct client, sans jamais faire transiter le fichier par la Function. Nécessaire suite à S47-04b. |
| S47-04b | `POST /api/dishes/[id]/scan` | `FAIT` | **Corrigé en cours de test réel** : reçoit désormais `{ videoUrl }` ou `{ imageUrls }` en JSON, plus le fichier en multipart - les Vercel Functions refusent tout corps entrant au-delà de ~4,5 Mo (`FUNCTION_PAYLOAD_TOO_LARGE`), constaté avec une vraie vidéo de 13,6 Mo pourtant conforme aux critères KIRI. La route télécharge elle-même le média depuis l'URL Cloudinary (appel sortant, pas soumis à cette limite). Valide les bornes (20-300 images), crée le `ScanJob` avant l'appel KIRI, distingue le 403 (crédit insuffisant, renvoyé en 402) du 401 (clé invalide, renvoyé en 500). `tsc`/`lint`/`build` verts. Voir `CONTEXT.md` section 5 et `D-06`. |
| S47-04c | Normalisation de la vidéo avant envoi à KIRI | `FAIT` | **Découvert en test réel** : une capture d'iPhone est refusée par KIRI en code 2009 (« The video does not meet the requirements »), la contrainte étant 3 min et 1920x1080 maximum. Exiger du restaurateur qu'il convertisse lui-même n'est pas tenable, et la vidéo est déjà chez Cloudinary : la route demande donc une version dérivée conforme (`c_limit,w_1920,h_1080,eo_180,f_mp4,vc_h264`). `c_limit` ne fait que réduire et préserve le cadrage, y compris en portrait ; `f_mp4` écarte au passage le doute sur le conteneur `.mov`. Cloudinary répond 423 le temps de calculer une transformation inédite, d'où une reprise espacée côté route. `maxDuration` relevé à 60 s : deux transferts de plusieurs dizaines de Mo ne tiennent pas dans les 10 s par défaut. |
| S47-05 | `POST /api/webhooks/kiri` | `FAIT` (validation de signature en attente) | Reçoit `{status, serialize}`, retrouve le `ScanJob`, télécharge le zip via `getModelZip`, scanne pour `.glb` **et** `.usdz` (plutôt que de supposer un seul format), téléverse ce qui est trouvé sur Cloudinary, met à jour `Dish`. Répond HTTP 200 dans tous les cas. Ajoute la dépendance `jszip` (aucune vulnérabilité propre, vérifié par `npm audit`). **La validation du secret de signature n'est pas implémentée** : le mécanisme exact (en-tête, algorithme) n'est pas documenté par KIRI, les en-têtes reçus sont journalisés pour l'observer sur le premier appel réel plutôt que de deviner. |
| S47-05ter | `GET /api/dishes/[id]/scan` et suivi affiché | `FAIT` | Renvoie l'état du dernier `ScanJob` du plat et **interroge KIRI** plutôt que de se fier à ce que la base contient : une notification perdue ou un callback mal configuré laisserait sinon le restaurateur devant un job éternellement « en cours » alors que son modèle est prêt. Le traitement du résultat (zip, extraction, téléversement) vit désormais dans `lib/scan-finalize.ts`, partagé avec le webhook, pour qu'il n'existe qu'une seule façon d'en tirer les fichiers. Le panneau affiche l'état en permanence et se rafraîchit toutes les 15 s tant que le job est actif, puis recharge la fiche quand le modèle arrive. |
| S47-05bis | Configurer le webhook dans le dashboard KIRI | `FAIT` (preview) | Enregistré par Mouhamed sur l'URL de la branche pour le test. **À repointer vers `https://vorae-menu.vercel.app/api/webhooks/kiri` au passage en production** : il n'y a qu'un seul webhook pour tout le compte, celui de preview cessera de recevoir quoi que ce soit d'utile une fois la branche supprimée. Secret à générer et stocker dans `KIRI_WEBHOOK_SECRET` quand la vérification de signature sera implémentée (S47-05). |
| S47-06 | Garde-fous d'usage | `FAIT` | Deux verrous, tous deux **avant** toute lecture du média pour ne rien télécharger inutilement. (1) Quota mensuel par restaurant, dérivé du palier souscrit (`lib/scan-quota.ts`, 15/45/100 scans, 10 sans abonnement actif, aligné sur les crédits offerts par KIRI). Seuls les crédits réellement débités comptent : un job échoué avant l'appel fournisseur n'a rien coûté. Le quota est affiché sous le bouton avant le clic, pas seulement en cas de refus. (2) Un seul scan actif par plat : un double clic ou un onglet rouvert ne peut plus déclencher deux scans facturés. **Le palier prestige inclut un nombre illimité de plats AR (section 15.1), ce qui ne peut pas signifier un nombre illimité de scans payants** : son plafond de 100 est un garde-fou contre l'emballement, à relever si un client légitime l'atteint. **Le coût réel par plat reste suspendu à la question ouverte sur `fileFormat`** (1 $/plat si un appel suffit pour glb+usdz, 2 $/plat sinon) : les chiffres ci-dessus sont à revoir dès que le premier scan réel aura tranché. |
| S47-07a | Panneau de capture sur la fiche plat | `FAIT` (non stylé) | Sélection de la vidéo, fenêtre de progression pendant l'envoi et la préparation, avertissement de ne pas quitter la page, puis suivi permanent de l'état du job (S47-05ter). La barre suit la progression réelle pendant l'envoi ; la préparation n'offrant aucune mesure, elle y avance sur une estimation **plafonnée avant la fin de la phase**, pour ne jamais annoncer un achèvement qui n'a pas eu lieu. Reste à styler avec le reste du dashboard en S47-07. |
| S47-07 | Interface dans le dashboard restaurant | `TODO` | Bouton "Scanner ce plat" sur la fiche plat, enregistrement ou upload vidéo, statut du job en direct. Validation côté client avant l'appel API (durée vidéo ≤ 3 min/1920x1080, 20 à 300 photos) pour ne jamais gaspiller un crédit sur une requête vouée à échouer (codes 2004/2005/2007/2009/2010, détail dans `docs/roadmap-ai-instant-3d.md`). **Séquencé après S46-04** pour n'être stylé qu'une fois. Coexiste avec l'upload manuel, ne le supprime pas. |
| S47-08a | Premier scan réel de bout en bout | `FAIT` | Le 26 août 2026 : vidéo de test envoyée depuis un iPhone, acceptée par KIRI (`Featureless Scan`, tâche `637b2629a8d044a4980fff80e36f956c`), **1 crédit débité, solde 10 → 9**, confirmé dans l'historique d'usage du compte. Valide toute la chaîne : signature Cloudinary, upload direct, normalisation vidéo, création du `ScanJob`, appel fournisseur. Reste à observer le retour du modèle. |
| S47-08 | Test réel sur le restaurant pilote | `TODO` | Avec les crédits gratuits de S47-01, sur de vrais plats, pas des photos de stock. Condition de passage à l'échelle. |

---

## Sprint 5 - Dashboard super admin et pilote réel

Rien n'est démarré. Périmètre issu des sections 11 et 21 du cahier.

| # | Ticket | Statut | Notes |
|---|---|---|---|
| S5-01 | Rôle et garde d'accès SuperAdmin (section 18) | `TODO` | Aucune route `/superadmin` n'existe. Le middleware la protège déjà par anticipation. |
| S5-02 | Vue d'ensemble revenus : MRR, ARR, churn (section 11.1) | `TODO` | Dépend de S4-12 : sans données Stripe réelles, aucun revenu à afficher. |
| S5-03 | Gestion des restaurants : liste, filtres, suspension (section 11.2) | `TODO` | Inclut le mode support "impersonate" avec traçabilité. |
| S5-04 | Facturation globale et codes promo (section 11.3) | `TODO` | Dépend de S4-12. |
| S5-05 | Statistiques produit cross-restaurants (section 11.4) | `TODO` | Réutilise `lib/analytics.ts` en élargissant la portée à tous les restaurants. |
| S5-06 | Notes de support internes (section 11.5) | `TODO` | Modèle `SuperAdminNote` déjà présent dans le schéma depuis le Sprint 0. |
| S5-07 | Vrai flux d'invitation d'équipe (section 10.7) | `TODO` | Remplace l'auto-provisionnement actuel, voir `CONTEXT.md` section 6. Bloquant avant d'ouvrir à plusieurs restaurants. |
| S5-08 | Pilote réel avec un restaurant montréalais | `TODO` | Objectif de fin de sprint selon la section 23. Nécessite de vrais modèles 3D de plats. |

---

## Chantiers hors cahier des charges

| # | Ticket | Statut | Notes |
|---|---|---|---|
| X-01 | Capture 3D automatisée des plats | `DÉPLACÉ` | N'est plus hors cahier des charges : arbitré et planifié en détail dans le **Sprint 4.7**, ci-dessus. Décision et schéma de flux dans `docs/scan-3d-plats-vorae.pdf`. |

---

## Dette technique connue

Ces points ne bloquent rien aujourd'hui mais deviendront bloquants à
l'échelle. Détail et raisonnement dans `CONTEXT.md` section 4.

| # | Sujet | Statut | Devient bloquant quand |
|---|---|---|---|
| D-01 | Onboarding auto-provisionné (premier compte Clerk devient owner) | `TODO` | Dès le 2e restaurant client. |
| D-02 | Rate limiting en mémoire (`lib/scan.ts`) | `TODO` | Dès un déploiement multi-instance. |
| D-03 | Pas de conversion automatique `.glb` vers `.usdz` | `TODO` | Dès que les restaurateurs uploadent leurs propres modèles sans passer par le service de capture. |
| D-04 | Modèles 3D sur Cloudinary au lieu d'AWS S3 + CloudFront | `TODO` | Quand le volume ou le coût le justifie. |
| D-05 | Aucun test automatisé sur les routes API de facturation | `TODO` | Avant la première vraie transaction client. |
| D-06 | `POST /api/dishes/[id]/model3d` accepte jusqu'à 15 Mo dans son propre code, au-dessus de la limite réelle de Vercel (~4,5 Mo, `FUNCTION_PAYLOAD_TOO_LARGE`) | `TODO` | Découvert en corrigeant le même problème sur `/scan` (Sprint 4.7, voir `CONTEXT.md` section 5). Tout `.glb`/`.usdz` entre 4,5 et 15 Mo échoue probablement déjà en production. Même correctif à appliquer : upload direct client vers Cloudinary. |

---

## Actions en attente côté Mouhamed

Récapitulatif de tout ce qui est bloqué et qui ne peut pas avancer sans
une action extérieure.

1. **Créer le compte Stripe** et renseigner les 8 variables d'environnement (S4-12). Checklist pas à pas dans `CONTEXT.md` section 4. C'est le seul blocage réel du Sprint 4.
2. **Tester et merger la PR #5** une fois la preview Vercel vérifiée.
3. L'`UPDATE` SQL dans Neon a été exécuté (S4-14). Attention, son effet n'est pas encore visible sur la grille du menu public : celle-ci n'affiche pas les photos de plats, voir S45-07.
4. **Créer le compte KIRI Engine** et transmettre la clé API (S47-01). 10 crédits offerts à l'inscription (1 crédit = 1 scan = 1 $), de quoi tester la qualité sur de vrais plats sans rien payer. Au-delà, la recharge minimale est de 500 crédits (500 $) : à budgéter avant de dépasser 10 plats, pas maintenant. Bloque tout le Sprint 4.7.
