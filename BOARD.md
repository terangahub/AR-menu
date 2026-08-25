# Board de livraison - Vorae

Suivi d'avancement de tous les sprints et de tous les tickets du projet.
C'est le "Jira" du projet : l'état de chaque chantier, qui attend quoi, et
ce qui bloque.

Deux documents complémentaires, ne pas les confondre :

| Document | Rôle |
|---|---|
| `BOARD.md` (ce fichier) | **Où en est chaque ticket.** Statut, blocages, prochaine action. |
| `CONTEXT.md` | **Comment le projet est fait.** Architecture, écarts au cahier, pièges connus. |
| `docs/roadmap-ai-instant-3d.md` | Planification détaillée d'un chantier futur non démarré. |

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
| S46-02 | Refonte du menu public et de la fiche plat | `TODO` | Écran vu par le convive, le plus critique commercialement. Absorbe S45-07 (photos sur la grille). |
| S46-03 | Refonte de la coquille du dashboard | `TODO` | Navigation, en-tête, mise en page générale. |
| S46-04 | Refonte des écrans du dashboard | `TODO` | Vue d'ensemble, plats, QR codes, analytics, facturation. |
| S46-05 | Vérifier chaque écran en clair et en sombre, en FR et en EN | `TODO` | Quatre combinaisons par écran, à valider au rendu réel et pas seulement au build. |

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
| X-01 | Génération de modèle 3D instantanée par IA | `TODO` | Planification complète dans `docs/roadmap-ai-instant-3d.md`. Demande un comparatif de fournisseurs avant tout code. |

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

---

## Actions en attente côté Mouhamed

Récapitulatif de tout ce qui est bloqué et qui ne peut pas avancer sans
une action extérieure.

1. **Créer le compte Stripe** et renseigner les 8 variables d'environnement (S4-12). Checklist pas à pas dans `CONTEXT.md` section 4. C'est le seul blocage réel du Sprint 4.
2. **Tester et merger la PR #5** une fois la preview Vercel vérifiée.
3. L'`UPDATE` SQL dans Neon a été exécuté (S4-14). Attention, son effet n'est pas encore visible sur la grille du menu public : celle-ci n'affiche pas les photos de plats, voir S45-07.
