# Contexte projet - Vorae (AR-menu)

Ce document résume l'état réel du projet pour toute personne (humaine ou IA)
qui reprend le travail sans avoir suivi les sessions précédentes. Il complète
le cahier des charges (`Vorae - Cahier des charges technique v2.0`), qui reste
la source de vérité produit - ce fichier documente l'**implémentation
réelle**, y compris les écarts par rapport au cahier et les raisons.

**Règle** : mettre à jour ce fichier à la fin de chaque sprint (nouvelle
section "Sprint N", écarts constatés, comptes externes ajoutés, bugs connus).
Ne jamais le laisser devenir obsolète - un contexte faux est pire qu'aucun
contexte.

**Voir aussi** : [`BOARD.md`](./BOARD.md) suit l'**avancement** ticket par
ticket (statuts TODO, READY, DEV, REVIEW, DONE, DEPLOYED, BLOCKED) et
recense ce qui est bloqué. Répartition des rôles : `BOARD.md` répond à "où
en est le travail", `CONTEXT.md` à "comment le projet est fait". Mettre à
jour `BOARD.md` à chaque changement d'état d'un ticket, pas seulement en
fin de sprint.

**Convention d'écriture** : aucun tiret long (cadratin) nulle part dans le
projet, ni dans le code, ni dans les commentaires, ni dans la
documentation, ni dans les textes visibles par l'utilisateur. Utiliser un
tiret court, une virgule ou un deux-points selon ce qui est le plus
naturel. Exigence explicite du client.

---

## 1. État des sprints

| Sprint | Statut | Contenu |
|---|---|---|
| Sprint 0 | ✅ Mergé | Next.js 14 + TS + Tailwind + shadcn/ui, Prisma, Clerk, CI, PR workflow |
| Sprint 1 | ✅ Mergé | Menu 2D public, fiche plat + AR (`<model-viewer>`) + fallback 2D, i18n FR/EN |
| Sprint 2 | ✅ Mergé | Dashboard restaurateur : CRUD plats, upload photo/3D, QR codes |
| Sprint 3 | ✅ Mergé | Analytics par plat, système de design (palette reflect.app + Space Grotesk/Inter + toggle dark/light), landing page marketing (section 12, avancée depuis le Sprint 4) |
| Sprint 4 | 🔄 En cours (branche `feature/s4-billing-landing-polish`) | Stripe Billing (3 paliers, section 15), section tarifs + FAQ sur la landing - reste à faire : visuels réels (voir section 4), Stripe pas encore testé en conditions réelles (clés manquantes) |

---

## 2. Comptes externes (déjà créés, gérés par Mouhamed / lomedlow)

| Service | Usage | Où sont les identifiants |
|---|---|---|
| **GitHub** | `terangahub/AR-menu` - repo **public** (protection de branche gratuite impossible sur un repo privé d'org sur le plan Free) | - |
| **Vercel** | Hébergement, scope `terangahub's projects` | Vercel → Settings → Environment Variables |
| **Neon** | Postgres serverless, projet `vorae` | `DATABASE_URL` dans Vercel - **utiliser la connexion POOLED** (hostname avec `-pooler`), pas la directe (voir section 5) |
| **Clerk** | Authentification | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` dans Vercel |
| **Cloudinary** | Stockage images ET modèles 3D (voir écart section 4) | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` dans Vercel |
| **Stripe** | Facturation (section 15) - **compte pas encore créé par le client**, code écrit et buildé mais jamais exercé contre l'API réelle | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_{ESSENTIEL,CROISSANCE,PRESTIGE}_{MONTHLY,ANNUAL}` - 8 variables au total, voir section 4 pour la checklist de création |

Pas encore créés : AWS (S3/CloudFront), Stripe (produits à créer, voir section 4), Resend.

---

## 3. Architecture réelle

Stack conforme au cahier (section 7), avec les versions **épinglées**
ci-dessous - voir section 4 pour pourquoi.

```
src/
  app/
    [locale]/                    ← toutes les routes passent par next-intl
      page.tsx                   ← landing marketing (section 12, direction reflect.app - voir section 4)
      [restaurantSlug]/          ← menu public 2D (F02)
        dishes/[dishId]/         ← fiche plat + AR (F03-F05)
      dashboard/                 ← protégé par middleware Clerk, force-dynamic
        page.tsx                 ← vue d'ensemble (10.1)
        dishes/                  ← CRUD plats (10.2)
        qrcodes/                 ← génération QR (10.4)
        analytics/               ← tableau global triable + export CSV (10.3)
        analytics/[dishId]/      ← analytics par plat : tendance, heure de pointe (10.3)
        billing/                 ← palier actuel, factures, checkout/portail Stripe (10.6)
    api/
      menu/[restaurantSlug]/     ← GET menu public
      dishes/                    ← GET liste (dashboard) / POST création
      dishes/[id]/               ← GET public / PUT / DELETE
      dishes/[id]/photo/         ← upload image → Cloudinary
      dishes/[id]/model3d/       ← upload .glb (+.usdz optionnel) → Cloudinary
      dishes/[id]/scan/upload-url/ ← POST signature d'upload direct vers Cloudinary (jamais le fichier lui-même, voir section 5)
      dishes/[id]/scan/          ← POST { videoUrl | imageUrls } déclenche une capture 3D via KIRI Engine (Sprint 7) / GET état du dernier ScanJob, interrogé côté KIRI (voir section 5)
      webhooks/kiri/             ← POST callback KIRI (statut de scan), voir lib/scan3d.ts
      qrcodes/                   ← GET liste / POST création
      qrcodes/[id]/              ← DELETE
      qrcodes/[id]/png/          ← régénère le PNG à la volée (Content-Disposition: attachment)
      scan/                      ← POST tracking scan (rate-limited)
      allergens/                 ← GET table de référence
      analytics/export/          ← GET export CSV (Content-Disposition: attachment)
      billing/checkout/          ← POST session Stripe Checkout (palier + cycle)
      billing/portal/            ← POST session portail client Stripe
      webhooks/stripe/           ← POST synchronisation Subscription/Invoice (signature vérifiée)
  components/
    menu/                        ← composants du menu public
    dashboard/                   ← composants du dashboard (dont analytics-table, dish-trend-chart, billing-panel)
    landing/                     ← reveal.tsx, site-header.tsx, pricing-section.tsx, trusted-marquee.tsx, reviews-section.tsx, about-section.tsx, back-to-top.tsx, feature-field.tsx (champs de mots defilants), globe-section.tsx (globe canvas)
    theme-toggle.tsx             ← bascule dark/light (next-themes)
    ui/                          ← shadcn/ui (button, etc. - installés à la main, voir section 4)
  lib/
    prisma.ts                    ← client Prisma singleton
    auth.ts                      ← résout Clerk → Restaurant/User (voir section 6)
    scan.ts                      ← logique + rate limiting des scans
    analytics.ts                 ← requêtes agrégées pour le dashboard (10.1, 10.3)
    dish-locale.ts               ← localizedDishName() - résout name/nameEn selon la locale (voir section 4)
    billing.ts                   ← TIERS (source unique des prix, section 15.1), getStripe(), subscriptionFieldsFrom()
    scan3d.ts                    ← Scan3dProvider (Sprint 7) : adaptateur KIRI Engine, sur le même principe que billing.ts
    scan-video.ts                ← URL Cloudinary dérivée conforme aux contraintes vidéo de KIRI, partagée serveur/navigateur
    scan-finalize.ts             ← extraction du zip résultat et rattachement au plat, partagé webhook/suivi
    blob-storage.ts              ← Vercel Blob pour les modèles 3D issus du scan (Cloudinary refuse les fichiers `raw` au-delà de 10 Mo, voir section 5)
    qrcode.ts                    ← génération PNG + URL absolue
    cloudinary.ts                ← config + upload (photos de plats, vidéo source du scan - plus les modèles 3D résultat, voir blob-storage.ts)
    dish-schema.ts                ← validation zod du formulaire plat
    dish-categories.ts           ← catégories existantes (pour le dropdown)
  i18n/                          ← next-intl (routing, navigation, request config)
scripts/
  check-contrast.mjs             ← verifie les ratios WCAG de la palette claire
prisma/
  schema.prisma
  seed.ts                        ← restaurant démo "demo" + 3 plats + 1 QR code
```

---

## 4. Écarts assumés par rapport au cahier des charges

Chacun de ces écarts est documenté en commentaire dans le code source
concerné - cette liste est un résumé, pas la seule source.

- **Prisma 6.19.3, pas la dernière version (7.x)** - Prisma 7 supprime
  `datasource { url }` au profit de `prisma.config.ts` + adapters. Le
  schéma du cahier suppose la syntaxe classique.
- **@clerk/nextjs 6.x, pas 7.x** - Clerk 7 exige Next.js 15+, or le cahier
  impose Next.js 14.
- **Cloudinary au lieu d'AWS S3+CloudFront pour les modèles 3D**
  (section 7) - aucun compte AWS configuré. Cloudinary stocke aussi les
  `.glb`/`.usdz` en `resource_type: "raw"`. À migrer vers S3 si le volume
  ou le coût le justifie.
- **Pas de conversion automatique .glb → .usdz** (section 9.2 le
  demande) - aucun outil fiable côté serveur Node (il faut `usdz_converter`
  d'Apple, macOS uniquement, ou un service tiers payant). Upload manuel du
  `.usdz` en attendant un vrai pipeline (section 16).
- **shadcn/ui installé à la main** - `ui.shadcn.com` est bloqué par le
  proxy réseau de l'environnement de dev utilisé ; les fichiers standards
  (`components.json`, `lib/utils.ts`, composants) ont été recréés
  manuellement plutôt que via le CLI.
- **Schéma de données complété** - la section 8 du cahier omet plusieurs
  champs référencés ailleurs dans le texte : `Dish.category`/`categoryEn`
  (F02, 10.2), `Dish.ingredients`/`ingredientsEn` (F05),
  `Dish.prepTimeMinutes` (F05), `Dish.descriptionEn` (F06 bilingue complet),
  la table `Allergen`/`DishAllergen` (référencée mais jamais définie),
  `User.clerkUserId` (lien identité Clerk ↔ profil restaurant, nécessaire
  pour le dashboard section 18).
- **Repo GitHub public, pas privé** - la protection de branche (section
  4.1, PR obligatoire + CI verte requise) n'est **appliquée** par GitHub
  que sur les repos publics pour une organisation sur le plan Free. Un
  repo privé d'org sur ce plan peut créer des règles mais elles restent
  inertes. Alternative si la confidentialité redevient prioritaire :
  upgrade payant vers GitHub Team.
- **Onboarding dashboard simplifié** - pas de flux d'invitation d'équipe
  (section 10.7, hors scope Sprint 2). Le premier compte Clerk qui visite
  `/dashboard` est auto-provisionné "owner" du restaurant `demo`
  (voir `src/lib/auth.ts`). À remplacer avant d'ouvrir à plusieurs
  restaurants/plusieurs comptes.
- **Rate limiting en mémoire** (`src/lib/scan.ts`) - suffisant pour une
  seule instance serveur. À remplacer par un store partagé (Upstash Redis)
  avant un déploiement multi-instance.
- **Vue de fiche plat ajoutée en Sprint 3** - le Sprint 1 n'enregistrait un
  `ScanEvent` avec `dishId` que lors d'une activation AR ; il n'y avait
  donc aucune donnée pour calculer un taux d'activation AR (activations ÷
  vues). La page fiche plat enregistre maintenant aussi un scan à
  l'ouverture (`arActivated: false`), distinct de celui déclenché par
  l'activation AR - voir `src/lib/analytics.ts`.
- **Palette et typographie de la section 13 remplacées par celles de
  reflect.app - décision explicite du client, à l'encontre de la section
  26 ("ne pas improviser de palette alternative").** Après avoir vu le
  dashboard Sprint 3 en conditions réelles, le client a jugé le design de
  la section 13 insuffisant pour un SaaS premium et a fourni un prompt de
  direction créative détaillé basé sur une analyse mesurée de reflect.app
  (couleurs hex, polices, rayons, espacement, structure de landing). Face
  au conflit avec le cahier, le choix explicite proposé et validé était :
  remplacer **toute** la palette (dashboard + landing), pas seulement
  celle de la landing. Détails :
  - `globals.css` : tokens HSL mesurés sur reflect.app en mode sombre
    (`#030014`/`#efedfd`/`#181848`/`#f0d8f0`/`#481890`/`#484860`) ; le
    mode clair n'a pas d'équivalent mesuré (reflect.app n'en a pas) donc
    ses tokens sont dérivés, pas mesurés.
  - Polices : Space Grotesk (titres) + Inter (corps) via `next/font/google`,
    remplaçant Fraunces/Geist - AeonikPro et "Inter V" (polices d'origine
    du prompt) sont payantes/non disponibles ; le prompt prévoyait
    lui-même ces alternatives Google Fonts.
  - `--radius: 7px`, `--radius-card: 24px`, boutons `h-auto` avec padding
    explicite (12px 24px) - spec boutons reflect.app mesurée.
  - La landing (`[locale]/page.tsx`) force `data-theme="dark"` localement
    via un wrapper (reflect.app n'a pas de mode clair) ; le dashboard garde
    `defaultTheme="system"` inchangé - pas de second `ThemeProvider`,
    l'attribut `data-theme` posé sur un `<div>` suffit car tous les tokens
    sont déjà scopés par sélecteur CSS.
  - **Si le cahier doit un jour reprendre le dessus** (ex. revue légale/
    marque), les valeurs originales de la section 13 (or/sarcelle) sont
    encore dans l'historique git (`4032e9f`, `db663f6`) - il suffirait de
    restaurer `globals.css`/`tailwind.config.ts`/`layout.tsx` à cet état.
- **Section 13.2 ne donne pas de valeurs succès/alerte pour le mode
  clair** - non applicable tel quel depuis le remplacement de palette
  ci-dessus ; les tokens `--success`/`--destructive` du mode clair de
  `globals.css` sont dérivés, pas mesurés sur reflect.app (qui n'a pas de
  mode clair). À revoir si un contrôle de contraste WCAG AA (section
  17.5) le juge insuffisant.
- **Landing page (section 12) livrée en avance sur le Sprint 4** - copy FR
  reprise textuellement du cahier quand elle existait (hero, 3 bullets
  features), copy originale mais alignée pour les sections que le cahier
  ne couvre pas (offre de lancement en remplacement de faux témoignages/
  logos clients - aucun client réel à ce stade -, le trio "Scanner → Voir
  en AR → Commander" dérivé du parcours client section 6.1). Section
  tarifs (12.1 #9) et FAQ (12.1 #10) ajoutées au Sprint 4, montants tirés
  tels quels de la section 15.1 via `lib/billing.ts` (source unique
  partagée avec le dashboard facturation, pour ne jamais désynchroniser
  les deux).
- **Stripe Billing (section 15, F10) - code écrit et buildé, jamais
  exercé contre l'API réelle.** Aucun compte Stripe n'existe encore côté
  client. Checklist pour débloquer (mode Test suffit pour valider avant
  la mise en prod) :
  1. Créer un compte Stripe (ou utiliser un compte existant), rester en
     **mode Test** pour le développement.
  2. Créer 3 Products : "Vorae Essentiel", "Vorae Croissance", "Vorae
     Prestige".
  3. Pour chacun, créer deux Prices récurrents en **CAD** (montants
     exacts de la section 15.1) :
     Essentiel 79 $/mois et 790 $/an · Croissance 199 $/mois et 1 990 $/an
     · Prestige 449 $/mois et 4 490 $/an.
  4. Copier les 6 `price_...` obtenus dans les variables
     `STRIPE_PRICE_{ESSENTIEL,CROISSANCE,PRESTIGE}_{MONTHLY,ANNUAL}`
     (Vercel + `.env` local).
  5. Récupérer la clé secrète (Developers → API keys) → `STRIPE_SECRET_KEY`.
  6. Créer un endpoint de webhook Stripe pointant vers
     `https://<domaine>/api/webhooks/stripe`, événements à cocher :
     `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`,
     `invoice.payment_failed`. Copier le signing secret →
     `STRIPE_WEBHOOK_SECRET`.
  7. Dans Stripe → Customer Portal (Settings), autoriser les 3 Products
     ci-dessus et activer le changement de palier - c'est ce qui permet
     à `POST /api/billing/portal` (section 9.2, 10.6) de couvrir "changement
     de palier en libre-service avec proratisation automatique" sans code
     applicatif supplémentaire : la logique de proratisation est gérée
     entièrement par Stripe.
  - **Facturation à l'usage (section 15.2, plats additionnels au-delà du
    quota inclus) : non implémentée.** `extraDishCount` existe dans le
    schéma `Subscription` mais rien ne l'incrémente ni ne le reporte à
    Stripe (`metered billing`, un second item de subscription par
    palier). Décision de scope Sprint 4 : livrer l'abonnement de base (3
    paliers × 2 cycles, checkout, portail, webhook) d'abord - l'usage
    metered demande une automatisation (compter les plats actifs, reporter
    l'usage à Stripe) qui n'a pas pu être testée sans compte Stripe réel.
    Palier Prestige non concerné (plats illimités).
  - Palier "illimité" (Prestige) représenté par `includedDishSlots: -1`
    dans `lib/billing.ts`/`Subscription.includedDishSlots` (le champ
    Prisma est un `Int` non nullable, donc pas de `null`) - tout code lisant
    ce champ doit connaître cette convention.
  - Service de capture 3D à la carte/forfaits (section 15.3,
    `DishCaptureOrder`) : modèle de données existant depuis Sprint 0, mais
    aucun flux de commande ni paiement associé - non demandé explicitement
    pour ce sprint, à faire si le client en a besoin.

---

## 5. Pièges connus / à ne pas refaire

- **Neon : toujours utiliser la connexion POOLED** (`-pooler` dans le
  hostname) pour `DATABASE_URL` sur Vercel - bonne pratique générale pour
  du serverless (la connexion directe a une limite de connexions
  simultanées très basse sur le plan gratuit). Note : ce n'était **pas**
  la cause du bug ci-dessous malgré la ressemblance des symptômes - les
  deux pièges peuvent coexister, ne pas arrêter le diagnostic au premier
  suspect plausible.
- **Vercel peut créer une variable d'env comme chaîne VIDE plutôt qu'absente**
  - au tout premier import du projet, Vercel avait auto-détecté les noms
  de variables depuis `.env.example` (dont `NEXT_PUBLIC_APP_URL=`, sans
  valeur) et créé l'entrée correspondante vide plutôt que de ne rien
  créer. `process.env.NEXT_PUBLIC_APP_URL` valait donc `""`, pas
  `undefined`. Tout code utilisant `??` pour un fallback laissait passer
  cette chaîne vide (elle n'est pas null/undefined) - `new URL(path, "")`
  plante avec `ERR_INVALID_URL`. Symptôme en prod : "Application error: a
  server-side exception has occurred" sans plus de détail - le vrai
  message (`TypeError: Invalid URL ... base: ''`) n'était visible que
  dans Vercel → Deployments → [déploiement] → Runtime Logs, pas dans
  l'onglet "Logs" du projet (qui est production-only). **Toujours
  utiliser `||` (pas `??`) pour un fallback de variable d'environnement
  potentiellement vide**, et vérifier les Runtime Logs du déploiement
  concerné dès qu'une erreur 500 générique apparaît, avant de deviner.
- **Aucune connexion TCP brute (Postgres, etc.) depuis l'environnement de
  dev sandboxé** utilisé pour ce projet - seul le HTTPS passe par le proxy
  réseau. Toute migration/seed Prisma contre la vraie base doit être faite
  soit par SQL généré offline (`prisma migrate diff --from-empty
  --to-schema-datamodel prisma/schema.prisma --script`, qui ne nécessite
  aucune connexion) collé dans le SQL Editor de Neon, soit exécutée par
  quelqu'un ayant un accès réseau direct.
- **`export const dynamic = "force-dynamic"`** est nécessaire sur le
  layout `/dashboard` (et hérité par ses routes filles) - sans ça, Next.js
  tente de pré-générer ces pages personnalisées par utilisateur une seule
  fois au build. Le résumé du build peut afficher "●" (statique) même
  quand `force-dynamic` fonctionne correctement : vérifier l'absence
  réelle de fichiers `.html`/`.rsc` dans `.next/server/app/...` plutôt que
  de se fier à ce symbole.
- **Toujours vérifier `res.ok`** sur les appels fetch côté client et
  afficher une erreur visible - plusieurs bugs signalés ("le bouton ne
  fait rien", "il faut rafraîchir pour voir le changement") venaient
  d'échecs silencieux côté client masquant une vraie erreur serveur.
- **Toute donnée bilingue doit avoir ses deux champs dès sa création**
  (`x` et `xEn`) - plusieurs oublis déjà corrigés (description, catégorie,
  ingrédients). Vérifier systématiquement qu'un nouveau champ visible par
  l'utilisateur final a son pendant anglais avant de le considérer terminé.
- **`localeDetection: false`** est requis dans `src/i18n/routing.ts` - le
  comportement par défaut de next-intl sert la langue du navigateur, ce
  qui viole la Loi 96 (le français doit être prédominant à l'ouverture,
  jamais l'anglais par défaut, même sur un navigateur anglophone).
- **Un champ bilingue en base (`x`/`xEn`) ne suffit pas : il faut aussi
  que chaque requête serveur qui l'affiche sélectionne `xEn` et résout la
  bonne valeur selon la locale.** Bug constaté : `src/lib/analytics.ts`
  avait bien `Dish.nameEn` en base depuis le Sprint 1, mais ses requêtes
  Prisma (vue d'ensemble, tableau global, page par plat) ne
  sélectionnaient que `name` - le dashboard en anglais affichait quand
  même les noms de plats en français. Corrigé avec un helper partagé
  `localizedDishName()` (`src/lib/dish-locale.ts`) et une locale propagée
  jusqu'à ces requêtes ; l'export CSV (route API hors segment `[locale]`)
  reçoit la locale en query string. Vérifier ce même piège sur tout futur
  champ bilingue affiché depuis une requête serveur, pas seulement dans les
  formulaires/composants client.
- **Le webhook Stripe doit lire le corps brut de la requête** (`req.text()`)
  et jamais `req.json()` - la vérification de signature
  (`stripe.webhooks.constructEvent`) recalcule un HMAC sur les octets
  exacts reçus ; `req.json()` puis re-sérialiser donnerait un contenu
  différent (ordre de clés, espaces) et ferait toujours échouer la
  vérification. Voir `src/app/api/webhooks/stripe/route.ts`.
- **Le matcher du middleware (`src/middleware.ts`) doit exclure toute
  extension de fichier statique servie depuis `public/`**, pas seulement
  les images - sinon next-intl route la requête comme une page et la
  redirige vers `/fr/<fichier>` (404). Repéré en ajoutant une vidéo
  (`.mp4`) : la regex d'exclusion listait `jpe?g|webp|png|...` mais pas
  `mp4|webm|mov|mp3`. Vérifier ce matcher à chaque nouveau type de fichier
  statique ajouté au projet.
- **Un calque décoratif en `-z-10` (halo, particules) peut être invisible
  à l'écran tout en étant bien présent dans le DOM, si la section qui le
  contient ne forme pas son propre contexte d'empilement CSS.** `position:
  relative` seul, sans `z-index`, ne suffit pas : l'élément `-z-10` remonte
  alors jusqu'au premier ancêtre qui en forme un (souvent la racine de la
  page), et se retrouve peint **sous** le fond opaque de cet ancêtre au
  lieu de juste derrière le texte de sa propre section. Repéré en ajoutant
  les étoiles filantes des sections À propos et Avis (Sprint 5, S5-12) :
  invisibles malgré un `opacity` et une `animation` corrects en
  `getComputedStyle`, confirmé en écrivant un carré rouge de test au même
  endroit et en vérifiant sa couleur de pixel réelle plutôt que de se fier
  aux styles calculés. Corrigé en ajoutant `isolate` (utilitaire Tailwind
  pour `isolation: isolate`) sur chaque `<section>` contenant un calque
  `-z-10` : hero, "Comment ça marche", Fonctionnalités, Avis, À propos,
  Tarifs, Globe. **Tout nouveau calque `-z-10` doit vivre dans une section
  qui a `isolate`, sinon vérifier son rendu par une capture d'écran, pas
  seulement par la lecture du code.**
- **Un badge positionné en dehors d'un élément avec un simple décalage
  négatif fixe (`-left-10`, `-right-12`) chevauche cet élément si son
  propre contenu est plus large que le décalage** - constaté sur les
  badges flottants du hero (`product-mockup.tsx`) : corrects en anglais,
  ils chevauchaient l'écran du téléphone en français, le texte y étant
  plus long. Un décalage fixe suffit pour un élément de taille connue à
  l'avance, pas pour un texte dont la longueur dépend de la langue.
  Corrigé avec `right`/`left: calc(100% + Npx)` en style inline : le
  badge part toujours du bord de son voisin vers l'extérieur, quelle que
  soit sa propre largeur.
- **Les pourcentages d'un `@keyframes` CSS se comptent sur le cycle
  entier, pas sur le créneau d'un élément : on ne peut donc pas faire un
  chassé-croisé entre N éléments avec une seule animation partagée et des
  délais négatifs décalés, sauf à écrire des pourcentages qui dépendent
  de N** - or ils ne peuvent pas être paramétrés. Constaté sur la bascule
  entre langues (`feature-language-flip.tsx`) : avec 12 langues et une
  plage visible de 3 % à 88 % du cycle, une dizaine restaient à
  `opacity: 1` en même temps et le texte s'empilait, illisible. Passer
  l'alternance en JavaScript (un index qui avance, `transition` CSS pour
  l'effet) reste correct quel que soit le nombre d'éléments.
- **Un composant lucide (ou tout `forwardRef`) ne peut pas être passé en
  prop à un Client Component depuis un Server Component** :
  "Functions cannot be passed directly to Client Components", erreur
  **invisible au build** (`next build` passe, les pages se génèrent) qui
  ne sort qu'à l'exécution, en 500. Rencontrée en rendant
  `feature-language-flip.tsx` client : il recevait `icon={Icon}` depuis
  la page. Passer un élément déjà rendu (`icon={<Icon />}`) ne suffit pas
  non plus ici, le `type` de l'élément restant cette même fonction et le
  composant étant rendu dans les enfants sérialisés de `Reveal`, lui
  aussi client. Solution retenue : importer l'icône directement dans le
  Client Component. **Après avoir ajouté `"use client"` à un composant
  existant, vérifier la page dans un vrai navigateur, pas seulement le
  build.**
- **`transformStyle: preserve-3d` casse le test de collision des
  descendants : des boutons deviennent incliquables à la souris alors
  qu'ils répondent encore à un clic déclenché en JavaScript.** Constaté
  sur la maquette de téléphone du hero, dont le châssis porte une légère
  rotation 3D qui suit la souris : `mousedown` était attribué au
  conteneur, `mouseup` au bouton, et le navigateur déclenchait donc le
  `click` sur leur ancêtre commun, si bien que le bouton ne réagissait
  jamais. Piège vicieux à diagnostiquer : `document.elementFromPoint`
  renvoyait bien le bouton, et un `element.click()` en JS fonctionnait.
  La méthode qui a tranché : écouter `pointerdown`/`mousedown`/`mouseup`/
  `click` au niveau du document et comparer leurs cibles. `preserve-3d`
  n'était pas nécessaire ici (aucun enfant n'a sa propre transformation
  3D), le retirer garde la rotation identique à l'oeil. **Ne pas mettre
  `preserve-3d` sur un conteneur qui contient des éléments cliquables, et
  tester les clics à la souris, pas seulement en JavaScript.**
- **Un élément statique remonté sous un élément positionné passe
  derrière lui, quel que soit l'ordre du DOM.** Sur la fiche plat de la
  maquette, le bloc texte était remonté par `-mt-6` pour chevaucher le
  bas de la photo ; le conteneur de la photo étant `relative` et le bloc
  texte statique, le nom du plat et le prix étaient invisibles, cachés
  derrière l'image. Corrigé en donnant `relative` au bloc texte. Aucun
  test automatique ne l'aurait vu (le texte est bien dans le DOM et
  `innerText` le renvoie) : c'est la relecture des captures d'écran qui
  l'a révélé.
- **Une animation en boucle continue depuis le montage rate son propre
  effet dès qu'elle est censée être vue au scroll.** La carte
  Accessibilité tournait en boucle dès le chargement de la page : le
  flash-back rapide (~2,3s) n'occupe qu'une petite fraction d'un cycle
  total de ~24s, donc un visiteur qui scrolle jusqu'à la carte arrive le
  plus souvent en pleine phase lente et ne voit jamais le flash-back.
  Corrigé avec le même idiome que `Reveal` (`IntersectionObserver` sur le
  conteneur de la carte), qui remet l'étape à 0 à chaque entrée dans le
  cadre. **Toute animation en boucle dont le début compte doit se
  déclencher/relancer à l'entrée dans le viewport, pas au montage.**
- **`ctx.arc()` plante avec `IndexSizeError` si le rayon calculé est
  négatif, même de très peu.** Sur le globe, l'anneau d'une onde de choc
  se calcule à partir de `age = (now - ripple.start) / RIPPLE_MS`, où
  `now` vient du timestamp de `requestAnimationFrame` et `ripple.start`
  de `performance.now()` pris dans le gestionnaire `pointerdown`/
  `pointerup`. Les deux horloges sont censées concorder, mais un appui
  juste avant le prochain frame peut renvoyer un `age` légèrement négatif
  (quelques millisecondes), ce qui rend `(1 - Math.pow(1 - age, 2))`
  négatif et donc le rayon de l'anneau aussi. Reproduit de façon fiable
  avec un glisser rapide et répété sur le globe (confirmé avec un
  `CanvasRenderingContext2D.prototype.arc` instrumenté en Playwright).
  Corrigé en bornant `age` à `[0, 1]`. **Ne jamais faire confiance à ce
  que deux horloges différentes (event timestamp vs `now` de rAF)
  produisent un delta positif ; borner toute valeur dérivée d'un delta de
  temps avant de l'utiliser comme rayon.**
- **`Buffer` de Node n'est pas assignable à `BlobPart` sous TypeScript
  strict.** Rencontré dans `lib/scan3d.ts` en construisant un `FormData`
  pour l'upload multipart vers KIRI : `new Blob([buffer])` échoue à la
  compilation (`Buffer<ArrayBufferLike>` vs `ArrayBufferView<ArrayBuffer>`,
  une incompatibilité de types liée à `SharedArrayBuffer`). Corrigé en
  enveloppant explicitement : `new Blob([new Uint8Array(buffer)])`.
- **Le champ `code` d'une API tierce n'est pas forcément un indicateur de
  succès fiable, même documenté comme tel.** La doc KIRI montre `code: 0`
  sur ses exemples de réponse réussie, mais un appel réel testé en
  direct a renvoyé `code: 200` pour le même succès. `lib/scan3d.ts` se
  fie au champ `ok` (booléen), jamais à `code`. **Vérifier le comportement
  réel d'une API avant de coder une condition sur un champ de statut
  documenté par des exemples plutôt que par une spec stricte.**
- **Les Vercel Functions (Node.js) refusent tout corps de requête entrant
  au-delà d'environ 4,5 Mo, avec l'erreur `FUNCTION_PAYLOAD_TOO_LARGE`
  (HTTP 413) - avant même que le code de la route s'exécute.** Découvert
  en testant `POST /api/dishes/[id]/scan` avec une vraie vidéo de 13,6 Mo,
  pourtant conforme aux critères KIRI (1080p, moins de 3 minutes). Aucune
  vidéo de scan utilisable ne tient sous ce seuil. Corrigé en faisant
  transiter le média par un upload direct client → Cloudinary (signature
  générée par `POST /api/dishes/[id]/scan/upload-url`, jamais les octets
  eux-mêmes) : la route `/scan` ne reçoit plus qu'une URL en JSON, et va
  chercher le fichier elle-même côté serveur (un appel sortant depuis une
  Function n'est pas soumis à cette limite, seul le corps entrant l'est).
  **Cette limite s'applique à toute route qui reçoit un fichier en
  multipart directement.** `POST /api/dishes/[id]/model3d` (upload manuel
  de `.glb`/`.usdz`, section 9.2) accepte actuellement jusqu'à 15 Mo dans
  son propre code, largement au-dessus du seuil réel de Vercel - tout
  fichier entre 4,5 et 15 Mo y échoue donc probablement déjà en
  production avec le même 413, non corrigé pour l'instant (hors
  périmètre du Sprint 7, à traiter séparément).
- **Une erreur renvoyée sans corps lisible coûte un cycle de déploiement
  par hypothèse.** La mise au point du flux de scan a buté trois fois de
  suite sur un `500` au corps vide : une exception non rattrapée dans une
  route App Router ne laisse rien passer au navigateur. Trois correctifs
  en ont découlé, tous conservés : la signature Cloudinary nomme la
  variable d'environnement qui manque (jamais sa valeur), la création du
  `ScanJob` renvoie l'erreur Prisma réelle, et un échec fournisseur porte
  son statut HTTP et son code détaillé. `lib/scan3d.ts` lit désormais la
  réponse en texte avant de l'analyser : une passerelle en erreur répond
  en HTML, et un `res.json()` direct levait une `SyntaxError` qui
  masquait complètement le vrai statut. **Dans une route appelée depuis
  le navigateur, toute branche d'échec doit renvoyer un corps JSON
  exploitable.**
- **KIRI refuse toute vidéo au-delà de 3 minutes ou de 1920x1080 (code
  2009).** Constaté sur une capture d'iPhone ordinaire, qui filme en 4K
  ou en portrait 1080x1920. Plutôt que d'imposer une conversion manuelle
  au restaurateur, `POST /api/dishes/[id]/scan` demande à Cloudinary une
  version dérivée conforme de la vidéo déjà téléversée
  (`c_limit,w_1920,h_1080,eo_180,f_mp4,vc_h264`) : `c_limit` ne fait que
  réduire et préserve le cadrage, y compris en portrait. **Cloudinary
  répond `423` tant qu'une transformation inédite n'est pas calculée**,
  d'où une reprise espacée dans `fetchAsFile`. Le plafond de durée de la
  Function est relevé à 60 s : télécharger la vidéo puis la reverser à
  KIRI ne tient pas dans les 10 s par défaut.
- **Ne jamais faire dépendre un résultat d'une seule notification
  entrante.** Le modèle 3D revient normalement par le webhook KIRI, mais
  une notification peut se perdre, arriver sur une URL de preview
  périmée, ou ne jamais être configurée. `GET /api/dishes/[id]/scan`
  interroge donc KIRI directement quand le job est encore actif, et
  finalise lui-même si le modèle est prêt. Le traitement du résultat vit
  dans `lib/scan-finalize.ts`, appelé par les deux chemins, pour qu'il
  n'existe qu'une seule façon d'extraire les fichiers du zip.
- **Un plafond de taille de fichier annoncé "par requête" peut en réalité
  porter sur le fichier total reconstitué.** Le premier modèle 3D réel
  produit par KIRI pèse environ 86 Mo, refusé par Cloudinary
  (`File size too large. Got 89973380. Maximum is 10485760.`, soit
  10 Mo). Un envoi fractionné en morceaux de 6 Mo semblait la solution
  évidente, mais a échoué avec `Got 12582912` - exactement deux morceaux
  cumulés, pas la taille d'un seul. La preuve que la limite du compte
  porte sur le fichier entier, pas sur chaque requête : aucun découpage
  ne pouvait la contourner. Vérifié aussi que monter en plan Cloudinary
  n'aide pas : le plan Plus à 99 $/mois plafonne encore à 20 Mo. Les
  modèles 3D sont donc stockés sur **Vercel Blob** (`lib/blob-storage.ts`)
  plutôt que Cloudinary, choisi sur AWS S3 (prévu par la section 7 du
  cahier) parce qu'aucun compte AWS n'existe et que Vercel Blob s'active
  depuis les réglages du projet déjà en place. Les photos de plats et la
  vidéo source du scan restent sur Cloudinary, bien en-dessous de ses
  plafonds.
- **`upload_large_stream` du SDK Cloudinary existe dans ses types
  TypeScript mais pas réellement sur l'objet `v2.uploader`** dans la
  version installée (2.10.1) : défini dans `lib/uploader.js`, jamais
  reporté vers l'API v2 publique (`lib/v2/uploader.js`). Un appel lève
  `TypeError` (`r is not a function` une fois minifié). Confirmé à
  l'exécution (`typeof cloudinary.uploader.upload_large_stream ===
  "undefined"`) avant de chercher l'alternative réellement exposée,
  `upload_chunked_stream`, avec la même convention d'appel
  `(options, callback)`. **Vérifier qu'une fonction citée dans les types
  d'un SDK existe réellement à l'exécution avant de s'y fier**, surtout
  pour une fonctionnalité annexe (l'upload fractionné) qui a pu ne pas
  suivre le reste de l'API lors d'un portage v1 vers v2.

---

## 6. Modèle d'authentification (dashboard)

`src/lib/auth.ts` → `getCurrentRestaurantUser()` :
1. Récupère l'utilisateur Clerk courant (`currentUser()`).
2. Cherche un `User` Prisma par `clerkUserId` ou par email.
3. Si trouvé mais `clerkUserId` pas encore lié (première connexion après
   création manuelle) → lie l'identité.
4. Si aucun `User` n'existe → auto-provisionne comme `owner` du **premier**
   restaurant créé en base (`orderBy: createdAt asc`). C'est une
   simplification Sprint 2 : fonctionne tant qu'il n'y a qu'un seul
   restaurant. À remplacer par un vrai flux d'invitation (section 10.7)
   avant d'ouvrir à plusieurs restaurants/organisations.

---

## 7. Lancer le projet en local

```bash
npm install
cp .env.example .env   # renseigner DATABASE_URL (pooled), CLERK_*, CLOUDINARY_*
npx prisma generate
npm run dev
```

Scripts utiles : `npm run lint`, `npm run typecheck`, `npm run test -- --run`,
`npm run build`. Le seed (`prisma/seed.ts`) nécessite une vraie connexion DB
et n'a pas pu être exécuté depuis l'environnement de développement utilisé
pour ce projet (voir section 5) - le restaurant démo et ses données ont été
créés via un script SQL équivalent collé directement dans Neon.

---

## 8. Prochaines étapes (Sprint 4, section 21)

La landing marketing (section 12, y compris tarifs + FAQ) et l'abonnement
Stripe de base (checkout, portail, webhook, page facturation dashboard)
sont codés et buildés. Il reste :

- **Créer le compte Stripe et les 8 variables d'environnement** - voir la
  checklist complète en section 4 ("Stripe Billing - code écrit... jamais
  exercé contre l'API réelle"). Rien de ce qui touche à la facturation ne
  peut être testé en conditions réelles avant ça.
- **Facturation à l'usage (plats additionnels au-delà du quota, section
  15.2)** - non implémentée, voir section 4 pour le détail du gap
  (`extraDishCount` existe en base mais rien ne l'alimente ni ne le
  reporte à Stripe en metered billing).
- **Visuels réels intégrés (générés par IA - Gemini/Imagen, pas de vraies
  photos de plats ni un vrai enregistrement d'écran de l'app).** Livrés
  par Mouhamed, stockés dans `public/` (pas Cloudinary - ce sont des
  assets de site statiques, pas des données `Dish` éditables par un
  restaurateur) et référencés en dur dans le code :
  - `public/logo-icon.png` - icône du logo (monogramme "V" + réticule),
    utilisée dans `SiteHeader` et comme favicon (`src/app/icon.png`,
    convention Next.js App Router).
  - `public/hero-dish.jpg` - photo plat dramatique, intégrée en visuel
    sous le CTA du hero (`[locale]/page.tsx`).
  - `public/hero-video.mp4` - vidéo concept (bol qui apparaît en
    hologramme au-dessus d'un téléphone), remplace l'ancien mockup CSS
    dans la section "aperçu produit". **Reconvertie depuis un .mov HEVC+AAC
    d'origine** (non lisible de façon fiable sur Chrome/Firefox et avec
    piste audio superflue pour une vidéo en boucle muette) vers H.264/
    yuv420p sans audio via `ffmpeg` - nécessaire pour la compatibilité
    navigateur, pas une simple copie de fichier.
  - `public/dish-*.jpg` (signature-bowl, pasta, burger, salad) - pas
    encore reliées aux plats du restaurant démo en base (nécessite un
    `UPDATE` SQL collé dans Neon, voir message de session - même
    contrainte que d'habitude, pas d'accès TCP direct depuis cet
    environnement). `dish-burger.jpg` n'a pas de plat correspondant dans
    `seed.ts` - disponible si un 4ᵉ plat est ajouté un jour.
  - **Piège découvert en intégrant la vidéo** : le matcher du middleware
    (`src/middleware.ts`) excluait bien `.png`/`.jpg`/etc. du routing
    i18n mais pas `.mp4`/`.webm`/`.mov`/`.mp3` - next-intl redirigeait
    donc `/hero-video.mp4` vers `/fr/hero-video.mp4` (404). Corrigé en
    étendant la regex d'exclusion. Voir aussi section 5 (pièges connus).
  - Ces visuels sont volontairement "concept" et non de vraies captures
    de l'app (pas de fausse interface dans la vidéo) - voir l'échange sur
    ce point en session. À remplacer par de vraies photos/captures dès
    qu'elles existent.
- Pages `/privacy` et `/terms` - les liens du footer de la landing pointent
  vers `#` en attendant (voir commentaire dans `[locale]/page.tsx`).
- Le CTA "Réserver une démo" / "Book a demo" de la landing ne fait encore
  rien (pas de bouton fonctionnel, pas de formulaire/lien Calendly, etc.)
  - à brancher avant mise en production réelle. Les CTA de la section
  tarifs, eux, renvoient déjà vers `/dashboard` (sign-in Clerk → palier
  choisi dans la page facturation).
- Rappel : ne plus réintroduire la palette or/sarcelle de la section 13
  sans revalider avec le client - le remplacement par reflect.app est une
  décision explicite et documentée (section 4), pas un oubli.

---

## 8bis. Sections de landing reprises de webglow.ca (Sprint 5)

Le client est aussi propriétaire de l'agence WebGlow (webglow.ca) et a
fourni le dépôt de son site pour que quatre éléments visuels soient repris
et adaptés à Vorae. C'est du code lui appartenant, réécrit avec nos tokens
de couleur, pas une copie d'un site tiers.

| Élément Vorae | Source WebGlow | Adaptation |
|---|---|---|
| `trusted-marquee.tsx` | bloc de logos dans `Hero.tsx` | Rouge `#A60000` remplacé par les tokens. Contenu : types d'établissement. |
| `reviews-section.tsx` | `Reviews.tsx` | Halo en coeur en SVG conservé, dégradés passés en `hsl(var(--primary))`. Photos de personnes remplacées par des pastilles d'initiales. |
| `about-section.tsx` | `About.tsx` | Le composant `Particles` de Magic UI (canvas, 246 lignes, dépendance) est remplacé par des points en CSS animés : rendu équivalent à cette échelle, aucune dépendance ajoutée. |
| `back-to-top.tsx` | `BackToTop.tsx` | Repris quasi tel quel, couleurs adaptées. |

Deux points de vigilance :

- **Les avis affichés sont inventés.** Aucun client réel n'existe encore.
  Volontairement sans portrait photo : associer des photos de banque
  d'images à de fausses citations donnerait l'illusion de vrais
  témoignages. Les pastilles d'initiales se lisent comme un gabarit. À
  remplacer avant toute mise en production, cf. section 12.3 du cahier
  ("la preuve vient des chiffres et des études de cas, pas de
  l'adjectif").
- **Le bandeau défilant liste des types d'établissement**, pas des noms de
  restaurants ou de marques. Afficher une enseigne réelle comme cliente
  alors qu'elle ne l'est pas serait une fausse référence. WebGlow fait le
  même choix sur son propre site.

Les particules de la section à propos ont des positions **figées en dur**
et non tirées au hasard : une valeur `Math.random()` différente entre le
rendu serveur et le rendu client provoque une erreur d'hydratation React.

---

## 8ter. Palette claire et animations sans dépendance

**Palette claire refaite (Sprint 6, S6-01).** Les tokens clairs d'origine
étaient une inversion approximative du sombre. Ils sont maintenant
construits autour du violet de marque, et chaque paire texte/fond est
vérifiée en contraste WCAG AA (section 17.5 du cahier). Le script
`scripts/check-contrast.mjs` recalcule tous les ratios : le relancer
après toute modification des tokens clairs de `globals.css`.

Deux inversions volontaires de rôle entre sombre et clair, documentées en
commentaire dans `globals.css` : `--primary` passe d'un lavande clair
(sombre) au violet profond (clair), et `--secondary` sert de fond de
pastille en clair alors qu'il sert de violet de halo en sombre.

**Limite de vérification :** le dashboard et le menu public ne peuvent pas
être rendus dans l'environnement de développement, faute d'accès à la base
(voir section 5). La palette claire y est donc validée par le calcul, pas
encore à l'oeil. La validation visuelle passe par la preview Vercel.

**Animations, principe retenu.** Trois effets repris de sites de
référence sont codés à la main plutôt qu'importés :

| Effet | Référence | Implémentation |
|---|---|---|
| Bandeaux défilants | webglow.ca | CSS pur, contenu dupliqué une fois et translation de -50%. |
| Champs de mots des fonctionnalités | section "Hardened security" de reflect.app | Mêmes bandeaux, en rangées alternées sous masque radial. |
| Globe en pointillés | section "dotted across the globe" de reflect.app | Canvas 2D, projection orthographique, ~60 lignes. Évite une librairie de globe (cobe, three.js) de plusieurs centaines de Ko. |

Deux règles à respecter pour tout nouvel effet de ce type :

- **Pas de `Math.random()` au rendu.** Une valeur différente entre serveur
  et client provoque une erreur d'hydratation React. Les positions des
  particules et les décalages des rangées sont figés ou dérivés de
  l'index.
- **Couper l'animation hors écran.** Le globe suspend sa boucle
  `requestAnimationFrame` via un `IntersectionObserver` : une boucle qui
  tourne en continu sur une page longue vide la batterie pour rien. Les
  animations CSS n'ont pas ce problème, le navigateur les gère seul.

Les animations d'apparition au scroll (`reveal.tsx`) se rejouent dans les
deux sens de défilement, à la demande du client. Deux seuils plutôt qu'un
pour éviter le clignotement au ras de la limite : apparition dès 30% de
visibilité, réarmement seulement une fois entièrement sorti du cadre.

---

## 9. Roadmap - fonctionnalités hors cahier des charges (planifiées, pas construites)

- **Génération de modèle 3D instantanée par IA (photo → 3D)** - voir
  `docs/roadmap-ai-instant-3d.md`. Ajout de scope proposé par le client
  après avoir vu une vidéo marketing d'un concurrent (AR Code, déjà listé
  section 3 du cahier). Document de planification complet (architecture,
  schéma, endpoints, garde-fous qualité, lien facturation) - **rien n'est
  implémenté**, à reprendre en détail avant de coder quoi que ce soit.
